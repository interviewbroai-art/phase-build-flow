import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.1-pro-preview";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("AI rate limit exceeded. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up Lovable AI in workspace settings.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function systemPrompt(opts: {
  jobRole: string;
  experience: string;
  mode: string;
  language: string;
}) {
  const tone =
    opts.mode === "strict"
      ? "You are a strict, sharp recruiter at a top product company. Push back politely on vague or weak answers and probe for depth, numbers, and trade-offs."
      : opts.mode === "campus"
      ? "You are a campus placement panelist. Mix HR, aptitude reasoning, basic CS fundamentals, and one or two role-specific questions, like an Indian campus drive."
      : "You are a warm, encouraging senior interviewer who helps the candidate feel comfortable while still going deep.";

  const langLine =
    opts.language === "hi"
      ? "Language: natural Hinglish — mix Hindi and English the way Indian students actually speak. Keep technical terms in English."
      : "Language: clear, professional Indian English.";

  return `You are conducting a realistic mock interview for a ${opts.experience} candidate applying for a ${opts.jobRole} role in India.

${tone}
${langLine}

How to ask questions:
- Ask exactly ONE question per turn. Keep it crisp — ideally 1–3 sentences.
- Build naturally on the candidate's previous answer. If they said something interesting, vague, or weak, follow up on THAT instead of jumping to a brand new topic.
- Vary the mix across the round: introduction / background, behavioural (STAR-style: tell me about a time…), situational ("what would you do if…"), role-specific technical / conceptual, problem-solving, and 1–2 HR / culture-fit questions near the end.
- Calibrate difficulty to "${opts.experience}". For fresher / intern, stay on fundamentals, projects, internships, college work. For experienced, go into system design, trade-offs, leadership, ownership, metrics.
- Make questions specific to "${opts.jobRole}" — reference real tools, concepts, scenarios from that role. Avoid generic filler.
- Occasionally ask the candidate to walk through their thinking out loud, give an example, or quantify impact.

What NOT to do:
- Do NOT give the answer, hints, model solutions, or evaluative commentary during the round.
- Do NOT say things like "Great answer", "Good point", "Next question:", "Let's move on" — just ask the next question directly.
- Do NOT number the questions.
- Do NOT ask more than one question at a time.
- Do NOT repeat a question that's already been asked.

Respond with ONLY the next question text. Nothing else.`;
}


export const interviewChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobRole: z.string().min(1).max(120),
      experience: z.string().min(1).max(40),
      mode: z.string().min(1).max(20),
      language: z.string().min(1).max(10),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          }),
        )
        .max(40),
      questionNumber: z.number().int().min(1).max(20),
    }),
  )
  .handler(async ({ data }) => {
    const messages: Msg[] = [
      { role: "system", content: systemPrompt(data) },
      ...data.history,
    ];
    if (data.history.length === 0) {
      messages.push({
        role: "user",
        content: "Please start the interview with your first question.",
      });
    }
    const content = await callGateway({
      model: MODEL,
      messages,
      stream: false,
    });
    return { question: content.trim(), number: data.questionNumber };
  });

export const scoreInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      jobRole: z.string().min(1).max(120),
      experience: z.string().min(1).max(40),
      durationSeconds: z.number().int().min(0).max(60 * 60 * 3),
      transcript: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          }),
        )
        .min(1)
        .max(60),
    }),
  )
  .handler(async ({ data, context }) => {
    const transcriptText = data.transcript
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const sys = `You are an interview evaluator. Score the candidate's performance honestly.
Return ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "overall": number 0-100,
  "confidence": number 0-100,
  "communication": number 0-100,
  "technical": number 0-100,
  "strengths": string[] (2-4 items),
  "improvements": string[] (2-4 items),
  "summary": string (2-3 sentences, plain text)
}`;

    const raw = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: `Role: ${data.jobRole} (${data.experience})\n\nTranscript:\n${transcriptText}`,
        },
      ],
      stream: false,
    });

    // Extract JSON
    let parsed: {
      overall: number;
      confidence: number;
      communication: number;
      technical: number;
      strengths: string[];
      improvements: string[];
      summary: string;
    };
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      parsed = {
        overall: 65,
        confidence: 65,
        communication: 65,
        technical: 60,
        strengths: ["Engaged through the round"],
        improvements: ["Could not parse AI scoring — try again"],
        summary: "Scoring fell back to defaults due to a parsing error.",
      };
    }

    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const overall = clamp(parsed.overall);
    const confidence = clamp(parsed.confidence);
    const communication = clamp(parsed.communication);
    const technical = clamp(parsed.technical);

    const { supabase } = context;
    const { error: rpcErr } = await supabase.rpc("complete_interview_session", {
      p_session: data.sessionId,
      p_overall: overall,
      p_confidence: confidence,
      p_communication: communication,
      p_technical: technical,
      p_duration: data.durationSeconds,
      p_feedback: {
        strengths: parsed.strengths ?? [],
        improvements: parsed.improvements ?? [],
        summary: parsed.summary ?? "",
        transcript: data.transcript,
      },
    });
    if (rpcErr) throw new Error(rpcErr.message);

    return { overall, confidence, communication, technical, summary: parsed.summary };
  });
