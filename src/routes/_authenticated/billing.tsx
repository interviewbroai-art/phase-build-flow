import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowLeft, Receipt, Crown, Sparkles, CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PLANS, effectivePlan } from "@/lib/billing/plans";
import { getMyPayments } from "@/lib/api/billing.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing & receipts — InterviewBro AI" }] }),
  component: BillingPage,
});

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function BillingPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const fetchPayments = useServerFn(getMyPayments);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_started_at, plan_expires_at, display_name")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", userId],
    queryFn: () => fetchPayments(),
  });

  const currentPlan = effectivePlan(profile?.plan, profile?.plan_expires_at);
  const planInfo = PLANS[currentPlan];

  const downloadReceipt = (p: any) => {
    const lines = [
      "==========================================",
      "        INTERVIEWBRO AI · RECEIPT",
      "==========================================",
      "",
      `Receipt no:    ${p.receipt_number}`,
      `Date:          ${formatDate(p.paid_at || p.created_at)}`,
      `Customer:      ${profile?.display_name || user?.email}`,
      `Email:         ${user?.email}`,
      "",
      "------------------------------------------",
      `Plan:          ${PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan}`,
      `Amount:        ${formatINR(p.amount_paise)} ${p.currency}`,
      `Payment ID:    ${p.razorpay_payment_id ?? "—"}`,
      `Order ID:      ${p.razorpay_order_id ?? "—"}`,
      `Method:        ${p.method ?? "—"}`,
      `Status:        ${p.status.toUpperCase()}`,
      "------------------------------------------",
      "",
      "Thank you for using InterviewBro AI!",
      "Questions? Reach us at support@interviewbro.ai",
      "",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const payments = paymentsData?.payments ?? [];

  return (
    <div className="px-6 py-8 md:py-10 max-w-4xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl clay-sm">
            <Receipt className="w-5 h-5 text-primary-glow" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Billing & receipts</h1>
            <p className="text-sm text-muted-foreground">Manage your plan and download invoices.</p>
          </div>
        </div>
      </motion.div>

      {/* Current plan card */}
      <div className="mt-8 clay p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Current plan</div>
            <div className="mt-1 flex items-center gap-2">
              {currentPlan === "premium" ? (
                <Crown className="w-5 h-5 text-primary-glow" />
              ) : currentPlan === "pro" ? (
                <Sparkles className="w-5 h-5 text-primary-glow" />
              ) : (
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="font-display text-2xl font-bold">{planInfo.name}</span>
              <span className="text-sm text-muted-foreground">· {planInfo.priceLabel}{planInfo.pricePaise > 0 ? "/mo" : ""}</span>
            </div>
            {currentPlan !== "free" && profile?.plan_expires_at && (
              <div className="mt-2 text-xs text-muted-foreground">
                Renews / expires on <span className="text-foreground">{formatDate(profile.plan_expires_at)}</span>
              </div>
            )}
            <div className="mt-3 text-sm text-muted-foreground">
              {planInfo.interviewsPerMonth === -1
                ? "Unlimited interviews each month"
                : `${planInfo.interviewsPerMonth} interviews per month`}
            </div>
          </div>
          <Link to="/upgrade" className="btn-clay px-4 py-2.5 rounded-2xl text-sm font-medium inline-flex items-center gap-2">
            {currentPlan === "free" ? <>Upgrade <Crown className="w-4 h-4" /></> : <>Manage / extend</>}
          </Link>
        </div>
      </div>

      {/* Payments history */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold mb-3">Payment history</h2>
        <div className="clay p-2">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading receipts…</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payments yet. Upgrade to Pro or Premium to see receipts here.
            </div>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {payments.map((p: any) => {
                const StatusIcon = p.status === "paid" ? CheckCircle2 : p.status === "failed" ? XCircle : Clock;
                const statusColor = p.status === "paid" ? "text-emerald-400" : p.status === "failed" ? "text-rose-400" : "text-amber-400";
                return (
                  <li key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                    <div className="grid place-items-center w-10 h-10 rounded-2xl clay-sm">
                      <StatusIcon className={"w-4 h-4 " + statusColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan} · {formatINR(p.amount_paise)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.receipt_number} · {formatDate(p.paid_at || p.created_at)}
                        {p.method ? ` · ${p.method.toUpperCase()}` : ""}
                      </div>
                    </div>
                    <span className={"text-xs font-medium uppercase " + statusColor}>{p.status}</span>
                    {p.status === "paid" && (
                      <button
                        type="button"
                        onClick={() => downloadReceipt(p)}
                        className="btn-ghost-clay px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" /> Receipt
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
