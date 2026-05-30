import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { User as UserIcon, ImageIcon, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — InterviewBro AI" }] }),
  component: SettingsPage,
});

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "hinglish", label: "Hinglish" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
] as const;

const MODES = [
  { value: "friendly", label: "Friendly practice" },
  { value: "strict", label: "Strict HR" },
  { value: "campus", label: "Campus placement" },
] as const;

const EXPERIENCE = [
  { value: "student", label: "Student" },
  { value: "fresher", label: "Fresher (0-1 yr)" },
  { value: "junior", label: "Junior (1-3 yr)" },
  { value: "mid", label: "Mid (3-6 yr)" },
] as const;

const inputCls =
  "w-full clay-inset px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60";

function SettingsPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
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

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [jobRole, setJobRole] = useState("");
  const [experience, setExperience] = useState("fresher");
  const [mode, setMode] = useState("friendly");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setLanguage(profile.preferred_language ?? "en");
    setJobRole(profile.default_job_role ?? "");
    setExperience(profile.default_experience_level ?? "fresher");
    setMode(profile.default_interview_mode ?? "friendly");
  }, [profile]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        preferred_language: language,
        default_job_role: jobRole.trim() || null,
        default_experience_level: experience,
        default_interview_mode: mode,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const initials = (displayName || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-6 py-8 md:py-10 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold">Your profile</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Update how you appear and your default interview preferences.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {/* Identity */}
        <section className="clay p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary-glow" /> Identity
          </h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl clay-sm grid place-items-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.currentTarget.style.display = "none"))}
                />
              ) : (
                <span className="font-display font-bold text-xl text-gradient">{initials}</span>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <Field label="Display name">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Priya Sharma"
                  className={inputCls}
                  disabled={isLoading}
                />
              </Field>
              <Field label="Avatar URL">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…"
                    className={inputCls + " pl-10"}
                    disabled={isLoading}
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="clay p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-glow" /> Interview preferences
          </h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <Field label="Default job role">
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="Frontend developer"
                className={inputCls}
                disabled={isLoading}
              />
            </Field>
            <Field label="Experience level">
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={inputCls}
                disabled={isLoading}
              >
                {EXPERIENCE.map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default mode">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className={inputCls}
                disabled={isLoading}
              >
                {MODES.map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred language">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={inputCls}
                disabled={isLoading}
              >
                {LANGUAGES.map((o) => (
                  <option key={o.code} value={o.code} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Signed in as <span className="text-foreground">{user?.email}</span>
          </p>
          <button type="submit" disabled={saving || isLoading} className="btn-clay">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
