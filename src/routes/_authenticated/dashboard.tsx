import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Flame,
  Trophy,
  Zap,
  Target,
  Play,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Check,
  X as XIcon,
  CalendarDays,
  Mic,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { UpgradeReminder } from "@/components/UpgradeReminder";
import { UpgradeSection } from "@/components/UpgradeSection";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — InterviewBro AI" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const userId = user!.id;


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

  const { data: sessions } = useQuery({
    queryKey: ["sessions", userId, "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Last 30 days for streak/weekly widget
  const { data: weekly } = useQuery({
    queryKey: ["sessions", userId, "weekly"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id,status,completed_at,created_at")
        .gte("created_at", since.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const firstName =
    (profile?.display_name ?? user?.user_metadata?.display_name ?? user?.email?.split("@")[0]) ||
    "there";
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;
  const longest = profile?.longest_streak ?? 0;
  const xpInLevel = xp % 500;
  const xpPct = Math.min(100, (xpInLevel / 500) * 100);


  return (
    <div className="px-4 py-5 md:px-6 md:py-10 max-w-6xl mx-auto">
      <UpgradeReminder plan={(profile as any)?.plan} planExpiresAt={(profile as any)?.plan_expires_at} />
      {/* Mobile brand */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-2xl clay-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          </span>
          <span className="font-display font-bold text-sm">
            InterviewBro<span className="text-gradient"> AI</span>
          </span>
        </Link>
        <Link to="/settings" className="w-8 h-8 rounded-2xl clay-sm grid place-items-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-display font-bold text-gradient">
              {firstName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4"
      >
        <div>
          <p className="text-xs md:text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-0.5 text-2xl md:text-4xl font-bold">
            Hi {firstName} <span className="text-gradient">👋</span>
          </h1>
          <p className="mt-1 md:mt-2 text-muted-foreground text-xs md:text-sm max-w-md">
            {profile?.default_job_role
              ? `Defaults: ${profile.default_job_role} · ${profile.default_interview_mode}`
              : "Set up your defaults in Settings."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Link to="/interview/new" className="btn-clay">
            <Play className="w-4 h-4" /> Start new interview
          </Link>
          <Link to="/interview/voice" className="btn-ghost-clay">
            <Mic className="w-4 h-4" /> Voice mode
          </Link>
          <Link to="/interview/video" className="btn-ghost-clay">
            <Video className="w-4 h-4" /> Video simulation
          </Link>
        </div>


      </motion.div>

      {(() => {
        const p = (profile as any)?.plan;
        const exp = (profile as any)?.plan_expires_at;
        const isActivePaid = p && p !== "free" && exp && new Date(exp).getTime() > Date.now();
        return isActivePaid ? null : (
          <UpgradeSection plan={p} planExpiresAt={exp} />
        );
      })()}

      {/* Stats */}
      <div className="mt-6 md:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Flame} label="Current streak" value={`${streak} days`} sub={`Best: ${longest}`} accent />
        <StatCard
          icon={Zap}
          label="Level"
          value={`Lvl ${level}`}
          sub={`${xpInLevel} / 500 XP to Lvl ${level + 1}`}
          pct={xpPct}
        />
        <StatCard icon={Trophy} label="Total XP" value={xp.toLocaleString("en-IN")} />
        <StatCard icon={Target} label="Sessions (30d)" value={String(weekly?.length ?? 0)} />
      </div>


      {/* Streak analytics widget */}
      <StreakWidget sessions={weekly ?? []} currentStreak={streak} longest={longest} />

      {/* Quick start */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Jump back in</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, title: "Friendly practice", desc: "Warm up with low-pressure questions.", mode: "friendly" },
            { icon: Briefcase, title: "Strict HR round", desc: "Real recruiter pace and follow-ups.", mode: "strict" },
            { icon: GraduationCap, title: "Campus placement", desc: "Aptitude + HR, mass-recruiter style.", mode: "campus" },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Link to="/interview/new" className="clay p-6 text-left group block">
                <div className="w-11 h-11 rounded-2xl clay-sm grid place-items-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <c.icon className="w-5 h-5 text-primary-glow" />
                </div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary-glow font-medium">
                  Start <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent sessions */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent interviews</h2>
          <Link
            to="/history"
            className="text-xs text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {!sessions || sessions.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl clay-sm grid place-items-center">
              <Sparkles className="w-5 h-5 text-primary-glow" />
            </div>
            <h3 className="mt-4 font-semibold">No interviews yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start your first interview to begin earning XP and building a streak.
            </p>
          </div>
        ) : (
          <div className="clay p-2">
            <div className="clay-inset rounded-xl divide-y divide-border/30">
              {sessions.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  to="/sessions/$sessionId"
                  params={{ sessionId: s.id }}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-foreground/[0.03] transition group"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.job_role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {s.experience_level} · {s.interview_type} · {s.mode}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.overall_score != null && (
                      <span className="clay-sm px-2.5 py-1 rounded-full text-xs flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-accent" />
                        {s.overall_score}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------ Streak analytics widget ------------------ */

type WeeklySession = {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

function StreakWidget({
  sessions,
  currentStreak,
  longest,
}: {
  sessions: WeeklySession[];
  currentStreak: number;
  longest: number;
}) {
  const days = useMemo(() => {
    const out: {
      date: Date;
      key: string;
      label: string;
      weekday: string;
      isToday: boolean;
      isFuture: boolean;
      count: number;
      completed: number;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build last 7 days (oldest -> today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        date: d,
        key,
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
        isToday: i === 0,
        isFuture: false,
        count: 0,
        completed: 0,
      });
    }

    for (const s of sessions) {
      const d = new Date(s.created_at);
      const key = d.toISOString().slice(0, 10);
      const slot = out.find((x) => x.key === key);
      if (slot) {
        slot.count++;
        if (s.status === "completed") slot.completed++;
      }
    }
    return out;
  }, [sessions]);

  const completedDays = days.filter((d) => d.completed > 0).length;
  const missedDays = days.filter((d) => d.completed === 0 && !d.isToday).length;
  const totalSessions = days.reduce((acc, d) => acc + d.count, 0);

  // Explanation for missed days
  const missedExplanation = useMemo(() => {
    const missed = days.filter((d) => d.completed === 0 && !d.isToday).map((d) => d.weekday);
    if (missed.length === 0) return "Perfect week — every day had a completed round.";
    if (missed.length === 7) return "You haven't practised in the last week. Streaks reset after one missed day.";
    return `Missed practice on ${missed.join(", ")}. Each gap day breaks your streak — finish at least one session daily to keep the flame alive.`;
  }, [days]);

  return (
    <section className="mt-8 clay p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary-glow" /> Last 7 days
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Daily completion · streak rules apply.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="clay-inset px-3 py-1.5 rounded-full">
            <span className="text-muted-foreground">Done</span>{" "}
            <span className="font-medium text-foreground">{completedDays}/7</span>
          </span>
          <span className="clay-inset px-3 py-1.5 rounded-full">
            <span className="text-muted-foreground">Streak</span>{" "}
            <span className="font-medium text-foreground">{currentStreak}d</span>
          </span>
          <span className="clay-inset px-3 py-1.5 rounded-full">
            <span className="text-muted-foreground">Best</span>{" "}
            <span className="font-medium text-foreground">{longest}d</span>
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const done = d.completed > 0;
          const isMissed = !done && !d.isToday;
          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="text-center"
              title={
                done
                  ? `${d.completed} completed session${d.completed > 1 ? "s" : ""} · ${d.label}`
                  : d.isToday
                  ? `Today · ${d.count} session${d.count === 1 ? "" : "s"} so far`
                  : `Missed · ${d.label}`
              }
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {d.weekday}
              </div>
              <div
                className={
                  "mt-1.5 mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-2xl grid place-items-center transition " +
                  (done
                    ? "clay-sm ring-1 ring-primary/40"
                    : d.isToday
                    ? "clay-inset ring-1 ring-accent/40"
                    : "clay-inset opacity-60")
                }
                style={
                  done ? { background: "var(--gradient-primary)" } : undefined
                }
              >
                {done ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : d.isToday ? (
                  <Flame className="w-4 h-4 text-accent" />
                ) : (
                  <XIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={
                  "mt-1 text-[10px] " +
                  (isMissed ? "text-muted-foreground/70" : "text-muted-foreground")
                }
              >
                {d.date.getDate()}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
        <MiniStat label="Days completed" value={`${completedDays}/7`} tone="ok" />
        <MiniStat label="Missed days" value={String(missedDays)} tone={missedDays > 0 ? "warn" : "ok"} />
        <MiniStat label="Total sessions" value={String(totalSessions)} />
      </div>

      <div className="mt-4 clay-inset rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">Streak rules:</span> finish at least one
        session per day. Same-day extras don't add to the streak. Skip a day and the counter
        resets to 1 on your next session. {missedExplanation}
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const color =
    tone === "warn" ? "text-accent" : tone === "ok" ? "text-primary-glow" : "text-foreground";
  return (
    <div className="clay-inset rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display font-bold text-lg " + color}>{value}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  pct,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub?: string;
  pct?: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="clay p-3.5 md:p-5"
    >
      <div className="flex items-center gap-2.5 md:gap-3">
        <span
          className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl grid place-items-center shrink-0 ${
            accent ? "" : "clay-sm"
          }`}
          style={accent ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" } : undefined}
        >
          <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${accent ? "text-primary-foreground" : "text-primary-glow"}`} />
        </span>
        <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest leading-tight">{label}</span>
      </div>
      <div className="mt-2 md:mt-3 text-lg md:text-2xl font-display font-bold">{value}</div>
      {sub && <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{sub}</div>}

      {pct != null && (
        <div className="mt-3 h-1.5 rounded-full clay-inset overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          />
        </div>
      )}
    </motion.div>
  );
}
