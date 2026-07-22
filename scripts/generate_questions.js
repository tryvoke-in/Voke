
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../resources/leetcode-company-wise-problems');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/questions.ts');

// Map to store unique questions by URL (or Title if URL is missing, but URL is better)
const questionsMap = new Map();

function toTitleCase(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recurse, but checks if it's a company folder with '5. All.csv'
      const csvPath = path.join(fullPath, '5. All.csv');
      if (fs.existsSync(csvPath)) {
          console.log(`Processing ${item.name}...`);
          processCSV(csvPath, item.name);
      } else {
           // It might be a nested folder (though structure seems flat-ish after first level)
           // But based on "leetcode-company-wise-problems/Google/5. All.csv", the company is the immediate parent.
           // If there are deeper levels, this recursion handles it.
           processDirectory(fullPath);
      }
    }
  }
}

function processCSV(filePath, companyName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row) => {
      // Row keys: Difficulty, Title, Frequency, 'Acceptance Rate', Link, Topics
      const title = row['Title'];
      const url = row['Link'];
      
      if (!title) return;

      const difficulty = toTitleCase(row['Difficulty']); // EASY -> Easy
      const topicsStr = row['Topics'];
      const tags = topicsStr ? topicsStr.split(',').map(t => t.trim()) : [];

      // Unique Key: URL is best, fallback to Title
      const key = url || title;

      if (!questionsMap.has(key)) {
        questionsMap.set(key, {
          id: questionsMap.size + 1,
          title: title,
          difficulty: difficulty,
          companies: new Set(),
          platform: 'LeetCode', // Defaulting as source is "leetcode-company-wise-problems"
          url: url || '',
          tags: tags
        });
      }

      const q = questionsMap.get(key);
      q.companies.add(companyName);
      // Merge tags if we find more/different ones? Usually getting them from one source is enough.
      // But we can ensure we have the union of tags if needed. For now, assuming they are consistent.
    });

  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

console.log('Starting import...');
if (fs.existsSync(ROOT_DIR)) {
    processDirectory(ROOT_DIR);
} else {
    console.error(`Root directory not found: ${ROOT_DIR}`);
    process.exit(1);
}

// Convert Map to Array
const textQuestions = Array.from(questionsMap.values()).map(q => ({
  ...q,
  companies: Array.from(q.companies)
}));

console.log(`Found ${textQuestions.length} unique questions.`);

// Generate TS File Content
const fileContent = `export interface Question {
  id: number;
  title: string;
  difficulty: string;
  companies: string[];
  platform: string;
  url: string;
  tags: string[];
}

export const QUESTIONS: Question[] = ${JSON.stringify(textQuestions, null, 2)};

export const COMPANIES = ["All", ...Array.from(new Set(QUESTIONS.flatMap(q => q.companies))).sort()];
export const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
`;

// Write to file
// Ensure dir exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, fileContent);
console.log(`Wrote data to ${OUTPUT_FILE}`);
