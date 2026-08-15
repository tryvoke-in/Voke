import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RawJob {
    title: string;
    company: string;
    description: string;
    requirements?: string;
    salary_range: string | null;
    location: string;
    remote_ok: boolean;
    experience_level: string;
    skills_required: string[];
    application_url: string | null;
    source: string;
    source_id: string;
    posted_date: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const canonicalizeUrl = (url: string | null): string | null => {
        if (!url) return null;
        try {
            const u = new URL(url);
            u.searchParams.delete('utm_source');
            u.searchParams.delete('utm_medium');
            u.searchParams.delete('utm_campaign');
            return u.href;
        } catch {
            return url;
        }
    };

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Wipe all job recommendations to prevent Foreign Key constraint errors!
        console.log("Wiping job recommendations...");
        await supabase.from('job_recommendations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 2. Wipe ALL old job postings so the DB is completely fresh!
        console.log("Wiping job postings...");
        await supabase.from('job_postings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // 3. Fetch monitored locations
        const { data: locationsData } = await supabase
            .from('monitored_locations')
            .select('location_name')
            .eq('is_active', true);
            
        let activeLocations = ["India"];
        if (locationsData && locationsData.length > 0) {
            activeLocations = locationsData.map(l => l.location_name);
        }
        console.log("Fetching for locations:", activeLocations);

        const jobs: RawJob[] = [];
        const stats: Record<string, { fetched: number, kept: number }> = {
            themuse: { fetched: 0, kept: 0 },
            remoteok: { fetched: 0, kept: 0 },
            remotive: { fetched: 0, kept: 0 }
        };

        const TIME_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();
        const isRecent = (dateStr: string) => {
            if (!dateStr) return true; 
            try {
                const dateMs = new Date(dateStr).getTime();
                if (isNaN(dateMs)) return true;
                return (nowMs - dateMs) <= TIME_WINDOW_MS;
            } catch {
                return true;
            }
        };

        // Define fetchers per location
        const createFetchers = (loc: string) => {
            
            const museLoc = loc.toLowerCase() === 'india' ? 'India' : `${loc}, India`;

            const fetchTheMuse = async () => {
                try {
                    // Fetch up to 10 pages for each location to get ~200 jobs from TheMuse
                    for (let page = 1; page <= 10; page++) {
                        const url = `https://www.themuse.com/api/public/jobs?location=${encodeURIComponent(museLoc)}&page=${page}&category=Software%20Engineering&category=Data%20Science&category=IT&category=Computer%20and%20IT`;
                        const res = await fetch(url);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.results && Array.isArray(data.results)) {
                                if (data.results.length === 0) break; // no more pages
                                for (const item of data.results) {
                                    stats.themuse.fetched++;
                                    const posted = item.publication_date ? new Date(item.publication_date).toISOString() : new Date().toISOString();
                                    if (isRecent(posted)) {
                                        stats.themuse.kept++;
                                        jobs.push({
                                            title: item.name,
                                            company: item.company?.name || "Tech Company",
                                            description: item.contents || item.short_description || "",
                                            salary_range: null,
                                            location: item.locations?.[0]?.name || loc,
                                            remote_ok: item.locations?.some((l: any) => l.name?.toLowerCase().includes("remote")) || false,
                                            experience_level: inferExperienceLevel(item.name, item.contents || ""),
                                            skills_required: extractSkills(item.contents || ""),
                                            application_url: canonicalizeUrl(item.refs?.landing_page || null),
                                            source: "themuse",
                                            source_id: String(item.id),
                                            posted_date: posted
                                        });
                                    }
                                }
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                } catch (e) {}
            };

            const fetchRemoteOk = async () => {
                try {
                    const res = await fetch(`https://remoteok.com/api?location=${encodeURIComponent(loc)}`, {
                        headers: { "User-Agent": "VokeAI/1.0 JobScout" }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            for (const item of data.slice(1, 100)) {
                                if (!item.position) continue;
                                stats.remoteok.fetched++;
                                const posted = item.date ? new Date(item.date).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.remoteok.kept++;
                                    jobs.push({
                                        title: item.position,
                                        company: item.company || "Remote Company",
                                        description: item.description || item.position,
                                        salary_range: item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : (item.salary || null),
                                        location: item.location || loc,
                                        remote_ok: true,
                                        experience_level: inferExperienceLevel(item.position, item.description || ""),
                                        skills_required: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 10) : extractSkills(item.description || ""),
                                        application_url: canonicalizeUrl(item.url || item.apply_url || null),
                                        source: "remoteok",
                                        source_id: String(item.id || item.slug || Math.random()),
                                        posted_date: posted
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {}
            };

            const fetchRemotive = async () => {
                try {
                    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(loc)}&limit=100`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.jobs && Array.isArray(data.jobs)) {
                            for (const item of data.jobs) {
                                stats.remotive.fetched++;
                                const posted = item.publication_date ? new Date(item.publication_date).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.remotive.kept++;
                                    jobs.push({
                                        title: item.title,
                                        company: item.company_name || "Company",
                                        description: item.description || item.title,
                                        salary_range: item.salary || null,
                                        location: item.candidate_required_location || loc,
                                        remote_ok: true,
                                        experience_level: inferExperienceLevel(item.title, item.description || ""),
                                        skills_required: Array.isArray(item.tags) ? item.tags : extractSkills(item.description || ""),
                                        application_url: canonicalizeUrl(item.url || null),
                                        source: "remotive",
                                        source_id: String(item.id || Math.random()),
                                        posted_date: posted
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {}
            };

            return [fetchTheMuse, fetchRemoteOk, fetchRemotive];
        };

        // We run sequentially over locations to not overwhelm the limits or memory
        for (const loc of activeLocations) {
            console.log("Fetching for location:", loc);
            const fetchers = createFetchers(loc);
            await Promise.allSettled(fetchers.map(fn => fn()));
            // Brief pause to respect API rate limits
            await new Promise(r => setTimeout(r, 100)); 
        }

        console.log("Finished fetching. Total jobs kept:", jobs.length);

        if (jobs.length > 0) {
            // Deduplicate in memory before upsert
            const uniqueJobs = Array.from(new Map(jobs.map(item => [`${item.source}_${item.source_id}`, item])).values());
            
            console.log(`Deduplicated to ${uniqueJobs.length} jobs. Inserting in chunks...`);
            
            const chunkSize = 1000;
            let insertedCount = 0;
            for (let i = 0; i < uniqueJobs.length; i += chunkSize) {
                const chunk = uniqueJobs.slice(i, i + chunkSize);
                const { error: insertError } = await supabase
                    .from('job_postings')
                    .upsert(chunk, {
                        onConflict: 'source,source_id',
                        ignoreDuplicates: true
                    });

                if (insertError) {
                    console.error(`Error inserting chunk ${i / chunkSize}:`, insertError);
                } else {
                    insertedCount += chunk.length;
                }
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    count: insertedCount,
                    stats: stats,
                    message: "Real jobs successfully fetched and inserted."
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: false,
                message: 'No jobs fetched from real APIs.',
                stats: stats,
                jobs: []
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in fetch-real-jobs:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

function inferExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff') || text.includes('architect')) {
        return 'senior'
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('intern') || text.includes('associate') || text.includes('graduate') || text.includes('fresher')) {
        return 'entry'
    }
    return 'mid'
}

function extractSkills(description: string): string[] {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
        'React', 'Vue', 'Next.js', 'Angular', 'Node.js', 'Express', 'Django', 'Spring Boot',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
        'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
        'Machine Learning', 'AI', 'Tailwind', 'Git', 'CI/CD', 'DevOps', 'Data Science'
    ]

    const found = commonSkills.filter(skill =>
        description.toLowerCase().includes(skill.toLowerCase())
    )

    return found.length > 0 ? found.slice(0, 8) : ['Software Engineering', 'Problem Solving']
}
