import { supabase } from '@/integrations/supabase/client';

export interface ProfileContext {
    fullName: string;
    context: string;
    projectCount: number;
    hasResume: boolean;
    hasGithub: boolean;
    githubRepos?: { name: string; description: string; language: string; summary: string }[];
    targetRole?: string;
    dreamCompany?: string;
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
            console.log('[ProfileContext] Guest/unauthenticated mode - using default profile context.');
            return {
                fullName: 'Candidate',
                context: 'Candidate practicing technical & behavioral interviews.',
                projectCount: 0,
                hasResume: false,
                hasGithub: false,
                githubRepos: [],
                targetRole: undefined,
                dreamCompany: undefined
            };
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
        const targetRole = userProfile?.target_role || userProfile?.role || userProfile?.headline || undefined;
        const dreamCompany = userProfile?.dream_company || undefined;

        if (targetRole) {
            context += `Target Role: ${targetRole}\n`;
        }
        if (dreamCompany) {
            context += `Target Company: ${dreamCompany}\n`;
        }

        let projectCount = 0;
        let hasGithub = false;
        let hasResume = false;

        let githubReposList: { name: string; description: string; language: string; summary: string }[] = [];

        // Fetch GitHub context (Auto-connected GitHub OAuth metadata + Stored Profile URL + Supabase Identities)
        const userMetadata = user.user_metadata || {};
        let targetGithubUsername: string | null = null;

        if (userProfile?.github_url) {
            const rawGithubUrl = String(userProfile.github_url).trim();
            const cleanUrl = rawGithubUrl.replace(/\/$/, '').split('?')[0];
            const parts = cleanUrl.split('/');
            const candidateName = parts[parts.length - 1];
            if (candidateName && candidateName.toLowerCase() !== 'github.com' && candidateName.toLowerCase() !== 'users') {
                targetGithubUsername = candidateName;
            }
        }

        // Direct GitHub Auth Session Fallback (Auto-connects from OAuth metadata or identities)
        if (!targetGithubUsername) {
            const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');
            const identityData = githubIdentity?.identity_data || {};

            targetGithubUsername = 
                identityData.user_name || 
                identityData.preferred_username || 
                userMetadata.user_name || 
                userMetadata.preferred_username || 
                (user.app_metadata?.provider === 'github' ? (userMetadata.preferred_username || userMetadata.user_name) : null) || 
                null;

            if (targetGithubUsername) {
                console.log('[ProfileContext] Auto-connected GitHub username from OAuth session:', targetGithubUsername);
                const autoGithubUrl = `https://github.com/${targetGithubUsername}`;
                supabase.from('profiles').update({ github_url: autoGithubUrl }).eq('id', user.id).then();
            }
        }

        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (targetGithubUsername || providerToken) {
            try {
                const username = targetGithubUsername || 'user';
                console.log('[ProfileContext] Fetching GitHub repos (Personal & Org)...');

                const allRawRepos: any[] = [];
                const reqHeaders: Record<string, string> = {
                    'Accept': 'application/vnd.github.v3+json'
                };
                if (providerToken) {
                    reqHeaders['Authorization'] = `Bearer ${providerToken}`;
                }

                // 1. Authenticated User Endpoint (Returns all owner, collaborator, & org repos)
                if (providerToken) {
                    try {
                        const authReposRes = await fetch(
                            `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100`,
                            { headers: reqHeaders }
                        );
                        if (authReposRes.ok) {
                            const authRepos = await authReposRes.json();
                            if (Array.isArray(authRepos)) allRawRepos.push(...authRepos);
                        }
                    } catch (aErr) {
                        console.warn('[ProfileContext] Auth user repos fetch note:', aErr);
                    }
                }

                // 2. Personal public repos endpoint
                if (allRawRepos.length === 0 && targetGithubUsername) {
                    const reposResponse = await fetch(
                        `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
                        { headers: reqHeaders }
                    );

                    if (reposResponse.ok) {
                        const userRepos = await reposResponse.json();
                        if (Array.isArray(userRepos)) allRawRepos.push(...userRepos);
                    }
                }

                // 3. Public Organization repos endpoint
                if (targetGithubUsername) {
                    try {
                        const orgsResponse = await fetch(
                            `https://api.github.com/users/${username}/orgs`,
                            { headers: reqHeaders }
                        );
                        if (orgsResponse.ok) {
                            const orgs = await orgsResponse.json();
                            if (Array.isArray(orgs) && orgs.length > 0) {
                                for (const org of orgs) {
                                    if (org?.login) {
                                        const orgReposRes = await fetch(
                                            `https://api.github.com/orgs/${org.login}/repos?sort=updated&per_page=100`,
                                            { headers: reqHeaders }
                                        );
                                        if (orgReposRes.ok) {
                                            const orgRepos = await orgReposRes.json();
                                            if (Array.isArray(orgRepos)) allRawRepos.push(...orgRepos);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (orgErr) {
                        console.warn('[ProfileContext] Org repos fetch note:', orgErr);
                    }
                }

                // Deduplicate repos by name
                const uniqueMap = new Map();
                for (const r of allRawRepos) {
                    if (r && r.name && !uniqueMap.has(r.name)) {
                        uniqueMap.set(r.name, r);
                    }
                }
                const repos = Array.from(uniqueMap.values());

                if (repos.length > 0) {
                    projectCount = repos.length;
                    githubReposList = repos.map((repo: any) => ({
                        name: repo.name,
                        description: repo.description || (repo.owner?.login ? `Repository in ${repo.owner.login}` : 'GitHub project repository'),
                        language: repo.language || 'TypeScript/JavaScript',
                        summary: repo.description ? `${repo.name}: ${repo.description}` : `${repo.name} project repository`
                    }));

                    const projectSummaries = repos.map((repo: any) => 
                        `Project: ${repo.name}\n- Description: ${repo.description || 'No description'}\n- Tech: ${repo.language || 'Not specified'}\n- Owner: ${repo.owner?.login || username}`
                    );

                    context += `\nGITHUB PROJECTS:\n${projectSummaries.join('\n\n')}\n`;
                    hasGithub = true;
                    console.log('[ProfileContext] ✓ Successfully loaded ALL Personal & Org GitHub projects:', projectCount, githubReposList.map(r => r.name));
                }
            } catch (e) {
                console.error('[ProfileContext] GitHub fetch error:', e);
                context += `GitHub Profile: https://github.com/${targetGithubUsername}\n`;
            }
        }

        // DO NOT inject hardcoded dummy repos - keep githubReposList as real user repos only
        if (githubReposList.length === 0) {
            console.log('[ProfileContext] No GitHub repos found for user session.');
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
            hasGithub,
            githubRepos: githubReposList,
            targetRole,
            dreamCompany
        };
    } catch (error) {
        console.error('[ProfileContext] Error loading profile context:', error);
        throw error;
    }
}
