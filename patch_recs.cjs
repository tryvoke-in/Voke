const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase/functions/generate-job-recommendations/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the select query to include location
content = content.replace(
  /select\('full_name, resume_url, github_url, target_role'\)/,
  `select('full_name, resume_url, github_url, target_role, location')`
);

// 2. Update the sorting logic to use profile location
const newSortingLogic = `        // Ensure we prioritize jobs from the user's primary location
        const userLocation = (profile?.location || '').toLowerCase().trim();
        if (userLocation) {
            console.log("Prioritizing jobs for user location:", userLocation);
            liveJobs.sort((a: any, b: any) => {
                const aLoc = (a.location || '').toLowerCase();
                const bLoc = (b.location || '').toLowerCase();
                const aIsMatch = aLoc.includes(userLocation);
                const bIsMatch = bLoc.includes(userLocation);
                
                if (aIsMatch && !bIsMatch) return -1;
                if (!aIsMatch && bIsMatch) return 1;
                return 0;
            });
        } else {
            console.log("No user location found, falling back to default sorting.");
            liveJobs.sort((a: any, b: any) => {
                const aLoc = (a.location || '').toLowerCase();
                const bLoc = (b.location || '').toLowerCase();
                const aIsIndia = aLoc.includes('india') || aLoc.includes('bengaluru') || aLoc.includes('hyderabad') || aLoc.includes('pune') || aLoc.includes('delhi');
                const bIsIndia = bLoc.includes('india') || bLoc.includes('bengaluru') || bLoc.includes('hyderabad') || bLoc.includes('pune') || bLoc.includes('delhi');
                if (aIsIndia && !bIsIndia) return -1;
                if (!aIsIndia && bIsIndia) return 1;
                return 0;
            });
        }`;

content = content.replace(
  /\s*\/\/ Ensure we prioritize Indian jobs as requested by the user[\s\S]*?return 0;\n        \}\);/,
  `\n${newSortingLogic}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched generate-job-recommendations/index.ts');
