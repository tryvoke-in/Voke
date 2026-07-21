const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'AllCompaniesQuestions', 'DSA by Shradha Ma\'am - DSA in 2.5 Months.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const questions = [];
let currentTopic = '';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(',,') || line.startsWith('DSA by') || line.startsWith('Meet us') || line.startsWith('Ideal Time') || line.startsWith('Easy') || line.startsWith('Medium') || line.startsWith('Hard') || line.startsWith('Topics,Question')) {
        continue;
    }
    
    // Parse CSV line correctly handling quotes if necessary
    let inQuote = false;
    let currentWord = '';
    const cols = [];
    for (let char of line) {
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            cols.push(currentWord.trim());
            currentWord = '';
        } else {
            currentWord += char;
        }
    }
    cols.push(currentWord.trim());

    if (cols.length >= 2) {
        let topic = cols[0];
        let title = cols[1];
        let companiesStr = cols[2] || '';
        let remarks = cols[3] || '';
        
        if (topic) {
            currentTopic = topic;
        }
        
        if (title && title !== 'Question (375)') {
            let companies = companiesStr.split(' ').map(c => c.trim()).filter(c => c.length > 0 && c !== '+');
            
            // Generate a fake url based on title for now if we don't have it
            let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            let url = `https://leetcode.com/problems/${slug}/`;
            
            questions.push({
                id: questions.length + 1,
                topic: currentTopic || topic,
                title: title.replace(/^"|"$/g, ''),
                companies: companies,
                remarks: remarks,
                difficulty: 'Medium',
                platform: 'LeetCode',
                url: url
            });
        }
    }
}

const tsContent = `export type DSAQuestion = {
    id: number;
    topic: string;
    title: string;
    companies: string[];
    remarks: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    platform: string;
    url: string;
};

export const DSA_QUESTIONS: DSAQuestion[] = ${JSON.stringify(questions, null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'dsaQuestions.ts'), tsContent);
console.log('Successfully generated src/data/dsaQuestions.ts with ' + questions.length + ' questions.');
