<#
.SYNOPSIS
  Deploy all pending Supabase Edge Functions for the Voke security fixes (SEC-01 through SEC-04).

.HOW TO RUN
  1. Get your Supabase Access Token from:
     https://supabase.com/dashboard/account/tokens
  2. Open PowerShell in the project root (c:\My_Project\voke\Voke)
  3. Run:
       .\deploy-functions.ps1 -Token "sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

  To deploy a single function only:
       .\deploy-functions.ps1 -Token "sbp_xxx" -Only "groq-ai-proxy"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,

    [Parameter(Mandatory=$false)]
    [string]$Only = ""
)

$PROJECT_REF = "qjzcyvoavqzcifjqeont"

# All functions that need to be deployed (order matters — groq-ai-proxy first)
$FUNCTIONS = @(
    "groq-ai-proxy",
    "verify-razorpay-payment",
    "create-razorpay-order",
    "adaptive-interview-chat",
    "generate-job-recommendations",
    "create-career-plan"
)

# Filter to a single function if -Only was specified
if ($Only -ne "") {
    if ($FUNCTIONS -contains $Only) {
        $FUNCTIONS = @($Only)
    } else {
        Write-Host "ERROR: Unknown function '$Only'. Valid options: $($FUNCTIONS -join ', ')" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Voke Edge Function Deployer" -ForegroundColor Cyan
Write-Host "  Project: $PROJECT_REF" -ForegroundColor Cyan
Write-Host "  Functions to deploy: $($FUNCTIONS.Count)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$success = @()
$failed  = @()

foreach ($fn in $FUNCTIONS) {
    Write-Host "Deploying: $fn ..." -ForegroundColor Yellow -NoNewline

    # npx supabase functions deploy <name> --project-ref <ref> --no-verify-jwt
    # --no-verify-jwt is safe here because each function does its own JWT check
    $result = npx supabase functions deploy $fn `
        --project-ref $PROJECT_REF `
        --token $Token `
        2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $success += $fn
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host $result -ForegroundColor DarkRed
        $failed += $fn
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Deploy Summary" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if ($success.Count -gt 0) {
    Write-Host "Deployed OK ($($success.Count)):" -ForegroundColor Green
    $success | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
}

if ($failed.Count -gt 0) {
    Write-Host "Failed ($($failed.Count)):" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  x $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Tip: Check the error output above. Common causes:" -ForegroundColor Yellow
    Write-Host "  - Invalid or expired token (get one at https://supabase.com/dashboard/account/tokens)" -ForegroundColor Yellow
    Write-Host "  - Wrong project ref (current: $PROJECT_REF)" -ForegroundColor Yellow
    Write-Host "  - Function folder missing (check supabase/functions/<name>/index.ts exists)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "All functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEP - Add secrets in Supabase Dashboard:" -ForegroundColor Magenta
Write-Host "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Required secrets:" -ForegroundColor White
Write-Host "    GROQ_API_KEY              <- NEW rotated key from console.groq.com/keys" -ForegroundColor White
Write-Host "    RAZORPAY_KEY_ID           <- From Razorpay dashboard" -ForegroundColor White
Write-Host "    RAZORPAY_KEY_SECRET       <- From Razorpay dashboard" -ForegroundColor White
Write-Host "    SUPABASE_SERVICE_ROLE_KEY <- From Supabase Settings > API" -ForegroundColor White
Write-Host "    (SUPABASE_URL and SUPABASE_ANON_KEY are auto-injected)" -ForegroundColor DarkGray
Write-Host ""
