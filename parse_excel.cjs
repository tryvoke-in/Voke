const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('newton-school-questions-complete.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

fs.writeFileSync('newton_questions.json', JSON.stringify(data, null, 2));
console.log('Saved to newton_questions.json');
console.log('Total questions:', data.length);
console.log('First question:', data[0]);
