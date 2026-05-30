import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — InterviewBro AI" }] }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "no_token" | "expired";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Detect that we arrived via a password-recovery email link.
  // Supabase fires PASSWORD_RECOVERY when it parses the recovery hash.
  useEffect(() => {
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        resolved = true;
        setStatus("ready");
      }
    });

    // Fallback for already-hydrated sessions or direct visits.
    supabase.auth.getSession().then(({ data }) => {
      if (resolved) return;
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("error")) {
        setStatus("expired");
      } else if (data.session) {
        setStatus("ready");
      } else if (hash.includes("type=recovery") || hash.includes("access_token")) {
        // Token present but not yet processed — give Supabase a tick.
        setTimeout(() => setStatus((s) => (s === "checking" ? "ready" : s)), 600);
      } else {
        setStatus("no_token");
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated!");
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Make it strong, make it yours."
      footer={
        <>
          <Link to="/login" className="text-primary-glow hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {status === "checking" && (
        <div className="clay-inset p-5 text-sm text-muted-foreground">Verifying reset link…</div>
      )}

      {status === "no_token" && (
        <div className="clay-inset p-5 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <div>
            <div className="font-medium text-foreground">No reset link detected</div>
            <p className="text-muted-foreground mt-1">
              Open this page from the email we sent, or{" "}
              <Link to="/forgot-password" className="text-primary-glow hover:underline">
                request a new link
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {status === "expired" && (
        <div className="clay-inset p-5 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <div>
            <div className="font-medium text-foreground">This link has expired</div>
            <p className="text-muted-foreground mt-1">
              <Link to="/forgot-password" className="text-primary-glow hover:underline">
                Request a new reset link
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {status === "ready" && !done && (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="New password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls + " pl-10"}
                placeholder="Min 8 characters"
              />
            </div>
          </Field>
          <Field label="Confirm password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls + " pl-10"}
                placeholder="Repeat new password"
              />
            </div>
          </Field>
          <button type="submit" disabled={loading} className="btn-clay w-full justify-center">
            {loading ? "Updating…" : <>Update password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}

      {done && (
        <div className="clay-inset p-5 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary-glow shrink-0" />
          <div>
            <div className="font-medium text-foreground">Password updated</div>
            <p className="text-muted-foreground mt-1">Redirecting you to your dashboard…</p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
