const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase/functions/fetch-real-jobs/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace `\`` with ```
content = content.replace(/\\`/g, '`');

// Replace `\$` with `$`
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(filePath, content);
console.log('Fixed backslashes in fetch-real-jobs/index.ts');
