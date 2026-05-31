import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Sparkles, ArrowLeft, Zap, Crown } from "lucide-react";
import { PLANS } from "@/lib/billing/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — InterviewBro AI" },
      { name: "description", content: "Affordable plans for Indian students and freshers. Free to start, ₹299 for Pro, ₹599 for Premium." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-blob" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full clay-sm text-xs text-muted-foreground mb-4">
            <Sparkles className="w-3 h-3 text-primary-glow" /> Pricing in INR · GST included
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Pick a plan that fits your <span className="text-gradient">placement season</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Pay securely via UPI, card or netbanking. Cancel anytime. No auto-renew.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {(["free", "pro", "premium"] as const).map((id, idx) => {
            const p = PLANS[id];
            const featured = id === "pro";
            const Icon = id === "premium" ? Crown : id === "pro" ? Zap : Sparkles;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                className={
                  "clay p-6 flex flex-col relative " +
                  (featured ? "ring-1 ring-primary/40 md:scale-[1.03]" : "")
                }
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
                  {p.pricePaise > 0 && (
                    <span className="text-xs text-muted-foreground">/ month</span>
                  )}
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

                <Link
                  to={id === "free" ? "/signup" : "/upgrade"}
                  search={id === "free" ? undefined : ({ plan: id } as any)}
                  className={
                    "mt-6 w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-medium transition " +
                    (featured ? "btn-clay" : "btn-ghost-clay")
                  }
                >
                  {id === "free" ? "Get started free" : `Upgrade to ${p.name}`}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Payments processed securely by Razorpay · UPI / Cards / Netbanking / Wallets
        </div>
      </div>
    </div>
  );
}
