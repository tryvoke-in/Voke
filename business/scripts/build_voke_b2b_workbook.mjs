import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = '/Users/Anurag/Documents/Voke/outputs/voke_b2b_plan';
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const navy = '#171B4A';
const purple = '#6D4AFF';
const lavender = '#EEEAFE';
const paleBlue = '#EEF5FF';
const green = '#E8F7EE';
const orange = '#FFF1DF';
const red = '#FCE9E7';
const gray = '#5C6470';
const border = '#D8DEE8';

function title(sheet, text, subtitle, endCol) {
  sheet.mergeCells(`A1:${endCol}1`);
  sheet.getRange('A1').values = [[text]];
  sheet.getRange(`A1:${endCol}1`).format = { fill: navy, font: { bold: true, color: '#FFFFFF', size: 18 }, horizontalAlignment: 'left', verticalAlignment: 'center' };
  sheet.getRange('A1').format.rowHeight = 32;
  sheet.mergeCells(`A2:${endCol}2`);
  sheet.getRange('A2').values = [[subtitle]];
  sheet.getRange(`A2:${endCol}2`).format = { fill: '#F5F6FA', font: { color: gray, italic: true, size: 10 }, verticalAlignment: 'center', wrapText: true };
  sheet.getRange('A2').format.rowHeight = 28;
}

function section(sheet, cellRange, text) {
  const r = sheet.getRange(cellRange);
  r.merge();
  r.values = [[text]];
  r.format = { fill: lavender, font: { bold: true, color: navy, size: 11 }, verticalAlignment: 'center' };
  r.format.rowHeight = 22;
}

function header(sheet, range) {
  const r = sheet.getRange(range);
  r.format = { fill: purple, font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true, borders: { preset: 'all', style: 'thin', color: border } };
  r.format.rowHeight = 26;
}

function body(sheet, range) {
  const r = sheet.getRange(range);
  r.format = { verticalAlignment: 'top', wrapText: true, borders: { preset: 'inside', style: 'thin', color: border } };
}

function widths(sheet, config) {
  for (const [col, width] of Object.entries(config)) sheet.getRange(`${col}:${col}`).format.columnWidth = width;
}

function currency(sheet, range) {
  sheet.getRange(range).format.numberFormat = '#,##0.00';
}

// 1. Start Here
{
  const s = wb.worksheets.add('Start Here');
  s.showGridLines = false;
  title(s, 'Voke B2B Plan - Universities & Companies', 'A practical, easy-to-present sales and delivery plan. All prices are INR before GST.', 'F');
  section(s, 'A4:F4', 'The strategy in one line');
  s.mergeCells('A5:F6');
  s.getRange('A5').values = [['Start with small, measurable readiness pilots for universities and companies. Convert successful pilots into paid cohort contracts. Sell the outcome: more interview-ready people with less manual coaching.']];
  s.getRange('A5:F6').format = { fill: paleBlue, font: { bold: true, color: navy, size: 12 }, wrapText: true, verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: border } };
  section(s, 'A8:F8', 'What Voke should do first');
  s.getRange('A9:F13').values = [
    ['Priority', 'Target buyer', 'Why they buy', 'First offer', 'Success measure', 'Next step'],
    ['1', 'University placement cells', 'Need scalable placement readiness and visibility into student gaps.', '100-student / 14-day free pilot', '40%+ first-mock completion', 'Sell 100 paid seats'],
    ['2', 'Graduate hiring / L&D teams', 'Need trainees and early-career candidates to communicate better.', '20-person diagnostic cohort or paid 50 seats', '60%+ first-mock completion', 'Sell 50 paid seats'],
    ['3', 'Recruitment agencies', 'Need candidates prepared before client interviews.', 'Paid 50-seat readiness cohort', 'Fewer repeat basic coaching sessions', 'Expand to more recruiters'],
    ['Avoid first', 'Generic sponsorships / broad promotions', 'Large reach but weak interview intent and unclear ROI.', 'Do not lead with this.', 'Positive contribution, not vanity signups', 'Consider only after proof']
  ];
  header(s, 'A9:F9'); body(s, 'A10:F13');
  s.getRange('A10:A13').format.horizontalAlignment = 'center';
  section(s, 'A15:F15', 'Free mock policy - recommended');
  s.getRange('A16:F20').values = [
    ['Offer', 'What the user receives', 'AI cost per user', 'Why', 'Rule', 'Result'],
    ['Free Diagnostic Mock', '1 Text Interview + 1 Pro Video Interview', 2.89, 'Shows answer feedback and body-language feedback in one experience.', 'One free diagnostic only.', 'Useful baseline + protects margin'],
    ['Do not give', '2-4 Pro Video credits as default free access', 5.78, 'More free access reduces the reason to upgrade.', 'Use only as a targeted reward.', 'Lower acquisition cost'],
    ['Paid next step', 'Voke Pro or Voke Elite cohort package', null, 'Student now understands the product before choosing more practice.', 'Offer after diagnostic completion.', 'Higher-intent upgrade']
  ];
  header(s, 'A16:F16'); body(s, 'A17:F19'); currency(s, 'C17:C19');
  s.getRange('A17:F17').format.fill = green;
  s.getRange('A18:F18').format.fill = orange;
  widths(s, { A: 16, B: 34, C: 15, D: 38, E: 28, F: 28 });
  s.freezePanes.freezeRows(2);
}

// 2. University Plan
{
  const s = wb.worksheets.add('University Plan');
  s.showGridLines = false;
  title(s, 'University B2B Plan', 'Primary target: placement cells, career services teams, deans and student placement committees.', 'F');
  section(s, 'A4:F4', 'Why a university will buy Voke');
  s.getRange('A5:C10').values = [
    ['University problem', 'How Voke helps', 'What the buyer gets'],
    ['Students struggle to explain projects, HR stories and technical thinking.', 'Repeated interview practice across Text and Video modes.', 'More prepared placement-ready students.'],
    ['Placement team cannot do personal mock interviews for everyone.', '24/7 first-practice layer; human coaches focus on final candidates.', 'Less manual coaching pressure.'],
    ['No clear picture of where the batch is weak.', 'Aggregate cohort report with participation and common improvement areas.', 'Better training decisions.'],
    ['Need to show placement-readiness support to students and parents.', 'A branded, structured interview-readiness programme.', 'A visible employability service.'],
    ['Budget is limited.', 'Bulk rate below individual retail price.', 'Affordable cohort access.']
  ];
  header(s, 'A5:C5'); body(s, 'A6:C10');
  section(s, 'A12:F12', 'University offer structure');
  s.getRange('A13:F16').values = [
    ['Stage', 'Package', 'Seats / period', 'What is included', 'Price to university', 'Purpose'],
    ['Pilot', 'Interview Readiness Pilot', 'Up to 100 students / 14 days', '1 Text + 1 Pro Video diagnostic each; launch workshop; cohort report', 0, 'Prove value before procurement'],
    ['Core deal', 'Voke Pro Placement Pack', '100+ activated seats / 90 days', '4 Pro Video + 3 Text credits per student; reports; role templates; one workshop', 299, 'Regular placement practice'],
    ['Premium deal', 'Voke Elite Placement Pack', '100+ activated seats / 90 days', '4 Elite Credits + 2 Pro Video; Code IDE; resume optimisation; one workshop', 449, 'Students close to interviews']
  ];
  header(s, 'A13:F13'); body(s, 'A14:F16'); currency(s, 'E14:E16');
  s.getRange('A14:F14').format.fill = paleBlue;
  section(s, 'A18:F18', 'Pilot to paid conversion process');
  s.getRange('A19:F23').values = [
    ['Step', 'Voke responsibility', 'University responsibility', 'Output', 'Decision gate', 'Timing'],
    ['1. Discovery', 'Ask about batch size, upcoming drives and common interview gaps.', 'Share current placement-readiness process.', 'Pilot scope', 'Committed coordinator?', 'Week 1'],
    ['2. Launch', 'Set up code and run a 30-45 minute workshop.', 'Send official email / WhatsApp announcement.', 'Registered cohort', '100 students invited?', 'Week 2'],
    ['3. Measure', 'Send weekly aggregate usage update.', 'Remind students to complete diagnostic.', 'Activation data', '40%+ first mock?', 'Weeks 2-3'],
    ['4. Review', 'Present completion, gaps and student feedback.', 'Attend outcome review.', 'Cohort report', 'Is a paid cohort justified?', 'Week 3'],
    ['5. Close', 'Issue bulk-seat proposal and invoice.', 'Approve 100+ seats and nominate coordinator.', '90-day paid cohort', 'Payment before access', 'Week 4']
  ];
  header(s, 'A19:F19'); body(s, 'A20:F24');
  widths(s, { A: 19, B: 35, C: 35, D: 25, E: 23, F: 13 });
  s.freezePanes.freezeRows(2);
}

// 3. Company Plan
{
  const s = wb.worksheets.add('Company Plan');
  s.showGridLines = false;
  title(s, 'Company B2B Plan', 'Sell to organisations responsible for making people job-ready - not to every employer with open roles.', 'F');
  section(s, 'A4:F4', 'Best company customers and use cases');
  s.getRange('A5:D9').values = [
    ['Company type', 'Likely buyer', 'Use case', 'Why they take Voke'],
    ['Graduate hiring / campus programme', 'Campus hiring lead or L&D lead', 'Prepare selected interns, trainees and pre-joining graduate hires.', 'More professional communication before joining.'],
    ['Recruitment / staffing agency', 'Founder, recruitment head or delivery manager', 'Candidates practise before client interviews.', 'Less repeat basic coaching, better-prepared candidate pool.'],
    ['IT services / BPO / consulting firm', 'L&D or talent-development lead', 'Freshers practise client and role-change interviews.', 'A scalable first-practice layer.'],
    ['CSR employability programme', 'CSR / programme manager', 'Give beneficiary students structured career preparation.', 'Measurable employability intervention.']
  ];
  header(s, 'A5:D5'); body(s, 'A6:D9');
  section(s, 'A11:F11', 'Company offer structure');
  s.getRange('A12:F15').values = [
    ['Offer', 'Minimum seats', 'User type', 'Included', 'Price per seat', 'When to use'],
    ['Discovery cohort', '20', 'Trainees / agency candidates / interns', '1 Text + 1 Pro Video diagnostic; aggregate report', 0, 'Only to demonstrate value'],
    ['Voke Pro Workforce-Readiness Pack', '50', 'Early-career employees or candidates', 'Pro credits; launch workshop; weekly aggregate report', 399, 'Standard paid programme'],
    ['Voke Elite Workforce-Readiness Pack', '50', 'High-priority candidates / advanced trainees', 'Elite credits; launch workshop; weekly aggregate report', 549, 'Close to high-stakes interviews']
  ];
  header(s, 'A12:F12'); body(s, 'A13:F15'); currency(s, 'E13:E15');
  s.getRange('A13:F13').format.fill = paleBlue;
  section(s, 'A17:F17', 'Rules for company deployments');
  s.getRange('A18:F22').values = [
    ['Rule', 'Reason', 'What Voke says'],
    ['Do not promise a job or selection outcome.', 'Voke improves readiness; the employer owns hiring decisions.', '“Interview practice, not a job guarantee.”'],
    ['Keep individual recordings and answers private by default.', 'Candidate trust and privacy.', '“Only aggregate cohort data is shared unless the user gives consent.”'],
    ['Do not begin with an open-ended free rollout.', 'Companies have budgets; Voke needs committed use.', '“20 diagnostics or a paid 50-seat cohort.”'],
    ['Measure recruiter time saved and candidate completion.', 'This proves commercial value.', '“Voke handles first practice; humans coach finalists.”'],
    ['Invoice before bulk access starts.', 'Protect cash flow and delivery planning.', '“Access starts after payment / PO confirmation.”']
  ];
  header(s, 'A18:C18'); body(s, 'A19:C23');
  widths(s, { A: 29, B: 23, C: 33, D: 33, E: 15, F: 25 });
  s.freezePanes.freezeRows(2);
}

// 4. Economics
{
  const s = wb.worksheets.add('Pricing & Economics');
  s.showGridLines = false;
  title(s, 'Pricing & Economics', 'Editable inputs are highlighted. Formulas calculate direct contribution before support, infrastructure, salaries, tax and refunds.', 'G');
  section(s, 'A4:G4', 'Core cost assumptions');
  s.getRange('A5:C9').values = [
    ['Input', 'Value', 'Notes'],
    ['Text Interview AI cost', 0.17, 'Gemini text interview'],
    ['Pro Video AI cost', 2.72, '10-minute video interview'],
    ['Elite Credit AI cost', 6.44, 'Four-round company interview credit'],
    ['Payment gateway rate', 0.02, 'Use only where payment is collected through a gateway']
  ];
  header(s, 'A5:C5'); body(s, 'A6:C9'); currency(s, 'B6:B8'); s.getRange('B9').format.numberFormat = '0.0%'; s.getRange('B6:B9').format.fill = orange;
  section(s, 'A11:G11', 'Package economics - formulas are linked to assumptions above');
  s.getRange('A12:G16').values = [
    ['Package', 'Seats', 'Price per seat', 'AI cost per seat', 'Payment fee per seat', 'Total revenue', 'Direct contribution'],
    ['University Pro Placement Pack', 100, 299, null, null, null, null],
    ['University Elite Placement Pack', 100, 449, null, null, null, null],
    ['Company Pro Workforce-Readiness Pack', 50, 399, null, null, null, null],
    ['Company Elite Workforce-Readiness Pack', 50, 549, null, null, null, null]
  ];
  s.getRange('D13:D16').formulas = [["='Pricing & Economics'!$B$7*4+'Pricing & Economics'!$B$6*3"], ["='Pricing & Economics'!$B$8*4+'Pricing & Economics'!$B$7*2"], ["='Pricing & Economics'!$B$7*4+'Pricing & Economics'!$B$6*3"], ["='Pricing & Economics'!$B$8*4+'Pricing & Economics'!$B$7*2"]];
  s.getRange('E13:E16').formulas = [["=C13*'Pricing & Economics'!$B$9"], ["=C14*'Pricing & Economics'!$B$9"], ["=C15*'Pricing & Economics'!$B$9"], ["=C16*'Pricing & Economics'!$B$9"]];
  s.getRange('F13:F16').formulas = [['=B13*C13'], ['=B14*C14'], ['=B15*C15'], ['=B16*C16']];
  s.getRange('G13:G16').formulas = [['=F13-(B13*D13)-(B13*E13)'], ['=F14-(B14*D14)-(B14*E14)'], ['=F15-(B15*D15)-(B15*E15)'], ['=F16-(B16*D16)-(B16*E16)']];
  header(s, 'A12:G12'); body(s, 'A13:G16'); currency(s, 'C13:G16');
  s.getRange('B13:C16').format.fill = orange;
  s.getRange('G13:G16').format.fill = green;
  section(s, 'A18:G18', 'Free pilot cost');
  s.getRange('A19:G22').values = [
    ['Pilot type', 'Students', 'Free Text mocks per user', 'Free Pro Video mocks per user', 'AI cost per user', 'Total AI pilot cost', 'Recommendation'],
    ['University pilot', 100, 1, 1, null, null, 'Recommended: one diagnostic mock only'],
    ['Company discovery cohort', 20, 1, 1, null, null, 'Recommended: cap at 20 users'],
    ['Not recommended default', 100, 2, 2, null, null, 'Costs twice as much without proving more value']
  ];
  s.getRange('E20:E22').formulas = [["=C20*'Pricing & Economics'!$B$6+D20*'Pricing & Economics'!$B$7"], ["=C21*'Pricing & Economics'!$B$6+D21*'Pricing & Economics'!$B$7"], ["=C22*'Pricing & Economics'!$B$6+D22*'Pricing & Economics'!$B$7"]];
  s.getRange('F20:F22').formulas = [['=B20*E20'], ['=B21*E21'], ['=B22*E22']];
  header(s, 'A19:G19'); body(s, 'A20:G22'); currency(s, 'E20:F22'); s.getRange('A20:G20').format.fill = green; s.getRange('A22:G22').format.fill = red;
  widths(s, { A: 34, B: 13, C: 15, D: 16, E: 15, F: 17, G: 36 });
  s.freezePanes.freezeRows(2);
}

// 5. 90-day Plan
{
  const s = wb.worksheets.add('90-Day Rollout');
  s.showGridLines = false;
  title(s, '90-Day B2B Rollout', 'A simple execution calendar for obtaining proof, converting pilots, and preparing the next sales cycle.', 'F');
  section(s, 'A4:F4', 'Execution roadmap');
  s.getRange('A5:F12').values = [
    ['Period', 'Main goal', 'Actions', 'Owner', 'Success measure', 'Output'],
    ['Days 1-14', 'Prepare the B2B product', 'Create landing pages, cohort codes, pilot agreement, onboarding guide, invoice template and sample report.', 'Founder + product', 'Everything needed to launch a pilot exists.', 'B2B sales kit'],
    ['Days 15-30', 'Book and close pilots', 'Target 30 universities and 20 companies; send personalised outreach; run discovery calls.', 'Founder / sales', '10 discovery calls; 2 university pilots; 1 company cohort.', 'Signed pilot dates'],
    ['Days 31-45', 'Launch and activate', 'Conduct workshop, share codes, send reminders, monitor completion.', 'Customer success', 'University 40%+ completion; company 60%+ completion.', 'Active cohorts'],
    ['Days 46-60', 'Measure value', 'Send weekly usage report; interview active users; collect permitted testimonials.', 'Customer success + founder', 'Clear gaps and feedback evidence.', 'Closing report'],
    ['Days 61-75', 'Convert pilots', 'Present results and a bulk-seat recommendation.', 'Founder / sales', '1 university deal of 100 seats; 1 company deal of 50 seats.', 'Paid proposal / invoice'],
    ['Days 76-90', 'Document and scale', 'Publish case studies; improve offer; repeat with new target list.', 'Founder + marketing', '2 case studies and a repeatable sales process.', 'Scale plan']
  ];
  header(s, 'A5:F5'); body(s, 'A6:F12');
  section(s, 'A14:F14', 'Weekly management dashboard');
  s.getRange('A15:F21').values = [
    ['Metric', 'Target', 'Week 1', 'Week 2', 'Week 3', 'Week 4'],
    ['New university outreach messages', 10, null, null, null, null],
    ['New company outreach messages', 10, null, null, null, null],
    ['Discovery calls booked', 3, null, null, null, null],
    ['Pilots launched', 1, null, null, null, null],
    ['First-mock completion rate', 0.4, null, null, null, null],
    ['Paid cohort contracts closed', 1, null, null, null, null]
  ];
  header(s, 'A15:F15'); body(s, 'A16:F21');
  s.getRange('B20:F20').format.numberFormat = '0.0%';
  s.getRange('C16:F21').format.fill = orange;
  widths(s, { A: 21, B: 20, C: 35, D: 19, E: 25, F: 25 });
  s.freezePanes.freezeRows(2);
}

// 6. Sales Tracker
{
  const s = wb.worksheets.add('Sales Tracker');
  s.showGridLines = false;
  title(s, 'B2B Sales Tracker', 'Use this table to manage first outreach, pilot progress and next steps. Orange cells are intended for user entry.', 'J');
  s.getRange('A4:J17').values = [
    ['Organisation', 'Type', 'Contact / role', 'Student / user cohort', 'Use case', 'Stage', 'Pilot start', 'Pilot result', 'Next action', 'Owner'],
    ['Example University', 'University', 'TPO / Career Services Head', 100, 'Placement readiness', 'Target', null, null, 'Send personalised email', 'Founder'],
    ['Example Company', 'Company', 'L&D or Recruitment Head', 50, 'Graduate / agency readiness', 'Target', null, null, 'Send personalised email', 'Founder'],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', ''],
    ['', '', '', null, '', 'Target', null, null, '', '']
  ];
  header(s, 'A4:J4'); body(s, 'A5:J17');
  s.getRange('A5:J17').format.rowHeight = 28;
  s.getRange('A6:J17').format.fill = orange;
  s.getRange('D5:D17').format.numberFormat = '#,##0';
  s.getRange('G5:H17').format.numberFormat = 'yyyy-mm-dd';
  s.getRange('B5:B17').dataValidation = { rule: { type: 'list', values: ['University', 'Company'] } };
  s.getRange('F5:F17').dataValidation = { rule: { type: 'list', values: ['Target', 'Contacted', 'Discovery call', 'Pilot agreed', 'Pilot live', 'Proposal sent', 'Closed won', 'Closed lost'] } };
  widths(s, { A: 26, B: 15, C: 27, D: 17, E: 27, F: 17, G: 15, H: 20, I: 30, J: 16 });
  s.freezePanes.freezeRows(4);
}

const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(`${outputDir}/Voke_B2B_University_Company_Plan.xlsx`);

for (const sheetName of ['Start Here', 'University Plan', 'Company Plan', 'Pricing & Economics', '90-Day Rollout', 'Sales Tracker']) {
  const blob = await wb.render({ sheetName, autoCrop: 'all', scale: 1.25, format: 'png' });
  await fs.writeFile(`${outputDir}/${sheetName.replaceAll(' ', '_')}.png`, new Uint8Array(await blob.arrayBuffer()));
}

const inspect = await wb.inspect({ kind: 'table', range: "'Pricing & Economics'!A5:G22", include: 'values,formulas', tableMaxRows: 25, tableMaxCols: 8 });
console.log(inspect.ndjson);
const errors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, summary: 'formula error scan' });
console.log(errors.ndjson);
