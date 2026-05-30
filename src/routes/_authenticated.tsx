import { createFileRoute, Outlet, Navigate, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Sparkles, LayoutDashboard, History, Settings, LogOut } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-hero grid place-items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ redirect: router.state.location.href }} />;
  }

  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-blob"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <Sidebar onSignOut={signOut} />
        <main className="flex-1 lg:pl-72">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/history", label: "Interview history", icon: History },
    { to: "/settings", label: "Settings", icon: Settings },
  ] as const;
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 p-5 flex-col gap-4 z-20">
      <Link to="/" className="flex items-center gap-2 px-2 py-2">
        <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm">
          <Sparkles className="w-4 h-4 text-primary-glow" />
        </span>
        <span className="font-display font-bold text-lg">
          InterviewBro<span className="text-gradient"> AI</span>
        </span>
      </Link>

      <nav className="clay p-3 flex-1 flex flex-col gap-1">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            activeOptions={{ exact: true }}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition data-[status=active]:bg-foreground/[0.06] data-[status=active]:text-foreground"
          >
            <it.icon className="w-4 h-4" />
            <span className="flex-1">{it.label}</span>
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="clay-sm px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </aside>
  );
}
