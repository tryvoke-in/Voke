
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Types
type Question = {
  difficulty: string;
  title: string;
  frequency: number;
  acceptanceRate: number;
  link: string;
  topics: string[];
  period: string; // "30 Days", "3 Months", etc.
};

// Simple CSV Parser handling quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ubktoscausselrtpuxux.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required.");
  console.error("Please run with: SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/seed-companies.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  const baseDir = path.join(process.cwd(), 'AllCompaniesQuestions');

  try {
    const companies = await fs.readdir(baseDir);
    const validCompanies = companies.filter(c => !c.startsWith('.'));

    console.log(`Found ${validCompanies.length} companies.`);

    for (const company of validCompanies) {
      console.log(`Processing ${company}...`);

      // 1. Upsert Company
      const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .upsert({
          name: company,
          slug: slug
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (companyError) {
        console.error(`Error upserting company ${company}:`, companyError);
        continue;
      }

      const companyId = companyData.id;
      const companyDir = path.join(baseDir, company);
      const startFiles = await fs.readdir(companyDir);

      const questionsToInsert: any[] = [];

      for (const file of startFiles) {
        if (!file.endsWith('.csv')) continue;
        if (!entry.isDirectory()) continue;

        // Map filename to period
        let period = file.replace('.csv', '').replace(/^\d+\.\s*/, '').trim();
        // e.g. "1. Thirty Days.csv" -> "Thirty Days"

        const content = await fs.readFile(path.join(companyDir, file), 'utf-8');
        const lines = content.split('\n');

        // Skip header (line 0)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = parseCSVLine(line);
          // Columns: Difficulty, Title, Frequency, Acceptance Rate, Link, Topics
          // Index:   0           1      2          3                4     5

          if (cols.length < 5) continue;

          const title = cols[1]?.trim();
          if (!title) continue;

          questionsToInsert.push({
            company_id: companyId,
            title: title,
            difficulty: cols[0]?.trim() || 'Unknown',
            frequency: parseFloat(cols[2] || '0'),
            acceptance_rate: parseFloat(cols[3] || '0'),
            url: cols[4]?.trim() || '',
            topics: cols[5] ? cols[5].replace(/^"|"$/g, '').split(',').map(t => t.trim()) : [],
            period: period
          });
        }
      }

      if (questionsToInsert.length > 0) {
        // Batch insert
        const { error: batchError } = await supabase
          .from('company_questions')
          .upsert(questionsToInsert, { onConflict: 'company_id,title,period' }); // using the unique constraint

        if (batchError) {
          console.error(`Error inserting questions for ${company}:`, batchError);
        } else {
          console.log(`  Inserted/Updated ${questionsToInsert.length} questions for ${company}.`);
        }
      }
    }

    console.log("Seeding complete!");

  } catch (err) {
    console.error("Fatal error:", err);
  }
}

seed();
