import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Trophy, ChevronRight, History as HistoryIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Interview history — InterviewBro AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const userId = user!.id;

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", userId, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <HistoryIcon className="w-3.5 h-3.5" /> Interview history
        </p>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold">
          Every round, <span className="text-gradient">tracked</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Review past interviews, scores and AI feedback.
        </p>
      </motion.div>

      <div className="mt-8">
        {isLoading ? (
          <div className="clay p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl clay-sm grid place-items-center">
              <Sparkles className="w-5 h-5 text-primary-glow" />
            </div>
            <h3 className="mt-4 font-semibold">Nothing here yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first session from the dashboard.
            </p>
            <Link to="/dashboard" className="btn-clay mt-5 inline-flex">
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="clay p-2">
            <div className="clay-inset rounded-xl divide-y divide-border/30">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  to="/sessions/$sessionId"
                  params={{ sessionId: s.id }}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-foreground/[0.03] transition group"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.job_role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {s.experience_level} · {s.interview_type} · {s.mode} ·{" "}
                      <span
                        className={
                          s.status === "completed"
                            ? "text-primary-glow"
                            : "text-muted-foreground"
                        }
                      >
                        {s.status}
                      </span>
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
                        year: "2-digit",
                      })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
