import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, location = "United States", page = 1 } = await req.json()

        // Use The Muse API or Adzuna API (common job search APIs)
        // This is a generic implementation - adjust based on actual API
        const JOB_API_KEY = Deno.env.get('JOB_SEARCH_API_KEY') || '2451839aa10951a2081e044f97a26f7f'

        // Try The Muse API format first
        // Note: API key removed as it was causing 403 errors and the API is public
        const museUrl = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`

        let jobs = []

        try {
            const response = await fetch(museUrl)
            const data = await response.json()

            if (data.results) {
                // The Muse API format
                jobs = data.results.map((job: any) => ({
                    title: job.name,
                    company: job.company?.name || 'Unknown Company',
                    description: job.contents || job.short_description || '',
                    requirements: '',
                    salary_range: null,
                    location: job.locations?.[0]?.name || location,
                    remote_ok: job.locations?.some((loc: any) => loc.name.toLowerCase().includes('remote')) || false,
                    experience_level: inferExperienceLevel(job.name, job.contents),
                    skills_required: extractSkills(job.contents || ''),
                    application_url: job.refs?.landing_page || null,
                    source: 'themuse',
                    posted_date: new Date(job.publication_date || Date.now()).toISOString()
                }))
            }
        } catch (error) {
            console.error('The Muse API error:', error)

            // Fallback: Try Adzuna API format
            try {
                const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${JOB_API_KEY}&app_key=${JOB_API_KEY}&results_per_page=20&what=${encodeURIComponent(query || 'software engineer')}`

                const adzunaResponse = await fetch(adzunaUrl)
                const adzunaData = await adzunaResponse.json()

                if (adzunaData.results) {
                    jobs = adzunaData.results.map((job: any) => ({
                        title: job.title,
                        company: job.company?.display_name || 'Unknown Company',
                        description: job.description || '',
                        requirements: '',
                        salary_range: job.salary_min && job.salary_max
                            ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
                            : null,
                        location: job.location?.display_name || location,
                        remote_ok: job.title?.toLowerCase().includes('remote') || job.description?.toLowerCase().includes('remote') || false,
                        experience_level: inferExperienceLevel(job.title, job.description),
                        skills_required: extractSkills(job.description || ''),
                        application_url: job.redirect_url || null,
                        source: 'adzuna',
                        posted_date: new Date(job.created || Date.now()).toISOString()
                    }))
                }
            } catch (adzunaError) {
                console.error('Adzuna API error:', adzunaError)
            }
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Store jobs in database (upsert to avoid duplicates)
        if (jobs.length > 0) {
            const { data: insertedJobs, error: insertError } = await supabase
                .from('job_postings')
                .upsert(jobs, {
                    onConflict: 'title,company',
                    ignoreDuplicates: true
                })
                .select()

            if (insertError) {
                console.error('Error inserting jobs:', insertError)
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    count: jobs.length,
                    jobs: insertedJobs || jobs
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: false,
                message: 'No jobs found. API key may be invalid or API is unavailable.',
                jobs: []
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error in fetch-real-jobs:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Helper function to infer experience level from job title/description
function inferExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
        return 'senior'
    }
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('intern')) {
        return 'entry'
    }
    if (text.includes('mid') || text.includes('intermediate')) {
        return 'mid'
    }

    // Default based on years of experience mentioned
    if (text.match(/\d+\+?\s*years?/)) {
        const years = parseInt(text.match(/(\d+)\+?\s*years?/)?.[1] || '0')
        if (years >= 5) return 'senior'
        if (years >= 2) return 'mid'
        return 'entry'
    }

    return 'mid' // Default
}

// Helper function to extract skills from job description
function extractSkills(description: string): string[] {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
        'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
        'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
        'System Design', 'Microservices', 'DevOps', 'Security'
    ]

    const foundSkills = commonSkills.filter(skill =>
        description.toLowerCase().includes(skill.toLowerCase())
    )

    return foundSkills.slice(0, 10) // Limit to 10 skills
}
