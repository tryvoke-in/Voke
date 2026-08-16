import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renderPDF() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = `file://${path.join(__dirname, 'Voke_Unstop_Partnership_Proposal.html')}`;
  
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(__dirname, 'Voke_Unstop_Partnership_Proposal.pdf');

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

  console.log(`PDF successfully saved to: ${pdfPath}`);

  // Capture preview screenshots of Page 1 and Page 2
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
  
  const pages = await page.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const screenshotPath = path.join(__dirname, `unstop_proposal_page_${i + 1}.png`);
    await pages[i].screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
  }

  await browser.close();
}

renderPDF().catch(err => {
  console.error("Error generating PDF:", err);
  process.exit(1);
});
