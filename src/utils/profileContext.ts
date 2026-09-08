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

        // Fetch GitHub context (Auto-connected GitHub OAuth metadata + Stored Profile URL + Supabase Identities + LocalStorage)
        const userMetadata = user.user_metadata || {};
        let targetGithubUsername: string | null = null;

        // 1. Check profile.github_url
        if (userProfile?.github_url) {
            targetGithubUsername = extractGithubUsername(userProfile.github_url);
        }

        // 2. Check local storage if not found in DB
        if (!targetGithubUsername && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const localUsername = localStorage.getItem('voke_github_username');
            if (localUsername) {
                targetGithubUsername = extractGithubUsername(localUsername);
            }
            if (!targetGithubUsername) {
                try {
                    const localResume = localStorage.getItem('voke_resume_data');
                    if (localResume) {
                        const parsed = JSON.parse(localResume);
                        if (parsed.github) {
                            targetGithubUsername = extractGithubUsername(parsed.github);
                        }
                    }
                } catch (e) {
                    console.warn('[ProfileContext] Error reading local resume data:', e);
                }
            }
        }

        // 3. Direct GitHub Auth Session Fallback (Auto-connects from OAuth metadata or identities)
        if (!targetGithubUsername) {
            const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');
            const identityData = githubIdentity?.identity_data || {};

            const oauthCandidate = 
                identityData.user_name || 
                identityData.preferred_username || 
                userMetadata.user_name || 
                userMetadata.preferred_username || 
                (user.app_metadata?.provider === 'github' ? (userMetadata.preferred_username || userMetadata.user_name) : null) || 
                null;

            if (oauthCandidate) {
                targetGithubUsername = extractGithubUsername(oauthCandidate);
                if (targetGithubUsername) {
                    console.log('[ProfileContext] Auto-connected GitHub username from OAuth session:', targetGithubUsername);
                    const autoGithubUrl = `https://github.com/${targetGithubUsername}`;
                    supabase.from('profiles').update({ github_url: autoGithubUrl }).eq('id', user.id).then();
                    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                        localStorage.setItem('voke_github_username', targetGithubUsername);
                    }
                }
            }
        }

        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token || (typeof window !== 'undefined' ? (localStorage.getItem('voke_github_oauth_token') || localStorage.getItem('voke_github_pat')) : null);

        // Fetch Repositories with multi-tier fallback (Live API -> Cache -> Resume Projects)
        if (targetGithubUsername || providerToken) {
            const fetched = await fetchUserGithubRepos(targetGithubUsername || undefined, providerToken);
            if (fetched && fetched.length > 0) {
                githubReposList = fetched;
            }
        }

        // Fallback: If still 0 repos, check cached repos in localStorage
        if (githubReposList.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const cached = getCachedGithubRepos();
            if (cached && cached.length > 0) {
                console.log('[ProfileContext] Recovered repositories from local cache:', cached.length);
                githubReposList = cached;
            }
        }

        // Fallback: If still 0 repos, extract projects from user's profile resume data
        if (githubReposList.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                const localResume = localStorage.getItem('voke_resume_data');
                if (localResume) {
                    const parsed = JSON.parse(localResume);
                    if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
                        const fallbackProjects = parsed.projects
                            .filter((p: any) => p && (p.name || p.title))
                            .map((p: any) => ({
                                name: (p.name || p.title).trim(),
                                description: p.description || 'Project from candidate profile',
                                language: p.techStack || 'TypeScript/JavaScript',
                                summary: `${p.name || p.title}: ${p.description || 'Portfolio candidate project'}`
                            }));
                        if (fallbackProjects.length > 0) {
                            console.log('[ProfileContext] Loaded candidate projects from resume profile:', fallbackProjects.length);
                            githubReposList = fallbackProjects;
                        }
                    }
                }
            } catch (e) {
                console.warn('[ProfileContext] Resume projects fallback note:', e);
            }
        }

        if (githubReposList.length > 0) {
            projectCount = githubReposList.length;
            hasGithub = true;
            const projectSummaries = githubReposList.map((repo) => 
                `Project: ${repo.name}\n- Description: ${repo.description || 'No description'}\n- Tech: ${repo.language || 'Not specified'}\n- Owner: ${targetGithubUsername || 'Candidate'}`
            );
            context += `\nGITHUB PROJECTS:\n${projectSummaries.join('\n\n')}\n`;
            console.log('[ProfileContext] ✓ Repositories successfully attached to context:', projectCount, githubReposList.map(r => r.name));
        } else {
            console.log('[ProfileContext] No GitHub repos or profile projects available.');
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

export interface GitHubRepoItem {
    name: string;
    description: string;
    language: string;
    summary: string;
}

/**
 * Robustly extracts the clean GitHub username from a URL, handle, or string
 */
export function extractGithubUsername(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let val = String(raw).trim();
    if (!val) return null;

    // Strip wrapping quotes, brackets, markdown links
    val = val.replace(/^["'<\(\[]+|["'>\)\]]+$/g, '');
    // Strip leading @
    val = val.replace(/^@+/, '');

    // Handle full URL format
    try {
        if (val.startsWith('http://') || val.startsWith('https://')) {
            const parsed = new URL(val);
            const pathSegments = parsed.pathname.split('/').filter(Boolean);
            if (pathSegments.length > 0) {
                const candidate = pathSegments[0].replace(/^@+/, '');
                if (!['settings', 'explore', 'topics', 'trending', 'features', 'login', 'signup', 'orgs', 'users', 'github.com'].includes(candidate.toLowerCase())) {
                    return candidate;
                }
            }
        }
    } catch {
        // Fall back to regex cleaning
    }

    // Handle non-protocol URLs like "github.com/username" or "username/project"
    const cleaned = val
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/^github\.com\//i, '')
        .split('?')[0]
        .split('#')[0];

    const segments = cleaned.split('/').map(s => s.trim()).filter(Boolean);
    if (segments.length > 0) {
        const candidate = segments[0].replace(/^@+/, '');
        if (candidate && !['settings', 'explore', 'topics', 'trending', 'features', 'login', 'signup', 'orgs', 'users', 'github.com'].includes(candidate.toLowerCase())) {
            return candidate;
        }
    }

    return null;
}

/**
 * Retrieve cached repositories from localStorage
 */
export function getCachedGithubRepos(): GitHubRepoItem[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    try {
        const saved = localStorage.getItem('voke_cached_github_repos');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('[ProfileContext] Error reading cached repos:', e);
    }
    return [];
}

/**
 * Save or add custom repo directly to local cache & active list
 */
export function saveCustomRepo(repo: { name: string; description?: string; language?: string }): GitHubRepoItem[] {
    if (!repo || !repo.name) return getCachedGithubRepos();
    const cleanName = repo.name.trim();
    const existing = getCachedGithubRepos();
    const filtered = existing.filter(r => r.name.toLowerCase() !== cleanName.toLowerCase());
    const newItem: GitHubRepoItem = {
        name: cleanName,
        description: repo.description?.trim() || 'Custom candidate project',
        language: repo.language?.trim() || 'TypeScript/JavaScript',
        summary: repo.description ? `${cleanName}: ${repo.description.trim()}` : `${cleanName} project repository`
    };
    const updated = [newItem, ...filtered];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('voke_cached_github_repos', JSON.stringify(updated));
        } catch (e) {
            console.warn('[ProfileContext] Failed to persist custom repo:', e);
        }
    }
    return updated;
}

/**
 * Fetch GitHub repos for user with resilience against 401 token expiration and 403 rate-limits
 */
export async function fetchUserGithubRepos(
    usernameOverride?: string,
    providerTokenOverride?: string | null
): Promise<GitHubRepoItem[]> {
    const rawUsername = usernameOverride || (typeof window !== 'undefined' ? localStorage.getItem('voke_github_username') : null);
    const username = extractGithubUsername(rawUsername);

    let personalAccessToken: string | null = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        personalAccessToken = localStorage.getItem('voke_github_pat') || null;
    }

    const allRawRepos: any[] = [];
    const baseHeaders: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
    };

    // 1. If PAT is provided by candidate, it gives 5,000 req/hr rate limit
    const authHeaders: Record<string, string> = { ...baseHeaders };
    let hasAuthToken = false;

    const oauthToken = providerTokenOverride || (typeof window !== 'undefined' ? localStorage.getItem('voke_github_oauth_token') : null);

    // 0. High-speed rate-limit-immune local proxy endpoint
    if (username && typeof window !== 'undefined') {
        try {
            const proxyRes = await fetch(`/api/github-repos?username=${encodeURIComponent(username)}`);
            if (proxyRes.ok) {
                const proxyData = await proxyRes.json();
                if (Array.isArray(proxyData) && proxyData.length > 0) {
                    console.log(`[ProfileContext] Successfully fetched ${proxyData.length} repos via proxy for @${username}`);
                    localStorage.setItem('voke_cached_github_repos', JSON.stringify(proxyData));
                    localStorage.setItem('voke_github_username', username);
                    return proxyData;
                }
            }
        } catch (proxyErr) {
            console.warn('[ProfileContext] Local proxy note:', proxyErr);
        }
    }

    if (personalAccessToken) {
        authHeaders['Authorization'] = `token ${personalAccessToken.trim()}`;
        hasAuthToken = true;
    } else if (oauthToken) {
        authHeaders['Authorization'] = `Bearer ${oauthToken.trim()}`;
        hasAuthToken = true;
    }

    // Try authenticated endpoint first if token is available
    if (hasAuthToken) {
        try {
            const authRes = await fetch(
                `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100`,
                { headers: authHeaders }
            );
            if (authRes.ok) {
                const repos = await authRes.json();
                if (Array.isArray(repos)) allRawRepos.push(...repos);
            } else if (authRes.status === 401 || authRes.status === 403) {
                console.warn(`[ProfileContext] Auth user repos failed (${authRes.status}), clearing stale token for fallback.`);
                hasAuthToken = false;
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                    localStorage.removeItem('voke_github_oauth_token');
                }
            }
        } catch (err) {
            console.warn('[ProfileContext] Authenticated user repos fetch error:', err);
        }
    }

    // 2. Fetch public repos for target username
    if (allRawRepos.length === 0 && username) {
        try {
            // Only pass Authorization header if token didn't fail earlier
            const reqHeaders = hasAuthToken ? authHeaders : baseHeaders;
            const reposRes = await fetch(
                `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
                { headers: reqHeaders }
            );

            if (reposRes.ok) {
                const repos = await reposRes.json();
                if (Array.isArray(repos)) allRawRepos.push(...repos);
            } else {
                const errStatus = reposRes.status;
                if (errStatus === 403) {
                    console.warn(`[ProfileContext] GitHub rate limit reached for IP (403). Using cached or profile projects.`);
                } else if (errStatus === 401 && hasAuthToken) {
                    // Retry once without token
                    const retryRes = await fetch(
                        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
                        { headers: baseHeaders }
                    );
                    if (retryRes.ok) {
                        const repos = await retryRes.json();
                        if (Array.isArray(repos)) allRawRepos.push(...repos);
                    }
                }
            }
        } catch (err) {
            console.warn('[ProfileContext] Public repos fetch error:', err);
        }
    }

    // 3. Fetch public org repos
    if (username && allRawRepos.length < 50) {
        try {
            const reqHeaders = hasAuthToken ? authHeaders : baseHeaders;
            const orgsRes = await fetch(
                `https://api.github.com/users/${encodeURIComponent(username)}/orgs`,
                { headers: reqHeaders }
            );
            if (orgsRes.ok) {
                const orgs = await orgsRes.json();
                if (Array.isArray(orgs) && orgs.length > 0) {
                    for (const org of orgs.slice(0, 3)) {
                        if (org?.login) {
                            try {
                                const orgReposRes = await fetch(
                                    `https://api.github.com/orgs/${encodeURIComponent(org.login)}/repos?sort=updated&per_page=50`,
                                    { headers: reqHeaders }
                                );
                                if (orgReposRes.ok) {
                                    const orgRepos = await orgReposRes.json();
                                    if (Array.isArray(orgRepos)) allRawRepos.push(...orgRepos);
                                }
                            } catch (oErr) {
                                // Ignore individual org errors
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // Ignore org errors
        }
    }

    // Deduplicate repos by name
    const uniqueMap = new Map<string, any>();
    for (const r of allRawRepos) {
        if (r && r.name && !uniqueMap.has(r.name.toLowerCase())) {
            uniqueMap.set(r.name.toLowerCase(), r);
        }
    }
    const repos = Array.from(uniqueMap.values());

    if (repos.length > 0) {
        const mappedList: GitHubRepoItem[] = repos.map((repo: any) => ({
            name: repo.name,
            description: repo.description || (repo.owner?.login ? `Repository in ${repo.owner.login}` : 'GitHub project repository'),
            language: repo.language || 'TypeScript/JavaScript',
            summary: repo.description ? `${repo.name}: ${repo.description}` : `${repo.name} project repository`
        }));

        // Cache successful response
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('voke_cached_github_repos', JSON.stringify(mappedList));
                if (username) {
                    localStorage.setItem('voke_github_username', username);
                }
            } catch (e) {
                console.warn('[ProfileContext] Error caching repos:', e);
            }
        }
        return mappedList;
    }

    // If fetch yielded 0 (e.g. rate limit 403 or network issue), return cached repos
    const cached = getCachedGithubRepos();
    if (cached.length > 0) {
        return cached;
    }

    return [];
}
