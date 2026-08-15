import fs from 'fs';

const fileContent = fs.readFileSync('./src/data/eliteNewtonQuestions.ts', 'utf8');
const sections = fileContent.split('"id":');
let noTestCases = [];

for (let sec of sections) {
  if (sec.includes('"title"')) {
    const titleMatch = sec.match(/"title":\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    const testCaseMatch = sec.match(/"testCases":\s*\[([\s\S]*?)\]/);
    if (!testCaseMatch || testCaseMatch[1].trim() === '') {
      noTestCases.push(title);
    }
  }
}

console.log('Problems with empty test cases:', noTestCases);
