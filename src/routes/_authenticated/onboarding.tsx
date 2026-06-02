import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Check, Upload, FileText, X, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS } from "@/lib/billing/plans";
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
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [step, setStep] = useState(0);
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState<string>("fresher");
  const [mode, setMode] = useState<string>("friendly");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setJobRole(profile.default_job_role ?? "");
    setExperience(profile.default_experience_level ?? "fresher");
    setMode(profile.default_interview_mode ?? "friendly");
    setResumeUrl(profile.resume_url ?? null);
    setResumeFileName(profile.resume_file_name ?? null);
  }, [profile]);

  const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  const handleUpload = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Upload a PDF or image (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is too large. Max 10 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const path = `${userId}/resume-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    setResumeUrl(path);
    setResumeFileName(file.name);
    setUploading(false);
    toast.success("Resume uploaded");
  };

  const removeResume = async () => {
    if (resumeUrl) {
      await supabase.storage.from("resumes").remove([resumeUrl]);
    }
    setResumeUrl(null);
    setResumeFileName(null);
  };

  const finish = async () => {
    if (!jobRole.trim()) {
      toast.error("Tell us your target job role first");
      setStep(0);
      return;
    }
    setSaving(true);
    const payload = {
      id: userId,
      display_name: profile?.display_name ?? user?.email?.split("@")[0] ?? "Student",
      avatar_url: profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null,
      default_job_role: jobRole.trim(),
      default_experience_level: experience,
      default_interview_mode: mode,
      resume_url: resumeUrl,
      resume_file_name: resumeFileName,
      onboarding_completed: true,
    };

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.setQueryData(["profile", userId], updatedProfile);
    toast.success("All set — let's get cracking.");
    navigate({ to: "/dashboard" });
  };

  if (profile?.onboarding_completed) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary-glow" /> Quick setup · Step {step + 1} of 5
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
          {step === 3 && (
            <>
              Upload your <span className="text-gradient">resume</span>{" "}
              <span className="text-muted-foreground text-xl md:text-2xl font-medium">(optional)</span>
            </>
          )}
          {step === 4 && (
            <>
              Pick a <span className="text-gradient">plan</span>{" "}
              <span className="text-muted-foreground text-xl md:text-2xl font-medium">(you can start free)</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          {step === 3
            ? "PDF or image (PNG, JPG, WEBP), up to 10 MB. We'll use it to personalise your interviews."
            : step === 4
            ? "Start free — no card needed. Upgrade any time from Billing to unlock more interviews and advanced feedback."
            : "We'll use this to tailor every new interview. You can change it any time in Settings."}
        </p>
      </motion.div>

      <div className="mt-6 h-1.5 rounded-full clay-inset overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${((step + 1) / 5) * 100}%` }}
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

        {step === 3 && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            {!resumeUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full clay-inset rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center hover:bg-foreground/[0.02] transition disabled:opacity-60"
              >
                <span
                  className="grid place-items-center w-12 h-12 rounded-2xl"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </span>
                <span className="font-medium text-sm">
                  {uploading ? "Uploading…" : "Click to upload your resume"}
                </span>
                <span className="text-xs text-muted-foreground">PDF, PNG, JPG or WEBP · up to 10 MB</span>
              </button>
            ) : (
              <div className="clay-sm rounded-2xl p-4 flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl clay-inset shrink-0">
                  <FileText className="w-4 h-4 text-primary-glow" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{resumeFileName ?? "Resume"}</div>
                  <div className="text-xs text-muted-foreground">Uploaded · ready to use</div>
                </div>
                <button
                  type="button"
                  onClick={removeResume}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Remove resume"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Skip this step if you'd rather upload later from Settings.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-3 md:grid-cols-3">
            {(["free", "pro", "premium"] as const).map((pid) => {
              const p = PLANS[pid];
              const featured = pid === "pro";
              return (
                <div
                  key={pid}
                  className={
                    "p-4 rounded-2xl flex flex-col gap-3 " +
                    (featured ? "clay-sm ring-2 ring-primary/40" : "clay-inset")
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {p.tagline}
                      </div>
                      <div className="font-display font-bold text-lg flex items-center gap-1.5">
                        {pid !== "free" && <Crown className="w-4 h-4 text-primary-glow" />}
                        {p.name}
                      </div>
                    </div>
                    {p.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full clay-sm text-primary-glow">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-gradient">
                      {p.priceLabel}
                    </span>
                    {p.pricePaise > 0 && (
                      <span className="text-xs text-muted-foreground">/month</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground flex-1">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary-glow mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <p className="md:col-span-3 text-xs text-muted-foreground text-center mt-1">
              You'll start on the Free plan. Upgrade any time from Billing — no pressure.
            </p>
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
        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 0 && !jobRole.trim()) {
                toast.error("Add a job role first");
                return;
              }
              setStep((s) => Math.min(4, s + 1));
            }}
            className="btn-clay"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await finish();
                navigate({ to: "/upgrade" });
              }}
              disabled={saving || uploading}
              className="btn-ghost-clay text-sm"
            >
              <Crown className="w-4 h-4" /> See upgrade options
            </button>
            <button type="button" onClick={finish} disabled={saving || uploading} className="btn-clay">
              {saving ? "Saving…" : <>Start with Free <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
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
