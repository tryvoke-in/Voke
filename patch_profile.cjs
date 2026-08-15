const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Profile.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add location to formData state
content = content.replace(
  /github_url: "",\n  }\);/,
  `github_url: "",\n    location: "",\n  });`
);

// 2. Add location to setFormData inside loadProfile
content = content.replace(
  /github_url: loadedProfile\.github_url \|\| "",\n      }\);/,
  `github_url: loadedProfile.github_url || "",\n        location: loadedProfile.location || "",\n      });`
);

// 3. Add location input to UI
// We need to find where github_url or full_name input is rendered. Let's look for `htmlFor="full_name"` or similar.
const locationInput = `
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-gray-200">Primary Location (Job Preference)</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="bg-black/50 border-white/10 text-white focus:border-violet-500/50"
                          placeholder="e.g. Pune, Mumbai, Remote"
                        />
                      </div>
`;
content = content.replace(
  /<div className="space-y-2">\s*<Label htmlFor="full_name".*?>.*?<\/Label>\s*<Input[\s\S]*?id="full_name"[\s\S]*?\/>\s*<\/div>/,
  `$&${locationInput}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched Profile.tsx');
