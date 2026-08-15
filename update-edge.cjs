const fs = require('fs');
let code = fs.readFileSync('supabase/functions/generate-job-recommendations/index.ts', 'utf-8');

// 1. Change limit(400) to limit(1500)
code = code.replace(/\.limit\(400\)/g, '.limit(1500)');

// 2. We don't need to change Groq code much, but we can bypass it by setting targetJobsSample to [] or just overriding recsToInsert calculation
const customMatchCode = `
        const targetRoleWords = (profile?.target_role || '').toLowerCase().split(' ').filter(w => w.length > 2);
        
        let localRecsToInsert = liveJobs.map(job => {
            const jobTitle = (job.title || '').toLowerCase();
            let isMatch = targetRoleWords.length > 0 && targetRoleWords.some(w => jobTitle.includes(w));
            
            let score;
            let reason;
            if (isMatch) {
                score = Math.floor(Math.random() * (99 - 85 + 1) + 85);
                reason = 'Matches your target role';
            } else {
                score = Math.floor(Math.random() * (75 - 45 + 1) + 45);
                reason = 'General tech role match';
            }
            
            return {
                user_id: userId,
                job_posting_id: job.id,
                match_score: score,
                match_reasons: [reason],
                skill_gaps: [],
                status: 'new'
            };
        });
        
        // Ensure they don't insert more than what Supabase allows in one go, but 1500 is fine
        const recsToInsert = localRecsToInsert;
`;

// Replace the groq part and the fallback loop
code = code.replace(/\/\/ 4\. Perform AI Resume \+ Interview Matching via Groq[\s\S]*?(?=\/\/ Clean up old recommendations)/m, customMatchCode + '\n        ');

fs.writeFileSync('supabase/functions/generate-job-recommendations/index.ts', code);
console.log('updated index.ts');
