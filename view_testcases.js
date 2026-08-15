const fs = require('fs');
const problems = require('./src/data/eliteNewtonQuestions.ts').NEWTON_SECTION_A_PROBLEMS;
// Wait, I cannot require eliteNewtonQuestions.ts directly. Let me use pure regex.
const fileContent = fs.readFileSync('./src/data/eliteNewtonQuestions.ts', 'utf8');

// Just split by "title": 
const sections = fileContent.split('"id":');
let noTestCases = [];
for (let sec of sections) {
  if (sec.includes('"title"')) {
    const titleMatch = sec.match(/"title":\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "Unknown";
    const testCaseMatch = sec.match(/"testCases":\s*\[([\s\S]*?)\]/);
    if (!testCaseMatch) {
       noTestCases.push(title);
    } else {
       // Check if empty
       if (testCaseMatch[1].trim() === '') {
         noTestCases.push(title);
       }
    }
  }
}

console.log("Problems with empty or no test cases:", noTestCases);
