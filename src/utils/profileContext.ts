import { supabase } from '@/integrations/supabase/client';

export interface ProfileContext {
    fullName: string;
    context: string;
    projectCount: number;
    hasResume: boolean;
    hasGithub: boolean;
}

/**
 * Loads user profile context including GitHub projects and resume content
 * @returns ProfileContext object with formatted context string
 */
export async function loadUserProfileContext(): Promise<ProfileContext> {
    try {
        console.log('[ProfileContext] Starting profile context load...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        let userProfile = profile as any;

        if (profileError || !userProfile) {
            console.warn('[ProfileContext] Profile not found in database, creating fallback context.');
            const userMetadata = user.user_metadata || {};
            const fallbackFullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'Candidate';
            
            try {
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        full_name: fallbackFullName
                    }])
                    .select()
                    .maybeSingle();
                
                if (!insertError && newProfile) {
                    userProfile = newProfile;
                } else {
                    userProfile = {
                        id: user.id,
                        email: user.email,
                        full_name: fallbackFullName,
                        created_at: new Date().toISOString()
                    };
                }
            } catch (err) {
                userProfile = {
                    id: user.id,
                    email: user.email,
                    full_name: fallbackFullName,
                    created_at: new Date().toISOString()
                };
            }
        }

        console.log('[ProfileContext] Profile loaded:', {
            hasGithub: !!userProfile.github_url,
            hasResume: !!userProfile.resume_url
        });

        let context = `User Name: ${userProfile.full_name || 'Candidate'}\n`;
        let projectCount = 0;
        let hasGithub = false;
        let hasResume = false;

        // Fetch GitHub context
        if (userProfile.github_url) {
            try {
                const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
                const usernameMatch = userProfile.github_url.match(/github\.com\/([^\/]+)/);
                if (usernameMatch) {
                    const username = usernameMatch[1];
                    const headers: Record<string, string> = {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Voke-Interview-App'
                    };

                    let reposResponse = await fetch(
                        `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
                        { headers }
                    );

                    if ((reposResponse.status === 401 || reposResponse.status === 403) && githubToken) {
                        console.warn('[ProfileContext] Public request failed or token required. Retrying with token...');
                        const authHeaders = { ...headers, 'Authorization': `token ${githubToken}` };
                        reposResponse = await fetch(
                            `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
                            { headers: authHeaders }
                        );
                    }

                    if (reposResponse.ok) {
                        const repos = await reposResponse.json();
                        projectCount = repos.length;

                        const projectSummaries = await Promise.all(
                            repos.map(async (repo: any) => {
                                let readmeSummary = 'No README available';

                                try {
                                    let readmeResponse = await fetch(
                                        `https://api.github.com/repos/${username}/${repo.name}/readme`,
                                        { headers }
                                    );

                                    if ((readmeResponse.status === 401 || readmeResponse.status === 403) && githubToken) {
                                        const authHeaders = { ...headers, 'Authorization': `token ${githubToken}` };
                                        readmeResponse = await fetch(
                                            `https://api.github.com/repos/${username}/${repo.name}/readme`,
                                            { headers: authHeaders }
                                        );
                                    }

                                    if (readmeResponse.ok) {
                                        const readmeData = await readmeResponse.json();
                                        const decodedContent = atob(readmeData.content);
                                        readmeSummary = decodedContent.substring(0, 300).replace(/[#*`\n]/g, ' ').trim();
                                    }
                                } catch (e) {
                                    console.log(`[ProfileContext] No README for ${repo.name}`);
                                }

                                return `Project: ${repo.name}\n- Description: ${repo.description || 'No description'}\n- Tech: ${repo.language || 'Not specified'}\n- Stars: ${repo.stargazers_count}\n- Summary: ${readmeSummary}`;
                            })
                        );

                        context += `\nGITHUB PROJECTS:\n${projectSummaries.join('\n\n')}\n`;
                        hasGithub = true;
                        console.log('[ProfileContext] ✓ GitHub projects loaded:', projectCount);
                    }
                }
            } catch (e) {
                console.error('[ProfileContext] GitHub fetch error:', e);
                context += `GitHub Profile: ${userProfile.github_url}\n`;
            }
        }

        // Fetch LeetCode data
        if (userProfile.leetcode_id) {
            try {
                console.log('[ProfileContext] Fetching LeetCode data...');
                const { data, error } = await supabase.functions.invoke('fetch-leetcode-data', {
                    body: { username: userProfile.leetcode_id }
                });

                if (!error && data && !data.error) {
                    const solved = data.submitStats?.find((s: any) => s.difficulty === "All")?.count || 0;
                    const rating = Math.round(data.contestRanking?.rating || 0);
                    context += `\nLEETCODE PROFILE:\n- Username: ${userProfile.leetcode_id}\n- Problems Solved: ${solved}\n- Contest Rating: ${rating}\n`;
                    console.log('[ProfileContext] ✓ LeetCode data loaded');
                }
            } catch (e) {
                console.error('[ProfileContext] LeetCode fetch error:', e);
            }
        }

        // Fetch Codeforces data
        if (userProfile.codeforces_id) {
            try {
                console.log('[ProfileContext] Fetching Codeforces data...');
                const { data, error } = await supabase.functions.invoke('fetch-codeforces-data', {
                    body: { handle: userProfile.codeforces_id }
                });

                if (!error && data && !data.error) {
                    context += `\nCODEFORCES PROFILE:\n- Handle: ${userProfile.codeforces_id}\n- Rating: ${data.rating}\n- Rank: ${data.rank}\n- Max Rating: ${data.maxRating}\n`;
                    console.log('[ProfileContext] ✓ Codeforces data loaded');
                }
            } catch (e) {
                console.error('[ProfileContext] Codeforces fetch error:', e);
            }
        }

        // Parse resume PDF
        if (userProfile.resume_url) {
            try {
                console.log('[ProfileContext] Fetching resume...');
                const resumeResponse = await fetch(userProfile.resume_url);
                const resumeBlob = await resumeResponse.blob();
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    'pdfjs-dist/build/pdf.worker.min.mjs',
                    import.meta.url
                ).toString();

                const arrayBuffer = await resumeBlob.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let resumeText = '';
                for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    resumeText += pageText + '\n';
                }

                resumeText = resumeText.replace(/\s+/g, ' ').trim().substring(0, 2000);
                context += `\nRESUME CONTENT:\n${resumeText}\n`;
                hasResume = true;
                console.log('[ProfileContext] ✓ Resume parsed, length:', resumeText.length);
            } catch (e) {
                console.error('[ProfileContext] Resume parse error:', e);
                context += `Resume URL: ${userProfile.resume_url}\n`;
            }
        }

        if (userProfile.linkedin_url) {
            context += `LinkedIn Profile: ${userProfile.linkedin_url}\n`;
        }

        console.log('[ProfileContext] Context loaded successfully, length:', context.length);

        return {
            fullName: userProfile.full_name || 'Candidate',
            context,
            projectCount,
            hasResume,
            hasGithub
        };
    } catch (error) {
        console.error('[ProfileContext] Error loading profile context:', error);
        throw error;
    }
}
