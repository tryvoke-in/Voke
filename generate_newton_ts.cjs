const fs = require('fs');
const data = require('./newton_questions.json');

const problems = [];

data.forEach((row, i) => {
  const title = row.Title;
  const rawText = row.Question;
  const diff = row.Difficulty;

  let topic = "Algorithms";
  if (rawText.includes("binary tree")) topic = "Binary Trees";
  else if (rawText.includes("array")) topic = "Arrays";
  else if (rawText.includes("string")) topic = "Strings";

  // Attempt to parse out Example blocks
  let testCases = [];
  let examples = [];
  
  const exampleBlocks = rawText.split(/Example\s*Input/i);
  for (let j = 1; j < exampleBlocks.length; j++) {
    const block = exampleBlocks[j];
    // Next word is usually the input until 'Output'
    const outSplit = block.split(/Output/i);
    if (outSplit.length >= 2) {
        const inputRaw = outSplit[0].trim();
        const explSplit = outSplit[1].split(/Explanation|Input/i);
        const outputRaw = explSplit[0].trim();
        const explRaw = explSplit.length > 1 && !outSplit[1].includes("Input") ? explSplit[1].trim() : "";

        // Add to testCases and examples
        testCases.push({ input: `"${inputRaw.replace(/\n/g, ' ')}"`, expected: `"${outputRaw.replace(/\n/g, ' ')}"` });
        examples.push({ input: inputRaw.replace(/\n/g, ' '), output: outputRaw.replace(/\n/g, ' '), explanation: explRaw.slice(0, 150) });
    }
  }

  // If no test cases parsed, add a dummy one
  if (testCases.length === 0) {
    testCases = [{ input: "''", expected: "''" }];
  }

  problems.push({
    id: `newton_q${i+1}`,
    title: `${i+1}. ${title}`,
    difficulty: diff === 'Medium' ? 'Medium' : 'Easy',
    topic: topic,
    description: rawText.replace(/`/g, "'").slice(0, 2000), // Trim description if too long
    examples: examples,
    constraints: [],
    starterCode: {
      typescript: `function solve(input: string): any {\n  // Your code here\n}`,
      javascript: `function solve(input) {\n  // Your code here\n}`,
      python: `def solve(input_str: str):\n    # Your code here\n    pass`
    },
    testCases: testCases
  });
});

const fileContent = `// Auto-generated from Newton School excel
import { ProblemDefinition } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_SECTION_A_PROBLEMS: any[] = ${JSON.stringify(problems, null, 2)};
`;

fs.writeFileSync('./src/data/eliteNewtonQuestions.ts', fileContent);
console.log('Generated src/data/eliteNewtonQuestions.ts with ' + problems.length + ' questions.');
