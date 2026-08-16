import os
import base64

# Read Voke logo as Base64
logo_path = "public/images/voke_logo_new.png"
if os.path.exists(logo_path):
    with open(logo_path, "rb") as f:
        logo_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
else:
    logo_b64 = ""

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voke AI Hackathon - Partnership Overview</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }}

    .page {{
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm 10mm 14mm;
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

    /* Header Styling - Robust PDF compatible colors, NO webkit-background-clip */
    .header {{
      background: #0f172a;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      border: 1px solid #1e293b;
    }}

    .header-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .brand-logo {{
      height: 32px;
      width: auto;
      object-fit: contain;
    }}

    .brand-text-fallback {{
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }}

    .badge-pill {{
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid #6366f1;
      color: #e0e7ff;
      font-size: 9.5px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }}

    .header-title h1 {{
      font-size: 21px;
      font-weight: 800;
      margin: 0 0 4px 0;
      letter-spacing: -0.4px;
      line-height: 1.2;
      color: #ffffff !important;
    }}

    .header-title p {{
      margin: 0 0 14px 0;
      font-size: 11.5px;
      color: #c7d2fe;
      font-weight: 500;
    }}

    .header-chips {{
      display: flex;
      gap: 8px;
      flex-wrap: nowrap;
    }}

    .chip {{
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 7px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .chip-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }}

    .chip-dot.gold {{ background-color: #fbbf24; }}
    .chip-dot.emerald {{ background-color: #34d399; }}
    .chip-dot.indigo {{ background-color: #818cf8; }}

    .chip-text {{
      font-size: 10.5px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
    }}

    /* Section Headers */
    .section-title {{
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .section-title::before {{
      content: '';
      display: inline-block;
      width: 4px;
      height: 13px;
      background: #4f46e5;
      border-radius: 2px;
    }}

    .card {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }}

    .grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }}

    /* Mentor Cards */
    .mentor-card {{
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
    }}

    .mentor-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }}

    .mentor-name {{
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
    }}

    .mentor-tag {{
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }}

    .tag-microsoft {{
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #a5b4fc;
    }}

    .tag-google {{
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }}

    .mentor-title {{
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 4px;
    }}

    .mentor-desc {{
      font-size: 10px;
      color: #334155;
      line-height: 1.4;
      margin: 0;
    }}

    /* Feature Pills */
    .pills-container {{
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }}

    .pill {{
      background: #e0e7ff;
      border: 1px solid #c7d2fe;
      color: #3730a3;
      font-size: 9.5px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 6px;
    }}

    /* Selection Items */
    .selection-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }}

    .selection-item {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 9px;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .selection-item svg {{
      width: 13px;
      height: 13px;
      color: #4f46e5;
      flex-shrink: 0;
    }}

    .selection-note {{
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 3px solid #f59e0b;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 10px;
      color: #78350f;
      margin-top: 8px;
      line-height: 1.4;
    }}

    /* Timeline Flow */
    .timeline {{
      display: flex;
      flex-direction: column;
      gap: 7px;
    }}

    .timeline-item {{
      display: flex;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }}

    .day-badge {{
      width: 72px;
      background: #1e1b4b;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px;
      text-align: center;
      flex-shrink: 0;
    }}

    .day-badge .day-num {{
      font-size: 11px;
      font-weight: 800;
      color: #818cf8;
      text-transform: uppercase;
    }}

    .day-badge .day-title {{
      font-size: 10px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 1px;
    }}

    .timeline-content {{
      padding: 8px 12px;
      flex-grow: 1;
    }}

    .timeline-title {{
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px 0;
    }}

    .timeline-desc {{
      font-size: 10px;
      color: #475569;
      margin: 0;
      line-height: 1.38;
    }}

    /* Partner Benefits */
    .benefits-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }}

    .benefit-card {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 3px solid #4f46e5;
      border-radius: 8px;
      padding: 9px 11px;
    }}

    .benefit-header {{
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 3px;
    }}

    .benefit-icon {{
      width: 20px;
      height: 20px;
      border-radius: 5px;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .benefit-title {{
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }}

    .benefit-desc {{
      font-size: 9.8px;
      color: #475569;
      margin: 0;
      line-height: 1.35;
    }}

    /* Vision Box */
    .vision-box {{
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid #1e293b;
      margin-top: 8px;
    }}

    .vision-title {{
      font-size: 12px;
      font-weight: 800;
      color: #fbbf24;
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .vision-text {{
      font-size: 10.2px;
      color: #e2e8f0;
      line-height: 1.45;
      margin: 0;
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
      margin-top: auto;
    }}

    .footer-brand {{
      font-weight: 700;
      color: #0f172a;
    }}
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="brand">
            {"<img src='" + logo_b64 + "' class='brand-logo' alt='Voke Logo'>" if logo_b64 else "<div class='brand-text-fallback'>VOKE AI</div>"}
          </div>
          <span class="badge-pill">Partnership Proposal</span>
        </div>

        <div class="header-title">
          <h1>Voke AI Hackathon – Partnership Overview</h1>
          <p>Building India's Most Engaging Student AI Hackathon • Proposal for AWS Campus Ambassadors</p>
        </div>

        <div class="header-chips">
          <div class="chip">
            <div class="chip-dot gold"></div>
            <span class="chip-text">₹10,000 Prize Pool</span>
          </div>
          <div class="chip">
            <div class="chip-dot emerald"></div>
            <span class="chip-text">7-Day Interactive Online AI Hackathon</span>
          </div>
          <div class="chip">
            <div class="chip-dot indigo"></div>
            <span class="chip-text">Microsoft & Google Mentorship</span>
          </div>
        </div>
      </div>

      <!-- About Voke -->
      <div class="section-title">About Voke</div>
      <div class="card">
        <p style="margin: 0 0 6px 0; font-size: 10.5px; color: #334155; line-height: 1.48;">
          <strong>Voke</strong> is an AI-powered interview platform that simulates real company hiring processes instead of traditional mock interviews. Users experience complete interview rounds such as resume screening, online assessments, technical interviews, and HR interviews, receiving detailed AI-powered feedback to accelerate career growth.
        </p>
        <p style="margin: 0 0 8px 0; font-size: 10.5px; color: #334155; line-height: 1.48;">
          We have publicly launched Voke and have <strong>150+ active users</strong> with continuous improvements based on user feedback. We are actively building both our B2C and B2B offerings.
        </p>
        <div class="pills-container">
          <span class="pill">Resume Screening</span>
          <span class="pill">Online Assessments</span>
          <span class="pill">Technical Interview Simulator</span>
          <span class="pill">HR Interview Rounds</span>
          <span class="pill">Actionable AI Feedback</span>
        </div>
      </div>

      <!-- World-Class Mentorship -->
      <div class="section-title">World-Class Mentorship</div>
      <div class="grid-2" style="margin-bottom: 6px;">
        <div class="mentor-card">
          <div class="mentor-header">
            <span class="mentor-name">Vivek Sridhar</span>
            <span class="mentor-tag tag-microsoft">Microsoft</span>
          </div>
          <div class="mentor-title">CTO at Microsoft for Startups</div>
          <p class="mentor-desc">
            Guiding Voke on product strategy, AI architecture, startup growth, and go-to-market execution.
          </p>
        </div>

        <div class="mentor-card">
          <div class="mentor-header">
            <span class="mentor-name">Udit Goyal</span>
            <span class="mentor-tag tag-google">Google</span>
          </div>
          <div class="mentor-title">COO at Google</div>
          <p class="mentor-desc">
            Helping Voke refine business strategy, product vision, and scaling roadmap.
          </p>
        </div>
      </div>
      <p style="font-size: 9.8px; color: #64748b; margin: 0 0 10px 0; font-style: italic;">
        * Their mentorship has been instrumental in shaping both Voke and our hackathon initiative.
      </p>

      <!-- About the Hackathon -->
      <div class="section-title">About the Hackathon</div>
      <div class="card">
        <p style="margin: 0 0 6px 0; font-size: 10.5px; color: #334155; line-height: 1.48;">
          We are organizing a <strong>7-day online AI Hackathon</strong> with a <strong>₹10,000 prize pool</strong> to bring together college students and developers across India to build innovative AI solutions.
        </p>
        <p style="margin: 0; font-size: 10.5px; color: #334155; line-height: 1.48;">
          <strong>Core Differentiator:</strong> Unlike traditional hackathons, participants stay engaged throughout the week through mentor sessions, progress reviews, community activities, technical discussions, and product feedback loops.
        </p>
      </div>

      <!-- Selection Process -->
      <div class="section-title">Selection Process</div>
      <div class="card">
        <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Applicants Submit:</div>
        <div class="selection-grid">
          <div class="selection-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Resume & LinkedIn Profile
          </div>
          <div class="selection-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            GitHub & Portfolio
          </div>
          <div class="selection-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Previous Projects & Hackathons
          </div>
          <div class="selection-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Community Involvement (GDSC, GDG, etc.)
          </div>
        </div>
        <div class="selection-note">
          <strong>Selection Basis:</strong> Selection will be based primarily on technical ability, project quality, communication, and overall potential. Community involvement will be considered as an additional factor rather than the deciding criterion.
        </div>
      </div>
    </div>

    <!-- Page Footer -->
    <div class="footer">
      <div><span class="footer-brand">Voke AI</span> • Partnership Proposal Overview</div>
      <div>Page 1 of 2</div>
    </div>
  </div>


  <!-- PAGE 2 -->
  <div class="page">
    <div>
      <!-- Header Compact Page 2 -->
      <div style="background: #0f172a; padding: 12px 18px; border-radius: 10px; margin-bottom: 12px; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Hackathon Flow & Partnership Impact</div>
          <div style="font-size: 10.5px; color: #c7d2fe;">Voke AI Hackathon • Community Partnership Overview</div>
        </div>
        <span class="badge-pill">AWS Campus Ambassadors</span>
      </div>

      <!-- Hackathon Flow -->
      <div class="section-title">7-Day Interactive Hackathon Flow</div>
      <div class="timeline" style="margin-bottom: 12px;">
        
        <div class="timeline-item">
          <div class="day-badge">
            <span class="day-num">Day 1</span>
            <span class="day-title">Kickoff</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">Opening Ceremony & Development Begins</div>
            <p class="timeline-desc">Mentor introductions, rules briefing, problem statements release, and development launch.</p>
          </div>
        </div>

        <div class="timeline-item">
          <div class="day-badge">
            <span class="day-num">Day 2</span>
            <span class="day-title">AI Trial</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">Voke AI Interview & Structured Feedback</div>
            <p class="timeline-desc">Every participant completes a Voke AI interview round and submits structured feedback to help improve the platform.</p>
          </div>
        </div>

        <div class="timeline-item">
          <div class="day-badge">
            <span class="day-num">Days 2–6</span>
            <span class="day-title">Mentorship</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">Office Hours, Discord & Bonus Challenges</div>
            <p class="timeline-desc">Mentor office hours, Discord discussions, progress updates, networking, and bonus challenges (Best Feature Suggestion, Best Bug Report, Best Creator, Best Progress Update, Community Helper).</p>
          </div>
        </div>

        <div class="timeline-item">
          <div class="day-badge">
            <span class="day-num">Day 4</span>
            <span class="day-title">Review</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">Midway Progress Review & Finals Shortlisting</div>
            <p class="timeline-desc">Midway progress review with live demo and Q&A. Teams are evaluated on progress, innovation, and technical execution, and shortlisted for the finals.</p>
          </div>
        </div>

        <div class="timeline-item">
          <div class="day-badge">
            <span class="day-num">Day 7</span>
            <span class="day-title">Finale</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-title">Final Presentations, Judging & Winner Announcement</div>
            <p class="timeline-desc">Final presentations, live demos, judging, and winner announcement.</p>
          </div>
        </div>

      </div>

      <!-- Why Partner With Us -->
      <div class="section-title">Why Partner With Us? (Community Partner Benefits)</div>
      <div class="benefits-grid" style="margin-bottom: 10px;">
        
        <div class="benefit-card">
          <div class="benefit-header">
            <div class="benefit-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-23"></path></svg>
            </div>
            <div class="benefit-title">Event & Social Branding</div>
          </div>
          <p class="benefit-desc">Branding across event assets, promotional materials, and social media campaigns.</p>
        </div>

        <div class="benefit-card">
          <div class="benefit-header">
            <div class="benefit-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
            </div>
            <div class="benefit-title">Ceremony Recognition</div>
          </div>
          <p class="benefit-desc">Recognition and official partner mentions during opening and closing ceremonies.</p>
        </div>

        <div class="benefit-card">
          <div class="benefit-header">
            <div class="benefit-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <div class="benefit-title">Workshop Opportunities</div>
          </div>
          <p class="benefit-desc">Opportunity to host technical sessions or workshops for hackathon participants.</p>
        </div>

        <div class="benefit-card">
          <div class="benefit-header">
            <div class="benefit-icon">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <div class="benefit-title">Direct Talent Access</div>
          </div>
          <p class="benefit-desc">Direct access to an engaged community of AI-focused student developers.</p>
        </div>

      </div>

      <div class="card" style="margin-bottom: 8px; background: #eef2ff; border-color: #c7d2fe;">
        <div style="display: flex; align-items: center; gap: 7px;">
          <svg width="14" height="14" fill="none" stroke="#3730a3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          <div style="font-size: 10.5px; font-weight: 700; color: #3730a3;">Multi-Channel Visibility Across All Communications</div>
        </div>
        <p style="margin: 3px 0 0 0; font-size: 9.8px; color: #4338ca; line-height: 1.38;">
          Visibility across LinkedIn, Discord channels, and all hackathon communications.
        </p>
      </div>

      <!-- Our Vision -->
      <div class="vision-box">
        <div class="vision-title">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Our Vision
        </div>
        <p class="vision-text">
          Our goal is to build one of the most engaging student AI hackathons in India—not just a coding competition, but a community where students learn, network, receive mentorship, and build impactful AI products. We believe partnering with <strong>AWS Campus Ambassadors</strong> will help us create a high-quality experience while empowering the next generation of AI innovators.
        </p>
      </div>
    </div>

    <!-- Page Footer -->
    <div class="footer">
      <div><span class="footer-brand">Voke AI</span> • Proposal for AWS Campus Ambassadors</div>
      <div>Page 2 of 2</div>
    </div>
  </div>

</body>
</html>
"""

html_filename = "Voke_AI_Hackathon_Partnership_Overview.html"
with open(html_filename, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated HTML generator script and compiled HTML successfully.")
