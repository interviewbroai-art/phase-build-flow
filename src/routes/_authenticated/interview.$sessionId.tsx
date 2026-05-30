import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Send, Square, Clock, Sparkles, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { interviewChat, scoreInterview } from "@/lib/api/interview.functions";

export const Route = createFileRoute("/_authenticated/interview/$sessionId")({
  head: () => ({ meta: [{ title: "Interview in progress — InterviewBro AI" }] }),
  component: InterviewRoomPage,
});

const TOTAL_QUESTIONS = 10;

type Turn = { role: "user" | "assistant"; content: string };

function InterviewRoomPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const chatFn = useServerFn(interviewChat);
  const scoreFn = useServerFn(scoreInterview);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", "resume-summary"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("resume_summary")
        .maybeSingle();
      return data;
    },
  });


  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const askedRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll — only inside the transcript container, never the page
  useEffect(() => {
    const el = bottomRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, thinking]);


  // Kick off the first question once session is loaded
  const initRef = useRef(false);
  useEffect(() => {
    if (!session || initRef.current) return;
    if (session.status !== "in_progress") {
      navigate({ to: "/sessions/$sessionId", params: { sessionId }, replace: true });
      return;
    }
    initRef.current = true;
    void askNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const askNext = async (history: Turn[]) => {
    if (!session) return;
    setThinking(true);
    try {
      const res = await chatFn({
        data: {
          jobRole: session.job_role,
          experience: session.experience_level,
          mode: session.mode,
          language: session.language,
          difficulty: (session.difficulty ?? "medium") as "easy" | "medium" | "hard" | "brutal",
          depth: (session.depth ?? "moderate") as "shallow" | "moderate" | "deep",
          resumeSummary: profile?.resume_summary ?? null,
          history,
          questionNumber: askedRef.current + 1,
        },
      });
      askedRef.current += 1;
      setTranscript((prev) => [...prev, { role: "assistant", content: res.question }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed to respond");
    } finally {
      setThinking(false);
    }
  };


  const sendAnswer = async () => {
    const text = input.trim();
    if (!text || thinking || ending) return;
    const next: Turn[] = [...transcript, { role: "user", content: text }];
    setTranscript(next);
    setInput("");

    if (askedRef.current >= TOTAL_QUESTIONS) {
      await endInterview(next);
      return;
    }
    await askNext(next);
  };

  const endInterview = async (finalTranscript?: Turn[]) => {
    if (ending) return;
    const tr = finalTranscript ?? transcript;
    if (tr.length === 0) {
      toast.error("Answer at least one question before ending.");
      return;
    }
    setEnding(true);
    const toastId = toast.loading("Scoring your interview…");
    try {
      await scoreFn({
        data: {
          sessionId,
          jobRole: session!.job_role,
          experience: session!.experience_level,
          durationSeconds: Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)),
          transcript: tr,
        },
      });
      toast.success("Interview complete! XP awarded.", { id: toastId });
      navigate({ to: "/sessions/$sessionId", params: { sessionId }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed", { id: toastId });
      setEnding(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />
      </div>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const progress = Math.min(100, (askedRef.current / TOTAL_QUESTIONS) * 100);

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto flex flex-col h-[100dvh] min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="clay-inset px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-accent" />
            {mm}:{ss}
          </span>
          <span className="clay-inset px-3 py-1.5 rounded-full">
            Q{Math.min(askedRef.current, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
          </span>
        </div>
      </div>

      {/* Title + progress */}
      <div className="clay p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {session.experience_level} · {session.mode} · {session.interview_type}
            </div>
            <h1 className="text-lg font-semibold truncate flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-glow shrink-0" /> {session.job_role}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => endInterview()}
            disabled={ending || thinking}
            className="btn-ghost-clay text-xs"
          >
            <Square className="w-3 h-3" />
            {ending ? "Scoring…" : "End interview"}
          </button>
        </div>
        <div className="mt-3 h-1.5 rounded-full clay-inset overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: "var(--gradient-primary)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 mb-4 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {transcript.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={"flex gap-3 " + (m.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={
                  "w-9 h-9 rounded-2xl grid place-items-center shrink-0 " +
                  (m.role === "user" ? "clay-sm" : "clay-sm")
                }
                style={m.role === "assistant" ? { background: "var(--gradient-primary)" } : undefined}
              >
                {m.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
              <div
                className={
                  "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap " +
                  (m.role === "user" ? "clay-sm" : "clay-inset")
                }
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div
              className="w-9 h-9 rounded-2xl grid place-items-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="clay-inset px-4 py-3 rounded-2xl text-sm inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="clay p-2 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAnswer();
              }
            }}
            placeholder={
              thinking ? "Interviewer is thinking…" : ending ? "Scoring…" : "Type your answer… (Shift+Enter for newline)"
            }
            disabled={thinking || ending}
            rows={2}
            className="flex-1 clay-inset px-4 py-3 text-sm bg-transparent outline-none resize-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={sendAnswer}
            disabled={thinking || ending || !input.trim()}
            className="btn-clay h-12 px-4 shrink-0"
            aria-label="Send answer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
