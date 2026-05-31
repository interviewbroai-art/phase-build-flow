import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Check, Crown, Sparkles, Zap, Loader2, Smartphone, CreditCard, Building2, Wallet } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PLANS, type PlanId, effectivePlan } from "@/lib/billing/plans";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/billing.functions";
import { loadRazorpay, openRazorpayCheckout } from "@/lib/billing/razorpay";

const searchSchema = z.object({
  plan: z.enum(["pro", "premium"]).optional(),
});

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade — InterviewBro AI" }] }),
  validateSearch: searchSchema,
  component: UpgradePage,
});

function UpgradePage() {
  const { user } = useAuth();
  const userId = user!.id;
  const { plan: preselect } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<PlanId | null>(null);

  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_expires_at, display_name")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const currentPlan = effectivePlan(profile?.plan, profile?.plan_expires_at);

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === "free") return;
    setBusy(planId);
    try {
      await loadRazorpay();
      const order = await createOrder({ data: { planId } });

      openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "InterviewBro AI",
        description: `${order.planName} plan · ${order.receiptNumber}`,
        prefillEmail: user?.email ?? undefined,
        prefillName: profile?.display_name ?? undefined,
        onSuccess: async (resp) => {
          try {
            const result = await verifyPayment({
              data: {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                method: resp.method,
              },
            });
            toast.success(`${result.planName} activated! 🎉`);
            await qc.invalidateQueries({ queryKey: ["profile"] });
            await qc.invalidateQueries({ queryKey: ["payments"] });
            navigate({ to: "/billing" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Verification failed");
          } finally {
            setBusy(null);
          }
        },
        onDismiss: () => {
          setBusy(null);
          toast.info("Payment cancelled");
        },
      });
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : "Could not start payment");
    }
  };

  return (
    <div className="px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl clay-sm">
            <Crown className="w-5 h-5 text-primary-glow" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Upgrade your plan</h1>
            <p className="text-sm text-muted-foreground">
              You're on <span className="text-foreground font-medium">{PLANS[currentPlan].name}</span> right now.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-sm"><Smartphone className="w-3 h-3 text-primary-glow" /> UPI</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-sm"><CreditCard className="w-3 h-3 text-primary-glow" /> Cards</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-sm"><Building2 className="w-3 h-3 text-primary-glow" /> Netbanking</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full clay-sm"><Wallet className="w-3 h-3 text-primary-glow" /> Wallets</span>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-5">
        {(["pro", "premium"] as const).map((id, idx) => {
          const p = PLANS[id];
          const Icon = id === "premium" ? Crown : Zap;
          const featured = id === preselect || (!preselect && id === "pro");
          const isCurrent = currentPlan === id;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.08 }}
              className={"clay p-6 flex flex-col relative " + (featured ? "ring-1 ring-primary/40" : "")}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground shadow-lg">
                  {p.badge}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm">
                  <Icon className="w-4 h-4 text-primary-glow" />
                </span>
                <div>
                  <div className="font-display font-bold text-lg">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.tagline}</div>
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{p.priceLabel}</span>
                <span className="text-xs text-muted-foreground">/ month · UPI/Card</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 grid place-items-center w-4 h-4 rounded-full bg-primary/20 shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary-glow" />
                    </span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() => handleUpgrade(id)}
                className={
                  "mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed " +
                  (featured ? "btn-clay" : "btn-ghost-clay")
                }
              >
                {busy === id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</>
                ) : isCurrent ? (
                  <>Extend {p.name} · {p.priceLabel}</>
                ) : (
                  <>Pay {p.priceLabel} · Get {p.name}</>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Secured by Razorpay · Test mode keys active · You'll get an in-app receipt instantly
      </p>
    </div>
  );
}
