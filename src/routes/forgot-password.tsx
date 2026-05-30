import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Reset password — InterviewBro AI" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your inbox for the reset link.");
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-primary-glow hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="clay-inset p-5 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary-glow shrink-0" />
            <div>
              <div className="font-medium text-foreground">Reset link sent</div>
              <p className="text-muted-foreground mt-1">
                If an account exists for{" "}
                <span className="text-foreground font-medium">{email}</span>, a reset link is on
                its way. Check your spam folder too.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="btn-ghost-clay w-full justify-center"
          >
            Send to a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className={inputCls + " pl-10"}
              />
            </div>
          </Field>
          {error && (
            <div className="text-xs text-destructive">{error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-clay w-full justify-center">
            {loading ? "Sending…" : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
