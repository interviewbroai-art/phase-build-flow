import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Clock, Mic, Brain, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  head: () => ({ meta: [{ title: "Session detail — InterviewBro AI" }] }),
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();

  const { data: s, isLoading, error } = useQuery({
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

  return (
    <div className="px-6 py-8 md:py-10 max-w-4xl mx-auto">
      <Link
        to="/history"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to history
      </Link>

      {isLoading ? (
        <div className="clay p-8 text-center text-sm text-muted-foreground mt-6">Loading…</div>
      ) : error || !s ? (
        <div className="clay p-10 text-center mt-6">
          <h3 className="font-semibold">Session not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted or you don't have access.
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <p className="text-sm text-muted-foreground capitalize">
                {s.interview_type} · {s.mode}
              </p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold">{s.job_role}</h1>
              <p className="mt-2 text-muted-foreground text-sm capitalize">
                {s.experience_level} · {s.language}
                {s.company_type ? ` · ${s.company_type}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  "clay-sm px-3 py-1.5 rounded-full text-xs capitalize " +
                  (s.status === "completed" ? "text-primary-glow" : "text-muted-foreground")
                }
              >
                {s.status}
              </span>
              {s.overall_score != null && (
                <span className="clay-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-accent" /> {s.overall_score}/100
                </span>
              )}
            </div>
          </motion.div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard icon={Trophy} label="Overall" value={s.overall_score} />
            <ScoreCard icon={Mic} label="Confidence" value={s.confidence_score} />
            <ScoreCard icon={MessageSquare} label="Communication" value={s.communication_score} />
            <ScoreCard icon={Brain} label="Technical" value={s.technical_score} />
          </div>

          <section className="mt-8 clay p-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-glow" /> Timing
            </h2>
            <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
              <Stat label="Duration" value={`${Math.round((s.duration_seconds ?? 0) / 60)} min`} />
              <Stat
                label="Started"
                value={new Date(s.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <Stat
                label="Completed"
                value={
                  s.completed_at
                    ? new Date(s.completed_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
                }
              />
            </div>
          </section>

          <section className="mt-6 clay p-6">
            <h2 className="font-semibold">AI feedback</h2>
            {s.feedback ? (
              <pre className="mt-4 clay-inset rounded-xl p-4 text-xs whitespace-pre-wrap break-words text-muted-foreground overflow-x-auto">
                {JSON.stringify(s.feedback, null, 2)}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No detailed feedback recorded for this session yet.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: number | null | undefined;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="clay p-5">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-2xl clay-sm grid place-items-center">
          <Icon className="w-4 h-4 text-primary-glow" />
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-display font-bold">
        {value == null ? "—" : `${value}`}
        {value != null && <span className="text-sm text-muted-foreground">/100</span>}
      </div>
      <div className="mt-3 h-1.5 rounded-full clay-inset overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "var(--gradient-primary)" }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="clay-inset rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
