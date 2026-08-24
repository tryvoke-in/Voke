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

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        console.log("Cleaning up old job postings...");
        await supabase.from('job_postings').delete().lt('created_at', thirtyDaysAgo);

        // Fetch monitored locations
        const { data: locationsData } = await supabase
            .from('monitored_locations')
            .select('location_name')
            .eq('is_active', true);
            
        let activeLocations = ["India"];
        if (locationsData && locationsData.length > 0) {
            activeLocations = locationsData.map(l => l.location_name);
        }

        // Add Cybersecurity Domains as requested by user
        const cybersecurityDomains = [
            "Cybersecurity", 
            "SOC Analyst", 
            "IT Support", 
            "Desktop Support", 
            "Information Security"
        ];

        console.log("Fetching for locations:", activeLocations);
        console.log("Fetching for domains:", cybersecurityDomains);

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

        const addJob = (item: any, source: string, loc: string, defaultTitle: string = "") => {
            const posted = (item.publication_date || item.date) ? new Date(item.publication_date || item.date).toISOString() : new Date().toISOString();
            if (isRecent(posted)) {
                stats[source as keyof typeof stats].kept++;
                
                let desc = item.contents || item.short_description || item.description || item.position || item.title || defaultTitle;
                let title = item.name || item.position || item.title || defaultTitle;
                
                jobs.push({
                    title: title,
                    company: item.company?.name || item.company || item.company_name || "Company",
                    description: desc,
                    salary_range: item.salary_range || (item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : (item.salary || null)),
                    location: item.locations?.[0]?.name || item.location || item.candidate_required_location || loc,
                    remote_ok: item.locations?.some((l: any) => l.name?.toLowerCase().includes("remote")) || source === 'remoteok' || source === 'remotive' || false,
                    experience_level: inferExperienceLevel(title, desc),
                    skills_required: (Array.isArray(item.tags) && item.tags.length > 0) ? item.tags.slice(0, 10) : extractSkills(desc),
                    application_url: canonicalizeUrl(item.refs?.landing_page || item.url || item.apply_url || null),
                    source: source,
                    source_id: String(item.id || item.slug || Math.random()),
                    posted_date: posted
                });
            }
        };

        // Fetch by Location
        for (const loc of activeLocations) {
            console.log(`Fetching location: ${loc}`);
            const museLoc = loc.toLowerCase() === 'india' ? 'India' : `${loc}, India`;

            // TheMuse Location
            try {
                for (let page = 1; page <= 3; page++) {
                    const url = `https://www.themuse.com/api/public/jobs?location=${encodeURIComponent(museLoc)}&page=${page}&category=Software%20Engineering&category=Data%20Science&category=IT&category=Computer%20and%20IT`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                            data.results.forEach((item: any) => { stats.themuse.fetched++; addJob(item, 'themuse', loc); });
                        } else break;
                    } else break;
                }
            } catch (e) {}

            // RemoteOk Location
            try {
                const res = await fetch(`https://remoteok.com/api?location=${encodeURIComponent(loc)}`, { headers: { "User-Agent": "VokeAI/1.0 JobScout" }});
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        data.slice(1, 50).forEach(item => { if (item.position) { stats.remoteok.fetched++; addJob(item, 'remoteok', loc); } });
                    }
                }
            } catch (e) {}

            // Remotive Location
            try {
                const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(loc)}&limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.jobs && Array.isArray(data.jobs)) {
                        data.jobs.forEach((item: any) => { stats.remotive.fetched++; addJob(item, 'remotive', loc); });
                    }
                }
            } catch (e) {}
            
            await new Promise(r => setTimeout(r, 200)); 
        }

        // Fetch by Cybersecurity Domain
        for (const domain of cybersecurityDomains) {
            console.log(`Fetching domain: ${domain}`);

            // TheMuse Domain (using category IT)
            try {
                for (let page = 1; page <= 2; page++) {
                    const url = `https://www.themuse.com/api/public/jobs?page=${page}&category=IT&category=Computer%20and%20IT`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.results && Array.isArray(data.results)) {
                            // Filter in memory for domain keywords
                            const filtered = data.results.filter((i: any) => (i.name + i.contents).toLowerCase().includes(domain.toLowerCase()));
                            filtered.forEach((item: any) => { stats.themuse.fetched++; addJob(item, 'themuse', 'Global', domain); });
                        } else break;
                    } else break;
                }
            } catch (e) {}

            // RemoteOk Domain
            try {
                const res = await fetch(`https://remoteok.com/api?tags=${encodeURIComponent(domain)}`, { headers: { "User-Agent": "VokeAI/1.0 JobScout" }});
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        data.slice(1, 50).forEach(item => { if (item.position) { stats.remoteok.fetched++; addJob(item, 'remoteok', 'Remote', domain); } });
                    }
                }
            } catch (e) {}

            // Remotive Domain
            try {
                const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(domain)}&limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.jobs && Array.isArray(data.jobs)) {
                        data.jobs.forEach((item: any) => { stats.remotive.fetched++; addJob(item, 'remotive', 'Remote', domain); });
                    }
                }
            } catch (e) {}

            await new Promise(r => setTimeout(r, 200)); 
        }

        console.log("Finished fetching. Total jobs kept:", jobs.length);

        if (jobs.length > 0) {
            // Deduplicate
            const uniqueJobs = Array.from(new Map(jobs.map(item => [`${item.source}_${item.source_id}`, item])).values());
            console.log(`Deduplicated to ${uniqueJobs.length} jobs.`);
            
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
                    console.error(`Error inserting chunk:`, insertError);
                } else {
                    insertedCount += chunk.length;
                }
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    count: insertedCount,
                    stats: stats,
                    domains: cybersecurityDomains,
                    message: "Real jobs successfully fetched and inserted."
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: false,
                message: 'No jobs fetched.',
                stats: stats,
                domains: cybersecurityDomains,
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
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff') || text.includes('architect')) return 'senior'
    if (text.includes('junior') || text.includes('entry') || text.includes('intern') || text.includes('associate') || text.includes('graduate') || text.includes('fresher')) return 'entry'
    return 'mid'
}

function extractSkills(description: string): string[] {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
        'React', 'Vue', 'Next.js', 'Angular', 'Node.js', 'Express', 'Django', 'Spring Boot',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
        'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
        'Machine Learning', 'AI', 'Cybersecurity', 'SOC', 'Security', 'Network', 'IT Support', 'Active Directory'
    ]
    const found = commonSkills.filter(skill => description.toLowerCase().includes(skill.toLowerCase()))
    return found.length > 0 ? found.slice(0, 8) : ['Problem Solving']
}
