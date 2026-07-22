import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { githubUrl, githubToken } = await req.json()

        if (!githubUrl) {
            return new Response(
                JSON.stringify({ error: 'GitHub URL is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Extract username from GitHub URL
        const usernameMatch = githubUrl.match(/github\.com\/([^\/]+)/)
        if (!usernameMatch) {
            return new Response(
                JSON.stringify({ error: 'Invalid GitHub URL format' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const username = usernameMatch[1]
        console.log('Fetching repos for:', username)

        // Fetch user's repositories
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Voke-Interview-App'
        }

        if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`
        }

        const reposResponse = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
            { headers }
        )

        if (!reposResponse.ok) {
            const errorText = await reposResponse.text()
            console.error('GitHub API error:', errorText)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch GitHub repositories', details: errorText }),
                { status: reposResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const repos = await reposResponse.json()
        console.log(`Found ${repos.length} repositories`)

        // Extract relevant information from each repo
        const projectSummaries = await Promise.all(
            repos.slice(0, 5).map(async (repo: any) => {
                let readmeContent = ''

                // Try to fetch README
                try {
                    const readmeResponse = await fetch(
                        `https://api.github.com/repos/${username}/${repo.name}/readme`,
                        { headers }
                    )

                    if (readmeResponse.ok) {
                        const readmeData = await readmeResponse.json()
                        // Decode base64 content
                        const decodedContent = atob(readmeData.content)
                        // Take first 500 characters
                        readmeContent = decodedContent.substring(0, 500).replace(/[#*`]/g, '').trim()
                    }
                } catch (e) {
                    console.log(`No README for ${repo.name}`)
                }

                return {
                    name: repo.name,
                    description: repo.description || 'No description',
                    language: repo.language || 'Not specified',
                    stars: repo.stargazers_count,
                    url: repo.html_url,
                    readmeSummary: readmeContent || 'No README available',
                    topics: repo.topics || []
                }
            })
        )

        // Format context for the AI
        const contextText = projectSummaries.map((project, idx) =>
            `Project ${idx + 1}: ${project.name}
- Description: ${project.description}
- Tech Stack: ${project.language}${project.topics.length > 0 ? ', ' + project.topics.join(', ') : ''}
- Stars: ${project.stars}
- Summary: ${project.readmeSummary.substring(0, 200)}...`
        ).join('\n\n')

        return new Response(
            JSON.stringify({
                success: true,
                projects: projectSummaries,
                contextText: contextText
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
