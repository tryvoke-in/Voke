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
        const { error: recError } = await supabase
            .from('job_recommendations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
            
        if (recError) {
            console.error("Failed to wipe old job recommendations:", recError);
        } else {
            console.log("Successfully wiped all old job recommendations to clear foreign keys.");
        }

        // 2. Wipe ALL old job postings (except AI generated) so the DB is completely fresh!
        const { error: cleanupError } = await supabase
            .from('job_postings')
            .delete()
            .neq('source', 'ai-generated');
            
        if (cleanupError) {
            console.error("Failed to clean up old job postings:", cleanupError);
        } else {
            console.log("Successfully wiped all old job postings from database.");
        }

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

        const streams = ["Machine Learning", "Developer", "Data Science", "Artificial Intelligence", "Computer Engineer"];
        const jobs: RawJob[] = [];
        const stats: Record<string, { fetched: number, kept: number }> = {
            adzuna: { fetched: 0, kept: 0 },
            findwork: { fetched: 0, kept: 0 },
            themuse: { fetched: 0, kept: 0 },
            jobicy: { fetched: 0, kept: 0 },
            remotive: { fetched: 0, kept: 0 },
            google_jobs: { fetched: 0, kept: 0 },
            remoteok: { fetched: 0, kept: 0 },
        };

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();
        const isRecent = (dateStr: string) => {
            if (!dateStr) return true; 
            try {
                const dateMs = new Date(dateStr).getTime();
                if (isNaN(dateMs)) return true;
                return (nowMs - dateMs) <= SEVEN_DAYS_MS;
            } catch {
                return true;
            }
        };

        // Define fetchers per query and location
        const createFetchers = (query: string, loc: string) => {
            const fetchAdzuna = async () => {
                const adzunaAppId = Deno.env.get('ADZUNA_APP_ID');
                const adzunaAppKey = Deno.env.get('ADZUNA_APP_KEY');
                if (!adzunaAppId || !adzunaAppKey) return;
                try {
                    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=30&what=${encodeURIComponent(query)}&where=${encodeURIComponent(loc)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && Array.isArray(data.results)) {
                            for (const item of data.results) {
                                stats.adzuna.fetched++;
                                const posted = item.created ? new Date(item.created).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.adzuna.kept++;
                                    jobs.push({
                                        title: item.title,
                                        company: item.company?.display_name || "Unknown Company",
                                        description: item.description || item.title,
                                        salary_range: item.salary_min && item.salary_max ? `₹${item.salary_min} - ₹${item.salary_max}` : null,
                                        location: item.location?.display_name || loc,
                                        remote_ok: item.title?.toLowerCase().includes('remote') || false,
                                        experience_level: inferExperienceLevel(item.title, item.description || ""),
                                        skills_required: extractSkills(item.description || ""),
                                        application_url: canonicalizeUrl(item.redirect_url || null),
                                        source: "adzuna",
                                        source_id: String(item.id),
                                        posted_date: posted
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {}
            };

            const fetchFindwork = async () => {
                try {
                    const res = await fetch(`https://findwork.dev/api/jobs/?location=${encodeURIComponent(loc)}&search=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && Array.isArray(data.results)) {
                            for (const item of data.results.slice(0, 20)) {
                                stats.findwork.fetched++;
                                const posted = item.date_posted ? new Date(item.date_posted).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.findwork.kept++;
                                    jobs.push({
                                        title: item.role,
                                        company: item.company_name || "Tech Company",
                                        description: item.text || item.role,
                                        salary_range: null,
                                        location: item.location || loc,
                                        remote_ok: item.remote || false,
                                        experience_level: inferExperienceLevel(item.role, item.text || ""),
                                        skills_required: Array.isArray(item.keywords) ? item.keywords : extractSkills(item.text || ""),
                                        application_url: canonicalizeUrl(item.url || null),
                                        source: "findwork",
                                        source_id: String(item.id || Math.random()),
                                        posted_date: posted
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {}
            };

            const fetchTheMuse = async () => {
                try {
                    const res = await fetch(`https://www.themuse.com/api/public/jobs?location=${encodeURIComponent(loc)}&page=1&descending=true&category=${encodeURIComponent(query.split(' ')[0])}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && Array.isArray(data.results)) {
                            for (const item of data.results.slice(0, 20)) {
                                stats.themuse.fetched++;
                                const posted = item.publication_date ? new Date(item.publication_date).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.themuse.kept++;
                                    jobs.push({
                                        title: item.name,
                                        company: item.company?.name || "Unknown Company",
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
                        }
                    }
                } catch (e) {}
            };

            const fetchJobicy = async () => {
                try {
                    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20&geo=apac&industry=${encodeURIComponent(query.split(' ')[0])}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.jobs && Array.isArray(data.jobs)) {
                            for (const item of data.jobs) {
                                stats.jobicy.fetched++;
                                const posted = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.jobicy.kept++;
                                    jobs.push({
                                        title: item.jobTitle,
                                        company: item.companyName || "Tech Company",
                                        description: item.jobDescription || item.jobTitle,
                                        salary_range: item.annualSalaryMin && item.annualSalaryMax ? `$${item.annualSalaryMin} - $${item.annualSalaryMax}` : null,
                                        location: item.jobGeo || loc,
                                        remote_ok: true,
                                        experience_level: inferExperienceLevel(item.jobTitle, item.jobDescription || ""),
                                        skills_required: Array.isArray(item.jobIndustry) ? item.jobIndustry : extractSkills(item.jobDescription || ""),
                                        application_url: canonicalizeUrl(item.url || null),
                                        source: "jobicy",
                                        source_id: String(item.id || Math.random()),
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
                    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(loc)}&limit=20`);
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

            const fetchSerpApi = async () => {
                const serpApiKey = Deno.env.get('SERPAPI_KEY');
                if (!serpApiKey) return;
                try {
                    const serpUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query + ' ' + loc)}&gl=in&hl=en&api_key=${serpApiKey}`;
                    const res = await fetch(serpUrl);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.jobs_results && Array.isArray(data.jobs_results)) {
                            for (const item of data.jobs_results.slice(0, 15)) {
                                stats.google_jobs.fetched++;
                                const posted = new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.google_jobs.kept++;
                                    const applyLink = item.apply_options?.[0]?.link || item.share_link || null;
                                    jobs.push({
                                        title: item.title,
                                        company: item.company_name || "Company",
                                        description: item.description || item.snippet || "",
                                        salary_range: item.detected_extensions?.salary || null,
                                        location: item.location || loc,
                                        remote_ok: item.detected_extensions?.work_from_home || item.title.toLowerCase().includes("remote"),
                                        experience_level: inferExperienceLevel(item.title, item.description || ""),
                                        skills_required: extractSkills(item.description || ""),
                                        application_url: canonicalizeUrl(applyLink),
                                        source: "google_jobs",
                                        source_id: String(item.job_id || item.title + item.company_name),
                                        posted_date: posted
                                    });
                                }
                            }
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
                            const rawList = data.slice(1, 15);
                            for (const item of rawList) {
                                if (!item.position) continue;
                                stats.remoteok.fetched++;
                                const posted = item.date ? new Date(item.date).toISOString() : new Date().toISOString();
                                if (isRecent(posted)) {
                                    stats.remoteok.kept++;
                                    jobs.push({
                                        title: item.position,
                                        company: item.company || "Unknown Company",
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

            return [fetchAdzuna, fetchFindwork, fetchTheMuse, fetchJobicy, fetchRemotive, fetchSerpApi, fetchRemoteOk];
        };

        // We run sequentially over locations to not overwhelm the limits or memory
        for (const loc of activeLocations) {
            console.log("Fetching for location:", loc);
            // We run sequentially over streams to get a diverse spread
            for (const stream of streams) {
                console.log(" -> Stream:", stream);
                const fetchers = createFetchers(stream, loc);
                await Promise.allSettled(fetchers.map(fn => fn()));
                // Brief pause to respect API rate limits
                await new Promise(r => setTimeout(r, 500));
            }
        }

        console.log("Finished fetching. Total jobs kept:", jobs.length);

        if (jobs.length > 0) {
            // Deduplicate in memory before upsert
            const uniqueJobs = Array.from(new Map(jobs.map(item => [`${item.source}_${item.source_id}`, item])).values());
            
            const { data: insertedJobs, error: insertError } = await supabase
                .from('job_postings')
                .upsert(uniqueJobs, {
                    onConflict: 'source,source_id',
                    ignoreDuplicates: true
                })
                .select()

            if (insertError) {
                console.error('Error inserting jobs to DB:', insertError)
                return new Response(JSON.stringify({ success: false, error: insertError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    count: uniqueJobs.length,
                    stats: stats,
                    jobs: insertedJobs || uniqueJobs
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: false,
                message: 'No jobs fetched from free APIs.',
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
