import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const locations = [
            { location_name: 'Pune', is_active: true },
            { location_name: 'Mumbai', is_active: true },
            { location_name: 'Bangalore', is_active: true },
            { location_name: 'Hyderabad', is_active: true },
            { location_name: 'Delhi', is_active: true },
            { location_name: 'Chennai', is_active: true },
            { location_name: 'Noida', is_active: true },
            { location_name: 'Gurgaon', is_active: true }
        ];

        const { data, error } = await supabase
            .from('monitored_locations')
            .upsert(locations, { onConflict: 'location_name', ignoreDuplicates: true })

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 500 })
        }

        return new Response(JSON.stringify({ success: true, message: 'Locations added successfully' }), { status: 200 })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
