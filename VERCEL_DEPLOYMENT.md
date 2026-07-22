# Vercel Deployment Guide

Your app is showing a white screen on Vercel because the environment variables are missing. Follow these steps to fix it:

## Step 1: Add Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **Voke** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables (one by one):

### Required Variables:

| Variable Name | Description | Where to get it |
|--------------|-------------|-----------------|
| `VITE_GROQ_API_KEY` | Your Groq API key for voice transcription | Get from https://console.groq.com/keys |
| `VITE_GITHUB_TOKEN` | GitHub Personal Access Token | Get from https://github.com/settings/tokens |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI responses | Get from https://makersuite.google.com/app/apikey |
| `VITE_HUGGING_FACE_TOKEN` | Hugging Face token (optional) | Get from https://huggingface.co/settings/tokens |

**Note:** Use the same values from your local `.env` file.

**Important:** Make sure to select **All Environments** (Production, Preview, Development) when adding each variable.

## Step 2: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the **⋯** (three dots) menu
4. Select **Redeploy**
5. Check **Use existing Build Cache** (optional)
6. Click **Redeploy**

## Step 3: Verify

Once redeployed:
1. Open your Vercel URL
2. Open browser console (F12)
3. Check for any errors
4. Try logging in and using the voice interviewer

## Troubleshooting

### Still seeing white screen?
1. Check browser console for errors
2. Verify all environment variables are set correctly
3. Make sure Supabase is configured (it's hardcoded in the app, so should work)

### Voice Interview not working?
- The local TTS server (`npm run tts`) won't work on Vercel (it's for local development only)
- The app will automatically fall back to browser's built-in speech synthesis
- GitHub and Resume scanning should work fine

### Build errors?
- Check the build logs in Vercel
- Make sure all dependencies are in `package.json`
- Verify `pdfjs-dist` is installed

## Notes

- The `.env` file is not pushed to GitHub (it's in `.gitignore`)
- You must set environment variables in Vercel's dashboard
- Local TTS server is for development only; production uses browser TTS
