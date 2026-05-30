import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-hero relative overflow-hidden flex flex-col">
      {/* bg fx */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/30 blur-[120px] animate-blob" />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/25 blur-[120px] animate-blob"
          style={{ animationDelay: "-8s" }}
        />
        <div className="noise" />
      </div>

      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-primary-glow" />
          </span>
          <span className="font-display font-bold text-lg">
            InterviewBro<span className="text-gradient"> AI</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="clay p-8 md:p-10">
            <h1 className="text-3xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full clay-inset px-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/60";

export function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.45-1.7 4.26-5.5 4.26-3.31 0-6.01-2.74-6.01-6.12S8.69 6.12 12 6.12c1.89 0 3.15.81 3.87 1.5l2.65-2.55C16.84 3.52 14.62 2.5 12 2.5 6.78 2.5 2.5 6.78 2.5 12s4.28 9.5 9.5 9.5c5.49 0 9.12-3.86 9.12-9.28 0-.62-.07-1.1-.16-1.52H12z"
      />
    </svg>
  );
}
