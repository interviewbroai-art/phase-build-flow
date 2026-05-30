import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
    queryKey: ["sessions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
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
  const xpForNext = level * 500;
  const xpInLevel = xp % xpForNext;
  const xpPct = Math.min(100, (xpInLevel / xpForNext) * 100);

  return (
    <div className="px-6 py-8 md:py-10 max-w-6xl mx-auto">
      {/* Mobile brand */}
      <div className="lg:hidden mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm">
            <Sparkles className="w-4 h-4 text-primary-glow" />
          </span>
          <span className="font-display font-bold">
            InterviewBro<span className="text-gradient"> AI</span>
          </span>
        </Link>
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold">
            Hi {firstName} <span className="text-gradient">👋</span>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-md">
            Ready for today's round? Keep the streak alive.
          </p>
        </div>
        <button
          className="btn-clay self-start md:self-auto"
          onClick={() => alert("Mock interview flow coming in Phase 3!")}
        >
          <Play className="w-4 h-4" /> Start new interview
        </button>
      </motion.div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Current streak" value={`${streak} days`} accent />
        <StatCard icon={Zap} label="Level" value={`Lvl ${level}`} sub={`${xpInLevel} / ${xpForNext} XP`} pct={xpPct} />
        <StatCard icon={Trophy} label="Total XP" value={xp.toLocaleString("en-IN")} />
        <StatCard icon={Target} label="Sessions" value={String(sessions?.length ?? 0)} />
      </div>

      {/* Quick start */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Jump back in</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, title: "Friendly practice", desc: "Warm up with low-pressure questions." },
            { icon: Briefcase, title: "Strict HR round", desc: "Real recruiter pace and follow-ups." },
            { icon: GraduationCap, title: "Campus placement", desc: "Aptitude + HR, mass-recruiter style." },
          ].map((c, i) => (
            <motion.button
              key={c.title}
              type="button"
              onClick={() => alert("Mock interview flow coming in Phase 3!")}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -4 }}
              className="clay p-6 text-left group"
            >
              <div className="w-11 h-11 rounded-2xl clay-sm grid place-items-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <c.icon className="w-5 h-5 text-primary-glow" />
              </div>
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
              <div className="mt-4 flex items-center gap-1 text-xs text-primary-glow font-medium">
                Start <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Recent sessions */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent interviews</h2>
          <span className="text-xs text-muted-foreground">{sessions?.length ?? 0} total</span>
        </div>
        {!sessions || sessions.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl clay-sm grid place-items-center">
              <Sparkles className="w-5 h-5 text-primary-glow" />
            </div>
            <h3 className="mt-4 font-semibold">No interviews yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start your first mock round to see scores and feedback here.
            </p>
          </div>
        ) : (
          <div className="clay p-2">
            <div className="clay-inset rounded-xl divide-y divide-border/30">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 hover:bg-foreground/[0.02] transition"
                >
                  <div>
                    <div className="font-medium text-sm">{s.job_role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {s.experience_level} · {s.interview_type} · {s.mode}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
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
      className="clay p-5"
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-2xl grid place-items-center ${
            accent ? "" : "clay-sm"
          }`}
          style={accent ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" } : undefined}
        >
          <Icon className={`w-4 h-4 ${accent ? "text-primary-foreground" : "text-primary-glow"}`} />
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-display font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
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
