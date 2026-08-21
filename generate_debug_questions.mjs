import fs from 'fs';

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";
const data = JSON.parse(fs.readFileSync('./newton_debug_questions.json', 'utf8'));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateDebugData(problemText, title) {
  let prompt = `You are creating a Debugging Interview Question.
I will give you a problem description. You must write a realistic BUGGY implementation in JavaScript, a short scenario explaining what happens, and the expected behavior.

Return ONLY a valid JSON object in this format (no markdown, no backticks, just raw JSON):
{
  "buggyCode": "function solve(root) {\\n  // realistic buggy code with a common mistake\\n}",
  "scenario": "The code fails when...",
  "expectedBehavior": "It should..."
}

Problem Title: ${title}
Problem Description:
${problemText.substring(0, 1000)}`;

  let retries = 5;
  while (retries > 0) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (errText.includes("rate_limit") || response.status === 429) {
          const match = errText.match(/Please try again in ([0-9.]+)s/);
          let waitTime = match ? parseFloat(match[1]) + 1 : 10;
          console.log(`Rate limit hit. Waiting ${waitTime} seconds...`);
          await delay(waitTime * 1000);
          retries--;
          continue;
        } else {
          console.error("API error:", errText);
          return null;
        }
      }

      const result = await response.json();
      let content = result.choices[0].message.content.trim();
      if (content.startsWith("\`\`\`json")) content = content.replace(/\`\`\`json/g, "");
      if (content.startsWith("\`\`\`")) content = content.replace(/\`\`\`/g, "");
      if (content.endsWith("\`\`\`")) content = content.replace(/\`\`\`/g, "");
      
      return JSON.parse(content);
    } catch (err) {
      console.log("JSON Parse Error, retrying...");
      await delay(2000);
      retries--;
    }
  }
  return null;
}

async function run() {
  const problems = [];
  
  // Deduplicate by title prefix (e.g. "Target Sum In BT - Debug 1" -> "Target Sum In BT")
  const uniqueTitles = new Set();
  const selectedQuestions = [];
  
  for (const row of data) {
    const baseTitle = row.Title.split(' - Debug')[0];
    if (!uniqueTitles.has(baseTitle) && selectedQuestions.length < 20) {
      uniqueTitles.add(baseTitle);
      selectedQuestions.push(row);
    }
  }
  
  console.log(`Selected ${selectedQuestions.length} unique questions.`);

  for (let i = 0; i < selectedQuestions.length; i++) {
    const row = selectedQuestions[i];
    console.log(`[${i+1}/${selectedQuestions.length}] Generating debug info for: ${row.Title}`);
    
    const debugData = await generateDebugData(row["Full Question"], row.Title);
    
    if (debugData) {
      problems.push({
        id: `debug_q${i+1}`,
        title: row.Title,
        difficulty: row.Difficulty,
        topic: row.Topic || "Algorithms",
        description: row["Full Question"].replace(/\`/g, "'").slice(0, 1000),
        buggyCode: debugData.buggyCode,
        scenario: debugData.scenario,
        expectedBehavior: debugData.expectedBehavior
      });
    }
    
    // Save incrementally
    const fileContent = `// Auto-generated 20 Debugging Questions from Newton School
import { DebugProblem } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_DEBUG_PROBLEMS: DebugProblem[] = ${JSON.stringify(problems, null, 2)};
`;
    fs.writeFileSync('./src/data/eliteNewtonDebugQuestions.ts', fileContent);
    await delay(2000);
  }

  console.log('✅ COMPLETELY FINISHED GENERATING 20 DEBUG QUESTIONS!');
}

run();
