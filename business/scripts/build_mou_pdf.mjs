import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderPDF() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  const agreementDir = path.resolve(__dirname, '../agreements');
  const htmlPath = `file://${path.join(agreementDir, 'Voke_College_Pilot_Agreement_MoU.html')}`;
  
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(agreementDir, 'Voke_College_Pilot_Agreement_MoU.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    preferCSSPageSize: true
  });

  await browser.close();
  console.log(`PDF successfully generated: ${pdfPath}`);
}

renderPDF().catch(err => {
  console.error("Error generating PDF:", err);
  process.exit(1);
});
