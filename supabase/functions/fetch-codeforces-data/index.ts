import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { handle } = await req.json();

        if (!handle) {
            throw new Error("Handle is required");
        }

        const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
        });
        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error(data.comment || "Failed to fetch Codeforces data");
        }

        const user = data.result[0];
        const result = {
            handle: user.handle,
            rating: user.rating,
            rank: user.rank,
            maxRating: user.maxRating,
            maxRank: user.maxRank,
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
