import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { Crown, X, Sparkles } from "lucide-react";
import { effectivePlan, PLANS } from "@/lib/billing/plans";

const DISMISS_KEY = "ibro:upgrade-reminder:dismissed-until";
const SNOOZE_DAYS = 3;

type Props = {
  plan: string | null | undefined;
  planExpiresAt: string | null | undefined;
};

export function UpgradeReminder({ plan, planExpiresAt }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = effectivePlan(plan, planExpiresAt);
    if (current !== "free") return;
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && Date.now() < until) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [plan, planExpiresAt]);

  const dismiss = () => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {}
    setOpen(false);
  };

  const pro = PLANS.pro;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] clay p-5 rounded-3xl"
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-lg"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" /> Friendly reminder
          </div>
          <h3 className="mt-2 font-display font-bold text-lg leading-tight">
            Crack more interviews with <span className="text-gradient">Pro</span>
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            You're on Free (5 interviews/month). Pro unlocks 50 interviews,
            Brutal difficulty, resume-aware questions and detailed AI feedback.
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display font-bold text-2xl text-gradient">
              {pro.priceLabel}
            </span>
            <span className="text-xs text-muted-foreground">/month</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Link to="/upgrade" onClick={() => setOpen(false)} className="btn-clay flex-1 justify-center text-sm">
              <Crown className="w-4 h-4" /> Upgrade
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="btn-ghost-clay text-xs"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
