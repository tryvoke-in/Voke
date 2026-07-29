# Free Multi-API & Resume-Based Job Module Integration (India Region Focus)

## Overview

Voke's Job Module has been upgraded to aggregate everyday live job postings from **100% free public APIs and open scrapers** specifically focused on the **Indian Job Market** and remote tech jobs. It matches these jobs directly with candidate **Resume Skills + Interview Performance**.

---

## 1. Integrated Free Job APIs (India Focused)

We integrated **7 free APIs** to pull jobs tailored to Indian talent. None of these require paid subscriptions:

| Source | API Endpoint / Details | Type | Key Required |
|---|---|---|---|
| **Adzuna (India)** | `api.adzuna.com/v1/api/jobs/in/search` (Specifically targeting `in` region) | Generous Free Tier | Optional (App ID/Key) |
| **Findwork.dev** | `findwork.dev/api/jobs/?location=india` (100% free, no auth) | Free Public API | ❌ None |
| **The Muse** | `themuse.com/api/public/jobs?location=India` | Free Public API | ❌ None |
| **Jobicy** | `jobicy.com/api/v2/remote-jobs?geo=apac` (APAC/India jobs) | Free Public API | ❌ None |
| **Remotive** | `remotive.com/api/remote-jobs?search=india` | Free Public API | ❌ None |
| **RemoteOK** | `remoteok.com/api?location=india` | Free Public API | ❌ None |
| **Google Jobs (SerpApi)** | `serpapi.com/search.json?engine=google_jobs&gl=in` (gl=in sets India location) | Free Tier (100/mo) | ⚡ `SERPAPI_KEY` |

---

## 2. How to setup SerpApi (Google Jobs) and Adzuna (Optional for higher limits)

The system works perfectly without any API keys using Findwork, The Muse, Jobicy, Remotive, and RemoteOK. However, to get even more Google Jobs and Adzuna results, you can use their free tiers:

### Getting a SerpApi Key (Google Jobs):
1. Go to [serpapi.com](https://serpapi.com/) and create a free account.
2. You get 100 free searches every month.
3. Copy your API Key from the dashboard.
4. Add it to Supabase Edge Function Secrets:
   ```bash
   supabase secrets set SERPAPI_KEY="your_serpapi_key_here"
   ```

### Getting Adzuna Keys (10,000 requests/month):
1. Go to [developer.adzuna.com](https://developer.adzuna.com/) and create a free account.
2. Create an App to get an **App ID** and **App Key**.
3. Add them to Supabase Secrets:
   ```bash
   supabase secrets set ADZUNA_APP_ID="your_adzuna_app_id"
   supabase secrets set ADZUNA_APP_KEY="your_adzuna_app_key"
   ```

---

## 3. Resume-Based AI Matching Engine

The AI scout analyzes candidate data across 3 dimensions:
1. **Resume Analysis**: Skills parsed from user uploaded resume/profile (`resume_analyses` + `profiles.resume_url`).
2. **Interview Signals**: Scores from text, voice, and video practice interviews.
3. **Everyday Freshness**: Filters & tags jobs by posting date (`posted_date`) so users get real-time everyday jobs.

---

## 4. UI Features (`JobRecommendations.tsx`)
- **Source Filter**: Filter by Job Provider (*Findwork, Adzuna, RemoteOK, Jobicy, Arbeitnow, Remotive, Google Jobs, The Muse*).
- **Resume Sync Badge**: Visual status showing when a user's resume is synced for job matching.
- **Live Job Cards**: Displays source badges, salary ranges in ₹ or $, required skills, remote status, direct apply buttons, and career path generator.
