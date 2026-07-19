import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// SEC-02 FIX: Server-side plan price map. Caller supplies a planId only —
// the server looks up the canonical amount. Caller cannot control price.
const PLAN_PRICES: Record<string, { amount: number; currency: string; description: string }> = {
  "voke_elite_monthly": { amount: 9900, currency: "INR", description: "Voke Elite Monthly (₹99)" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SEC-02 FIX: Require a valid JWT — reject unauthenticated callers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the token and extract the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEC-02 FIX: Accept only a planId — look up canonical price server-side
    const body = await req.json();
    const planId: string = body.planId ?? "voke_elite_monthly"; // default to only plan
    const plan = PLAN_PRICES[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: `Unknown plan: ${planId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured in Supabase secrets.");
    }

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Auto-generate receipt from authenticated user ID (not caller-supplied)
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt,
        notes: { user_id: user.id, plan_id: planId },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay API error:", response.status, errorText);
      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    console.log(`[create-razorpay-order] Created order ${order.id} for user ${user.id}, plan ${planId}, amount ${plan.amount}`);

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-razorpay-order function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
