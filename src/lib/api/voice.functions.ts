import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { effectivePlan } from "@/lib/billing/plans";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("AI is busy, please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up Lovable AI.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export const voiceInterviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobRole: z.string().min(1).max(120),
      experience: z.string().min(1).max(40),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(2000),
          }),
        )
        .max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at, resume_summary")
      .eq("id", (await supabase.auth.getUser()).data.user!.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);

    const plan = effectivePlan(profile?.plan as string | null, profile?.plan_expires_at as string | null);
    if (plan === "free") {
      throw new Error("Voice interview mode is available on Pro and Premium plans only.");
    }

    const resumeBlock = profile?.resume_summary
      ? `\n\nCandidate background (from resume):\n${profile.resume_summary}\n`
      : "";

    const sys = `You are conducting a REALISTIC SPOKEN mock interview over a voice call for a ${data.experience} candidate applying for a ${data.jobRole} role.

VERY IMPORTANT RULES — this is a live phone call:
- LANGUAGE: English ONLY. Never use Hindi or Hinglish, even if the candidate does.
- Speak naturally, like a real recruiter on a call. Use short, conversational sentences (1–3 sentences max per turn).
- Do NOT use markdown, lists, bullet points, code blocks, or headings. Plain spoken English only.
- Ask ONE question per turn. Build naturally on what the candidate just said.
- If the candidate's answer is weak or vague, follow up on it instead of jumping topics.
- Mix introduction, behavioural (STAR), situational, role-specific, and 1–2 HR / culture-fit questions.
- Do NOT give answers, hints, or evaluative commentary. Do NOT say "Great answer" or "Next question". Just ask the next question.
- Do NOT number questions. Do NOT repeat a question already asked.
- Keep replies short enough to be spoken aloud in under 15 seconds.${resumeBlock}

Respond with ONLY the next spoken line. Nothing else.`;

    const messages = [
      { role: "system" as const, content: sys },
      ...data.history,
    ];
    if (data.history.length === 0) {
      messages.push({
        role: "user",
        content: "Start the call. Greet me briefly and ask your first question.",
      });
    }

    const reply = await callGateway({ model: MODEL, messages, stream: false });
    return { reply: reply.trim() };
  });
