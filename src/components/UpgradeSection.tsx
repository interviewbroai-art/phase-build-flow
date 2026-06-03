import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Crown, Sparkles, ArrowRight } from "lucide-react";
import { PLANS, effectivePlan, type PlanId } from "@/lib/billing/plans";

type Props = {
  plan: string | null | undefined;
  planExpiresAt: string | null | undefined;
};

export function UpgradeSection({ plan, planExpiresAt }: Props) {
  const current = effectivePlan(plan, planExpiresAt);
  const isFree = current === "free";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-10"
      aria-labelledby="upgrade-heading"
    >
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            {isFree ? "Unlock more interviews" : "Your plan"}
          </div>
          <h2 id="upgrade-heading" className="mt-1 text-2xl md:text-3xl font-bold">
            {isFree ? (
              <>
                Ready to <span className="text-gradient">level up</span>?
              </>
            ) : (
              <>
                You're on <span className="text-gradient">{PLANS[current].name}</span>
              </>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFree
              ? "Upgrade any time — cancel whenever. No card needed to keep using Free."
              : "Thanks for being a supporter. Manage or change your plan from Billing."}
          </p>
        </div>
        <Link to="/upgrade" className="btn-ghost-clay hidden sm:inline-flex text-sm">
          See all plans <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(["free", "pro", "premium"] as const).map((pid) => {
          const p = PLANS[pid];
          const isCurrent = current === pid;
          const featured = pid === "pro";
          return (
            <div
              key={pid}
              className={
                "p-5 rounded-3xl flex flex-col gap-3 transition " +
                (featured ? "clay ring-2 ring-primary/40" : "clay-sm")
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.tagline}
                  </div>
                  <div className="font-display font-bold text-lg flex items-center gap-1.5">
                    {pid !== "free" && <Crown className="w-4 h-4 text-primary-glow" />}
                    {p.name}
                  </div>
                </div>
                {isCurrent ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full clay-inset text-primary-glow">
                    Current
                  </span>
                ) : p.badge ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full clay-inset text-primary-glow">
                    {p.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-3xl text-gradient">
                  {p.priceLabel}
                </span>
                {p.pricePaise > 0 && (
                  <span className="text-xs text-muted-foreground">/month</span>
                )}
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground flex-1">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-glow mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {pid === "free" ? (
                <div className="text-[11px] text-muted-foreground text-center pt-1">
                  {current === "free" ? "Your current plan" : "Always free tier"}
                </div>
              ) : isCurrent ? (
                <Link to="/billing" className="btn-ghost-clay justify-center text-sm">
                  Manage plan
                </Link>
              ) : (
                <Link
                  to="/upgrade"
                  className={featured ? "btn-clay justify-center text-sm" : "btn-ghost-clay justify-center text-sm"}
                >
                  <Crown className="w-4 h-4" /> Upgrade to {p.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
