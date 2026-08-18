import os
import base64

# Read Voke logo as Base64
logo_path = "public/images/voke_logo_new.png"
if os.path.exists(logo_path):
    with open(logo_path, "rb") as f:
        logo_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
else:
    logo_b64 = ""

# Header SVG: Blue 'un' circle badge + Crisp White 'stop' wordmark (NO white bg box)
def get_header_unstop_b64():
    svg_content = """<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2120 796" style="enable-background:new 0 0 2120 796;">
<g>
	<!-- Solid Blue 'un' circle badge -->
	<path style="fill-rule:evenodd;clip-rule:evenodd;fill:#1C4980;" d="M397.6,0.4C178.6,0.4,0,179,0,398s178.6,397.6,397.6,397.6S795.2,617,795.2,398C795.1,179,616.5,0.4,397.6,0.4z M357.7,559h-82.6v-37.3c-23.8,36.2-52.6,51.5-96.1,51.5c-69,0-107.5-39.6-107.5-110.3V240.6h83.1v204.7c0,38.5,17.5,57.1,53.2,57.1c40.7,0,66.7-24.9,66.7-62.8V240h83.1v319H357.7z M640.5,559V362.2c0-37.9-17.5-57.1-53.2-57.1c-40.7,0-66.7,24.9-66.7,62.8V559h-83.1V240h82.6v0.6v45.8c23.8-36.2,52.6-51.5,96.1-51.5c69,0,107.5,39.6,107.5,110.3V559H640.5z"/>
	<!-- Crisp White 'stop' wordmark directly on header gradient (translate +100px) -->
	<g transform="translate(100, 0)">
		<path style="fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;" d="M1008.9,342.7c-0.6-28.8-20.4-43-59.9-43c-28.8,0-48.1,11.9-48.1,29.4c0,13,5.7,17.5,28.8,24.9l105.2,30c41.8,12.4,62.8,39,62.8,80.3c0,31.1-14.1,61.1-37.9,79.7c-23.8,18.7-57.7,28.3-101.8,28.3c-97.3,0-148.7-36.2-151-106.3h81.4c3.4,17,7.4,23.8,15.8,30c10.7,7.9,27.1,11.3,49.2,11.3c38.5,0,61.6-11.9,61.6-31.1c0-13-7.4-19.2-27.7-26l-99-30.5c-31.1-10.2-40.7-15.3-52-26.6c-11.3-12.4-17.5-30.5-17.5-52c0-65.6,50.3-106.3,131.8-106.3c86,0,138,40.7,139.1,108L1008.9,342.7z"/>
		<path style="fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;" d="M1297.3,300.9h-46.4v173.6c0,28.3,5.1,35.1,27.1,35.1c6.8,0,10.7-0.6,19.2-1.7v57.7c-15.3,4.5-28.8,6.2-48.1,6.2c-54.3,0-81.4-24.9-81.4-75.2V300.3H1127v-54.9h40.7V160h83.1v85.4h46.4v55.5H1297.3z"/>
		<path style="fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;" d="M1647.4,405.5c0,102.9-60.5,166.8-158.4,166.8c-98.4,0-158.3-63.9-158.3-169.1c0-104.6,59.9-169.1,157.8-169.1C1589.1,234.1,1647.4,297.5,1647.4,405.5L1647.4,405.5z M1413.8,403.2c0,61.6,30,102.4,75.2,102.4c44.7,0,75.2-41.3,75.2-101.2c0-62.8-29.4-103.5-75.2-103.5C1444.3,300.9,1413.8,342.1,1413.8,403.2z"/>
		<path style="fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;" d="M1777.2,286.7c20.4-35.6,48.6-52.6,88.8-52.6c38.5,0,78,20.4,99.5,50.3c21.5,29.4,34.5,74.6,34.5,119.3c0,96.7-57.1,169.1-134,169.1c-40.2,0-69-16.4-88.8-52v166.8h-83.1V239.8h83.1V286.7L1777.2,286.7z M1777.2,403.8c0,59.4,27.7,99.5,70.1,99.5c41.3,0,70.1-40.2,70.1-98.4c0-61.6-27.7-101.8-70.1-101.8C1804.9,303.7,1777.2,343.8,1777.2,403.8z"/>
	</g>
</g>
</svg>"""
    return "data:image/svg+xml;base64," + base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")

# Footer SVG: Official Unstop Brand Blue #1C4980
def get_footer_unstop_b64():
    svg_content = """<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2120 796" style="enable-background:new 0 0 2120 796;">
<style type="text/css">
	.st0{fill-rule:evenodd;clip-rule:evenodd;fill:#1C4980;}
</style>
<g>
	<path class="st0" d="M397.6,0.4C178.6,0.4,0,179,0,398s178.6,397.6,397.6,397.6S795.2,617,795.2,398C795.1,179,616.5,0.4,397.6,0.4z M357.7,559h-82.6v-37.3c-23.8,36.2-52.6,51.5-96.1,51.5c-69,0-107.5-39.6-107.5-110.3V240.6h83.1v204.7c0,38.5,17.5,57.1,53.2,57.1c40.7,0,66.7-24.9,66.7-62.8V240h83.1v319H357.7z M640.5,559V362.2c0-37.9-17.5-57.1-53.2-57.1c-40.7,0-66.7,24.9-66.7,62.8V559h-83.1V240h82.6v0.6v45.8c23.8-36.2,52.6-51.5,96.1-51.5c69,0,107.5,39.6,107.5,110.3V559H640.5z"/>
	<g transform="translate(100, 0)">
		<path class="st0" d="M1008.9,342.7c-0.6-28.8-20.4-43-59.9-43c-28.8,0-48.1,11.9-48.1,29.4c0,13,5.7,17.5,28.8,24.9l105.2,30c41.8,12.4,62.8,39,62.8,80.3c0,31.1-14.1,61.1-37.9,79.7c-23.8,18.7-57.7,28.3-101.8,28.3c-97.3,0-148.7-36.2-151-106.3h81.4c3.4,17,7.4,23.8,15.8,30c10.7,7.9,27.1,11.3,49.2,11.3c38.5,0,61.6-11.9,61.6-31.1c0-13-7.4-19.2-27.7-26l-99-30.5c-31.1-10.2-40.7-15.3-52-26.6c-11.3-12.4-17.5-30.5-17.5-52c0-65.6,50.3-106.3,131.8-106.3c86,0,138,40.7,139.1,108L1008.9,342.7z"/>
		<path class="st0" d="M1297.3,300.9h-46.4v173.6c0,28.3,5.1,35.1,27.1,35.1c6.8,0,10.7-0.6,19.2-1.7v57.7c-15.3,4.5-28.8,6.2-48.1,6.2c-54.3,0-81.4-24.9-81.4-75.2V300.3H1127v-54.9h40.7V160h83.1v85.4h46.4v55.5H1297.3z"/>
		<path class="st0" d="M1647.4,405.5c0,102.9-60.5,166.8-158.4,166.8c-98.4,0-158.3-63.9-158.3-169.1c0-104.6,59.9-169.1,157.8-169.1C1589.1,234.1,1647.4,297.5,1647.4,405.5L1647.4,405.5z M1413.8,403.2c0,61.6,30,102.4,75.2,102.4c44.7,0,75.2-41.3,75.2-101.2c0-62.8-29.4-103.5-75.2-103.5C1444.3,300.9,1413.8,342.1,1413.8,403.2z"/>
		<path class="st0" d="M1777.2,286.7c20.4-35.6,48.6-52.6,88.8-52.6c38.5,0,78,20.4,99.5,50.3c21.5,29.4,34.5,74.6,34.5,119.3c0,96.7-57.1,169.1-134,169.1c-40.2,0-69-16.4-88.8-52v166.8h-83.1V239.8h83.1V286.7L1777.2,286.7z M1777.2,403.8c0,59.4,27.7,99.5,70.1,99.5c41.3,0,70.1-40.2,70.1-98.4c0-61.6-27.7-101.8-70.1-101.8C1804.9,303.7,1777.2,343.8,1777.2,403.8z"/>
	</g>
</g>
</svg>"""
    return "data:image/svg+xml;base64," + base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")

unstop_b64_header = get_header_unstop_b64()
unstop_b64_footer = get_footer_unstop_b64()

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voke × Unstop Partnership Proposal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

    @page {{
      size: A4 portrait;
      margin: 0;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }}

    .page {{
      width: 210mm;
      height: 297mm;
      padding: 12mm 16mm 10mm 16mm;
      position: relative;
      background-color: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
    }}

    .page:last-child {{
      page-break-after: avoid;
    }}

    /* Header - Exact Gradient Match from User Screenshot */
    .header {{
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 55%, #1C4980 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border: 1px solid #312e81;
    }}

    .header-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }}

    .brand-container {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .brand-logo {{
      height: 30px;
      width: auto;
      object-fit: contain;
    }}

    .unstop-header-logo {{
      height: 26px;
      width: auto;
      object-fit: contain;
    }}

    .unstop-footer-logo {{
      height: 18px;
      width: auto;
      object-fit: contain;
    }}

    .brand-divider {{
      color: #818cf8;
      font-size: 18px;
      font-weight: 300;
    }}

    .header-badges-right {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .badge-pill {{
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}

    .website-pill {{
      background: rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(56, 189, 248, 0.6);
      color: #38bdf8;
      font-size: 8.5px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }}

    .header-title {{
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 3px 0;
      letter-spacing: -0.4px;
    }}

    .header-subtitle {{
      font-size: 10px;
      color: #e0e7ff;
      margin: 0;
      font-weight: 400;
      line-height: 1.35;
    }}

    /* Section Header */
    .section-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 14px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 1.5px solid #e2e8f0;
    }}

    .section-header:first-of-type {{
      margin-top: 0;
    }}

    .section-title {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    .section-badge-purple {{
      background: #4f46e5;
      color: #ffffff;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
    }}

    .section-badge-blue {{
      background: #1C4980;
      color: #ffffff;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
    }}

    /* About Box - Co-Branded Dual Tone */
    .about-box {{
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      border: 1px solid #cbd5e1;
      border-left: 4px solid #1C4980;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }}

    .about-title {{
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .about-text {{
      font-size: 10px;
      color: #334155;
      line-height: 1.4;
    }}

    /* Advisory Grid */
    .advisory-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }}

    .advisor-card {{
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1C4980 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid #312e81;
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .advisor-avatar {{
      background: #4f46e5;
      color: #ffffff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      flex-shrink: 0;
      border: 2px solid #818cf8;
    }}

    .advisor-name {{
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }}

    .advisor-role {{
      font-size: 9.5px;
      color: #38bdf8;
      font-weight: 700;
      margin-top: 1px;
    }}

    .advisor-tag {{
      font-size: 8.5px;
      color: #c7d2fe;
      margin-top: 1px;
    }}

    /* 2x2 Grids */
    .grid-2x2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }}

    /* Cards */
    .card {{
      background: #ffffff;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 5px;
    }}

    .card-title-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }}

    .card-num-purple {{
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 10.5px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .card-num-blue {{
      background: #dbeafe;
      color: #1C4980;
      font-weight: 800;
      font-size: 10.5px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .card-heading {{
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }}

    .card-subtext {{
      font-size: 8.5px;
      color: #64748b;
    }}

    /* Bullet List */
    .bullet-list {{
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }}

    .bullet-item {{
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.35;
    }}

    .bullet-icon-purple {{
      color: #4f46e5;
      font-weight: 800;
      font-size: 10px;
      line-height: 1.2;
      flex-shrink: 0;
    }}

    .bullet-icon-blue {{
      color: #1C4980;
      font-weight: 800;
      font-size: 10px;
      line-height: 1.2;
      flex-shrink: 0;
    }}

    .hl {{
      font-weight: 700;
      color: #0f172a;
    }}

    .disclaimer-tag {{
      background: #eff6ff;
      border: 1px solid #93c5fd;
      color: #1e40af;
      font-size: 8px;
      font-weight: 600;
      padding: 3px 6px;
      border-radius: 6px;
      margin-top: 2px;
      line-height: 1.3;
      display: flex;
      align-items: center;
      gap: 4px;
    }}

    /* Metric Summary Bar */
    .metrics-bar {{
      background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%);
      border: 1px solid #a5b4fc;
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 18px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }}

    .metric-item {{
      text-align: center;
    }}

    .metric-val {{
      font-size: 16px;
      font-weight: 800;
      color: #1C4980;
      line-height: 1.1;
    }}

    .metric-lbl {{
      font-size: 8px;
      color: #4338ca;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }}

    .metric-sep {{
      width: 1px;
      height: 24px;
      background: #cbd5e1;
    }}

    /* UNIQUE VISUAL WORKFLOW BANNER AT BOTTOM OF PAGE 1 (Filling Empty Space tastefully) */
    .workflow-banner {{
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #1C4980 100%);
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 14px;
      border: 1px solid #312e81;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .wf-title-group {{
      display: flex;
      flex-direction: column;
      gap: 2px;
    }}

    .wf-heading {{
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .wf-subtext {{
      font-size: 8.5px;
      color: #38bdf8;
      font-weight: 600;
    }}

    .wf-pipeline {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .wf-step {{
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 5px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      font-weight: 700;
      color: #ffffff;
    }}

    .wf-arrow {{
      color: #38bdf8;
      font-weight: 800;
      font-size: 11px;
    }}

    .wf-site-badge {{
      background: #38bdf8;
      color: #0f172a;
      font-size: 9px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 20px;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
      letter-spacing: 0.2px;
    }}

    /* Footer */
    .footer {{
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
    }}

    .footer-brand {{
      font-weight: 700;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
  </style>
</head>
<body>

  <!-- PAGE 1: OVERVIEW, MENTORSHIP & KEY FEATURES -->
  <div class="page">
    <div>
      <!-- Header matching User Screenshot Exactly + Website Pill -->
      <div class="header">
        <div class="header-top">
          <div class="brand-container">
            {"<img src='" + logo_b64 + "' class='brand-logo' alt='Voke Logo' />" if logo_b64 else "<span style='font-size:20px; font-weight:800; color:#fff;'>VOKE</span>"}
            <span class="brand-divider">×</span>
            {"<img src='" + unstop_b64_header + "' class='unstop-header-logo' alt='Unstop Logo' />" if unstop_b64_header else "<span style='font-size:20px; font-weight:800; color:#fff;'>unstop</span>"}
          </div>
          <div class="header-badges-right">
            <div class="website-pill">🌐 tryvoke.in</div>
            <div class="badge-pill">Proposal 2026</div>
          </div>
        </div>
        <h1 class="header-title">Voke × Unstop Partnership Proposal</h1>
        <p class="header-subtitle">Empowering Unstop candidates with AI Mock Interviews, exclusive user perks, sponsored prizes, and campus ambassador incentives.</p>
      </div>

      <!-- About Voke AI -->
      <div class="about-box">
        <div class="about-title">
          <span>🚀 About Voke AI</span>
          <span style="font-size:9.5px; color:#1C4980; font-weight:700;">Visit: www.tryvoke.in</span>
        </div>
        <div class="about-text">
          <strong>Voke</strong> is an AI-powered interview practice and career evaluation platform. Delivering hyper-realistic company mock rounds, instant voice/video analysis, and live coding evaluation, Voke prepares candidates to clear technical and HR rounds at top global companies.
        </div>
      </div>

      <!-- Mentorship Section -->
      <div class="section-header">
        <div class="section-title">
          <div class="section-badge-purple">★</div>
          <span>Mentorship</span>
        </div>
        <span style="font-size:9.5px; color:#475569; font-weight:700;">Guided by Industry Leaders</span>
      </div>

      <div class="advisory-grid">
        <!-- Mentor 1 -->
        <div class="advisor-card">
          <div class="advisor-avatar">VS</div>
          <div>
            <div class="advisor-name">Vivek Sridhar</div>
            <div class="advisor-role">CTO – Microsoft for Startups</div>
            <div class="advisor-tag">Technical & Scalability Mentor</div>
          </div>
        </div>

        <!-- Mentor 2 -->
        <div class="advisor-card">
          <div class="advisor-avatar">UG</div>
          <div>
            <div class="advisor-name">Udit Goyal</div>
            <div class="advisor-role">COO – Google</div>
            <div class="advisor-tag">Growth & Strategy Mentor</div>
          </div>
        </div>
      </div>

      <!-- Key Features Section -->
      <div class="section-header">
        <div class="section-title">
          <div class="section-badge-purple">⚡</div>
          <span>Key Features</span>
        </div>
        <span style="font-size:9.5px; color:#475569; font-weight:700;">Next-Gen Interview Technology</span>
      </div>

      <div class="grid-2x2">
        <!-- Feature 1 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-purple">1</div>
            <div>
              <div class="card-heading">Realistic AI Mock Interviews</div>
              <div class="card-subtext">Multimodal Voice & Video</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Human-like AI Rounds:</span> Natural conversational interviews simulating real hiring managers.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Adaptive Questioning:</span> Dynamic technical, behavioral & system design questions.</div>
            </li>
          </ul>
        </div>

        <!-- Feature 2 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-purple">2</div>
            <div>
              <div class="card-heading">360° Granular Feedback</div>
              <div class="card-subtext">Actionable AI Evaluation</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Instant Multi-Metric Scoring:</span> Evaluation on answer accuracy, speech & confidence.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Body Language Tracking:</span> Computer vision feedback on eye contact, posture & delivery.</div>
            </li>
          </ul>
        </div>

        <!-- Feature 3 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-purple">3</div>
            <div>
              <div class="card-heading">Company-Style Hiring Bars</div>
              <div class="card-subtext">FAANG & MNC Curriculums</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Targeted Prep Tracks:</span> Specific interview tracks modeled on Google, Amazon, TCS & startups.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Resume Parsing:</span> Tailors questions directly to candidate resumes & job descriptions.</div>
            </li>
          </ul>
        </div>

        <!-- Feature 4 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-purple">4</div>
            <div>
              <div class="card-heading">Live Code IDE & Sandbox</div>
              <div class="card-subtext">Real-Time Coding Evaluation</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Embedded IDE:</span> Monaco editor supporting 10+ languages with live code execution.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-purple">✓</span>
              <div><span class="hl">Automated Benchmarking:</span> Instant test case execution and complexity assessment.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- UNIQUE VISUAL PIPELINE BANNER AT BOTTOM OF PAGE 1 -->
      <div class="workflow-banner">
        <div class="wf-title-group">
          <div class="wf-heading">⚡ Candidate Experience Workflow</div>
          <div class="wf-subtext">Automated 3-Step Evaluation Journey</div>
        </div>
        <div class="wf-pipeline">
          <div class="wf-step">📄 1. Profile Upload</div>
          <span class="wf-arrow">➔</span>
          <div class="wf-step">🎙️ 2. AI Voice/Video Round</div>
          <span class="wf-arrow">➔</span>
          <div class="wf-step">📊 3. Instant Scorecard</div>
        </div>
        <div class="wf-site-badge">🌐 tryvoke.in</div>
      </div>
    </div>

    <!-- Footer Page 1 -->
    <div class="footer">
      <div class="footer-brand">
        <span>Voke AI (<strong style="color:#1C4980;">www.tryvoke.in</strong>)</span>
        <span style="color:#1C4980; font-weight:800;">×</span>
        {"<img src='" + unstop_b64_footer + "' class='unstop-footer-logo' alt='Unstop Logo' />" if unstop_b64_footer else "<span style='font-weight:800; color:#1C4980;'>unstop</span>"}
      </div>
      <div style="font-weight:700;">Page 1 of 2</div>
    </div>
  </div>

  <!-- PAGE 2: PARTNERSHIP PROPOSAL & UNSTOP REQUESTS -->
  <div class="page">
    <div>
      <!-- Section Header 1 (Unstop Deliverables) -->
      <div class="section-header" style="margin-top:0;">
        <div class="section-title">
          <div class="section-badge-blue">1</div>
          <span>What Unstop Receives</span>
        </div>
        <span style="font-size:9.5px; color:#475569; font-weight:700;">Value Package & Revenue Share</span>
      </div>

      <!-- 2x2 Grid Section 1 -->
      <div class="grid-2x2">
        <!-- 1. Revenue Sharing -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">1</div>
            <div>
              <div class="card-heading">Revenue Sharing</div>
              <div class="card-subtext">Monetization & Attribution</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">15% Payout:</span> Commission on all Premium subscriptions purchased via Unstop.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Tracking Dashboard:</span> Dedicated referral link & real-time conversion tracking.</div>
            </li>
          </ul>
        </div>

        <!-- 2. Exclusive Benefits -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">2</div>
            <div>
              <div class="card-heading">Exclusive Benefits for Users</div>
              <div class="card-subtext">Value Add for Every Unstop User</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">2 Free Elite Credits:</span> Free AI mock interview passes for all Unstop candidates.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Personalized Feedback:</span> In-depth evaluation on accuracy, speech & delivery.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Company-Style Practice:</span> Tailored technical and HR interview rounds.</div>
            </li>
          </ul>
        </div>

        <!-- 3. Sponsored Hackathon Prizes -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">3</div>
            <div>
              <div class="card-heading">Sponsored Hackathon Prizes</div>
              <div class="card-subtext">Event & Competition Sponsorship</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">1-Month & 3-Month Premium:</span> Voke licenses for winning teams.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Elite Interview Passes:</span> AI interview credits for top performers.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">AI Certificates:</span> Official AI Interview Preparation Certificates.</div>
            </li>
          </ul>
          <div class="disclaimer-tag">
            <span>ℹ️</span>
            <div><strong>Note:</strong> Sponsorship is provided as Voke subscriptions & AI credits (no cash prizes).</div>
          </div>
        </div>

        <!-- 4. Campus Ambassador Program -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">4</div>
            <div>
              <div class="card-heading">Campus Ambassador Program</div>
              <div class="card-subtext">Perks for Selected Ambassadors</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Free Voke Premium:</span> Complimentary premium access for selected ambassadors.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Extra Elite Credits:</span> Additional interview credits for ambassador practice.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">✓</span>
              <div><span class="hl">Campus Discounts & Perks:</span> Exclusive discount codes & referral incentives.</div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Quick Metrics Summary Bar -->
      <div class="metrics-bar">
        <div class="metric-item">
          <div class="metric-val">15%</div>
          <div class="metric-lbl">Revenue Share</div>
        </div>
        <div class="metric-sep"></div>
        <div class="metric-item">
          <div class="metric-val">2 Credits</div>
          <div class="metric-lbl">Free Per User</div>
        </div>
        <div class="metric-sep"></div>
        <div class="metric-item">
          <div class="metric-val">Subscriptions & Credits</div>
          <div class="metric-lbl">Sponsored Hackathon Prizes</div>
        </div>
        <div class="metric-sep"></div>
        <div class="metric-item">
          <div class="metric-val">Ambassadors</div>
          <div class="metric-lbl">Exclusive Perks</div>
        </div>
      </div>

      <!-- Section Header 2 (Requests from Unstop) -->
      <div class="section-header">
        <div class="section-title">
          <div class="section-badge-blue">2</div>
          <span>What We Request from Unstop</span>
        </div>
        <span style="font-size:9.5px; color:#475569; font-weight:700;">Strategic Co-Branding Integration</span>
      </div>

      <!-- 2x2 Grid Section 2 -->
      <div class="grid-2x2">
        <!-- Request 1 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">🎖️</div>
            <div>
              <div class="card-heading">Official AI Interview Partner</div>
              <div class="card-subtext">Partner Title & Recognition</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Partner Designation:</span> Official badge across selected flagship hackathons & challenges.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Tech Recognition:</span> Named as the exclusive AI interview technology partner.</div>
            </li>
          </ul>
        </div>

        <!-- Request 2 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">📍</div>
            <div>
              <div class="card-heading">Strategic Platform Placement</div>
              <div class="card-subtext">Event Pages & Candidate Reach</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Landing Page Integration:</span> Featured presence on hackathon & challenge pages.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Post-Event Outreach:</span> Logo & link in post-event candidate communications.</div>
            </li>
          </ul>
        </div>

        <!-- Request 3 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">✉️</div>
            <div>
              <div class="card-heading">Newsletter & Email Inclusion</div>
              <div class="card-subtext">Placement Outreaches & Guides</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Placement Newsletters:</span> Inclusion in student placement prep emails & guides.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Career Toolkits:</span> Featured resource in student hiring readiness toolkits.</div>
            </li>
          </ul>
        </div>

        <!-- Request 4 -->
        <div class="card">
          <div class="card-title-row">
            <div class="card-num-blue">🚀</div>
            <div>
              <div class="card-heading">Co-Branded Campaigns</div>
              <div class="card-subtext">Joint Bootcamps & Marketing</div>
            </div>
          </div>
          <ul class="bullet-list">
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Joint Bootcamps:</span> Co-hosted mock interview drives & AI readiness workshops.</div>
            </li>
            <li class="bullet-item">
              <span class="bullet-icon-blue">•</span>
              <div><span class="hl">Co-Marketing:</span> Joint social announcements & custom candidate practice portals.</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer">
      <div class="footer-brand">
        <span>Voke AI (<strong style="color:#1C4980;">www.tryvoke.in</strong>)</span>
        <span style="color:#1C4980; font-weight:800;">×</span>
        {"<img src='" + unstop_b64_footer + "' class='unstop-footer-logo' alt='Unstop Logo' />" if unstop_b64_footer else "<span style='font-weight:800; color:#1C4980;'>unstop</span>"}
      </div>
      <div style="font-weight:700;">Page 2 of 2</div>
    </div>
  </div>

</body>
</html>
"""

with open("Voke_Unstop_Partnership_Proposal.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated HTML with tryvoke.in domain + unique candidate workflow banner generated successfully!")
