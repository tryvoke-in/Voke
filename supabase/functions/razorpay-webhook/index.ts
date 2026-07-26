import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

async function verifyRazorpayWebhookSignature(
  payloadBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payloadBody)
    );
    const hashArray = Array.from(new Uint8Array(signatureBytes));
    const hexHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (hexHash.length !== signature.length) return false;
    let result = 0;
    for (let i = 0; i < hexHash.length; i++) {
      result |= hexHash.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("Error in webhook signature verification:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!RAZORPAY_WEBHOOK_SECRET) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
    }

    const payloadBody = await req.text();

    const isValid = await verifyRazorpayWebhookSignature(
      payloadBody,
      signature,
      RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Invalid Razorpay webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(payloadBody);
    console.log(`Received secure webhook event: ${event.event}`);

    // We primarily care about order.paid or payment.captured
    if (event.event === "order.paid" || event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const userId = paymentEntity.notes?.user_id;

      if (!userId) {
        console.error(`Webhook missing user_id in notes for order ${orderId}`);
        return new Response("OK", { status: 200 }); // Return 200 so Razorpay stops retrying
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Upsert the entitlement based on the order ID to prevent replay processing
      // We use order_id as a constraint logically via onConflict: "user_id" but we are certain
      // this is the authentic payload because the webhook signature verified it.
      const { error: dbError } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert(
          {
            user_id: userId,
            is_premium: true,
            payment_id: paymentId,
            order_id: orderId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (dbError) {
        console.error("Failed to update user_subscriptions table:", dbError);
        throw new Error(`Database entitlement update failed: ${dbError.message}`);
      }

      // Sync the auth user's metadata so frontend tokens reflect the status immediately
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        console.error("Failed to fetch user metadata:", userError);
      } else {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            is_premium: true,
          },
        });
      }
      
      console.log(`Successfully granted premium to user ${userId} for order ${orderId}`);
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
