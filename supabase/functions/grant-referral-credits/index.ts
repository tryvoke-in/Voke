import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { referrerId, referredId } = await req.json();

    if (!referrerId || !referredId) {
      return new Response(
        JSON.stringify({ error: "referrerId and referredId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the SERVICE_ROLE key so we can update any user's metadata
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the referrer's current metadata
    const { data: { user: referrer }, error: fetchErr } = await supabase.auth.admin.getUserById(referrerId);

    if (fetchErr || !referrer) {
      return new Response(
        JSON.stringify({ error: "Referrer not found", details: fetchErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meta = referrer.user_metadata || {};

    // +1 credit per feature (elite, voice, video)
    const newCreditsElite = (Number(meta.credits_elite) || 1) + 1;
    const newCreditsVoice = (Number(meta.credits_voice) || 1) + 1;
    const newCreditsVideo = (Number(meta.credits_video) || 1) + 1;

    const { error: updateErr } = await supabase.auth.admin.updateUserById(referrerId, {
      user_metadata: {
        ...meta,
        credits_elite: newCreditsElite,
        interview_credits: newCreditsElite,   // keep legacy field in sync
        credits_voice: newCreditsVoice,
        credits_video: newCreditsVideo,
      },
    });

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: "Failed to update credits", details: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        referrerId,
        creditsGranted: { elite: 1, voice: 1, video: 1 },
        newTotals: {
          credits_elite: newCreditsElite,
          credits_voice: newCreditsVoice,
          credits_video: newCreditsVideo,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[grant-referral-credits]", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
