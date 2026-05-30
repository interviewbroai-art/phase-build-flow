import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — InterviewBro AI" }] }),
  component: OnboardingPage,
});

const MODES = [
  { value: "friendly", label: "Friendly practice", desc: "Warm-up. Patient AI, easy follow-ups." },
  { value: "strict", label: "Strict HR", desc: "Recruiter pace. Sharp follow-ups." },
  { value: "campus", label: "Campus placement", desc: "Aptitude + HR, group-recruiter style." },
] as const;

const EXPERIENCE = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher (0-1 yr)" },
  { value: "junior", label: "Junior (1-3 yr)" },
  { value: "mid", label: "Mid (3-6 yr)" },
] as const;

const POPULAR_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Product Manager",
  "UI/UX Designer",
  "DevOps Engineer",
  "QA Engineer",
];

const inputCls =
  "w-full clay-inset px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60";

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = user!.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      return data;
    },
  });

  const [step, setStep] = useState(0);
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState<string>("fresher");
  const [mode, setMode] = useState<string>("friendly");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setJobRole(profile.default_job_role ?? "");
    setExperience(profile.default_experience_level ?? "fresher");
    setMode(profile.default_interview_mode ?? "friendly");
  }, [profile]);

  const finish = async () => {
    if (!jobRole.trim()) {
      toast.error("Tell us your target job role first");
      setStep(0);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        default_job_role: jobRole.trim(),
        default_experience_level: experience,
        default_interview_mode: mode,
        onboarding_completed: true,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile", userId] });
    toast.success("All set — let's get cracking.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary-glow" /> Quick setup · Step {step + 1} of 3
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          {step === 0 && (
            <>
              What role are you <span className="text-gradient">interviewing for</span>?
            </>
          )}
          {step === 1 && (
            <>
              How much <span className="text-gradient">experience</span> do you have?
            </>
          )}
          {step === 2 && (
            <>
              Pick your <span className="text-gradient">default vibe</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          We'll use this to tailor every new interview. You can change it any time in Settings.
        </p>
      </motion.div>

      <div className="mt-6 h-1.5 rounded-full clay-inset overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${((step + 1) / 3) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full"
          style={{ background: "var(--gradient-primary)" }}
        />
      </div>

      <div className="mt-8 clay p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className={inputCls}
            />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Popular</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setJobRole(r)}
                    className={
                      "px-3 py-1.5 rounded-full text-xs transition " +
                      (jobRole === r ? "clay-sm text-foreground" : "clay-inset text-muted-foreground hover:text-foreground")
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {EXPERIENCE.map((e) => (
              <OptionCard
                key={e.value}
                selected={experience === e.value}
                onClick={() => setExperience(e.value)}
                title={e.label}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3">
            {MODES.map((m) => (
              <OptionCard
                key={m.value}
                selected={mode === m.value}
                onClick={() => setMode(m.value)}
                title={m.label}
                desc={m.desc}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="btn-ghost-clay"
          disabled={step === 0}
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 0 && !jobRole.trim()) {
                toast.error("Add a job role first");
                return;
              }
              setStep((s) => Math.min(2, s + 1));
            }}
            className="btn-clay"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={finish} disabled={saving} className="btn-clay">
            {saving ? "Saving…" : <>Finish setup <ArrowRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left p-4 rounded-2xl transition flex items-start gap-3 " +
        (selected ? "clay-sm ring-2 ring-primary/40" : "clay-inset hover:bg-foreground/[0.02]")
      }
    >
      <span
        className={
          "mt-0.5 w-5 h-5 rounded-full grid place-items-center shrink-0 " +
          (selected ? "" : "clay-inset")
        }
        style={selected ? { background: "var(--gradient-primary)" } : undefined}
      >
        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
      </span>
      <span>
        <span className="block font-medium text-sm">{title}</span>
        {desc && <span className="block text-xs text-muted-foreground mt-1">{desc}</span>}
      </span>
    </button>
  );
}
