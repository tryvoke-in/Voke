# Google Sign-In Configuration Guide

To make the Google Sign-In button work, you need to configure Google OAuth in both the Google Cloud Console and your Supabase Dashboard.

## Step 1: Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create a Project**: Select an existing project or create a new one.
3.  **OAuth Consent Screen**:
    -   Navigate to **APIs & Services > OAuth consent screen**.
    -   Select **External** (unless you are G-Suite only) and click **Create**.
    -   Fill in the required fields (App Name, User Support Email, Developer Contact Email).
    -   Click **Save and Continue**.
4.  **Create Credentials**:
    -   Navigate to **APIs & Services > Credentials**.
    -   Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    -   **Application type**: Select **Web application**.
    -   **Name**: Enter a name (e.g., "Voke Web App").
    -   **Authorized JavaScript origins**: Add your app's URL (e.g., `http://localhost:5173` for local dev).
    -   **Authorized redirect URIs**: You need the callback URL from Supabase (see Step 2).
    -   Click **Create**.
    -   **Copy the Client ID and Client Secret.**

## Step 2: Supabase Dashboard Setup

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Navigate to **Authentication > Providers**.
4.  Select **Google** from the list.
5.  **Enable Google**: Toggle "Enable Sign in with Google".
6.  **Paste Credentials**:
    -   Paste the **Client ID** from Google Cloud into "Client ID".
    -   Paste the **Client Secret** from Google Cloud into "Client Secret".
7.  **Copy Callback URL**:
    -   Copy the "Callback URL (for OAuth)" displayed in this section.
    -   **Go back to Google Cloud Console** (Credentials > Your Client ID) and paste this URL into **Authorized redirect URIs**.
8.  Click **Save** in Supabase.

## Verification
Once configured, restart your application if needed, and the "Sign in with Google" button should now redirect you to the Google login page and then back to your dashboard.
