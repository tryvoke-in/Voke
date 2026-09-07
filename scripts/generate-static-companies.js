import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const slugsMap = {
  "google": "Google",
  "meta": "Meta",
  "amazon": "Amazon",
  "apple": "Apple",
  "microsoft": "Microsoft",
  "netflix": "Netflix",
  "uber": "Uber",
  "airbnb": "Airbnb",
  "linkedin": "LinkedIn",
  "twitter": "X",
  "tesla": "Tesla",
  "spotify": "Spotify",
  "adobe": "Adobe",
  "salesforce": "Salesforce",
  "oracle": "Oracle",
  "ibm": "IBM",
  "intel": "Intel",
  "nvidia": "Nvidia",
  "amd": "AMD",
  "cisco": "Cisco",
  "paypal": "PayPal",
  "stripe": "Stripe",
  "slack": "Slack",
  "bytedance": "ByteDance",
  "snapchat": "Snap",
  "reddit": "Reddit",
  "dropbox": "Dropbox",
  "gitlab": "GitLab",
  "github": "GitHub",
  "atlassian": "Atlassian"
};

const properNames = {
  "google": "Google",
  "meta": "Meta",
  "amazon": "Amazon",
  "apple": "Apple",
  "microsoft": "Microsoft",
  "netflix": "Netflix",
  "uber": "Uber",
  "airbnb": "Airbnb",
  "linkedin": "LinkedIn",
  "twitter": "Twitter (X)",
  "tesla": "Tesla",
  "spotify": "Spotify",
  "adobe": "Adobe",
  "salesforce": "Salesforce",
  "oracle": "Oracle",
  "ibm": "IBM",
  "intel": "Intel",
  "nvidia": "NVIDIA",
  "amd": "AMD",
  "cisco": "Cisco",
  "paypal": "PayPal",
  "stripe": "Stripe",
  "slack": "Slack",
  "bytedance": "ByteDance",
  "snapchat": "Snapchat",
  "reddit": "Reddit",
  "dropbox": "Dropbox",
  "gitlab": "GitLab",
  "github": "GitHub",
  "atlassian": "Atlassian"
};

const base = path.join(process.cwd(), 'AllCompaniesQuestions');
const companyData = {};

for (const [slug, folderName] of Object.entries(slugsMap)) {
  const dirPath = path.join(base, folderName);
  const questionsByPeriod = {};
  const allUniqueQuestions = new Map();

  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv'));
    for (const file of files) {
      const period = file.replace('.csv', '').replace(/^\d+\.\s*/, '').trim();
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const lines = content.split(/\r?\n/);
      const questions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 4) continue;
        const title = cols[1]?.trim();
        if (!title) continue;
        const qObj = {
          id: `${slug}-${period.replace(/\s+/g, '-').toLowerCase()}-${i}`,
          title,
          difficulty: cols[0]?.trim() || 'Medium',
          frequency: parseFloat(cols[2] || '50'),
          acceptance_rate: parseFloat(cols[3] || '0.5'),
          url: cols[4]?.trim() || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(title)}`,
          topics: cols[5] ? cols[5].replace(/^"|"$/g, '').split(',').map(t => t.trim()) : ['Data Structures', 'Algorithms'],
          period
        };
        questions.push(qObj);

        if (!allUniqueQuestions.has(title)) {
          allUniqueQuestions.set(title, qObj);
        }
      }
      if (questions.length > 0) {
        questionsByPeriod[period] = questions;
      }
    }
  }

  // If questionsByPeriod is empty or missing, provide standard high-frequency curated questions
  if (allUniqueQuestions.size === 0) {
    const defaultQuestions = [
      {
        id: `${slug}-default-1`,
        title: 'Two Sum',
        difficulty: 'EASY',
        frequency: 95.0,
        acceptance_rate: 0.52,
        url: 'https://leetcode.com/problems/two-sum',
        topics: ['Array', 'Hash Table'],
        period: 'All'
      },
      {
        id: `${slug}-default-2`,
        title: 'LRU Cache',
        difficulty: 'MEDIUM',
        frequency: 90.0,
        acceptance_rate: 0.43,
        url: 'https://leetcode.com/problems/lru-cache',
        topics: ['Hash Table', 'Linked List', 'Design'],
        period: 'All'
      },
      {
        id: `${slug}-default-3`,
        title: 'Number of Islands',
        difficulty: 'MEDIUM',
        frequency: 85.0,
        acceptance_rate: 0.58,
        url: 'https://leetcode.com/problems/number-of-islands',
        topics: ['Array', 'DFS', 'BFS', 'Graph'],
        period: 'All'
      },
      {
        id: `${slug}-default-4`,
        title: 'Trapping Rain Water',
        difficulty: 'HARD',
        frequency: 80.0,
        acceptance_rate: 0.61,
        url: 'https://leetcode.com/problems/trapping-rain-water',
        topics: ['Array', 'Two Pointers', 'Stack'],
        period: 'All'
      },
      {
        id: `${slug}-default-5`,
        title: 'Merge k Sorted Lists',
        difficulty: 'HARD',
        frequency: 75.0,
        acceptance_rate: 0.51,
        url: 'https://leetcode.com/problems/merge-k-sorted-lists',
        topics: ['Linked List', 'Divide and Conquer', 'Heap'],
        period: 'All'
      }
    ];
    questionsByPeriod['All'] = defaultQuestions;
    defaultQuestions.forEach(q => allUniqueQuestions.set(q.title, q));
  }

  // Ensure "All" period always exists with all unique questions
  if (!questionsByPeriod['All']) {
    questionsByPeriod['All'] = Array.from(allUniqueQuestions.values());
  }

  const name = properNames[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  companyData[slug] = {
    id: slug,
    name,
    slug,
    totalQuestions: allUniqueQuestions.size,
    periods: Object.keys(questionsByPeriod),
    questionsByPeriod
  };
}

const outputFile = path.join(process.cwd(), 'src/data/staticCompanyData.ts');
const fileContent = `// Auto-generated static company interview questions repository
// Used for instant SSR prerendering and fast client-side fallback

export interface StaticCompanyQuestion {
  id: string;
  title: string;
  difficulty: string;
  frequency: number;
  acceptance_rate: number;
  url: string;
  topics: string[];
  period: string;
}

export interface StaticCompanyItem {
  id: string;
  name: string;
  slug: string;
  totalQuestions: number;
  periods: string[];
  questionsByPeriod: Record<string, StaticCompanyQuestion[]>;
}

export const STATIC_COMPANIES: Record<string, StaticCompanyItem> = ${JSON.stringify(companyData, null, 2)};

export const ALL_STATIC_COMPANIES_LIST: StaticCompanyItem[] = Object.values(STATIC_COMPANIES);

export function getStaticCompany(slug: string): StaticCompanyItem | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  return STATIC_COMPANIES[normalized] || null;
}

export function getStaticCompanyQuestions(slug: string, period?: string): StaticCompanyQuestion[] {
  const company = getStaticCompany(slug);
  if (!company) return [];
  
  if (period && company.questionsByPeriod[period] && company.questionsByPeriod[period].length > 0) {
    return company.questionsByPeriod[period];
  }
  
  // Return first non-empty period or All
  if (company.questionsByPeriod['All'] && company.questionsByPeriod['All'].length > 0) {
    return company.questionsByPeriod['All'];
  }
  
  for (const p of company.periods) {
    if (company.questionsByPeriod[p] && company.questionsByPeriod[p].length > 0) {
      return company.questionsByPeriod[p];
    }
  }
  
  return [];
}
`;

fs.writeFileSync(outputFile, fileContent, 'utf-8');
console.log(`✅ Generated src/data/staticCompanyData.ts for ${Object.keys(companyData).length} companies.`);
