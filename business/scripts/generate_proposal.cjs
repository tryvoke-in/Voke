const fs = require('fs');
const md = fs.readFileSync('Voke_College_Placement_Proposal.md', 'utf8');

// Simple markdown to HTML converter
let html = md
  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
  .replace(/^\* (.*$)/gim, '<li>$1</li>')
  .replace(/^[0-9]\. (.*$)/gim, '<li>$1</li>')
  .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/gim, '<em>$1</em>')
  .replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="img-container"><img src="$2" alt="$1"></div>')
  .replace(/\n\n/gim, '<br>')
  .replace(/---/gim, '<hr>');

// Wrap lists
html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
html = html.replace(/<\/ul><br><ul>/gim, '');

const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voke Institutional Proposal</title>
<style>
  body {
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #2d3748;
    margin: 0;
    padding: 0;
    background-color: #e2e8f0;
  }
  .page {
    background: white;
    max-width: 850px;
    margin: 40px auto;
    padding: 60px 80px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
  .cover {
    text-align: center;
    padding: 150px 20px 200px 20px;
    page-break-after: always;
  }
  .cover img {
    width: 200px;
    margin-bottom: 40px;
    border: none;
    box-shadow: none;
  }
  .cover h1 {
    font-size: 38px;
    color: #1a365d;
    border: none;
    margin: 0 0 15px 0;
  }
  .cover h2 {
    font-size: 22px;
    color: #4a5568;
    font-weight: 400;
    border: none;
    margin: 0;
  }
  h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
  h2 { color: #2b6cb0; margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
  h3 { color: #2d3748; margin-top: 25px; }
  ul { margin-bottom: 20px; }
  li { margin-bottom: 10px; }
  .img-container { text-align: center; margin: 40px 0; page-break-inside: avoid; }
  .img-container img { max-width: 90%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  em { display: block; text-align: center; color: #718096; font-size: 0.9em; margin-top: 10px; }
  hr { border: 0; height: 1px; background: #e2e8f0; margin: 40px 0; }
  @media print {
    body { background: white; margin: 0; padding: 0; }
    .page { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
    .img-container { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <img src="assets/logo.png" alt="Voke Logo" onerror="this.style.display='none'">
      <h1>Voke AI</h1>
      <h2>Institutional Placement Proposal</h2>
    </div>
    ${html}
  </div>
</body>
</html>
`;
fs.writeFileSync('Voke_Proposal_ReadyToPrint.html', finalHtml);
console.log('HTML generated successfully!');
