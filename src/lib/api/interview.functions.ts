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

function difficultyLine(d: string) {
  switch (d) {
    case "easy":
      return "Difficulty: EASY — warm-up level. Stick to definitions, basic concepts, simple project walk-throughs.";
    case "hard":
      return "Difficulty: HARD — senior-bar questions. Push on trade-offs, edge cases, scaling, ownership, real numbers.";
    case "brutal":
      return "Difficulty: BRUTAL — FAANG/top-product bar. Ruthless follow-ups, system design, ambiguity, stress tests. If an answer is hand-wavy, call it out and ask for specifics.";
    default:
      return "Difficulty: MEDIUM — standard interview bar. Mix of definitions, scenarios, and one or two probing questions.";
  }
}

function depthLine(d: string) {
  switch (d) {
    case "shallow":
      return "Depth: SHALLOW — broad coverage. Move topic after one answer. Minimal follow-ups.";
    case "deep":
      return "Depth: DEEP — after each candidate answer, ask 1–2 sharp follow-ups before changing topic. Drill into 'why', 'how', 'what would you do if…', concrete examples, and numbers. Do not change topic until the area is truly explored.";
    default:
      return "Depth: MODERATE — usually one follow-up per topic before moving on.";
  }
}

function systemPrompt(opts: {
  jobRole: string;
  experience: string;
  mode: string;
  language: string;
  difficulty: string;
  depth: string;
  resumeSummary?: string | null;
}) {
  const tone =
    opts.mode === "strict"
      ? "You are a strict, sharp recruiter at a top product company. Push back politely on vague or weak answers and probe for depth, numbers, and trade-offs."
      : opts.mode === "campus"
      ? "You are a campus placement panelist. Mix HR, aptitude reasoning, basic CS fundamentals, and one or two role-specific questions, like an Indian campus drive."
      : "You are a warm, encouraging senior interviewer who helps the candidate feel comfortable while still going deep.";

  const langLine =
    opts.language === "hi" || opts.language === "hinglish"
      ? "Language: natural Hinglish — mix Hindi and English the way Indian students actually speak. Keep technical terms in English."
      : "Language: clear, professional Indian English.";

  const resumeBlock = opts.resumeSummary?.trim()
    ? `\nCandidate background (from their resume):\n${opts.resumeSummary.trim()}\n\nUse this — reference their real projects, skills, and experience in at least 3 questions. Probe claims and ask for specifics from the resume.`
    : "";

  return `You are conducting a realistic mock interview for a ${opts.experience} candidate applying for a ${opts.jobRole} role in India.

${tone}
${langLine}
${difficultyLine(opts.difficulty)}
${depthLine(opts.depth)}
${resumeBlock}

How to ask questions:
- Ask exactly ONE question per turn. Keep it crisp — ideally 1–3 sentences.
- Build naturally on the candidate's previous answer. If they said something interesting, vague, or weak, follow up on THAT instead of jumping to a brand new topic.
- Vary the mix across the round: introduction / background, behavioural (STAR-style), situational, role-specific technical / conceptual, problem-solving, and 1–2 HR / culture-fit questions near the end.
- Calibrate to "${opts.experience}". For fresher / intern, stay on fundamentals, college projects, internships. For experienced, go into system design, trade-offs, leadership, ownership, metrics.
- Make questions specific to "${opts.jobRole}" — reference real tools, concepts, scenarios from that role. Avoid generic filler.

What NOT to do:
- Do NOT give the answer, hints, model solutions, or evaluative commentary during the round.
- Do NOT say "Great answer", "Good point", "Next question:", "Let's move on" — just ask the next question.
- Do NOT number the questions.
- Do NOT ask more than one question at a time.
- Do NOT repeat a question already asked.

Respond with ONLY the next question text. Nothing else.`;
}

export const interviewChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobRole: z.string().min(1).max(120),
      experience: z.string().min(1).max(40),
      mode: z.string().min(1).max(20),
      language: z.string().min(1).max(20),
      difficulty: z.enum(["easy", "medium", "hard", "brutal"]).default("medium"),
      depth: z.enum(["shallow", "moderate", "deep"]).default("moderate"),
      resumeSummary: z.string().max(4000).nullish(),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          }),
        )
        .max(60),
      questionNumber: z.number().int().min(1).max(30),
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

export const summarizeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      resumeText: z.string().min(20).max(20000),
    }),
  )
  .handler(async ({ data, context }) => {
    const sys = `You compress a candidate's resume into a tight, interviewer-friendly briefing.
Return ONLY plain text (no markdown), 120–200 words, with these labelled sections, each one short paragraph:
Role target: ...
Experience: ...
Key skills: ...
Notable projects: ...
Achievements / numbers: ...
Red flags / gaps: ...
Probe areas: ...`;

    const summary = (
      await callGateway({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: data.resumeText.slice(0, 20000) },
        ],
        stream: false,
      })
    ).trim();

    const { supabase } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ resume_text: data.resumeText, resume_summary: summary })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);
    if (error) throw new Error(error.message);

    return { summary };
  });

export const scoreInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      jobRole: z.string().min(1).max(120),
      experience: z.string().min(1).max(40),
      difficulty: z.enum(["easy", "medium", "hard", "brutal"]).default("medium"),
      durationSeconds: z.number().int().min(0).max(60 * 60 * 3),
      transcript: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          }),
        )
        .min(1)
        .max(120),
    }),
  )
  .handler(async ({ data, context }) => {
    const transcriptText = data.transcript
      .map((m, i) => `[${i + 1}] ${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const sys = `You are a senior interview evaluator scoring at "${data.difficulty}" bar.
Be honest and specific — no flattery. For weak answers, score low.
Return ONLY valid JSON (no markdown, no commentary) matching this schema EXACTLY:
{
  "overall": number 0-100,
  "confidence": number 0-100,
  "communication": number 0-100,
  "technical": number 0-100,
  "strengths": string[] (2-4 short items),
  "improvements": string[] (2-4 short items),
  "summary": string (3-4 sentences, plain text, direct feedback addressed to the candidate),
  "questionFeedback": [
    {
      "question": string (paraphrased interviewer question, max 140 chars),
      "answer": string (paraphrased candidate answer, max 200 chars; "(no answer)" if missing),
      "score": number 0-100,
      "verdict": "weak" | "ok" | "good" | "excellent",
      "comment": string (1-2 sentences, what was good or missing),
      "modelAnswer": string (2-4 sentences of an ideal answer the candidate could have given)
    }
  ] (one entry per interviewer question, in order),
  "actionPlan": string[] (3-5 concrete next-step actions, each starts with a verb)
}`;

    const raw = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: `Role: ${data.jobRole} (${data.experience}) · Difficulty: ${data.difficulty}\n\nTranscript:\n${transcriptText}`,
        },
      ],
      stream: false,
    });

    type QFB = {
      question: string;
      answer: string;
      score: number;
      verdict: string;
      comment: string;
      modelAnswer: string;
    };
    type Parsed = {
      overall: number;
      confidence: number;
      communication: number;
      technical: number;
      strengths: string[];
      improvements: string[];
      summary: string;
      questionFeedback: QFB[];
      actionPlan: string[];
    };

    let parsed: Parsed;
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      parsed = JSON.parse(cleaned.slice(start, end + 1)) as Parsed;
    } catch {
      parsed = {
        overall: 60,
        confidence: 60,
        communication: 60,
        technical: 55,
        strengths: ["Engaged through the round"],
        improvements: ["Scoring AI returned unparseable output — try again"],
        summary: "Scoring fell back to defaults due to a parsing error.",
        questionFeedback: [],
        actionPlan: ["Retry the interview to get full feedback"],
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
        questionFeedback: parsed.questionFeedback ?? [],
        actionPlan: parsed.actionPlan ?? [],
        transcript: data.transcript,
      },
    });
    if (rpcErr) throw new Error(rpcErr.message);

    return { overall, confidence, communication, technical, summary: parsed.summary };
  });
