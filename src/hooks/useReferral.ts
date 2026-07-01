/**
 * useReferral – Referral Program Hook
 *
 * Responsibilities:
 *  • Generate / read the user's referral code (stored in user_metadata.referral_code)
 *  • Fetch all referrals the user has made (from the `referrals` table)
 *  • Grant credits to the referrer (+1 elite, +1 voice, +1 video) per successful referral
 *
 * Called from:
 *  • Auth.tsx  – after a new user signs up via a ref link → credit the referrer
 *  • Dashboard / Profile – to show the referral widget
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReferralRow {
  id: string;
  referred_id: string;
  status: string;
  created_at: string;
  credited_at: string | null;
}

export interface ReferralState {
  referralCode: string | null;   // The current user's unique shareable code (their user ID prefix)
  referralLink: string;          // Full URL to share
  referrals: ReferralRow[];      // List of users this person has referred
  totalReferred: number;
  totalCredited: number;
  loading: boolean;
}

export const useReferral = () => {
  const [state, setState] = useState<ReferralState>({
    referralCode: null,
    referralLink: "",
    referrals: [],
    totalReferred: 0,
    totalCredited: 0,
    loading: true,
  });

  /* ------------------------------------------------------------------ */
  /*  Fetch current user's referral data                                 */
  /* ------------------------------------------------------------------ */
  const fetchReferralData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata || {};

      // Referral code = first 8 chars of the user UUID (deterministic, shareable)
      const code: string = metadata.referral_code || user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

      // Persist code in metadata if not already set (fire-and-forget)
      if (!metadata.referral_code) {
        supabase.auth.updateUser({ data: { referral_code: code } }).catch(console.error);
      }

      // Check if user came from a referral link (via Google OAuth or Magic Link)
      const pendingRef = localStorage.getItem("voke_pending_referral");
      if (pendingRef) {
        // Run the referral silently in the background
        supabase.rpc("process_referral", {
          ref_code: pendingRef,
          new_user_id: user.id
        }).then(() => {
          // Remove it regardless of success (to prevent infinite retries if invalid/already referred)
          localStorage.removeItem("voke_pending_referral");
        });
      }

      const link = `${window.location.origin}/auth?ref=${code}`;

      // Fetch rows from referrals table (SELECT policy: referrer_id = auth.uid())
      const { data: rows, error } = await supabase
        .from("referrals" as any)
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useReferral] fetch error:", error);
      }

      const referrals: ReferralRow[] = (rows as any[]) || [];

      setState({
        referralCode: code,
        referralLink: link,
        referrals,
        totalReferred: referrals.length,
        totalCredited: referrals.filter(r => r.status === "credited").length,
        loading: false,
      });
    } catch (err) {
      console.error("[useReferral] error:", err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  /* ------------------------------------------------------------------ */
  /*  Copy link to clipboard                                              */
  /* ------------------------------------------------------------------ */
  const copyReferralLink = async () => {
    if (!state.referralLink) return;
    try {
      await navigator.clipboard.writeText(state.referralLink);
      toast.success("Referral link copied! 🎉");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Credit the referrer – called from Auth.tsx after a new signup      */
  /* ------------------------------------------------------------------ */
  const processReferral = async (referralCode: string, referredUserId: string) => {
    if (!referralCode || !referredUserId) return;

    try {
      // Call the secure RPC function to handle the entire lookup, insert, and credit update
      const { data, error } = await supabase.rpc("process_referral", {
        ref_code: referralCode,
        new_user_id: referredUserId
      });

      if (error) {
        console.error("[processReferral] RPC error:", error);
      } else {
        console.log("[processReferral] RPC success:", data);
      }
    } catch (err) {
      console.error("[processReferral] Unexpected error:", err);
    }
  };

  return {
    ...state,
    copyReferralLink,
    processReferral,
    refresh: fetchReferralData,
  };
};
