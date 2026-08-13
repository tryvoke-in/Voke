const fs = require('fs');
const data = require('./newton_questions.json');

const problems = [];

data.forEach((row, i) => {
  const title = row.Title;
  const rawText = row.Question;
  const diff = row.Difficulty;

  let topic = "Algorithms";
  if (rawText.toLowerCase().includes("binary tree")) topic = "Binary Trees";
  else if (rawText.toLowerCase().includes("linked list")) topic = "Linked Lists";
  else if (rawText.toLowerCase().includes("array")) topic = "Arrays";
  else if (rawText.toLowerCase().includes("string")) topic = "Strings";

  let testCases = [];
  let examples = [];
  
  // Find all Input/Output blocks
  const regex = /Input\s*\n([\s\S]*?)\nOutput\s*\n([\s\S]*?)(?=\nExplanation|\nInput|$)/gi;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    let inputRaw = match[1].trim();
    let outputRaw = match[2].trim();
    
    // Sometimes there are extra constraints or "Custom Input Format" before the real examples.
    // We only want the ones near the end. But let's just grab them all.
    // Format input/output as strings for the test runner.
    // If inputRaw contains quotes, escape them.
    const cleanInput = inputRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const cleanOutput = outputRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    // Only add if it looks like a real example (less than 500 chars)
    if (cleanInput.length < 500 && cleanOutput.length < 500 && cleanInput.length > 0) {
        testCases.push({ input: `"${cleanInput}"`, expected: `"${cleanOutput}"` });
        examples.push({ input: inputRaw.replace(/\n/g, ' '), output: outputRaw.replace(/\n/g, ' ') });
    }
  }

  // If no test cases parsed, try an alternative parsing
  if (testCases.length === 0) {
      // Sometimes it's not separated by newlines
      const altRegex = /Input:\s*([\s\S]*?)Output:\s*([\s\S]*?)(?=Explanation|Input|$)/gi;
      while ((match = altRegex.exec(rawText)) !== null) {
        let inputRaw = match[1].trim();
        let outputRaw = match[2].trim();
        const cleanInput = inputRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const cleanOutput = outputRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        if (cleanInput.length < 500 && cleanOutput.length < 500 && cleanInput.length > 0) {
            testCases.push({ input: `"${cleanInput}"`, expected: `"${cleanOutput}"` });
            examples.push({ input: inputRaw.replace(/\n/g, ' '), output: outputRaw.replace(/\n/g, ' ') });
        }
      }
  }

  // If still empty, add a dummy one but print warning
  if (testCases.length === 0) {
    console.log("No test cases found for: " + title);
    testCases = [{ input: '"1"', expected: '"1"' }];
  }

  // Deduplicate examples just in case the regex caught the main definition block
  // (The definition block usually has 'User Task' inside it or is very long)
  testCases = testCases.filter(tc => !tc.input.includes("User Task") && !tc.input.includes("Since this is a functional problem"));

  problems.push({
    id: `newton_q${i+1}`,
    title: `${i+1}. ${title}`,
    difficulty: diff === 'Medium' ? 'Medium' : 'Easy',
    topic: topic,
    description: rawText.replace(/`/g, "'").slice(0, 2000), 
    examples: examples.slice(0, 2),
    constraints: [],
    starterCode: {
      typescript: `function solve(input: string): string {\n  // Parse the raw input string\n  return "";\n}`,
      javascript: `function solve(input) {\n  // Parse the raw input string\n  return "";\n}`,
      python: `def solve(input_str: str):\n    # Parse the raw input string\n    return ""`
    },
    testCases: testCases
  });
});

const fileContent = `// Auto-generated from Newton School excel using Regex extraction
import { ProblemDefinition } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_SECTION_A_PROBLEMS: any[] = ${JSON.stringify(problems, null, 2)};
`;

fs.writeFileSync('./src/data/eliteNewtonQuestions.ts', fileContent);
console.log('Generated src/data/eliteNewtonQuestions.ts with properly parsed test cases!');
