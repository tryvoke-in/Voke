import { useState } from "react";
import { motion } from "motion/react";
import { Gift } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReferralCard } from "./ReferralCard";

export interface ReferralButtonProps {
  iconOnly?: boolean;
}

export const ReferralButton = ({ iconOnly = false }: ReferralButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={
          iconOnly
            ? "flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300 cursor-pointer shrink-0"
            : "flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-700 text-white shadow-md shadow-violet-500/10 hover:shadow-violet-500/25 transition-all duration-300 whitespace-nowrap text-xs font-semibold cursor-pointer shrink-0"
        }
      >
        <Gift className={iconOnly ? "w-5 h-5 text-gray-700 dark:text-gray-300" : "w-4 h-4 animate-pulse"} />
        {!iconOnly && <span>Refer & Earn</span>}
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

export default ReferralButton;
