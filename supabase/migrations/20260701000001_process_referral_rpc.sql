-- ============================================================
-- Referral Program: process_referral RPC
-- This function handles the entire referral process securely
-- on the server side: finding the referrer by code, checking
-- for duplicates/self-referrals, inserting into the referrals
-- table, and atomically updating the user_metadata credits.
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_referral(ref_code text, new_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referrer_uuid uuid;
    c_elite int;
    c_voice int;
    c_video int;
    meta jsonb;
BEGIN
    -- Find referrer by matching the first 8 characters of their UUID
    -- (The client generates the referral code exactly this way)
    SELECT id INTO referrer_uuid
    FROM auth.users
    WHERE id::text ILIKE (substring(ref_code from 1 for 8) || '%')
    LIMIT 1;

    IF referrer_uuid IS NULL THEN
        RETURN json_build_object('error', 'Referrer not found');
    END IF;

    IF referrer_uuid = new_user_id THEN
        RETURN json_build_object('error', 'Self referral not allowed');
    END IF;

    -- Insert into referrals table
    BEGIN
        INSERT INTO public.referrals (referrer_id, referred_id, status, credited_at)
        VALUES (referrer_uuid, new_user_id, 'credited', NOW());
    EXCEPTION WHEN unique_violation THEN
        RETURN json_build_object('error', 'Already referred');
    END;

    -- Update referrer credits in auth.users raw_user_meta_data
    SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = referrer_uuid;
    
    c_elite := COALESCE((meta->>'credits_elite')::int, 1) + 1;
    c_voice := COALESCE((meta->>'credits_voice')::int, 1) + 1;
    c_video := COALESCE((meta->>'credits_video')::int, 1) + 1;

    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'credits_elite', c_elite,
        'credits_voice', c_voice,
        'credits_video', c_video,
        'interview_credits', c_elite
    )
    WHERE id = referrer_uuid;

    RETURN json_build_object(
        'success', true, 
        'referrer_id', referrer_uuid,
        'credits', json_build_object('elite', c_elite, 'voice', c_voice, 'video', c_video)
    );
END;
$$;
