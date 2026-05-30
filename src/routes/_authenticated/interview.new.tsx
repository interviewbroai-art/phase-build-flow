import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Play,
  Briefcase,
  MessageSquare,
  GraduationCap,
  Sparkles,
  Clock,
  Flame,
  Layers,
  FileText,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/interview/new")({
  head: () => ({ meta: [{ title: "New interview — InterviewBro AI" }] }),
  component: NewInterviewPage,
});

const ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "Product Manager",
  "Business Analyst",
  "DevOps Engineer",
];

const EXPERIENCE = ["fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"];

const MODES = [
  { id: "friendly", label: "Friendly", icon: MessageSquare, desc: "Warm, low-pressure" },
  { id: "strict", label: "Strict HR", icon: Briefcase, desc: "Real recruiter pace" },
  { id: "campus", label: "Campus", icon: GraduationCap, desc: "Placement style" },
] as const;

const TYPES = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "mixed", label: "Mixed" },
] as const;

const DIFFICULTIES = [
  { id: "easy", label: "Easy", desc: "Warm-up · basics", emoji: "🌱" },
  { id: "medium", label: "Medium", desc: "Standard bar", emoji: "⚡" },
  { id: "hard", label: "Hard", desc: "Senior bar · trade-offs", emoji: "🔥" },
  { id: "brutal", label: "Brutal", desc: "FAANG bar · ruthless", emoji: "💀" },
] as const;

const DEPTHS = [
  { id: "shallow", label: "Shallow", desc: "Broad, fast pace" },
  { id: "moderate", label: "Moderate", desc: "1 follow-up per topic" },
  { id: "deep", label: "Deep", desc: "Drill until exhausted" },
] as const;

type Difficulty = (typeof DIFFICULTIES)[number]["id"];
type Depth = (typeof DEPTHS)[number]["id"];

function NewInterviewPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("fresher");
  const [mode, setMode] = useState<"friendly" | "strict" | "campus">("friendly");
  const [interviewType, setInterviewType] = useState<"technical" | "behavioral" | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [depth, setDepth] = useState<Depth>("moderate");

  useEffect(() => {
    if (!profile) return;
    setJobRole(profile.default_job_role || "Software Engineer");
    setExperience(profile.default_experience_level || "fresher");
    const m = (profile.default_interview_mode as "friendly" | "strict" | "campus") || "friendly";
    setMode(m);
    if (profile.default_difficulty) setDifficulty(profile.default_difficulty as Difficulty);
    if (profile.default_depth) setDepth(profile.default_depth as Depth);
  }, [profile]);

  const hasResume = !!profile?.resume_summary?.trim();

  const start = async () => {
    if (!jobRole.trim()) {
      toast.error("Pick a job role to continue");
      return;
    }
    setStarting(true);
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: userId,
          job_role: jobRole,
          experience_level: experience,
          mode,
          interview_type: interviewType,
          difficulty,
          depth,
          language: profile?.preferred_language ?? "en",
          status: "in_progress",
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate({ to: "/interview/$sessionId", params: { sessionId: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start interview");
      setStarting(false);
    }
  };

  return (
    <div className="px-6 py-8 md:py-10 max-w-3xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl clay-sm">
            <Sparkles className="w-5 h-5 text-primary-glow" />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Start a new interview</h1>
            <p className="text-sm text-muted-foreground">
              Tune how hard and deep the AI should grill you.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 clay p-6 space-y-6">
        {/* Resume hint */}
        <Link
          to="/settings"
          className={
            "flex items-start gap-3 p-3 rounded-2xl text-xs transition " +
            (hasResume
              ? "clay-inset text-muted-foreground"
              : "clay-inset hover:bg-foreground/[0.04] text-muted-foreground")
          }
        >
          <FileText className="w-4 h-4 mt-0.5 shrink-0 text-primary-glow" />
          <div className="flex-1">
            {hasResume ? (
              <>
                <span className="inline-flex items-center gap-1 text-primary-glow">
                  <Check className="w-3 h-3" /> Resume linked
                </span>
                <span className="ml-1">— interviewer will probe your real projects and skills.</span>
              </>
            ) : (
              <>
                <span className="text-foreground">Paste your resume in Settings</span> to make
                questions personal — the AI will reference your projects, internships and skills.
              </>
            )}
          </div>
        </Link>

        {/* Job role */}
        <Field label="Job role">
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            list="role-suggestions"
            placeholder="e.g. Frontend Developer"
            className="w-full clay-inset px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <datalist id="role-suggestions">
            {ROLES.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>

        {/* Experience */}
        <Field label="Experience level">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setExperience(e)}
                className={
                  "px-4 py-2 rounded-2xl text-sm transition " +
                  (experience === e
                    ? "clay-sm ring-2 ring-primary/50"
                    : "clay-inset text-muted-foreground hover:text-foreground")
                }
              >
                {e}
              </button>
            ))}
          </div>
        </Field>

        {/* Mode */}
        <Field label="Interviewer mode">
          <div className="grid sm:grid-cols-3 gap-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={
                  "p-4 rounded-2xl text-left transition " +
                  (mode === m.id
                    ? "clay-sm ring-2 ring-primary/50"
                    : "clay-inset hover:bg-foreground/[0.03]")
                }
              >
                <m.icon className="w-4 h-4 text-primary-glow mb-2" />
                <div className="font-medium text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </Field>

        {/* Difficulty */}
        <Field
          label="How hard?"
          icon={<Flame className="w-3.5 h-3.5 text-accent" />}
          help="Controls the bar — easy is warm-up, brutal is FAANG-level grilling."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={
                  "p-3 rounded-2xl text-left transition " +
                  (difficulty === d.id
                    ? "clay-sm ring-2 ring-primary/50"
                    : "clay-inset hover:bg-foreground/[0.03]")
                }
              >
                <div className="text-lg leading-none">{d.emoji}</div>
                <div className="mt-2 font-medium text-sm">{d.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </Field>

        {/* Depth */}
        <Field
          label="How deep?"
          icon={<Layers className="w-3.5 h-3.5 text-accent" />}
          help="How many follow-ups before the interviewer moves to the next topic."
        >
          <div className="grid sm:grid-cols-3 gap-3">
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDepth(d.id)}
                className={
                  "p-3 rounded-2xl text-left transition " +
                  (depth === d.id
                    ? "clay-sm ring-2 ring-primary/50"
                    : "clay-inset hover:bg-foreground/[0.03]")
                }
              >
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </Field>

        {/* Type */}
        <Field label="Question mix">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterviewType(t.id)}
                className={
                  "px-4 py-2 rounded-2xl text-sm transition " +
                  (interviewType === t.id
                    ? "clay-sm ring-2 ring-primary/50"
                    : "clay-inset text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="clay-inset rounded-2xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <div>
            ~15 min session · 10 questions · per-question feedback, model answers and an action plan
            at the end.
          </div>
        </div>

        <button
          type="button"
          disabled={starting}
          onClick={start}
          className="btn-clay w-full justify-center"
        >
          <Play className="w-4 h-4" />
          {starting ? "Starting…" : "Begin interview"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  icon,
  help,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  help?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {icon}
        {label}
      </label>
      {help && <p className="text-[11px] text-muted-foreground/80 mb-2 -mt-1">{help}</p>}
      {children}
    </div>
  );
}
