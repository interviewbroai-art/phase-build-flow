import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { effectivePlan } from "@/lib/billing/plans";

const DID_BASE = "https://api.d-id.com";

async function did(path: string, init: RequestInit & { method: string }) {
  const key = process.env.DID_API_KEY;
  if (!key) throw new Error("DID_API_KEY is not configured");
  const authorization = key.trim().startsWith("Basic ") ? key.trim() : `Basic ${key.trim()}`;
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
    throw new Error(`D-ID ${res.status}: ${t.slice(0, 300)}`);
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

async function assertPremium(
  supabase: { from: (t: string) => any; auth: { getUser: () => Promise<any> } },
) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at, resume_summary")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const plan = effectivePlan(
    data?.plan as string | null,
    data?.plan_expires_at as string | null,
  );
  if (plan !== "premium") {
    throw new Error("Video simulation is a Premium-only feature.");
  }
  return { uid, profile: data };
}

const DEFAULT_PRESENTER =
  "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg";

export const createDidStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPremium(context.supabase);
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
    z.object({ streamId: z.string().min(1), sessionId: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    try {
      await did(`/talks/streams/${data.streamId}`, {
        method: "DELETE",
        body: JSON.stringify({ session_id: data.sessionId }),
      });
    } catch {
      // ignore — stream may already be closed
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
    const { profile } = await assertPremium(context.supabase);

    const resumeBlock = (profile as any)?.resume_summary
      ? `\n\nCandidate background (from resume):\n${(profile as any).resume_summary}\n`
      : "";

    const sys = `You are a professional interviewer on a live VIDEO CALL with a ${data.experience} candidate applying for a ${data.jobRole} role.

RULES — this is a real face-to-face video interview:
- LANGUAGE: English only. Never Hindi or Hinglish.
- Speak naturally and conversationally. 1–2 short sentences per turn, max.
- NO markdown, lists, bullets, headings, or code. Plain spoken English.
- Ask ONE question per turn. Build on the candidate's last answer.
- Do NOT praise or evaluate ("Great answer", "Good"). Just ask the next question.
- Do NOT number questions or repeat questions already asked.
- Mix intro, behavioural (STAR), situational, role-specific, and 1–2 HR / culture-fit questions.
- Keep replies short enough to be spoken in under 12 seconds.${resumeBlock}

Respond with ONLY the next spoken line. Nothing else.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: sys },
      ...data.history,
    ];
    if (data.history.length === 0) {
      messages.push({
        role: "user",
        content:
          "Start the call. Briefly greet the candidate and ask your first question.",
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
