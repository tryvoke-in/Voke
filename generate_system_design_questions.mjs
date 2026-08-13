import fs from 'fs';

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CATEGORIES = [
  "backend", "backend", "backend",
  "frontend", "frontend", "frontend",
  "fullstack", "fullstack"
];

async function generateBatch(category, batchIndex) {
  let prompt = `You are a Principal Engineer creating System Design interview questions.
Generate exactly 5 highly realistic System Design interview questions for a **${category}** engineer.
Make them unique and interesting (e.g. Design Netflix, Design a Collaborative Canvas, Design a Rate Limiter).

Return ONLY a valid JSON array of objects in this exact format (no markdown, no backticks, just raw JSON array):
[
  {
    "id": "sd_${category}_${batchIndex}_1",
    "title": "Design a Distributed Rate Limiter",
    "category": "${category}",
    "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
    "keyDiscussionPoints": [
      "Token Bucket vs Sliding Window algorithms",
      "Redis Lua script atomicity",
      "Handling multi-region replication lag"
    ]
  }
]`;

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
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
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
      
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      throw new Error("Not an array");
    } catch (err) {
      console.log("JSON Parse Error, retrying...", err.message);
      await delay(2000);
      retries--;
    }
  }
  return [];
}

async function run() {
  const allQuestions = {
    backend: [],
    frontend: [],
    fullstack: []
  };

  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    console.log(`[Batch ${i+1}/${CATEGORIES.length}] Generating 5 ${category} questions...`);
    
    const batch = await generateBatch(category, i);
    if (batch && batch.length > 0) {
      allQuestions[category].push(...batch);
      
      // Save incrementally
      const fileContent = `// Auto-generated 40 System Design Questions
export const SYSTEM_DESIGN_QUESTIONS: Record<string, any[]> = ${JSON.stringify(allQuestions, null, 2)};
`;
      fs.writeFileSync('./src/data/eliteSystemDesignQuestions.ts', fileContent);
    }
    await delay(3000);
  }

  console.log('✅ COMPLETELY FINISHED GENERATING SYSTEM DESIGN QUESTIONS!');
}

run();
