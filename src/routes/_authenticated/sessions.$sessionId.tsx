import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Mic,
  Brain,
  MessageSquare,
  Pencil,
  Save,
  X,
  StickyNote,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/sessions/$sessionId")({
  head: () => ({ meta: [{ title: "Session detail — InterviewBro AI" }] }),
  component: SessionDetailPage,
});

const textareaCls =
  "w-full clay-inset px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60 resize-y min-h-[120px]";

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const qc = useQueryClient();

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

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);

  useEffect(() => {
    if (!s) return;
    setNotesDraft(s.notes ?? "");
    const fb = (s.feedback ?? {}) as { summary?: string };
    setSummaryDraft(fb.summary ?? "");
  }, [s]);

  const saveNotes = async () => {
    setSavingNotes(true);
    const { error } = await supabase
      .from("interview_sessions")
      .update({ notes: notesDraft.trim() || null })
      .eq("id", sessionId);
    setSavingNotes(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notes saved");
    setEditingNotes(false);
    qc.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const saveSummary = async () => {
    setSavingSummary(true);
    const current = (s?.feedback ?? {}) as Record<string, unknown>;
    const next = { ...current, summary: summaryDraft.trim() };
    const { error } = await supabase
      .from("interview_sessions")
      .update({ feedback: next })
      .eq("id", sessionId);
    setSavingSummary(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Feedback summary saved");
    setEditingSummary(false);
    qc.invalidateQueries({ queryKey: ["session", sessionId] });
  };

  const feedback = (s?.feedback ?? null) as
    | { summary?: string; strengths?: string[]; improvements?: string[] }
    | null;

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

          {/* AI Feedback summary (editable) */}
          <section className="mt-6 clay p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-glow" /> AI feedback summary
              </h2>
              {!editingSummary ? (
                <button
                  type="button"
                  className="btn-ghost-clay text-xs"
                  onClick={() => setEditingSummary(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost-clay text-xs"
                    onClick={() => {
                      setEditingSummary(false);
                      setSummaryDraft(feedback?.summary ?? "");
                    }}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-clay text-xs"
                    onClick={saveSummary}
                    disabled={savingSummary}
                  >
                    <Save className="w-3.5 h-3.5" /> {savingSummary ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {editingSummary ? (
              <textarea
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                placeholder="Add or refine the AI feedback summary…"
                className={"mt-4 " + textareaCls}
                maxLength={2000}
              />
            ) : feedback?.summary ? (
              <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {feedback.summary}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground italic">
                No summary yet — click Edit to add one.
              </p>
            )}

            {(feedback?.strengths?.length || feedback?.improvements?.length) ? (
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                {feedback?.strengths && feedback.strengths.length > 0 && (
                  <div className="clay-inset rounded-xl p-4">
                    <div className="text-[10px] uppercase tracking-widest text-primary-glow">Strengths</div>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      {feedback.strengths.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback?.improvements && feedback.improvements.length > 0 && (
                  <div className="clay-inset rounded-xl p-4">
                    <div className="text-[10px] uppercase tracking-widest text-accent">To improve</div>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      {feedback.improvements.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Personal notes (editable) */}
          <section className="mt-6 clay p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary-glow" /> My notes
              </h2>
              {!editingNotes ? (
                <button
                  type="button"
                  className="btn-ghost-clay text-xs"
                  onClick={() => setEditingNotes(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> {s.notes ? "Edit" : "Add note"}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost-clay text-xs"
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesDraft(s.notes ?? "");
                    }}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-clay text-xs"
                    onClick={saveNotes}
                    disabled={savingNotes}
                  >
                    <Save className="w-3.5 h-3.5" /> {savingNotes ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {editingNotes ? (
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="What did you learn? What will you do differently?"
                className={"mt-4 " + textareaCls}
                maxLength={4000}
              />
            ) : s.notes ? (
              <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">{s.notes}</p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground italic">
                Capture takeaways for next time — only you can see this.
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
