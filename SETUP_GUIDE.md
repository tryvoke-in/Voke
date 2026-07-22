# Quick Setup Guide - Job Recommendations System

Since Supabase CLI isn't installed, follow these simple steps to set up the job recommendation system:

## Step 1: Apply Database Migration

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the ENTIRE contents of this file: `supabase/migrations/20251203080000_add_job_recommendations.sql`
6. Paste into the SQL Editor
7. Click **"Run"** (or press Cmd/Ctrl + Enter)
8. You should see "Success. No rows returned"

## Step 2: Add Sample Job Data

1. In the same SQL Editor, click **"New Query"** again
2. Copy the ENTIRE contents of this file: `supabase/migrations/20251203080001_seed_job_postings.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. You should see "Success. 25 rows affected" (25 job postings added)

## Step 3: Deploy Edge Functions

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **"Edge Functions"** in the left sidebar
2. Click **"Deploy a new function"**

**For generate-job-recommendations:**
- Name: `generate-job-recommendations`
- Copy code from: `supabase/functions/generate-job-recommendations/index.ts`
- Paste and deploy

**For create-career-plan:**
- Name: `create-career-plan`
- Copy code from: `supabase/functions/create-career-plan/index.ts`
- Paste and deploy

### Option B: Using npx (Alternative)

If you prefer command line:
```bash
npx supabase functions deploy generate-job-recommendations --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-career-plan --project-ref YOUR_PROJECT_REF
```

## Step 4: Add API Keys

1. In Supabase Dashboard, go to **"Project Settings"** → **"Edge Functions"**
2. Scroll to **"Function Secrets"**
3. Add the following secrets:

**Groq API Key** (for AI matching):
- Name: `GROQ_API_KEY`
- Value: `YOUR_GROQ_API_KEY_HERE` (Get from https://console.groq.com)

**Job Search API Key** (for real jobs):
- Name: `JOB_SEARCH_API_KEY`
- Value: `YOUR_JOB_API_KEY_HERE` (Get from https://www.themuse.com/developers/api/v2)

4. Click **"Save"** for each

## Step 5: Test the Feature

1. Run your app: `npm run dev`
2. Log in to your account
3. Complete 2-3 interview sessions (any type)
4. Navigate to: `http://localhost:5173/job-recommendations`
5. Click **"Generate Recommendations"**
6. Wait for AI to analyze and match jobs
7. Click **"Create Career Plan"** on any job
8. View your personalized 3-month plan!

## Troubleshooting

**If migrations fail:**
- Make sure you're running them in the correct order
- Check that your Supabase project is active
- Try running each CREATE TABLE statement separately

**If Edge Functions don't work:**
- Verify GROQ_API_KEY is set correctly
- Check function logs in Supabase Dashboard → Edge Functions → Logs
- Make sure functions are deployed and enabled

**If TypeScript errors appear:**
- These will auto-resolve once migrations are applied
- The database types will be regenerated automatically

## What You Get

✅ **25 realistic job postings** across tech roles
✅ **AI-powered job matching** based on interview performance  
✅ **3-month career plans** with weekly tasks and resources  
✅ **Progress tracking** for career development  
✅ **100% FREE** using Groq API (no costs!)

---

Need help? Check the walkthrough.md for detailed documentation!
