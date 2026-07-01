import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReferralCard } from "./ReferralCard";

export const ReferralFloatingWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
      >
        <Gift className="w-5 h-5 animate-pulse" />
        <span className="font-semibold text-sm">Refer & Earn</span>
      </motion.button>

      {/* Popup Dialog containing the ReferralCard */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-none bg-transparent max-w-md shadow-2xl overflow-hidden rounded-2xl [&>button]:z-50 [&>button]:bg-black/20 [&>button]:text-white [&>button]:p-2 hover:[&>button]:bg-black/40 [&>button]:transition-colors">
          <DialogTitle className="sr-only">Referral Program</DialogTitle>
          <ReferralCard />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralFloatingWidget;
