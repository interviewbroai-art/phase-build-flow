import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { effectivePlan } from "@/lib/billing/plans";

const DID_BASE = "https://api.d-id.com";

async function did(path: string, init: RequestInit & { method: string }) {
  const key = process.env.DID_API_KEY;
  if (!key) throw new Error("DID_API_KEY is not configured");
  const authorization = key.trim().startsWith("Basic ")
    ? key.trim()
    : `Basic ${key.trim()}`;
  const res = await fetch(`${DID_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Avatar service ${res.status}: ${t.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Avatar access policy (per PRD §13):
 *  - Premium users: unlimited.
 *  - Everyone else: 1 free avatar interview lifetime, then must upgrade.
 *  Returns { uid, profile, plan, remainingFree }.
 */
async function assertAvatarAccess(supabase: {
  from: (t: string) => any;
  auth: { getUser: () => Promise<any> };
}) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at, resume_summary")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const plan = effectivePlan(
    profile?.plan as string | null,
    profile?.plan_expires_at as string | null,
  );

  if (plan === "premium") {
    return { uid, profile, plan, remainingFree: -1 };
  }

  const { count, error: cErr } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("interview_type", "video");
  if (cErr) throw new Error(cErr.message);

  const used = count ?? 0;
  const remaining = Math.max(0, 1 - used);
  if (remaining <= 0) {
    throw new Error(
      "You've used your free Avatar Interview. Upgrade to Premium for unlimited sessions.",
    );
  }
  return { uid, profile, plan, remainingFree: remaining };
}

/**
 * Lightweight read-only access check used by the UI to decide whether to
 * show the "Start" button vs the upgrade card. Never throws.
 */
export const getAvatarAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const r = await assertAvatarAccess(context.supabase);
      return {
        allowed: true as const,
        plan: r.plan,
        remainingFree: r.remainingFree,
      };
    } catch (e) {
      return {
        allowed: false as const,
        reason: e instanceof Error ? e.message : "Access denied",
      };
    }
  });

const DEFAULT_PRESENTER =
  "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg";

export const createDidStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAvatarAccess(context.supabase);
    const json = await did("/talks/streams", {
      method: "POST",
      body: JSON.stringify({
        source_url: DEFAULT_PRESENTER,
        stream_warmup: true,
      }),
    });
    return json as {
      id: string;
      session_id: string;
      offer: RTCSessionDescriptionInit;
      ice_servers: RTCIceServer[];
    };
  });

export const sendDidSdpAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      streamId: z.string().min(1),
      sessionId: z.string().min(1),
      answer: z.object({ type: z.string(), sdp: z.string() }),
    }),
  )
  .handler(async ({ data }) => {
    await did(`/talks/streams/${data.streamId}/sdp`, {
      method: "POST",
      body: JSON.stringify({
        session_id: data.sessionId,
        answer: data.answer,
      }),
    });
    return { ok: true };
  });

export const sendDidIce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      streamId: z.string().min(1),
      sessionId: z.string().min(1),
      candidate: z.string(),
      sdpMid: z.string().nullable(),
      sdpMLineIndex: z.number().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await did(`/talks/streams/${data.streamId}/ice`, {
      method: "POST",
      body: JSON.stringify({
        session_id: data.sessionId,
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      }),
    });
    return { ok: true };
  });

export const speakOnDidStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      streamId: z.string().min(1),
      sessionId: z.string().min(1),
      text: z.string().min(1).max(1500),
    }),
  )
  .handler(async ({ data }) => {
    await did(`/talks/streams/${data.streamId}`, {
      method: "POST",
      body: JSON.stringify({
        session_id: data.sessionId,
        script: {
          type: "text",
          input: data.text,
          provider: { type: "microsoft", voice_id: "en-US-JennyNeural" },
        },
        config: { stitch: true },
      }),
    });
    return { ok: true };
  });

export const closeDidStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      streamId: z.string().min(1),
      sessionId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      await did(`/talks/streams/${data.streamId}`, {
        method: "DELETE",
        body: JSON.stringify({ session_id: data.sessionId }),
      });
    } catch {
      // ignore
    }
    return { ok: true };
  });

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export const videoInterviewBrain = createServerFn({ method: "POST" })
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
    const { profile } = await assertAvatarAccess(context.supabase);

    const resumeBlock = (profile as any)?.resume_summary
      ? `\n\nCandidate background (from resume):\n${(profile as any).resume_summary}\n`
      : "";

    const sys = `You are a realistic AI interviewer inside Interview Bro AI Avatar Interview Mode. You are on a live VIDEO CALL with a ${data.experience} candidate applying for a ${data.jobRole} role in India.

How to behave:
- Speak in clear professional Indian English. No Hindi, no Hinglish.
- Talk like a real human recruiter on a video call: 1–2 short spoken sentences per turn, under 12 seconds.
- Plain spoken text only. No markdown, lists, bullets, headings, or code blocks.
- Ask ONE question per turn. Build on the candidate's previous answer.
- Mix the round: warm intro, resume-based, behavioural (STAR), situational, role-specific technical, and 1–2 HR/culture-fit questions.
- Do NOT praise ("Great", "Good"), do NOT give the answer, do NOT number the questions.
- If the candidate is vague or weak, ask one sharp follow-up before changing topic.${resumeBlock}

Respond with ONLY the next spoken line. Nothing else.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: sys },
      ...data.history,
    ];
    if (data.history.length === 0) {
      messages.push({
        role: "user",
        content:
          "Start the call. Briefly greet the candidate by role, then ask your first question.",
      });
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
    });
    if (res.status === 429) throw new Error("AI is busy, please try again.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Please top up Lovable AI.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const reply: string = (json.choices?.[0]?.message?.content ?? "").trim();
    return { reply };
  });

/**
 * Attach behaviour metrics + browser support flags to the saved session's
 * feedback JSON, after scoreInterview() has populated the core report.
 */
export const attachAvatarMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      behaviorMetrics: z.object({
        avgAttention: z.number().min(0).max(100),
        eyeContactPct: z.number().min(0).max(100),
        facePresencePct: z.number().min(0).max(100),
        fillerWords: z.number().int().min(0).max(1000),
        smileRatio: z.number().min(0).max(100).optional(),
        roleReadiness: z.enum(["Beginner", "Improving", "Interview Ready", "Strong"]),
      }),
      browserSupport: z.object({
        webrtc: z.boolean(),
        stt: z.boolean(),
        tts: z.boolean(),
        mediapipe: z.boolean(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) throw new Error("Not authenticated");

    const { data: row, error: rErr } = await supabase
      .from("interview_sessions")
      .select("feedback, user_id")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!row || row.user_id !== uid) throw new Error("Session not found");

    const existing = (row.feedback ?? {}) as Record<string, unknown>;
    const merged = {
      ...existing,
      avatarBehavior: data.behaviorMetrics,
      avatarBrowserSupport: data.browserSupport,
    };

    const { error: uErr } = await supabase
      .from("interview_sessions")
      .update({ feedback: merged })
      .eq("id", data.sessionId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });
