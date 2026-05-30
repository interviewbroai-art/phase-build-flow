import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Sparkles,
  Award,
  Crown,
  Rocket,
  Star,
  Medal,
  Lock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — InterviewBro AI" }] }),
  component: AchievementsPage,
});

type BadgeDef = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Trophy;
  tier: "bronze" | "silver" | "gold" | "platinum";
  goal: number;
  unit: string;
  metric: "sessions" | "completed" | "streak" | "xp" | "level" | "score90" | "score80" | "interview_types";
};

const BADGES: BadgeDef[] = [
  { id: "first-step", title: "First Step", desc: "Complete your first interview", icon: Rocket, tier: "bronze", goal: 1, unit: "interview", metric: "completed" },
  { id: "warming-up", title: "Warming Up", desc: "Complete 5 interviews", icon: Sparkles, tier: "bronze", goal: 5, unit: "interviews", metric: "completed" },
  { id: "dedicated", title: "Dedicated", desc: "Complete 15 interviews", icon: Medal, tier: "silver", goal: 15, unit: "interviews", metric: "completed" },
  { id: "veteran", title: "Veteran", desc: "Complete 50 interviews", icon: Award, tier: "gold", goal: 50, unit: "interviews", metric: "completed" },
  { id: "legend", title: "Legend", desc: "Complete 100 interviews", icon: Crown, tier: "platinum", goal: 100, unit: "interviews", metric: "completed" },

  { id: "spark", title: "Spark", desc: "Reach a 3-day streak", icon: Flame, tier: "bronze", goal: 3, unit: "days", metric: "streak" },
  { id: "blaze", title: "Blaze", desc: "Reach a 7-day streak", icon: Flame, tier: "silver", goal: 7, unit: "days", metric: "streak" },
  { id: "inferno", title: "Inferno", desc: "Reach a 30-day streak", icon: Flame, tier: "gold", goal: 30, unit: "days", metric: "streak" },

  { id: "xp-rookie", title: "XP Rookie", desc: "Earn 500 XP", icon: Zap, tier: "bronze", goal: 500, unit: "XP", metric: "xp" },
  { id: "xp-pro", title: "XP Pro", desc: "Earn 2,500 XP", icon: Zap, tier: "silver", goal: 2500, unit: "XP", metric: "xp" },
  { id: "xp-master", title: "XP Master", desc: "Earn 10,000 XP", icon: Star, tier: "gold", goal: 10000, unit: "XP", metric: "xp" },

  { id: "level-5", title: "Rising Star", desc: "Reach Level 5", icon: Trophy, tier: "silver", goal: 5, unit: "level", metric: "level" },
  { id: "level-10", title: "Elite", desc: "Reach Level 10", icon: Trophy, tier: "gold", goal: 10, unit: "level", metric: "level" },

  { id: "high-scorer", title: "High Scorer", desc: "Score 80+ in an interview", icon: Target, tier: "silver", goal: 1, unit: "interview", metric: "score80" },
  { id: "ace", title: "Ace", desc: "Score 90+ in an interview", icon: Crown, tier: "gold", goal: 1, unit: "interview", metric: "score90" },

  { id: "explorer", title: "Explorer", desc: "Try 3 different interview types", icon: Sparkles, tier: "silver", goal: 3, unit: "types", metric: "interview_types" },
];

const TIER_STYLE: Record<BadgeDef["tier"], { label: string; bg: string; ring: string; text: string }> = {
  bronze: { label: "Bronze", bg: "from-amber-700/40 to-amber-900/40", ring: "ring-amber-600/30", text: "text-amber-300" },
  silver: { label: "Silver", bg: "from-slate-400/40 to-slate-600/40", ring: "ring-slate-300/30", text: "text-slate-200" },
  gold: { label: "Gold", bg: "from-yellow-400/40 to-amber-600/40", ring: "ring-yellow-300/40", text: "text-yellow-200" },
  platinum: { label: "Platinum", bg: "from-cyan-300/40 to-fuchsia-400/40", ring: "ring-cyan-200/40", text: "text-cyan-100" },
};

function AchievementsPage() {
  const { user } = useAuth();
  const userId = user!.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", userId, "all-for-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id,status,overall_score,interview_type");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const completed = sessions?.filter((s) => s.status === "completed") ?? [];
    const bestScore = completed.reduce((m, s) => Math.max(m, s.overall_score ?? 0), 0);
    const types = new Set(completed.map((s) => s.interview_type).filter(Boolean));
    return {
      completed: completed.length,
      sessions: sessions?.length ?? 0,
      streak: profile?.current_streak ?? 0,
      longest: profile?.longest_streak ?? 0,
      xp: profile?.xp ?? 0,
      level: profile?.level ?? 1,
      bestScore,
      score80: bestScore >= 80 ? 1 : 0,
      score90: bestScore >= 90 ? 1 : 0,
      interview_types: types.size,
    };
  }, [profile, sessions]);

  const getValue = (m: BadgeDef["metric"]) =>
    (stats as unknown as Record<string, number>)[m] ?? 0;

  const unlocked = BADGES.filter((b) => getValue(b.metric) >= b.goal).length;

  return (
    <div className="px-6 py-8 md:py-10 max-w-6xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <p className="text-sm text-muted-foreground">Your trophy room</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold flex items-center gap-3">
            Achievements <Trophy className="w-7 h-7 text-accent" />
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-md">
            Unlock badges by practising consistently, climbing levels, and acing rounds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="clay-inset px-4 py-2 rounded-2xl text-sm">
            <span className="text-muted-foreground">Unlocked</span>{" "}
            <span className="font-display font-bold text-gradient">
              {unlocked}/{BADGES.length}
            </span>
          </span>
          <span className="clay-inset px-4 py-2 rounded-2xl text-sm">
            <span className="text-muted-foreground">Level</span>{" "}
            <span className="font-display font-bold">{stats.level}</span>
          </span>
          <span className="clay-inset px-4 py-2 rounded-2xl text-sm">
            <span className="text-muted-foreground">XP</span>{" "}
            <span className="font-display font-bold">{stats.xp.toLocaleString("en-IN")}</span>
          </span>
        </div>
      </motion.div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGES.map((b, i) => {
          const value = getValue(b.metric);
          const isUnlocked = value >= b.goal;
          const pct = Math.min(100, (value / b.goal) * 100);
          const tier = TIER_STYLE[b.tier];
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              className={"clay p-5 relative overflow-hidden " + (isUnlocked ? "" : "opacity-80")}
            >
              {isUnlocked && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.bg} opacity-30 pointer-events-none`}
                />
              )}
              <div className="relative flex items-start justify-between gap-3">
                <div
                  className={
                    "w-12 h-12 rounded-2xl grid place-items-center shrink-0 " +
                    (isUnlocked ? `ring-1 ${tier.ring}` : "clay-inset")
                  }
                  style={
                    isUnlocked
                      ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" }
                      : undefined
                  }
                >
                  {isUnlocked ? (
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={
                    "text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full clay-inset " +
                    tier.text
                  }
                >
                  {tier.label}
                </span>
              </div>

              <div className="relative mt-4">
                <div className="font-semibold flex items-center gap-2">
                  {b.title}
                  {isUnlocked && <CheckCircle2 className="w-4 h-4 text-primary-glow" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
              </div>

              <div className="relative mt-4">
                <div className="h-1.5 rounded-full clay-inset overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {Math.min(value, b.goal).toLocaleString("en-IN")} / {b.goal.toLocaleString("en-IN")} {b.unit}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
