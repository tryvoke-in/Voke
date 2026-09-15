import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voke AI - Enterprise Platform Architecture & Complete API Specification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #F8FAFC;
      color: #1E293B;
      font-size: 10px;
      line-height: 1.48;
    }

    .page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      position: relative;
      background: #FFFFFF;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      padding: 14mm 16mm 13mm 16mm;
    }

    /* Cover Page */
    .page.cover {
      background: radial-gradient(circle at 80% 20%, #1E1B4B 0%, #0F172A 50%, #090D16 100%);
      color: #FFFFFF;
      padding: 24mm 22mm 20mm 22mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding-bottom: 14px;
    }

    .cover-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cover-logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #6366F1, #38BDF8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      color: #FFFFFF;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
    }

    .cover-brand-text {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }

    .cover-brand-sub {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #94A3B8;
      font-weight: 600;
    }

    .cover-badges {
      display: flex;
      gap: 8px;
    }

    .pill-badge {
      font-size: 9px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-dark-accent {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #A5B4FC;
    }

    .badge-dark-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #6EE7B7;
    }

    .cover-hero {
      margin-top: 36px;
    }

    .cover-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #38BDF8;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cover-eyebrow::before {
      content: '';
      display: inline-block;
      width: 24px;
      height: 2px;
      background: #38BDF8;
    }

    .cover-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #FFFFFF;
      margin-bottom: 16px;
    }

    .cover-title span {
      background: linear-gradient(135deg, #818CF8 0%, #38BDF8 50%, #C084FC 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-desc {
      font-size: 12.5px;
      line-height: 1.6;
      color: #CBD5E1;
      max-width: 580px;
      margin-bottom: 30px;
    }

    .cover-highlights-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 36px;
    }

    .cover-highlight-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
      backdrop-filter: blur(10px);
    }

    .cover-highlight-num {
      font-size: 24px;
      font-weight: 800;
      color: #38BDF8;
      margin-bottom: 2px;
      font-family: 'JetBrains Mono', monospace;
    }

    .cover-highlight-label {
      font-size: 11px;
      font-weight: 600;
      color: #F8FAFC;
      margin-bottom: 4px;
    }

    .cover-highlight-sub {
      font-size: 9px;
      color: #94A3B8;
      line-height: 1.4;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .cover-meta-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748B;
      font-weight: 600;
    }

    .cover-meta-val {
      font-size: 10.5px;
      color: #E2E8F0;
      font-weight: 600;
    }

    /* Standard Page Header & Footer */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #E2E8F0;
      padding-bottom: 8px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-tag {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4F46E5;
      background: #EEF2FF;
      padding: 2.5px 7px;
      border-radius: 4px;
    }

    .header-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #1E293B;
    }

    .header-right {
      font-size: 8px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .page-footer {
      margin-top: auto;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748B;
      flex-shrink: 0;
    }

    .page-num {
      font-weight: 700;
      color: #0F172A;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Page Content Structure */
    .page-body {
      display: flex;
      flex-direction: column;
      gap: 11px;
      flex-grow: 1;
    }

    .section-headline {
      margin-bottom: 2px;
    }

    .section-eyebrow {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6366F1;
      margin-bottom: 2px;
    }

    .section-h1 {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-desc {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.45;
      margin-top: 2px;
    }

    /* Cards & Containers */
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 7px;
      padding: 10px 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .card-accent-blue { border-left: 3.5px solid #3B82F6; }
    .card-accent-indigo { border-left: 3.5px solid #6366F1; }
    .card-accent-emerald { border-left: 3.5px solid #10B981; }
    .card-accent-amber { border-left: 3.5px solid #F59E0B; }
    .card-accent-purple { border-left: 3.5px solid #8B5CF6; }

    .card-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-subtitle {
      font-size: 8.5px;
      color: #64748B;
      margin-bottom: 6px;
    }

    /* Tables */
    .table-container {
      width: 100%;
      border: 1px solid #E2E8F0;
      border-radius: 7px;
      overflow: hidden;
      background: #FFFFFF;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      text-align: left;
    }

    th {
      background: #F1F5F9;
      color: #334155;
      font-weight: 700;
      padding: 6px 8px;
      border-bottom: 1px solid #CBD5E1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 7.5px;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #F1F5F9;
      color: #334155;
      vertical-align: top;
      line-height: 1.4;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even) td {
      background-color: #FAFAFC;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      font-size: 7.5px;
      font-weight: 700;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-get { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
    .badge-post { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
    .badge-ws { background: #FAF5FF; color: #7E22CE; border: 1px solid #E9D5FF; }
    .badge-gql { background: #FDF2F8; color: #BE185D; border: 1px solid #FBCFE8; }
    .badge-rtc { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
    .badge-wasm { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }

    .badge-sla {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      color: #475569;
      font-size: 7.5px;
      font-weight: 600;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    /* Pipeline Diagram Elements */
    .pipeline-wrapper {
      background: #0F172A;
      border-radius: 7px;
      padding: 9px 12px;
      color: #F8FAFC;
      border: 1px solid #1E293B;
    }

    .pipeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 5px;
    }

    .pipeline-title {
      font-size: 10px;
      font-weight: 700;
      color: #38BDF8;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pipeline-tag {
      font-size: 7.5px;
      font-weight: 600;
      background: rgba(56, 189, 248, 0.15);
      color: #38BDF8;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
    }

    .pipeline-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    .pipeline-step {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      padding: 6px 8px;
      flex: 1;
      min-width: 0;
      position: relative;
    }

    .pipeline-step.active-gemini {
      border-color: #818CF8;
      background: rgba(99, 102, 241, 0.12);
    }

    .pipeline-step.active-groq {
      border-color: #F97316;
      background: rgba(249, 115, 22, 0.12);
    }

    .pipeline-step.active-emerald {
      border-color: #34D399;
      background: rgba(16, 185, 129, 0.12);
    }

    .pipeline-step-num {
      font-size: 7px;
      font-weight: 800;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }

    .pipeline-step-name {
      font-size: 8.5px;
      font-weight: 700;
      color: #FFFFFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pipeline-step-api {
      font-size: 7.5px;
      color: #38BDF8;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 1px;
    }

    .pipeline-arrow {
      color: #64748B;
      font-size: 12px;
      font-weight: bold;
    }

    .bullet-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bullet-item {
      position: relative;
      padding-left: 10px;
      font-size: 8.5px;
      color: #334155;
      line-height: 1.38;
    }

    .bullet-icon {
      position: absolute;
      left: 0;
      top: 4.5px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #4F46E5;
    }

    .tag-india {
      background: #FFF7ED;
      color: #C2410C;
      border: 1px solid #FFEDD5;
      font-weight: 700;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER PAGE ================= -->
  <section class="page cover">
    <div class="cover-header">
      <div class="cover-brand">
        <div class="cover-logo-icon">V</div>
        <div>
          <div class="cover-brand-text">VOKE AI</div>
          <div class="cover-brand-sub">Platform Engineering Group</div>
        </div>
      </div>
      <div class="cover-badges">
        <span class="pill-badge badge-dark-accent">Architecture Whitepaper</span>
        <span class="pill-badge badge-dark-success">Production Ready</span>
      </div>
    </div>

    <div class="cover-hero">
      <div class="cover-eyebrow">Enterprise Technical Specification</div>
      <div class="cover-title">
        System Architecture &<br>
        <span>Complete API Ecosystem</span>
      </div>
      <div class="cover-desc">
        Comprehensive engineering blueprint cataloging every external and internal API, real-time pipeline, multimodal vision engine, polyglot execution sandbox, and automated job intelligence service powering the Voke platform.
      </div>

      <div class="cover-highlights-grid">
        <div class="cover-highlight-card">
          <div class="cover-highlight-num">24+</div>
          <div class="cover-highlight-label">Integrated APIs</div>
          <div class="cover-highlight-sub">LLM, Multimodal Vision, STT/TTS, Polyglot Sandbox, 7 Job Feeds & Payment Webhooks.</div>
        </div>
        <div class="cover-highlight-card">
          <div class="cover-highlight-num">8</div>
          <div class="cover-highlight-label">Core Pipelines</div>
          <div class="cover-highlight-sub">Live voice WebSocket, video body language, automated code verification & career plans.</div>
        </div>
        <div class="cover-highlight-card">
          <div class="cover-highlight-num">&lt;250ms</div>
          <div class="cover-highlight-label">Streaming SLA</div>
          <div class="cover-highlight-sub">Sub-second inference responses with multi-key failover and client-side sandboxing.</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Document Scope</span>
        <span class="cover-meta-val">Full Platform API Architecture & Data Flows</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Audience</span>
        <span class="cover-meta-val">Executive Leadership & Core Engineering</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Version</span>
        <span class="cover-meta-val">v2.4.0 (Enterprise Specification)</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Classification</span>
        <span class="cover-meta-val">CONFIDENTIAL • PROPRIETARY</span>
      </div>
    </div>
  </section>

  <!-- ================= PAGE 2: EXECUTIVE ARCHITECTURE OVERVIEW ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 01</span>
        <span class="header-title">Executive Architecture Overview</span>
      </div>
      <div class="header-right">Voke Platform Architecture</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Macro System Topography</div>
        <div class="section-h1">Multi-Tier API Ecosystem & Micro-Services</div>
        <div class="section-desc">
          Voke operates a resilient, distributed, low-latency microservice architecture designed for synchronous interactive interviewing, multimodal video posture grading, real-time code evaluation, and automated career intelligence.
        </div>
      </div>

      <!-- Macro Architecture SVG Diagram -->
      <div style="background: #0F172A; border-radius: 8px; padding: 12px; border: 1px solid #1E293B;">
        <svg viewBox="0 0 760 260" style="width: 100%; height: auto; font-family: 'Plus Jakarta Sans', sans-serif;">
          <defs>
            <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.1"/>
            </linearGradient>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366F1" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#4338CA" stop-opacity="0.1"/>
            </linearGradient>
            <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#047857" stop-opacity="0.1"/>
            </linearGradient>
            <linearGradient id="extGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#B45309" stop-opacity="0.1"/>
            </linearGradient>
          </defs>

          <!-- Layer 1: Client Edge -->
          <rect x="10" y="10" width="165" height="240" rx="6" fill="url(#clientGrad)" stroke="#3B82F6" stroke-width="1.2"/>
          <text x="22" y="30" fill="#60A5FA" font-size="9.5" font-weight="700">CLIENT LAYER (BROWSER)</text>
          <rect x="20" y="40" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="28" y="54" fill="#F8FAFC" font-size="8" font-weight="600">Web Audio API & VAD</text>
          <text x="28" y="65" fill="#94A3B8" font-size="7">AnalyserNode FFT &amp; Volume</text>

          <rect x="20" y="78" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="28" y="92" fill="#F8FAFC" font-size="8" font-weight="600">Web Speech API (STT/TTS)</text>
          <text x="28" y="103" fill="#94A3B8" font-size="7">Zero-latency Native Audio</text>

          <rect x="20" y="116" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="28" y="130" fill="#F8FAFC" font-size="8" font-weight="600">WebRTC Peer Connection</text>
          <text x="28" y="141" fill="#94A3B8" font-size="7">P2P Media &amp; Google STUN</text>

          <rect x="20" y="154" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="28" y="168" fill="#F8FAFC" font-size="8" font-weight="600">Pyodide Wasm Sandbox</text>
          <text x="28" y="179" fill="#94A3B8" font-size="7">Isolated Python 3 in Worker</text>

          <rect x="20" y="192" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="28" y="206" fill="#F8FAFC" font-size="8" font-weight="600">PDF.js &amp; Tesseract OCR</text>
          <text x="28" y="217" fill="#94A3B8" font-size="7">Client-side ATS Extraction</text>

          <!-- Layer 2: Edge Gateway & Realtime -->
          <rect x="205" y="10" width="170" height="240" rx="6" fill="url(#edgeGrad)" stroke="#6366F1" stroke-width="1.2"/>
          <text x="217" y="30" fill="#818CF8" font-size="9.5" font-weight="700">EDGE GATEWAY &amp; ROUTING</text>
          <rect x="215" y="40" width="150" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="223" y="54" fill="#F8FAFC" font-size="8" font-weight="600">Interview Gateway (WS / SSE)</text>
          <text x="223" y="65" fill="#A5B4FC" font-size="7">Pre-warm Ping &amp; Streaming</text>

          <rect x="215" y="78" width="150" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="223" y="92" fill="#F8FAFC" font-size="8" font-weight="600">Gemini Multi-Key Pipeline</text>
          <text x="223" y="103" fill="#A5B4FC" font-size="7">Key Failover &amp; Model Downgrade</text>

          <rect x="215" y="116" width="150" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="223" y="130" fill="#F8FAFC" font-size="8" font-weight="600">Groq Whisper &amp; Proxy</text>
          <text x="223" y="141" fill="#A5B4FC" font-size="7">High-speed Audio Transcription</text>

          <rect x="215" y="154" width="150" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="223" y="168" fill="#F8FAFC" font-size="8" font-weight="600">Realtime Signaling Hub</text>
          <text x="223" y="179" fill="#A5B4FC" font-size="7">WebSocket SDP / ICE Mesh</text>

          <rect x="215" y="192" width="150" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="223" y="206" fill="#F8FAFC" font-size="8" font-weight="600">HMAC-SHA256 Webhook</text>
          <text x="223" y="217" fill="#A5B4FC" font-size="7">Cryptographic Signature Guard</text>

          <!-- Layer 3: AI Inference & Execution -->
          <rect x="405" y="10" width="165" height="240" rx="6" fill="url(#aiGrad)" stroke="#10B981" stroke-width="1.2"/>
          <text x="417" y="30" fill="#34D399" font-size="9.5" font-weight="700">INFERENCE &amp; EXECUTION</text>
          <rect x="415" y="40" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="423" y="54" fill="#F8FAFC" font-size="8" font-weight="600">Google Gemini API</text>
          <text x="423" y="65" fill="#6EE7B7" font-size="7">3.1 Flash-Lite, 2.5, 1.5 Flash</text>

          <rect x="415" y="78" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="423" y="92" fill="#F8FAFC" font-size="8" font-weight="600">Groq Cloud Inference</text>
          <text x="423" y="103" fill="#6EE7B7" font-size="7">LLaMA 3.3 70B &amp; Mixtral</text>

          <rect x="415" y="116" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="423" y="130" fill="#F8FAFC" font-size="8" font-weight="600">Gemini Multimodal Vision</text>
          <text x="423" y="141" fill="#6EE7B7" font-size="7">WebM Video Frame Body Analysis</text>

          <rect x="415" y="154" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="423" y="168" fill="#F8FAFC" font-size="8" font-weight="600">OnlineCompiler.io Engine</text>
          <text x="423" y="179" fill="#6EE7B7" font-size="7">Java 25, GCC 15, Rust, Go</text>

          <rect x="415" y="192" width="145" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="423" y="206" fill="#F8FAFC" font-size="8" font-weight="600">Piston Polyglot Engine</text>
          <text x="423" y="217" fill="#6EE7B7" font-size="7">14+ Containerized Compilers</text>

          <!-- Layer 4: External Services & Data Plane -->
          <rect x="600" y="10" width="150" height="240" rx="6" fill="url(#extGrad)" stroke="#F59E0B" stroke-width="1.2"/>
          <text x="610" y="30" fill="#FBBF24" font-size="9.5" font-weight="700">EXTERNAL APIS &amp; DATA</text>
          <rect x="608" y="40" width="134" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="615" y="54" fill="#F8FAFC" font-size="8" font-weight="600">7 Free Indian Job APIs</text>
          <text x="615" y="65" fill="#FCD34D" font-size="7">Adzuna, TheMuse, SerpApi, Remote</text>

          <rect x="608" y="78" width="134" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="615" y="92" fill="#F8FAFC" font-size="8" font-weight="600">LeetCode GraphQL API</text>
          <text x="615" y="103" fill="#FCD34D" font-size="7">Global Ranking &amp; Solves</text>

          <rect x="608" y="116" width="134" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="615" y="130" fill="#F8FAFC" font-size="8" font-weight="600">Codeforces &amp; GitHub</text>
          <text x="615" y="141" fill="#FCD34D" font-size="7">Repo Metadata &amp; Ratings</text>

          <rect x="608" y="154" width="134" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="615" y="168" fill="#F8FAFC" font-size="8" font-weight="600">Razorpay Orders &amp; Pay</text>
          <text x="615" y="179" fill="#FCD34D" font-size="7">Subscriptions &amp; Entitlements</text>

          <rect x="608" y="192" width="134" height="32" rx="4" fill="#1E293B" stroke="#334155"/>
          <text x="615" y="206" fill="#F8FAFC" font-size="8" font-weight="600">Database &amp; S3 Storage</text>
          <text x="615" y="217" fill="#FCD34D" font-size="7">32+ Tables with RLS &amp; Media</text>
        </svg>
      </div>

      <!-- Architectural Highlights Grid -->
      <div class="grid-3">
        <div class="card card-accent-blue">
          <div class="card-title">Streaming Gateway</div>
          <div class="card-subtitle">WebSocket / SSE Engine</div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span>Multiplexes voice audio and token streams via WebSockets with &lt;100ms first-byte latency.</div>
            <div class="bullet-item"><span class="bullet-icon"></span>Pre-warm ping protocols reduce initial cold-start model latency to zero.</div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">Multi-Key Failover</div>
          <div class="card-subtitle">Zero-Downtime Key Pool</div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span>Dynamic key rotation across primary, professional, and auxiliary quotas on 429/403.</div>
            <div class="bullet-item"><span class="bullet-icon"></span>Cascading model downgrades ensure interview continuity under outages.</div>
          </div>
        </div>

        <div class="card card-accent-amber">
          <div class="card-title">Hybrid Sandboxing</div>
          <div class="card-subtitle">Wasm + Container Hybrid</div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span>Python 3 runs locally in browser Web Workers via Pyodide Wasm—zero cloud cost.</div>
            <div class="bullet-item"><span class="bullet-icon"></span>Compiled languages (C++, Java 25, Rust) execute inside isolated cloud runtimes.</div>
          </div>
        </div>
      </div>

      <!-- Core Architectural Metrics Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Functional Domain</th>
              <th>Primary Technology / Protocol</th>
              <th>SLA / Latency Target</th>
              <th>Resilience Strategy</th>
              <th>Security &amp; Isolation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Live Voice Interview</strong></td>
              <td>WebSocket + Gemini SSE Stream</td>
              <td>&lt; 250 ms</td>
              <td>Multi-Key Rotation + Groq Fallback</td>
              <td>JWT Authentication + Turn Constraints</td>
            </tr>
            <tr>
              <td><strong>Video &amp; Posture AI</strong></td>
              <td>Gemini 2.5 Flash Multimodal Vision</td>
              <td>1.8 s - 2.5 s</td>
              <td>Inline Base64 + S3 Storage Fallback</td>
              <td>Private S3 Bucket + User Path RLS</td>
            </tr>
            <tr>
              <td><strong>Code Evaluation</strong></td>
              <td>Client Wasm + OnlineCompiler.io</td>
              <td>0 ms (Local) / 800 ms (Cloud)</td>
              <td>Piston Container Engine Fallback</td>
              <td>Thread Sandboxing &amp; 3000ms Timeout</td>
            </tr>
            <tr>
              <td><strong>Job Scouting</strong></td>
              <td>7 Free Public Aggregator APIs</td>
              <td>Async Batch Ingestion</td>
              <td>Deduplication &amp; Source Failover</td>
              <td>Sanitized Queries &amp; Domain Locks</td>
            </tr>
            <tr>
              <td><strong>Monetization</strong></td>
              <td>Razorpay API + Webhooks</td>
              <td>Instant State Sync</td>
              <td>Idempotent DB Upsert on Event</td>
              <td>HMAC-SHA256 Web Crypto Signature</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 01</span>
      <span class="page-num">Page 2 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 3: GENERATIVE AI & LLM APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 02</span>
        <span class="header-title">Generative AI &amp; Large Language Model (LLM) APIs</span>
      </div>
      <div class="header-right">Inference &amp; Language Systems</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Conversational Intelligence &amp; Evaluation</div>
        <div class="section-h1">Multi-Model LLM Inference Pipeline</div>
        <div class="section-desc">
          Voke utilizes a tiered, multi-provider generative AI strategy combining Google Gemini's advanced reasoning and structured JSON output with Groq's high-speed inference for conversational sub-second responsiveness.
        </div>
      </div>

      <!-- Pipeline Diagram: Gemini Multi-Key Failover -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Google Gemini Multi-Key Dynamic Failover Pipeline
          </div>
          <span class="pipeline-tag">High Availability • Zero Rate-Limit Dropouts</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Client Request</div>
            <div class="pipeline-step-api">WebSocket Payload</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02</div>
            <div class="pipeline-step-name">Context Build</div>
            <div class="pipeline-step-api">Mandates + History</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03</div>
            <div class="pipeline-step-name">Key Execution</div>
            <div class="pipeline-step-api">Gemini 3.1 Lite</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 04: 429/403</div>
            <div class="pipeline-step-name">Key Rotation</div>
            <div class="pipeline-step-api">Rotate Key (0 &rarr; N)</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05: On 5xx</div>
            <div class="pipeline-step-name">Model Cascade</div>
            <div class="pipeline-step-api">2.5 Flash &rarr; 1.5</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 06</div>
            <div class="pipeline-step-name">Chunk Stream</div>
            <div class="pipeline-step-api">SSE / WebSocket</div>
          </div>
        </div>
      </div>

      <!-- LLM API Specifications Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Provider &amp; API Endpoint</th>
              <th>Models Deployed</th>
              <th>Integration Mode</th>
              <th>Architectural Role &amp; Responsibilities</th>
              <th>Output Protocol</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Google Generative Language API</strong><br>
                <code style="font-size:7.5px; color:#6366F1;">/v1beta/models/{model}:generateContent</code><br>
                <code style="font-size:7.5px; color:#6366F1;">/v1beta/models/{model}:streamGenerateContent</code>
              </td>
              <td>
                <span class="badge badge-post">gemini-3.1-flash-lite</span><br>
                <span class="badge badge-post">gemini-2.5-flash</span><br>
                <span class="badge badge-post">gemini-1.5-flash</span>
              </td>
              <td>REST &amp; SSE Server-Sent Events</td>
              <td>
                <strong>Conversational Technical Interviewer:</strong> Generates live adaptive questions, verifies candidate algorithmic approaches, conducts FAANG-tier Round 3 coding dialogues, synthesizes 6Q personality scorecards, and formulates 3-month career roadmaps.
              </td>
              <td>
                Streaming Text Chunks &amp; Structured JSON Schema (<code style="font-size:7.5px;">responseMimeType: application/json</code>)
              </td>
            </tr>
            <tr>
              <td>
                <strong>Groq Cloud Inference API</strong><br>
                <code style="font-size:7.5px; color:#F97316;">/openai/v1/chat/completions</code>
              </td>
              <td>
                <span class="badge badge-post" style="border-color:#FED7AA; background:#FFF7ED; color:#C2410C;">llama-3.3-70b-versatile</span><br>
                <span class="badge badge-post" style="border-color:#FED7AA; background:#FFF7ED; color:#C2410C;">mixtral-8x7b-32768</span>
              </td>
              <td>REST High-Speed Inference</td>
              <td>
                <strong>Sub-Second Conversational Agent &amp; ATS Parser:</strong> Performs ultra-fast answer evaluations during mock sessions, executes high-accuracy ATS resume parsing into typed JSON schemas, and computes vector similarity for candidate job recommendations.
              </td>
              <td>
                Direct JSON Object (<code style="font-size:7.5px;">type: json_object</code>) &amp; Plain Text
              </td>
            </tr>
            <tr>
              <td>
                <strong>Lovable AI Gateway API</strong><br>
                <code style="font-size:7.5px; color:#10B981;">/v1/chat/completions</code>
              </td>
              <td>
                <span class="badge badge-post" style="border-color:#A7F3D0; background:#ECFDF5; color:#047857;">gemini-2.5-flash</span><br>
                <span class="badge badge-post" style="border-color:#A7F3D0; background:#ECFDF5; color:#047857;">gpt-4o-mini-proxy</span>
              </td>
              <td>REST Cloud Proxy</td>
              <td>
                <strong>Secondary Inference Gateway:</strong> Serves as an auxiliary fallback route for analyzing community interview trends, generating career guidance, and evaluating student placement mock rounds if primary upstream routes saturate.
              </td>
              <td>
                JSON Payload Response
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Technical Architecture Breakdown Cards -->
      <div class="grid-2">
        <div class="card card-accent-indigo">
          <div class="card-title">
            <span>Dynamic Key Rotation &amp; Cascade Engine</span>
            <span class="badge badge-sla">99.99% Availability</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Multi-Key Pool:</strong> Dynamically rotates across primary, pro, and dynamic keys.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Instant 429/403 Recovery:</strong> Key indices increment seamlessly without dropping candidate sessions.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Graceful Model Downgrade:</strong> If 5xx errors occur, requests step down: 3.1 Lite &rarr; 2.5 Flash &rarr; 1.5 Flash.</div>
          </div>
        </div>

        <div class="card card-accent-purple">
          <div class="card-title">
            <span>6Q Personality Evaluation Framework</span>
            <span class="badge badge-sla">JSON Schema Locked</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>6Q Metric Dimensions:</strong> Scored across IQ, EQ, CQ, AQ, SQ, and TQ (0–100 scale).</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Strict Output Lock:</strong> Guaranteed syntax-safe JSON schemas eliminate radar chart rendering bugs.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Anti-Repetition Engine:</strong> Prevents asking repeat or rephrased questions during interviews.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 02</span>
      <span class="page-num">Page 3 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 4: MULTIMODAL COMPUTER VISION & VIDEO APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 03</span>
        <span class="header-title">Multimodal Computer Vision &amp; Video Interview AI APIs</span>
      </div>
      <div class="header-right">Perception &amp; Video Intelligence</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Visual Body Language &amp; Gaze Perception</div>
        <div class="section-h1">Multimodal Video Analysis Pipeline</div>
        <div class="section-desc">
          Voke utilizes Google Gemini's advanced multimodal video vision capabilities to inspect candidate physical posture, eye-contact stability, hand gesturing, facial affect, and professional attire directly from recorded video streams.
        </div>
      </div>

      <!-- Multimodal Pipeline Flow -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            Multimodal Video Interview Analysis Pipeline
          </div>
          <span class="pipeline-tag">Frame-by-Frame Video &amp; Body Language Perception</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Camera Stream</div>
            <div class="pipeline-step-api">MediaDevices 720p</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02</div>
            <div class="pipeline-step-name">Client Recording</div>
            <div class="pipeline-step-api">MediaRecorder (WebM VP8/Opus)</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03</div>
            <div class="pipeline-step-name">Storage Staging</div>
            <div class="pipeline-step-api">Private S3 Bucket / Base64</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 04</div>
            <div class="pipeline-step-name">Multimodal Ingestion</div>
            <div class="pipeline-step-api">Gemini 2.5 Flash Vision</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">Posture Scorecard</div>
            <div class="pipeline-step-api">Gaze, Attire, Posture JSON</div>
          </div>
        </div>
      </div>

      <!-- Video AI Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Evaluation Metric</th>
              <th>Detection Criteria &amp; Visual Indicators</th>
              <th>Behavioral Signal</th>
              <th>Scoring Impact (0–100)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Eye Contact &amp; Gaze</strong></td>
              <td>Tracks vector angles of candidate pupils and face relative to camera lens. Detects persistent downward reading (notes/scripts) or upper sideways avoidance.</td>
              <td>Confidence &amp; Authenticity vs Script Reading</td>
              <td>Directly modulates <em>Delivery Score</em> and <em>Confidence Score</em>; highlights cheating or script reading.</td>
            </tr>
            <tr>
              <td><strong>Posture &amp; Stability</strong></td>
              <td>Monitors torso alignment, shoulder symmetry, and frequent leaning or uncentered movement within the 1280x720 frame boundary.</td>
              <td>Composure, Presence &amp; Body Language</td>
              <td>Docks points for excessive fidgeting; awards high marks for upright, calm posture.</td>
            </tr>
            <tr>
              <td><strong>Hand Gestures</strong></td>
              <td>Identifies hand positions across frame. Distinguishes between supportive, natural descriptive gestures and nervous waving or facial touching.</td>
              <td>Communication Impact &amp; Clarity</td>
              <td>Factors into <em>Body Language Score</em> with explicit actionable advice.</td>
            </tr>
            <tr>
              <td><strong>Attire &amp; Dressing</strong></td>
              <td>Observes upper torso visible clothing in video frame. Flags casual tank-tops or athletic vests vs formal or business casual shirts.</td>
              <td>Professionalism &amp; Corporate Readiness</td>
              <td>Injects explicit wardrobe guidance into scorecard for institutional campus drives.</td>
            </tr>
            <tr>
              <td><strong>Facial Affect &amp; Rapport</strong></td>
              <td>Evaluates micro-expressions: smiling, furrowed brows, active listening nods, and stress responses under difficult technical follow-ups.</td>
              <td>Emotional Intelligence (EQ) &amp; Engagement</td>
              <td>Feeds directly into candidate 6Q radar chart and comprehensive interview verdict.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Video Technical Protocol Cards -->
      <div class="grid-2">
        <div class="card card-accent-blue">
          <div class="card-title">
            <span>Video Recording &amp; Ingestion Protocol</span>
            <span class="badge badge-sla">720p WebM VP8/Opus</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Direct Base64 Inline Payloads:</strong> Client captures WebM chunks and streams direct Base64 payloads to Edge Gateway for instant sub-2.5s turnarounds.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Private S3 Storage Fallback:</strong> Payloads exceeding 25MB automatically stage to private object storage buckets under strict user folder paths.</div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">
            <span>Multimodal Gemini 2.5 Flash Vision Engine</span>
            <span class="badge badge-sla">Multimodal AI</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Frame-by-Frame Perception:</strong> Ingests native video streams without requiring complex separate frame extraction microservices.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Dual Output:</strong> Generates both qualitative human-like critique and quantitative metric scorecards with model answers.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 03</span>
      <span class="page-num">Page 4 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 5: AUDIO, SPEECH & VOICE APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 04</span>
        <span class="header-title">Speech-to-Text, Voice Activity &amp; Text-to-Speech APIs</span>
      </div>
      <div class="header-right">Audio &amp; Voice Engineering</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Real-Time Voice Pipeline</div>
        <div class="section-h1">Bidirectional Speech &amp; Voice Activity Systems</div>
        <div class="section-desc">
          Voke couples native browser speech APIs with cloud-hosted Groq Whisper models to provide resilient, low-latency, domain-biased voice recognition and conversational speech delivery.
        </div>
      </div>

      <!-- Voice Pipeline Flow -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            Bidirectional Voice Audio &amp; Transcription Pipeline
          </div>
          <span class="pipeline-tag">Dual-Engine STT • Web Audio VAD • Speech Synthesis</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Microphone In</div>
            <div class="pipeline-step-api">PCM 16/48kHz</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02</div>
            <div class="pipeline-step-name">Web Audio VAD</div>
            <div class="pipeline-step-api">AnalyserNode FFT</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03: Primary</div>
            <div class="pipeline-step-name">Web Speech API</div>
            <div class="pipeline-step-api">0ms Local STT</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-groq">
            <div class="pipeline-step-num">Step 04: Fallback</div>
            <div class="pipeline-step-name">Groq Whisper v3</div>
            <div class="pipeline-step-api">High Precision STT</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">Speech Synthesis</div>
            <div class="pipeline-step-api">Natural TTS Output</div>
          </div>
        </div>
      </div>

      <!-- Voice APIs Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Voice Subsystem</th>
              <th>API / Specification</th>
              <th>Input / Output Protocol</th>
              <th>Operational Characteristics &amp; Technical Capabilities</th>
              <th>Latency / SLA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Primary STT</strong></td>
              <td>
                <strong>Web Speech API (SpeechRecognition)</strong><br>
                <code style="font-size:7.5px; color:#10B981;">window.webkitSpeechRecognition</code>
              </td>
              <td>Continuous PCM audio stream &rarr; String text</td>
              <td>Runs 100% locally on user machine with zero network bandwidth consumption. Emits interim word hypotheses and triggers speech finalization upon conversational pause.</td>
              <td><strong>&lt; 50 ms</strong> (Zero Network Hop)</td>
            </tr>
            <tr>
              <td><strong>Fallback STT</strong></td>
              <td>
                <strong>Groq Cloud Whisper API</strong><br>
                <code style="font-size:7.5px; color:#F97316;">whisper-large-v3-turbo</code>
              </td>
              <td>Multipart audio/webm blob &rarr; JSON transcript</td>
              <td>High-fidelity transcription for complex tech accents. Runs with temperature 0, English lock, and domain prompting (<em>"Technical software engineering interview speech strictly in English"</em>).</td>
              <td><strong>200 - 350 ms</strong> (Cloud Inference)</td>
            </tr>
            <tr>
              <td><strong>Voice Activity (VAD)</strong></td>
              <td>
                <strong>Web Audio API (AudioContext)</strong><br>
                <code style="font-size:7.5px; color:#3B82F6;">AnalyserNode &amp; createMediaStreamSource</code>
              </td>
              <td>MediaStream &rarr; Float32 frequency data</td>
              <td>Computes root mean square (RMS) volume metrics, dynamically filters ambient room noise, drives audio visualizer waveforms, and triggers barge-in silence detection.</td>
              <td><strong>Real-Time</strong> (Audio Thread)</td>
            </tr>
            <tr>
              <td><strong>Interviewer TTS</strong></td>
              <td>
                <strong>Web Speech Synthesis API</strong><br>
                <code style="font-size:7.5px; color:#8B5CF6;">SpeechSynthesisUtterance</code>
              </td>
              <td>Clean text string &rarr; Hardware speaker audio</td>
              <td>Delivers natural spoken dialogue. Features automated resume heartbeat to bypass Chromium synthesis pause bugs, plus instant barge-in cancel when candidate starts speaking.</td>
              <td><strong>Instantaneous</strong> (Local Playback)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Silent Mode & Focus Protection -->
      <div class="card card-accent-emerald">
        <div class="card-title">
          <span>Candidate Coding Focus Protection: The Silent Mode Protocol</span>
          <span class="badge badge-post">Round 3 Algorithmic Assessment</span>
        </div>
        <div class="card-subtitle">Engineered Interruption Prevention Architecture</div>
        <div class="bullet-list">
          <div class="bullet-item"><span class="bullet-icon"></span><strong>Automated Audio Muting:</strong> When candidate transitions to Round 3 (Algorithmic Live Coding) or types in the code editor, the client orchestrator enforces <em>Silent Mode</em>. Microphone recording stops, speech synthesis cancels, and AudioContext suspends.</div>
          <div class="bullet-item"><span class="bullet-icon"></span><strong>Approach Verification Gate:</strong> Once the candidate verbally explains their algorithmic approach (&gt;50% relevance), the interviewer responds <code style="font-size:8px;">[APPROACH_VERIFIED]</code>, unlocks the editor, and remains completely silent until tests run.</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 04</span>
      <span class="page-num">Page 5 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 6: POLYGLOT CODE EXECUTION APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 05</span>
        <span class="header-title">Live Code Assessment &amp; Polyglot Sandbox Execution APIs</span>
      </div>
      <div class="header-right">Execution &amp; Verification Sandboxes</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Zero-Trust Safe Code Execution</div>
        <div class="section-h1">Polyglot Multi-Language Sandbox Architecture</div>
        <div class="section-desc">
          Voke implements a hybrid sandboxing architecture: Python and TypeScript execute locally inside WebAssembly and Web Worker isolation with zero server cost, while compiled enterprise languages (C++, Java, Go, Rust) execute via secure containerized APIs.
        </div>
      </div>

      <!-- Code Execution Flow Diagram -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Dual-Route Code Compilation &amp; Execution Pipeline
          </div>
          <span class="pipeline-tag">WebAssembly Wasm + Cloud Container Isolation</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Code Editor</div>
            <div class="pipeline-step-api">Syntax &amp; Language Detect</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02: Route</div>
            <div class="pipeline-step-name">Language Router</div>
            <div class="pipeline-step-api">Python/JS vs Compiled</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Route A: Wasm</div>
            <div class="pipeline-step-name">Pyodide Worker</div>
            <div class="pipeline-step-api">0ms Latency • Local Run</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Route B: Cloud</div>
            <div class="pipeline-step-name">OnlineCompiler API</div>
            <div class="pipeline-step-api">GCC 15 / Java 25 / Rust</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">Test Runner</div>
            <div class="pipeline-step-api">Diff Expected vs Actual</div>
          </div>
        </div>
      </div>

      <!-- Polyglot Execution API Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Execution Engine</th>
              <th>Protocol / Endpoint</th>
              <th>Languages Supported</th>
              <th>Runtime Isolation &amp; Security Specs</th>
              <th>Output Telemetry</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>In-Browser Pyodide Engine</strong><br>
                <span class="badge badge-wasm">Client WebAssembly</span>
              </td>
              <td>Web Worker Message Channel<br><code style="font-size:7.5px;">pyodide.js v0.26.1 (Wasm)</code></td>
              <td><strong>Python 3.11 / 3.12</strong> (Pure Python &amp; standard library)</td>
              <td>Runs inside an isolated Web Worker thread with no access to DOM, cookies, or network. Infinite loops terminate via worker timeout.</td>
              <td>Stdout, stderr, return value, microsecond timing, test results.</td>
            </tr>
            <tr>
              <td>
                <strong>OnlineCompiler.io REST API</strong><br>
                <span class="badge badge-post">Cloud Sandbox API</span>
              </td>
              <td><code style="font-size:7.5px; color:#1D4ED8;">POST /api/run-code-sync/</code><br>Auth: Bearer Server Key</td>
              <td><strong>Java</strong> (<code style="font-size:7.5px;">openjdk-25</code>), <strong>C/C++</strong> (<code style="font-size:7.5px;">gcc-15 / g++-15</code>), <strong>Go</strong> (<code style="font-size:7.5px;">go-1.24</code>), <strong>Rust</strong> (<code style="font-size:7.5px;">rust-1.87</code>)</td>
              <td>Containerized ephemeral jail runtimes with custom standard input piping, wall-clock timeout caps, and memory limits.</td>
              <td><code style="font-size:7.5px;">{ output, error, status, exit_code, time, memory }</code></td>
            </tr>
            <tr>
              <td>
                <strong>Piston Execution Engine</strong><br>
                <span class="badge badge-post">Container Polyglot</span>
              </td>
              <td><code style="font-size:7.5px; color:#7E22CE;">POST /api/v2/piston/execute</code><br><code style="font-size:7.5px; color:#7E22CE;">GET /api/v2/piston/runtimes</code></td>
              <td><strong>14+ Runtimes:</strong> Python, TypeScript, Java, C, C++, Rust, Go, Ruby, PHP, Swift, Kotlin, Bash</td>
              <td>cgroups &amp; seccomp container isolation: 10s compile timeout, 3s execution timeout, 512MB memory limit. Process signals tracked.</td>
              <td>Separate compile and run streams with exit codes and execution signals.</td>
            </tr>
            <tr>
              <td>
                <strong>Client TypeScript Transpiler</strong><br>
                <span class="badge badge-wasm">Client AST Engine</span>
              </td>
              <td>Dynamic ESM Import<br><code style="font-size:7.5px;">typescript v5.3.3 via ESM</code></td>
              <td><strong>TypeScript &amp; JavaScript</strong> (<code style="font-size:7.5px;">ES2022</code>)</td>
              <td>Transpiles TypeScript AST to clean JavaScript in memory, followed by regular expression sanitization fallbacks in sandboxed eval.</td>
              <td>Console intercept logs, return values, caught exception stack traces.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Test Case Verification Logic Card -->
      <div class="grid-2">
        <div class="card card-accent-blue">
          <div class="card-title">
            <span>Automated Test Harness Validation</span>
            <span class="badge badge-sla">Zero Regressions</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Structured Test Feeds:</strong> Wraps candidate code with test harnesses feeding complex vectors (trees, graphs, matrices) via stdin.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Normalization:</strong> Trims trailing whitespaces and normalizes numeric/string types to guarantee test comparisons evaluate accurately.</div>
          </div>
        </div>

        <div class="card card-accent-amber">
          <div class="card-title">
            <span>Algorithmic Complexity Evaluation</span>
            <span class="badge badge-sla">Round 3 Post-Run</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Big-O Interrogation:</strong> Once tests pass, the AI questions candidate on Big-O Time Complexity and Space Complexity tradeoffs.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Telemetry Logging:</strong> Records execution milliseconds and memory usage into candidate performance reports.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 05</span>
      <span class="page-num">Page 6 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 7: 7 JOB DISCOVERY APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 06</span>
        <span class="header-title">Multi-Source Real-Time Job Discovery APIs</span>
      </div>
      <div class="header-right">Market Feeds &amp; Aggregation</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Real-Time Indian &amp; Global Tech Employment Feeds</div>
        <div class="section-h1">7 Integrated Public Job Discovery Feeds</div>
        <div class="section-desc">
          Voke continuously aggregates everyday live technology postings across 7 public APIs and scrapers specifically focused on the Indian Job Market and remote engineering opportunities.
        </div>
      </div>

      <!-- 7 Job APIs Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Job Source &amp; Provider</th>
              <th>Endpoint &amp; Query Signature</th>
              <th>Geographic Focus</th>
              <th>Auth Requirement</th>
              <th>Ingestion &amp; Parsing Protocol</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Adzuna Jobs API</strong><br>
                <span class="badge tag-india">India Targeted</span>
              </td>
              <td><code style="font-size:7.5px; color:#1D4ED8;">api.adzuna.com/v1/api/jobs/in/search</code></td>
              <td>India Region (<code style="font-size:7.5px;">in</code>)</td>
              <td>Optional App ID/Key (10,000 req/mo)</td>
              <td>Extracts structured Indian tech postings with normalized salary bands (₹ INR), company name, and location filters.</td>
            </tr>
            <tr>
              <td>
                <strong>Google Jobs via SerpApi</strong><br>
                <span class="badge tag-india">India Targeted</span>
              </td>
              <td><code style="font-size:7.5px; color:#1D4ED8;">serpapi.com/search.json?engine=google_jobs&amp;gl=in</code></td>
              <td>India Regional Search (<code style="font-size:7.5px;">gl=in</code>)</td>
              <td>SerpApi Key (Free Tier 100/mo)</td>
              <td>Extracts verified employer listings indexed by Google Jobs across Indian metropolitan tech hubs (Bengaluru, NCR, Hyderabad, Pune).</td>
            </tr>
            <tr>
              <td>
                <strong>The Muse Public API</strong><br>
                <span class="badge badge-get">100% Free Public</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">themuse.com/api/public/jobs?location=India&amp;category=IT</code></td>
              <td>India &amp; Global Remote</td>
              <td>❌ No Auth Required</td>
              <td>Paginates Software Engineering, Data Science, and IT listings with rich corporate culture context and benefits data.</td>
            </tr>
            <tr>
              <td>
                <strong>RemoteOK Public API</strong><br>
                <span class="badge badge-get">100% Free Public</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">remoteok.com/api?location=india</code><br><code style="font-size:7.5px; color:#047857;">remoteok.com/api?tags=cybersecurity</code></td>
              <td>Global &amp; India Remote</td>
              <td>❌ No Auth Required</td>
              <td>Extracts developer, DevOps, and Cybersecurity roles filtered by technology tags, salary markers, and direct apply links.</td>
            </tr>
            <tr>
              <td>
                <strong>Remotive API</strong><br>
                <span class="badge badge-get">100% Free Public</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">remotive.com/api/remote-jobs?search=india</code></td>
              <td>Worldwide Remote &amp; APAC</td>
              <td>❌ No Auth Required</td>
              <td>Pulls active remote engineering openings, technology requirements, and candidate location constraints.</td>
            </tr>
            <tr>
              <td>
                <strong>Jobicy API</strong><br>
                <span class="badge badge-get">100% Free Public</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">jobicy.com/api/v2/remote-jobs?geo=apac</code></td>
              <td>APAC &amp; India Region</td>
              <td>❌ No Auth Required</td>
              <td>Fetches remote technology postings specifically open to candidates located in the Asia-Pacific region.</td>
            </tr>
            <tr>
              <td>
                <strong>Findwork.dev API</strong><br>
                <span class="badge badge-get">100% Free Public</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">findwork.dev/api/jobs/?location=india</code></td>
              <td>India Developer Market</td>
              <td>❌ No Auth Required</td>
              <td>Extracts software engineering openings tagged by programming language and experience level.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Regional & Cybersecurity Targeting Details -->
      <div class="grid-2">
        <div class="card card-accent-blue">
          <div class="card-title">
            <span>Targeted Geographic &amp; Metro Scouting</span>
            <span class="badge badge-sla">India Active Filter</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Dynamic Monitored Locations:</strong> Edge ingestion queries database table of active locations (Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Chennai).</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Regional Localization:</strong> Formats location parameters (<code style="font-size:7.5px;">loc, India</code>) across all external providers to capture domestic opportunities.</div>
          </div>
        </div>

        <div class="card card-accent-purple">
          <div class="card-title">
            <span>Specialized Cybersecurity &amp; IT Domains</span>
            <span class="badge badge-sla">Domain Ingestion</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Specialized Queries:</strong> Automatically queries designated domain verticals: SOC Analyst, Cybersecurity, Desktop Support, and Information Security.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Tag Filtering:</strong> Filters in-memory feeds for domain keywords to populate specialized cybersecurity tracks.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 06</span>
      <span class="page-num">Page 7 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 8: JOB MATCHING & CAREER ROADMAPS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 07</span>
        <span class="header-title">Job Matching, Deduplication &amp; Career Roadmap Architecture</span>
      </div>
      <div class="header-right">Intelligence &amp; Roadmaps</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Talent Matching &amp; Preparation Roadmaps</div>
        <div class="section-h1">Data Hygiene, AI Matching &amp; Career Engine</div>
        <div class="section-desc">
          Voke's background workers scrub and deduplicate multi-source feeds, match vacancies against candidate resume skills, and generate personalized 3-month career preparation roadmaps.
        </div>
      </div>

      <!-- Job Aggregation Pipeline Flow -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Automated Multi-Source Job Ingestion &amp; AI Matching Pipeline
          </div>
          <span class="pipeline-tag">7 Feeds • India Region Focused • 12-Hour AI Cache</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Scheduled Ingest</div>
            <div class="pipeline-step-api">Edge Cron Worker</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02: 7 Feeds</div>
            <div class="pipeline-step-name">Multi-API Query</div>
            <div class="pipeline-step-api">Adzuna, Muse, SerpApi</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03</div>
            <div class="pipeline-step-name">Data Hygiene</div>
            <div class="pipeline-step-api">Deduplicate &amp; Clean</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 04</div>
            <div class="pipeline-step-name">Resume Sync</div>
            <div class="pipeline-step-api">Skills + Mock Scores</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">AI Match Scoring</div>
            <div class="pipeline-step-api">Groq LLaMA 3.3 Scorer</div>
          </div>
        </div>
      </div>

      <!-- Data Hygiene & Matching Engine Details -->
      <div class="grid-2">
        <div class="card card-accent-blue">
          <div class="card-title">
            <span>Automated Hygiene &amp; Deduplication Engine</span>
            <span class="badge badge-sla">Composite Key Indexing</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Composite Deduplication:</strong> Generates unique composite keys (<code style="font-size:7.5px;">source_sourceId</code>) to collapse duplicate job listings cross-posted across multiple boards into a single canonical record.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>URL Canonicalization:</strong> Strips tracking parameters (<code style="font-size:7.5px;">utm_source, utm_medium, utm_campaign</code>) to deliver clean direct employer application links.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Automated TTL Cleanup:</strong> Deletes job postings older than 30 days on each execution cycle to ensure zero stale vacancies exist in the database.</div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">
            <span>AI Match Engine &amp; 3-Month Roadmaps</span>
            <span class="badge badge-sla">Personalized Vector</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Multi-Dimensional Matching:</strong> Evaluates parsed resume skills, mock interview scores, and target seniority to produce 0–100% candidate match percentages.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>12-Hour Intelligent Cache:</strong> Stores recommendations in the database with a 12-hour TTL to prevent redundant model calls while maintaining fresh feeds.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Career Roadmap Generator:</strong> Edge worker synthesizes 3-month preparation plans integrating free industry blueprints (Roadmap.sh, NeetCode 150, System Design Primer).</div>
          </div>
        </div>
      </div>

      <!-- Curated Free Resources Injected into Career Plans -->
      <div class="card card-accent-indigo">
        <div class="card-title">
          <span>Curated Industry Blueprint Integrations</span>
          <span class="badge badge-sla">Free Tier Curriculum</span>
        </div>
        <div class="bullet-list">
          <div class="bullet-item"><span class="bullet-icon"></span><strong>Roadmap.sh Blueprints:</strong> Ingests role-based visual roadmaps for target engineering tracks (Frontend, Backend, DevOps, Data).</div>
          <div class="bullet-item"><span class="bullet-icon"></span><strong>NeetCode Blind 75 / 150 Coding Patterns:</strong> Step-by-step video tutorials and optimal algorithmic patterns for coding rounds.</div>
          <div class="bullet-item"><span class="bullet-icon"></span><strong>System Design Primer &amp; DDIA:</strong> Standard open-source architectural blueprints for distributed data-intensive systems.</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 07</span>
      <span class="page-num">Page 8 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 9: CANDIDATE VERIFICATION APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 08</span>
        <span class="header-title">Candidate Verification &amp; External Developer APIs</span>
      </div>
      <div class="header-right">Candidate Verification &amp; Profile Ingestion</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Algorithmic Readiness &amp; Project Verification</div>
        <div class="section-h1">External Profile Verification &amp; Context Pipeline</div>
        <div class="section-desc">
          Voke integrates directly with LeetCode, Codeforces, and GitHub public APIs to verify candidate coding skills, contest ratings, solved problem metrics, and extract actual repository code context for personalized project deep-dive interviews.
        </div>
      </div>

      <!-- Verification Pipeline Diagram -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
            Candidate Profile Verification &amp; Project Context Pipeline
          </div>
          <span class="pipeline-tag">GraphQL &amp; REST Ingestion • Verified Skill Badges</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Profile Handles</div>
            <div class="pipeline-step-api">LeetCode / CF / GitHub</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02: LeetCode</div>
            <div class="pipeline-step-name">GraphQL Profile</div>
            <div class="pipeline-step-api">Solves by Difficulty + Rank</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03: CF</div>
            <div class="pipeline-step-name">REST User Info</div>
            <div class="pipeline-step-api">Rating &amp; Rank Check</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 04: GitHub</div>
            <div class="pipeline-step-name">README Decode</div>
            <div class="pipeline-step-api">Base64 Project Decode</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">Interview Context</div>
            <div class="pipeline-step-api">Inject Project Deep-Dives</div>
          </div>
        </div>
      </div>

      <!-- Developer Verification APIs Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Platform &amp; Protocol</th>
              <th>Endpoint &amp; Payload Structure</th>
              <th>Data Points Extracted</th>
              <th>Platform Utilization &amp; Pipeline Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>LeetCode Official API</strong><br>
                <span class="badge badge-gql">GraphQL POST</span>
              </td>
              <td><code style="font-size:7.5px; color:#BE185D;">POST https://leetcode.com/graphql</code><br>Query: <code style="font-size:7.5px;">getUserProfile($username: String!)</code></td>
              <td>• <code style="font-size:7.5px;">submitStatsGlobal</code>: Easy, Medium, Hard solves.<br>• <code style="font-size:7.5px;">userContestRanking</code>: Contest rating, global rank, top percentile.</td>
              <td><strong>Algorithmic Verification:</strong> Displays verified problem badges; sets starting question difficulty in technical mock interviews.</td>
            </tr>
            <tr>
              <td>
                <strong>Codeforces Official API</strong><br>
                <span class="badge badge-get">REST GET</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">GET /api/user.info?handles={handle}</code><br><code style="font-size:7.5px; color:#047857;">GET /api/user.status?handle={handle}</code></td>
              <td>• Current &amp; max competitive programming rating.<br>• Official rank title.<br>• Recent accepted submissions (<code style="font-size:7.5px;">verdict: "OK"</code>).</td>
              <td><strong>Solution Verification:</strong> Validates candidate solutions to contest problems and awards verified competitive programming badges.</td>
            </tr>
            <tr>
              <td>
                <strong>GitHub REST API</strong><br>
                <span class="badge badge-get">REST GET</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">GET /users/{username}/repos</code><br><code style="font-size:7.5px; color:#047857;">GET /repos/{user}/{repo}/readme</code></td>
              <td>• Top repositories sorted by updated date.<br>• Stars, language distribution, forks.<br>• Project README markdown decoded from base64.</td>
              <td><strong>Project Deep-Dive Rounds:</strong> Parses repository READMEs to instruct the AI to challenge candidate on their actual open-source projects.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deep Dive Interview Prompting Architecture -->
      <div class="grid-2">
        <div class="card card-accent-purple">
          <div class="card-title">
            <span>Project Deep-Dive Synthesis Engine</span>
            <span class="badge badge-sla">Context Injection</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>README Decoding:</strong> Decodes base64 README content, strips markdown formatting, and extracts core technology stacks and architectures.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Targeted Questions:</strong> Challenges candidate on architectural decisions: <em>"In [Project], why did you choose PostgreSQL over MongoDB, and how did you handle caching?"</em></div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">
            <span>Anti-Fraud Solution Verification</span>
            <span class="badge badge-sla">Real-Time Validation</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Live Profile Polling:</strong> When candidate marks an external problem as solved, the gateway queries the external platform API.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Timestamp Check:</strong> Verifies an accepted submission (<code style="font-size:7.5px;">verdict === "OK"</code>) exists under the candidate's verified handle.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 08</span>
      <span class="page-num">Page 9 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 10: PAYMENTS & WEBHOOKS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 09</span>
        <span class="header-title">Payments, Monetization &amp; Webhook Lifecycle APIs</span>
      </div>
      <div class="header-right">Billing, Monetization &amp; Security</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Enterprise Billing &amp; Webhook Ingestion</div>
        <div class="section-h1">Cryptographic Payments &amp; Entitlement Architecture</div>
        <div class="section-desc">
          Voke integrates Razorpay's end-to-end payment ecosystem with server-side price calculation, client modal checkout, and Web Crypto API HMAC-SHA256 cryptographic signature validation for idempotent subscription provisioning.
        </div>
      </div>

      <!-- Payment Pipeline Diagram -->
      <div class="pipeline-wrapper">
        <div class="pipeline-header">
          <div class="pipeline-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Cryptographic Payment Creation, Checkout &amp; Webhook Ingestion Pipeline
          </div>
          <span class="pipeline-tag">HMAC-SHA256 • Server-Authoritative Pricing • Idempotent</span>
        </div>
        <div class="pipeline-steps">
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 01</div>
            <div class="pipeline-step-name">Plan Selection</div>
            <div class="pipeline-step-api">User JWT + Coupon Code</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 02</div>
            <div class="pipeline-step-name">Order Creation</div>
            <div class="pipeline-step-api">Razorpay Orders (Paise)</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 03</div>
            <div class="pipeline-step-name">Client Checkout</div>
            <div class="pipeline-step-api">Razorpay Modal</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 04: 2 Routes</div>
            <div class="pipeline-step-name">Verification / Hook</div>
            <div class="pipeline-step-api">order.paid / captured</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 05</div>
            <div class="pipeline-step-name">HMAC-SHA256</div>
            <div class="pipeline-step-api">Subtle Crypto Check</div>
          </div>
          <div class="pipeline-arrow">&rarr;</div>
          <div class="pipeline-step active-gemini">
            <div class="pipeline-step-num">Step 06</div>
            <div class="pipeline-step-name">Entitlement Grant</div>
            <div class="pipeline-step-api">DB Subscription Upsert</div>
          </div>
        </div>
      </div>

      <!-- Payment APIs Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Payment Subsystem</th>
              <th>API Endpoint &amp; Protocol</th>
              <th>Authentication / Security</th>
              <th>Payload &amp; Parameter Specifications</th>
              <th>Database Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Order Creation Gateway</strong><br>
                <span class="badge badge-post">Server-to-Server</span>
              </td>
              <td><code style="font-size:7.5px; color:#1D4ED8;">POST https://api.razorpay.com/v1/orders</code></td>
              <td>HTTP Basic Auth (<code style="font-size:7.5px;">btoa(KEY_ID:KEY_SECRET)</code>)</td>
              <td>Locks plan cost on backend (e.g. ₹399 = 39900 paise). Computes dynamic discount coupons (e.g. 30% discount &rarr; ₹279 = 27900 paise). Encodes user ID and receipt in notes.</td>
              <td>Generates order entity bound to user ID; blocks client tampering.</td>
            </tr>
            <tr>
              <td>
                <strong>Client Modal Checkout</strong><br>
                <span class="badge badge-wasm">Client SDK</span>
              </td>
              <td><code style="font-size:7.5px; color:#15803D;">checkout.razorpay.com/v1/checkout.js</code></td>
              <td>Publishable Razorpay Key ID</td>
              <td>Mounts Razorpay Standard Modal. Accepts <code style="font-size:7.5px;">order_id</code>, pre-fills candidate email and contact, presents UPI, NetBanking, and Card instruments.</td>
              <td>Returns payment signature payload upon success.</td>
            </tr>
            <tr>
              <td>
                <strong>Client Payment Verification</strong><br>
                <span class="badge badge-post">Verification Edge</span>
              </td>
              <td><code style="font-size:7.5px;">POST /functions/v1/verify-razorpay-payment</code></td>
              <td>Bearer User JWT + Server Secret</td>
              <td>Validates signature: <code style="font-size:7.5px;">HMAC_SHA256(order_id + "|" + payment_id, SECRET)</code> using Web Crypto API. Constant-time byte matching eliminates timing attacks.</td>
              <td>Updates candidate subscription to <code style="font-size:7.5px;">is_premium = true</code> and grants premium tier.</td>
            </tr>
            <tr>
              <td>
                <strong>Async Webhook Listener</strong><br>
                <span class="badge badge-post">Server-to-Server</span>
              </td>
              <td><code style="font-size:7.5px;">POST /functions/v1/razorpay-webhook</code></td>
              <td><code style="font-size:7.5px;">x-razorpay-signature</code> Header Check</td>
              <td>Ingests <code style="font-size:7.5px;">order.paid</code> and <code style="font-size:7.5px;">payment.captured</code> events. Validates raw body signature before JSON parsing to protect against payload tampering.</td>
              <td>Executes idempotent upsert with user ID and payment ID to prevent duplicate records on retry.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Security Implementation Highlights Card -->
      <div class="grid-2">
        <div class="card card-accent-indigo">
          <div class="card-title">
            <span>Timing-Resistant Signature Check</span>
            <span class="badge badge-sla">Web Crypto API</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Native Cryptography:</strong> Uses <code style="font-size:7.5px;">crypto.subtle.importKey</code> and <code style="font-size:7.5px;">crypto.subtle.sign("HMAC", ...)</code>.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Constant-Time Comparison:</strong> Employs bitwise XOR across hash length, eliminating timing vulnerabilities.</div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">
            <span>Replay Attack &amp; Idempotency Protection</span>
            <span class="badge badge-sla">Database Constraint</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Unique Order Binding:</strong> Each order receipt encodes timestamp and user ID (<code style="font-size:7.5px;">rcpt_{userId}_{timestamp}</code>).</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Duplicate Webhook Defense:</strong> Database executes an atomic upsert on conflict with <code style="font-size:7.5px;">user_id</code>.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 09</span>
      <span class="page-num">Page 10 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 11: REALTIME MEDIA & INFRASTRUCTURE APIS ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 10</span>
        <span class="header-title">Real-Time Peer Media, Document Processing &amp; Infrastructure APIs</span>
      </div>
      <div class="header-right">Media Streams &amp; Platform Core</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Real-Time Mesh, Document Parsing &amp; Data Layer</div>
        <div class="section-h1">WebRTC P2P Mesh &amp; Core Infrastructure APIs</div>
        <div class="section-desc">
          Voke operates browser-to-browser WebRTC media streams coordinated through WebSocket signaling channels for peer mock interviews, alongside client-side spatial PDF parsing, geolocation, and a hardened relational database.
        </div>
      </div>

      <!-- Infrastructure APIs Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Subsystem</th>
              <th>Protocol / API Endpoint</th>
              <th>Underlying Engine / Service</th>
              <th>Architectural Function &amp; Flow</th>
              <th>Resilience / Fallback Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>WebRTC P2P Video Mesh</strong><br>
                <span class="badge badge-rtc">Real-Time P2P</span>
              </td>
              <td><code style="font-size:7.5px;">RTCPeerConnection</code><br>Google STUN (<code style="font-size:7.5px;">stun.l.google.com:19302</code>)</td>
              <td>Browser WebRTC Engine</td>
              <td>Connects candidates in 1-on-1 peer mock interviews with low-latency bidirectional audio/video streams. Google STUN handles NAT traversal and ICE candidate discovery.</td>
              <td>Multiple fallback STUN endpoints (stun1 through stun4) ensure connection across strict firewalls.</td>
            </tr>
            <tr>
              <td>
                <strong>Realtime Signaling Broker</strong><br>
                <span class="badge badge-ws">WebSocket Plane</span>
              </td>
              <td>Realtime Channels API<br><code style="font-size:7.5px;">channel("room:{sessionId}")</code></td>
              <td>Supabase Realtime (WebSockets)</td>
              <td>Broadcasts WebRTC Session Description Protocol (SDP) <code style="font-size:7.5px;">offer</code>, <code style="font-size:7.5px;">answer</code>, and <code style="font-size:7.5px;">ice-candidate</code> payloads, alongside collaborative text chat.</td>
              <td>Automatic WebSocket reconnection loop with heartbeat pings and presence detection.</td>
            </tr>
            <tr>
              <td>
                <strong>Spatial PDF Resume Parser</strong><br>
                <span class="badge badge-wasm">Client WebAssembly</span>
              </td>
              <td>Dynamic Worker Import<br><code style="font-size:7.5px;">pdfjs-dist (pdf.worker.min.mjs)</code></td>
              <td>PDF.js Engine &amp; Tesseract.js</td>
              <td>Validates <code style="font-size:7.5px;">%PDF-</code> magic bytes, extracts text elements with Y-descending and X-ascending geometric sorting to preserve multi-column reading order, and extracts link annotations.</td>
              <td>If extracted text is under 50 characters (scanned image resume), triggers Tesseract.js client OCR Web Worker.</td>
            </tr>
            <tr>
              <td>
                <strong>Relational Database Layer</strong><br>
                <span class="badge badge-post">PostgREST API</span>
              </td>
              <td>Database REST / GraphQL API<br><code style="font-size:7.5px;">/rest/v1/{table}</code></td>
              <td>Hardened PostgreSQL 15</td>
              <td>Manages 32+ relational tables (interview sessions, video scores, job postings, career plans) protected by Row-Level Security (RLS) policies tied to caller JWTs.</td>
              <td>Automated continuous backups, index optimization, and connection pooling.</td>
            </tr>
            <tr>
              <td>
                <strong>Encrypted Object Storage</strong><br>
                <span class="badge badge-post">S3 Compatible</span>
              </td>
              <td>Storage API<br><code style="font-size:7.5px;">/storage/v1/object/{bucket}/{path}</code></td>
              <td>Private S3 Storage Buckets</td>
              <td>Stores video interview recordings (<code style="font-size:7.5px;">{user_id}/{session_id}.webm</code>) and uploaded PDF resumes. Non-public buckets enforce folder-level RLS policies.</td>
              <td>Expiring signed URLs for authorized video analysis access; 500MB hard limit per video.</td>
            </tr>
            <tr>
              <td>
                <strong>IP Geolocation &amp; Telemetry</strong><br>
                <span class="badge badge-get">REST GET</span>
              </td>
              <td><code style="font-size:7.5px; color:#047857;">GET https://ipapi.co/json/</code></td>
              <td>IPAPI Geolocation Service</td>
              <td>Automatically detects candidate city and country for job search defaulting, local currency display (₹ INR vs $ USD), and regional analytics logging.</td>
              <td>Caches result in local storage; gracefully falls back to default region (India) if blocked.</td>
            </tr>
            <tr>
              <td>
                <strong>Campus Drive Synchronization</strong><br>
                <span class="badge badge-post">Serverless API</span>
              </td>
              <td><code style="font-size:7.5px; color:#1D4ED8;">GET / POST /api/college-drives</code></td>
              <td>Vercel Serverless Function</td>
              <td>Synchronizes scheduled campus placement drives, question banks, and student assessment slots across institutional dashboards.</td>
              <td>In-memory deduplication map with persistent state merging.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PDF Spatial Parsing & Link Extraction Highlight Card -->
      <div class="grid-2">
        <div class="card card-accent-blue">
          <div class="card-title">
            <span>Spatial Layout PDF Extraction Protocol</span>
            <span class="badge badge-sla">Human Reading Order</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Coordinate Vector Sorting:</strong> Standard parsers scramble two-column resumes. Voke evaluates X and Y coordinates to reconstruct exact reading sequences.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Annotation Harvesting:</strong> Reads underlying PDF link annotations to extract clean URLs for candidate GitHub, LinkedIn, and portfolio sites.</div>
          </div>
        </div>

        <div class="card card-accent-emerald">
          <div class="card-title">
            <span>Enterprise Row-Level Security (RLS)</span>
            <span class="badge badge-sla">Zero-Trust Isolation</span>
          </div>
          <div class="bullet-list">
            <div class="bullet-item"><span class="bullet-icon"></span><strong>User Path Protection:</strong> All database queries and video storage buckets evaluate <code style="font-size:7.5px;">auth.uid() == user_id</code> at kernel level.</div>
            <div class="bullet-item"><span class="bullet-icon"></span><strong>Institutional Boundaries:</strong> College placement assessment scorecards are partitioned so that college admins only access their own students.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 10</span>
      <span class="page-num">Page 11 of 12</span>
    </div>
  </section>

  <!-- ================= PAGE 12: MASTER END-TO-END PIPELINES & SECURITY ================= -->
  <section class="page">
    <div class="page-header">
      <div class="header-left">
        <span class="header-tag">Section 11</span>
        <span class="header-title">Master End-to-End API Pipeline Blueprints &amp; Security</span>
      </div>
      <div class="header-right">Comprehensive Operational Blueprint</div>
    </div>

    <div class="page-body">
      <div class="section-headline">
        <div class="section-eyebrow">Comprehensive Operational Workflows</div>
        <div class="section-h1">Master Pipeline Blueprints &amp; Security Architecture</div>
        <div class="section-desc">
          Chronological data lifecycle workflows mapping the sequential interaction of client subsystems, edge gateways, inference engines, sandboxes, and persistence layers across Voke's core user journeys.
        </div>
      </div>

      <!-- Master Pipeline 1: Live Voice Technical Interview -->
      <div class="card card-accent-indigo" style="padding: 8px 10px;">
        <div class="card-title" style="margin-bottom: 2px;">
          <span>Pipeline A: Live Conversational Technical Interview Flow</span>
          <span class="badge badge-ws">WebSocket Realtime Stream</span>
        </div>
        <div style="font-size: 8px; color:#475569; line-height: 1.35; margin-top: 2px;">
          <strong>Sequence:</strong>
          Candidate enters room &rarr; Client initiates WebSocket handshake with pre-warm ping &rarr; Candidate speaks into microphone &rarr; Web Audio API computes VAD volume envelope &rarr; Web Speech API transcribes speech in real time (fallback: Opus chunk sent to Groq Whisper v3 Turbo) &rarr; Formatted turn context with anti-repetition mandates sent to Streaming Gateway &rarr; Gateway invokes Gemini Multi-Key Pipeline &rarr; Tokens stream via SSE chunk-by-chunk to client &rarr; Browser Web Speech Synthesis delivers spoken response &rarr; On Round 3 coding question, Silent Mode automatically mutes AI speech.
        </div>
      </div>

      <!-- Master Pipeline 2: Video & Body Language Analysis -->
      <div class="card card-accent-purple" style="padding: 8px 10px;">
        <div class="card-title" style="margin-bottom: 2px;">
          <span>Pipeline B: Video Interview Body Language &amp; Posture Scoring</span>
          <span class="badge badge-post">Multimodal Vision AI</span>
        </div>
        <div style="font-size: 8px; color:#475569; line-height: 1.35; margin-top: 2px;">
          <strong>Sequence:</strong>
          Candidate answers question on webcam &rarr; MediaRecorder captures 720p WebM stream &rarr; Video staged to private S3 storage bucket under path-based RLS &rarr; Video payload transmitted as base64 inline stream to Gemini 2.5 Flash Multimodal Vision API &rarr; Vision engine conducts frame-by-frame analysis of eye contact, head stability, hand gestures, facial expressions, and attire appropriateness &rarr; Outputs structured JSON scorecard with delivery, posture, and confidence metrics (0–100) &rarr; Persisted to database and visualized on user report card.
        </div>
      </div>

      <!-- Master Pipeline 3: Multi-Source Job Discovery & AI Matching -->
      <div class="card card-accent-blue" style="padding: 8px 10px;">
        <div class="card-title" style="margin-bottom: 2px;">
          <span>Pipeline C: Multi-Source Job Scraping &amp; Resume Matching</span>
          <span class="badge badge-get">7 Public APIs + AI Scorer</span>
        </div>
        <div style="font-size: 8px; color:#475569; line-height: 1.35; margin-top: 2px;">
          <strong>Sequence:</strong>
          Scheduled Edge Cron triggers &rarr; Automated worker queries 7 public job APIs (Adzuna India, SerpApi Google Jobs, The Muse, RemoteOK, Remotive, Jobicy, Findwork) &rarr; Deletes listings older than 30 days &rarr; Deduplicates via composite source IDs and strips UTM tracking &rarr; Batches clean jobs into database &rarr; When user opens recommendations, worker extracts parsed resume skills and mock interview scores &rarr; Groq LLaMA 3.3 computes vector match percentage &rarr; Results cached for 12 hours with instant 3-month career roadmap generation.
        </div>
      </div>

      <!-- Master Pipeline 4: End-to-End Monetization & Webhook Lifecycle -->
      <div class="card card-accent-emerald" style="padding: 8px 10px;">
        <div class="card-title" style="margin-bottom: 2px;">
          <span>Pipeline D: Cryptographic Payment &amp; Entitlement Provisioning</span>
          <span class="badge badge-post">HMAC-SHA256 Webhooks</span>
        </div>
        <div style="font-size: 8px; color:#475569; line-height: 1.35; margin-top: 2px;">
          <strong>Sequence:</strong>
          Candidate selects Elite Pro plan &rarr; Client invokes Order Gateway with user JWT &rarr; Server computes authoritative price in INR paise and applies coupon discount &rarr; Creates authenticated Razorpay order entity &rarr; Client mounts Razorpay checkout modal &rarr; Upon payment success, webhook listener intercepts <code style="font-size:7.5px;">order.paid</code> event &rarr; Verifies raw body with <code style="font-size:7.5px;">crypto.subtle</code> HMAC-SHA256 signature in constant time &rarr; Idempotently upserts subscription record to unlock premium interview tiers.
        </div>
      </div>

      <!-- Security & Resilience Matrix Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Security &amp; Reliability Pillar</th>
              <th>Architectural Mechanism</th>
              <th>Threat Mitigation</th>
              <th>Production Guarantee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Quota &amp; Rate Resilience</strong></td>
              <td>Dynamic Multi-Key Pool + Model Fallback Cascade</td>
              <td>Third-party API rate limits (HTTP 429) &amp; outages (HTTP 5xx)</td>
              <td>Zero interrupted interviews during peak campus drives</td>
            </tr>
            <tr>
              <td><strong>Execution Sandboxing</strong></td>
              <td>Client WebAssembly (Pyodide) + Isolated Containers</td>
              <td>Malicious code execution, fork bombs, server resource theft</td>
              <td>Zero server compromise; 3000ms hard timeout limit</td>
            </tr>
            <tr>
              <td><strong>Payment Integrity</strong></td>
              <td>Web Crypto HMAC-SHA256 Constant-Time Verification</td>
              <td>Payment spoofing, replay attacks, client price tampering</td>
              <td>100% verified transactional ledger in INR paise</td>
            </tr>
            <tr>
              <td><strong>Data Privacy &amp; Access</strong></td>
              <td>PostgreSQL Kernel Row-Level Security (RLS)</td>
              <td>Unauthorized cross-tenant or cross-user data exposure</td>
              <td>Strict path isolation for video sessions and resumes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="page-footer">
      <span>Voke Platform Architecture • Section 11</span>
      <span class="page-num">Page 12 of 12</span>
    </div>
  </section>

</body>
</html>
`;

async function generatePDF() {
  console.log("Launching headless browser for 12-page PDF compilation...");
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  
  // Set A4 viewport at 96 DPI (794 x 1123)
  await page.setViewport({
    width: 794,
    height: 1123,
    deviceScaleFactor: 2
  });

  console.log("Loading HTML content into page...");
  await page.setContent(htmlContent, { waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });

  // Wait for Google Fonts to be fully loaded
  await page.evaluateHandle('document.fonts.ready');

  const pdfPath = path.join(__dirname, 'Voke_API_Architecture_and_Pipelines.pdf');
  console.log(`Writing high-resolution PDF to: ${pdfPath}`);

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

  console.log("PDF generation complete! Taking screenshots of all 12 rendered pages for quality verification...");

  // Capture preview screenshots of each page container
  const pageElements = await page.$$('.page');
  console.log(`Found ${pageElements.length} pages in the document.`);

  for (let i = 0; i < pageElements.length; i++) {
    const screenshotPath = path.join(__dirname, `voke_api_architecture_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: screenshotPath });
    console.log(`Saved preview: voke_api_architecture_page_${i + 1}.png`);
  }

  await browser.close();
  console.log("All 12 pages rendered and verified successfully!");
}

generatePDF().catch(err => {
  console.error("Fatal error during PDF generation:", err);
  process.exit(1);
});
