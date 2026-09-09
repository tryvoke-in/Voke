import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Create a client with the user's JWT to verify their identity securely
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Parse request and determine price server-side
    const { plan, couponCode } = await req.json();

    let amount = 0;
    const currency = "INR";
    const normalizedCoupon = typeof couponCode === "string" ? couponCode.trim().toLowerCase() : "";
    let appliedDiscount = "0%";
    
    // Map the plan identifier to a fixed server-side amount
    if (plan === "elite_pro") {
      const BASE_PRICE_RUPEES = 399;

      if (normalizedCoupon) {
        if (normalizedCoupon === "vickybyte30") {
          // 30% discount on ₹399 -> ₹279
          const discountedPriceRupees = Math.round(BASE_PRICE_RUPEES * 0.70); // 279
          amount = discountedPriceRupees * 100; // 27900 paise (₹279)
          appliedDiscount = "30%";
        } else {
          return new Response(JSON.stringify({ error: "Invalid coupon code" }), { 
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
      } else {
        amount = BASE_PRICE_RUPEES * 100; // 39900 paise (₹399)
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid plan specified" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Generate a secure receipt ID tied to the user
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`;

    // 3. Create the Razorpay Order
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured in Supabase secrets.");
    }

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: {
          user_id: user.id,
          plan: plan,
          coupon_code: normalizedCoupon || "none",
          discount: appliedDiscount,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay API error:", response.status, errorText);
      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();

    return new Response(JSON.stringify({
      ...order,
      razorpay_key_id: RAZORPAY_KEY_ID,
    }), {
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
