// Single source of truth for plan tiers, pricing, and limits.
// Used on both client (pricing UI, limit checks) and server (price validation).

export type PlanId = "free" | "pro" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  pricePaise: number; // INR paise. 0 = free
  priceLabel: string; // human label
  durationDays: number; // 0 for free, 30 for monthly, 365 for yearly
  interviewsPerMonth: number; // -1 = unlimited
  features: string[];
  highlights?: string[];
  badge?: string;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try the basics",
    pricePaise: 0,
    priceLabel: "₹0",
    durationDays: 0,
    interviewsPerMonth: 5,
    features: [
      "5 mock interviews / month",
      "Easy & medium difficulty",
      "Basic feedback",
      "English + Hindi support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Crack placements",
    pricePaise: 29900, // ₹299
    priceLabel: "₹299",
    durationDays: 30,
    interviewsPerMonth: 50,
    badge: "Most popular",
    features: [
      "50 mock interviews / month",
      "All difficulties incl. Brutal",
      "Detailed AI feedback + scores",
      "Resume-aware questions",
      "All 6 Indian languages",
      "Priority support",
    ],
    highlights: ["50 interviews/month", "All difficulties", "Resume-aware AI"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Land the offer",
    pricePaise: 59900, // ₹599
    priceLabel: "₹599",
    durationDays: 30,
    interviewsPerMonth: -1,
    features: [
      "Unlimited mock interviews",
      "Everything in Pro",
      "Voice interview mode",
      "Achievement boost (2× XP)",
      "Early access to new features",
      "1-on-1 prep tips weekly",
    ],
    highlights: ["Unlimited interviews", "Voice mode", "2× XP boost"],
  },
};

export const PAID_PLANS: PlanId[] = ["pro", "premium"];

export function isPlanActive(plan: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if (!plan || plan === "free") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export function effectivePlan(plan: string | null | undefined, expiresAt: string | null | undefined): PlanId {
  if (isPlanActive(plan, expiresAt)) return plan as PlanId;
  return "free";
}

export function getPlanLimits(planId: PlanId) {
  return PLANS[planId] ?? PLANS.free;
}
