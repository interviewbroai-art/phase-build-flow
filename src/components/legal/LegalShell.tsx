import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm group-hover:rotate-12 transition-transform">
              <Sparkles className="w-4 h-4 text-primary-glow" />
            </span>
            <span className="font-display font-bold text-lg">
              InterviewBro<span className="text-gradient"> AI</span>
            </span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back home
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Last updated · {updated}</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">{title}</h1>
        <div className="mt-10 prose-legal">{children}</div>
      </article>
      <style>{`
        .prose-legal { color: hsl(var(--foreground) / 0.85); font-size: 0.95rem; line-height: 1.75; }
        .prose-legal h2 { font-family: var(--font-display, inherit); font-size: 1.4rem; font-weight: 700; margin-top: 2.25rem; margin-bottom: 0.75rem; color: hsl(var(--foreground)); }
        .prose-legal h3 { font-size: 1.05rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: hsl(var(--foreground)); }
        .prose-legal p { margin-bottom: 1rem; }
        .prose-legal ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose-legal li { margin-bottom: 0.35rem; }
        .prose-legal a { color: hsl(var(--primary-glow, var(--primary))); text-decoration: underline; }
      `}</style>
    </div>
  );
}
