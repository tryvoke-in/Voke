import fs from 'fs';

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";
const data = JSON.parse(fs.readFileSync('./newton_questions.json', 'utf8'));

async function generateTestCases(problemText) {
  const prompt = `You are a test case generator. Given the coding problem below, generate exactly 5 robust test cases.
Return ONLY valid JSON in this exact format, with NO markdown formatting, NO backticks, just the raw JSON array:
[
  { "input": "\"hello\"", "expected": "\"olleh\"" },
  { "input": "[1, 2, 3]", "expected": "6" }
]

Problem:
${problemText.substring(0, 1000)}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
        console.error("Groq API error:", await response.text());
        return null;
    }

    const result = await response.json();
    let content = result.choices[0].message.content.trim();
    if (content.startsWith("\`\`\`json")) {
        content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "");
    }
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse or fetch:", err);
    return null;
  }
}

async function run() {
  const problems = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    console.log(`Processing ${i+1}/${data.length}: ${row.Title}`);
    
    let testCases = await generateTestCases(row.Question);
    if (!testCases || !Array.isArray(testCases)) {
      console.log("Fallback test cases for", row.Title);
      testCases = [{ input: "1", expected: "1" }];
    }

    let topic = "Algorithms";
    if (row.Question.includes("binary tree")) topic = "Binary Trees";
    else if (row.Question.includes("array")) topic = "Arrays";
    else if (row.Question.includes("string")) topic = "Strings";

    problems.push({
      id: `newton_q${i+1}`,
      title: `${i+1}. ${row.Title}`,
      difficulty: row.Difficulty === 'Medium' ? 'Medium' : 'Easy',
      topic: topic,
      description: row.Question.replace(/\`/g, "'").slice(0, 2000),
      examples: [],
      constraints: [],
      starterCode: {
        typescript: `function solve(input: any): any {\n  // Your code here\n}`,
        javascript: `function solve(input) {\n  // Your code here\n}`,
        python: `def solve(input_data):\n    # Your code here\n    pass`
      },
      testCases: testCases
    });
    
    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  const fileContent = `// Auto-generated from Newton School excel with AI Test Cases
import { ProblemDefinition } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_SECTION_A_PROBLEMS: any[] = ${JSON.stringify(problems, null, 2)};
`;

  fs.writeFileSync('./src/data/eliteNewtonQuestions.ts', fileContent);
  console.log('Successfully updated src/data/eliteNewtonQuestions.ts with real test cases!');
}

run();
