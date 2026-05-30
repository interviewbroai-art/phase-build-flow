import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  ChevronRight,
  History as HistoryIcon,
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Interview history — InterviewBro AI" }] }),
  component: HistoryPage,
});

const MODES = ["all", "friendly", "strict", "campus"] as const;
const STATUSES = ["all", "completed", "in_progress"] as const;

const inputCls =
  "w-full clay-inset px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60";

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

  const [q, setQ] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    if (!sessions) return [];
    const needle = q.trim().toLowerCase();
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    return sessions.filter((s) => {
      if (mode !== "all" && s.mode !== mode) return false;
      if (status !== "all" && s.status !== status) return false;
      const created = new Date(s.created_at).getTime();
      if (fromTs && created < fromTs) return false;
      if (toTs && created > toTs) return false;
      if (needle) {
        const hay = `${s.job_role ?? ""} ${s.interview_type ?? ""} ${s.company_type ?? ""} ${s.experience_level ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [sessions, q, mode, status, from, to]);

  const hasFilters = q || mode !== "all" || status !== "all" || from || to;
  const clear = () => {
    setQ("");
    setMode("all");
    setStatus("all");
    setFrom("");
    setTo("");
  };

  return (
    <div className="px-6 py-8 md:py-10 max-w-5xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-3"
      >
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

      {/* Filters */}
      <div className="mt-6 clay p-4 md:p-5">
        <div className="grid lg:grid-cols-[1.4fr,1fr,1fr,1fr,1fr] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search job role, type, company…"
              className={inputCls + " pl-10"}
            />
          </div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as (typeof MODES)[number])}
            className={inputCls}
            aria-label="Filter by mode"
          >
            {MODES.map((m) => (
              <option key={m} value={m} className="bg-background capitalize">
                {m === "all" ? "All modes" : m}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            className={inputCls}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-background capitalize">
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
            aria-label="From date"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
            aria-label="To date"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Showing {filtered.length} of {sessions?.length ?? 0}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 hover:text-foreground transition"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="clay p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !sessions || sessions.length === 0 ? (
          <EmptyState title="Nothing here yet" desc="Run your first session from the dashboard." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            desc="Try widening your filters or clearing the search."
            action={
              <button type="button" onClick={clear} className="btn-clay mt-5 inline-flex">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="clay p-2">
            <div className="clay-inset rounded-xl divide-y divide-border/30">
              {filtered.map((s) => (
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

function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="clay p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl clay-sm grid place-items-center">
        <Sparkles className="w-5 h-5 text-primary-glow" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      {action}
    </div>
  );
}
