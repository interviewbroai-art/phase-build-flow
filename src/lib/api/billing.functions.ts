import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PLANS, type PlanId, effectivePlan, getPlanLimits } from "@/lib/billing/plans";

const PLAN_IDS = ["pro", "premium"] as const;

// ---------- Create Razorpay order ----------
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ planId: z.enum(PLAN_IDS) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = PLANS[data.planId as PlanId];
    if (!plan || plan.pricePaise <= 0) {
      throw new Error("Invalid plan");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Payment gateway not configured");

    const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.pricePaise,
        currency: "INR",
        receipt: receiptNumber,
        notes: { plan_id: plan.id, user_id: userId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Razorpay order error:", res.status, text);
      throw new Error("Failed to create payment order");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };

    // Store pending payment row using service role (users no longer have INSERT on payments)
    const { error: insertErr } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      plan: plan.id,
      amount_paise: plan.pricePaise,
      currency: "INR",
      status: "created",
      receipt_number: receiptNumber,
      razorpay_order_id: order.id,
    });
    if (insertErr) {
      console.error("Insert payment error:", insertErr);
      throw new Error(insertErr.message);
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      receiptNumber,
      planName: plan.name,
    };
  });

// ---------- Verify + activate ----------
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
        method: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Payment gateway not configured");

    // Verify HMAC signature
    const payload = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expected = createHmac("sha256", keySecret).update(payload).digest("hex");
    if (expected !== data.razorpay_signature) {
      await supabase
        .from("payments")
        .update({ status: "failed", razorpay_payment_id: data.razorpay_payment_id })
        .eq("razorpay_order_id", data.razorpay_order_id)
        .eq("user_id", userId);
      throw new Error("Payment signature verification failed");
    }

    // Find the payment row
    const { data: paymentRow, error: fetchErr } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!paymentRow) throw new Error("Payment record not found");

    const plan = PLANS[paymentRow.plan as PlanId];
    if (!plan) throw new Error("Invalid plan on payment");

    const now = new Date();
    const expires = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Mark paid
    const { error: payUpdateErr } = await supabase
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        method: data.method ?? null,
        paid_at: now.toISOString(),
      })
      .eq("id", paymentRow.id);
    if (payUpdateErr) throw new Error(payUpdateErr.message);

    // Activate plan on profile — extend if already on same/better plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const currentExpires =
      profile?.plan === plan.id && profile?.plan_expires_at && new Date(profile.plan_expires_at) > now
        ? new Date(profile.plan_expires_at)
        : now;
    const newExpires = new Date(currentExpires.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        plan: plan.id,
        plan_started_at: now.toISOString(),
        plan_expires_at: newExpires.toISOString(),
      })
      .eq("id", userId);
    if (profileErr) throw new Error(profileErr.message);

    return {
      success: true,
      plan: plan.id,
      planName: plan.name,
      expiresAt: newExpires.toISOString(),
      receiptNumber: paymentRow.receipt_number,
    };
  });

// ---------- Receipts list ----------
export const getMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { payments: data ?? [] };
  });

// ---------- Plan limit check (used by interview start) ----------
export const checkInterviewQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();

    const planId = effectivePlan(profile?.plan, profile?.plan_expires_at);
    const limits = getPlanLimits(planId);

    if (limits.interviewsPerMonth === -1) {
      return { allowed: true, used: 0, limit: -1, planId };
    }

    // Count sessions in last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { count, error } = await supabase
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since.toISOString());
    if (error) throw new Error(error.message);

    const used = count ?? 0;
    return {
      allowed: used < limits.interviewsPerMonth,
      used,
      limit: limits.interviewsPerMonth,
      planId,
    };
  });
