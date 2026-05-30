import { createFileRoute } from "@tanstack/react-router";
import heroOrb from "@/assets/hero-ai-orb.jpg";
import {
  Sparkles,
  Mic,
  FileText,
  Brain,
  Trophy,
  Globe2,
  ArrowRight,
  Check,
  Briefcase,
  Zap,
  MessageSquare,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewBro AI — Your personal AI placement coach" },
      {
        name: "description",
        content:
          "Crack interviews with realistic AI mock interviews, resume analysis, and personalized feedback. Built for Indian students and freshers.",
      },
      { property: "og:title", content: "InterviewBro AI — Your personal AI placement coach" },
      {
        property: "og:description",
        content:
          "Realistic AI mock interviews, resume scoring, voice mode, and placement prep for TCS, Infosys, Amazon and more.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <Modes />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/40 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm">
            <Sparkles className="w-4 h-4 text-primary-glow" />
          </span>
          <span className="font-display font-bold text-lg">InterviewBro<span className="text-gradient"> AI</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#modes" className="hover:text-foreground transition">Modes</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">Sign in</a>
          <a href="#" className="btn-clay text-sm py-2.5 px-5">Get started</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-28 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full clay-sm text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            Now with voice interview mode
          </span>
          <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
            Your personal <span className="text-gradient">AI placement</span> coach.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Practice realistic HR, technical, and behavioral interviews. Get instant feedback, resume scoring, and
            company-specific prep for TCS, Infosys, Amazon and more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#" className="btn-clay">
              Start free interview <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#how" className="btn-ghost-clay">See how it works</a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <Stat value="50k+" label="Students" />
            <Divider />
            <Stat value="1M+" label="Questions asked" />
            <Divider />
            <Stat value="4.9★" label="App rating" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl rounded-full" />
          <div className="relative clay p-6 animate-float">
            <img
              src={heroOrb}
              alt="InterviewBro AI assistant"
              width={1024}
              height={1024}
              className="w-full rounded-2xl"
            />
            <FloatingChip className="absolute -top-4 -left-4" icon={<Mic className="w-4 h-4" />} label="Voice mode" />
            <FloatingChip
              className="absolute -bottom-4 -right-4"
              icon={<Trophy className="w-4 h-4 text-accent" />}
              label="Score: 92"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  icon,
  label,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={`clay-sm px-4 py-2.5 flex items-center gap-2 text-sm font-medium ${className}`}>
      {icon}
      {label}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Divider() {
  return <div className="w-px h-8 bg-border" />;
}

function Logos() {
  const items = ["TCS", "Infosys", "Wipro", "Accenture", "Amazon", "Flipkart"];
  return (
    <section className="border-y border-border/40 bg-background/40">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Prep for</p>
        {items.map((i) => (
          <span key={i} className="font-display font-semibold text-muted-foreground/80">{i}</span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Brain, title: "Adaptive AI interviewer", desc: "Difficulty adjusts to your answers in real time. No two sessions are the same." },
    { icon: Mic, title: "Voice & text modes", desc: "Practice speaking out loud or chat — like a real HR conversation." },
    { icon: FileText, title: "Resume analyzer", desc: "Upload your PDF. Get an ATS score, skills extraction, and tailored questions." },
    { icon: Trophy, title: "Detailed feedback", desc: "Confidence, communication, grammar, filler words — all scored after each round." },
    { icon: Briefcase, title: "Company-specific prep", desc: "TCS, Infosys, Amazon question patterns curated by experts." },
    { icon: Globe2, title: "English, Hindi, Telugu", desc: "Practice in the language you're most comfortable in." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-28">
      <SectionHeader
        eyebrow="Features"
        title={<>Everything you need to <span className="text-gradient">land the offer.</span></>}
        sub="Built with the same realism as an actual HR round — minus the awkward silence."
      />
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="clay p-7 group">
            <div className="w-12 h-12 rounded-2xl clay-sm grid place-items-center mb-5 group-hover:scale-110 transition-transform">
              <f.icon className="w-5 h-5 text-primary-glow" />
            </div>
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Modes() {
  const modes = [
    { icon: MessageSquare, title: "Friendly practice", desc: "Low pressure, warm-up round.", tag: "Beginner" },
    { icon: Briefcase, title: "Strict HR", desc: "Tough screener, real-world pace.", tag: "Intermediate" },
    { icon: Zap, title: "Fast pressure", desc: "Quick-fire, 60s per answer.", tag: "Advanced" },
    { icon: GraduationCap, title: "Campus placement", desc: "Mass-recruiter style aptitude + HR.", tag: "Popular" },
  ];
  return (
    <section id="modes" className="mx-auto max-w-7xl px-6 py-28">
      <SectionHeader
        eyebrow="Interview modes"
        title={<>Pick your <span className="text-gradient">battlefield.</span></>}
        sub="From relaxed practice to a brutal pressure round — train how you'll fight."
      />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modes.map((m) => (
          <div key={m.title} className="clay p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl clay-sm grid place-items-center">
                <m.icon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full clay-inset text-muted-foreground">
                {m.tag}
              </span>
            </div>
            <h3 className="font-semibold text-lg">{m.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Pick role & level", desc: "Choose job role, experience, company type, and mode." },
    { n: "02", title: "Talk to the AI", desc: "Realistic, adaptive questions — voice or text." },
    { n: "03", title: "Get scored & improve", desc: "Confidence, communication, grammar, and weak-area drills." },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-28">
      <SectionHeader
        eyebrow="How it works"
        title={<>Three steps to your <span className="text-gradient">next offer.</span></>}
      />
      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.n} className="clay p-8 relative overflow-hidden">
            <div className="absolute -right-4 -top-6 text-7xl font-display font-bold text-primary/20 select-none">
              {s.n}
            </div>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "₹0",
      sub: "Forever free",
      features: ["3 mock interviews / week", "Basic feedback", "Resume score", "English only"],
      cta: "Start free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "₹199",
      sub: "per month",
      features: [
        "Unlimited interviews",
        "Voice AI interviewer",
        "Advanced feedback & analytics",
        "Company-specific prep",
        "All languages",
      ],
      cta: "Go Pro",
      highlighted: true,
    },
    {
      name: "Campus",
      price: "₹499",
      sub: "per semester",
      features: ["Everything in Pro", "Video interview simulation", "Resume optimization", "Priority AI coach"],
      cta: "Get Campus",
      highlighted: false,
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-28">
      <SectionHeader
        eyebrow="Pricing"
        title={<>Student-friendly. <span className="text-gradient">No catches.</span></>}
        sub="Cancel anytime. Switch plans anytime."
      />
      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`clay p-8 flex flex-col ${t.highlighted ? "glow-primary" : ""}`}
          >
            {t.highlighted && (
              <span className="self-start text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary text-primary-foreground mb-4">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-semibold">{t.name}</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-display font-bold">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.sub}</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full clay-sm grid place-items-center shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </span>
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`mt-8 ${t.highlighted ? "btn-clay" : "btn-ghost-clay"}`}
            >
              {t.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <span className="text-xs uppercase tracking-[0.2em] text-primary-glow font-semibold">{eyebrow}</span>
      <h2 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 mt-10">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-xl clay-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          </span>
          <span className="text-sm text-muted-foreground">
            © 2026 InterviewBro AI · Made in India for students
          </span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
