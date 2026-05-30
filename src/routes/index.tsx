import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  X,
  Briefcase,
  Zap,
  MessageSquare,
  GraduationCap,
  Volume2,
  Star,
  Crown,
  Rocket,
  Quote,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewBro AI — Your personal AI placement coach" },
      {
        name: "description",
        content:
          "Realistic AI mock interviews, resume scoring, voice mode, and placement prep for TCS, Infosys, Amazon and more. Built for Indian students.",
      },
      { property: "og:title", content: "InterviewBro AI — Your personal AI placement coach" },
      {
        property: "og:description",
        content:
          "Practice realistic HR, technical, and behavioral interviews. Get instant feedback and resume scoring.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      <BackgroundFx />
      <Nav />
      <Hero />
      <LogoMarquee />
      <LiveDemo />
      <Features />
      <Modes />
      <HowItWorks />
      <StatsBand />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------- Background ---------- */
function BackgroundFx() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/30 blur-[120px] animate-blob" />
      <div
        className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-accent/25 blur-[140px] animate-blob"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary-glow/20 blur-[120px] animate-blob"
        style={{ animationDelay: "-12s" }}
      />
      <div className="noise" />
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? "glass border-b border-border/40" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-2xl clay-sm group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-primary-glow" />
          </span>
          <span className="font-display font-bold text-lg">
            InterviewBro<span className="text-gradient"> AI</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {["Features", "Modes", "How it works", "Pricing"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "")}`}
              className="hover:text-foreground transition story-link"
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </a>
          <MagneticButton href="/signup" className="btn-clay text-sm py-2.5 px-5">
            Get started
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}

/* ---------- Magnetic button ---------- */
function MagneticButton({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        ref.current.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0,0)";
      }}
      className={className}
      style={{ transition: "transform 200ms ease" }}
    >
      {children}
    </a>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  return (
    <section ref={ref} className="relative">
      <motion.div
        style={{ y, opacity }}
        className="mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center"
      >
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full clay-sm text-xs text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            Voice interview mode is live
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02]"
          >
            Crack your dream{" "}
            <span className="shimmer-text">interview</span>
            <br />
            with an <span className="text-gradient">AI coach</span> that talks back.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl"
          >
            Practice realistic HR, technical, and behavioral rounds. Get instant feedback, resume scoring, and
            company-specific prep for TCS, Infosys, Amazon and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <MagneticButton href="#" className="btn-clay">
              Start free interview <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <a href="#how" className="btn-ghost-clay">
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <Stat value="50k+" label="Students" />
            <Divider />
            <Stat value="1M+" label="Questions" />
            <Divider />
            <Stat value="4.9★" label="Rating" />
          </motion.div>
        </div>

        <HeroOrb />
      </motion.div>
    </section>
  );
}

function HeroOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative aspect-square max-w-[520px] mx-auto w-full"
    >
      {/* Orbit ring */}
      <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow" />
      <div
        className="absolute inset-8 rounded-full border border-accent/15 animate-spin-slow"
        style={{ animationDirection: "reverse", animationDuration: "30s" }}
      />

      <div className="absolute -inset-10 bg-gradient-to-br from-primary/40 to-accent/30 blur-3xl rounded-full" />

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative clay p-5 z-10"
      >
        <img
          src={heroOrb}
          alt="InterviewBro AI assistant"
          width={1024}
          height={1024}
          className="w-full rounded-2xl"
        />
      </motion.div>

      <OrbitChip className="top-2 -left-2" delay={0}>
        <Mic className="w-4 h-4 text-primary-glow" /> Voice mode
      </OrbitChip>
      <OrbitChip className="top-10 -right-4" delay={0.4}>
        <Trophy className="w-4 h-4 text-accent" /> Score 92
      </OrbitChip>
      <OrbitChip className="-bottom-2 left-6" delay={0.8}>
        <Brain className="w-4 h-4 text-primary-glow" /> Adaptive
      </OrbitChip>
      <OrbitChip className="bottom-12 -right-2" delay={1.2}>
        <FileText className="w-4 h-4 text-success" /> Resume +28%
      </OrbitChip>
    </motion.div>
  );
}

function OrbitChip({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay, duration: 0.6, ease: "backOut" }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}
        className="clay-sm px-3.5 py-2 flex items-center gap-2 text-xs font-medium whitespace-nowrap"
      >
        {children}
      </motion.div>
    </motion.div>
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

/* ---------- Logo marquee ---------- */
function LogoMarquee() {
  const items = ["TCS", "Infosys", "Wipro", "Accenture", "Amazon", "Flipkart", "Zoho", "Cognizant", "HCL", "Microsoft"];
  return (
    <section className="relative border-y border-border/40 bg-background/40 backdrop-blur-sm overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-7 flex items-center gap-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground shrink-0">Prep for</p>
        <div className="relative flex-1 overflow-hidden mask-fade">
          <div className="flex gap-12 animate-marquee whitespace-nowrap will-change-transform">
            {[...items, ...items].map((i, idx) => (
              <span key={idx} className="font-display font-semibold text-muted-foreground/80 text-lg">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`.mask-fade{mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent);}`}</style>
    </section>
  );
}

/* ---------- Live interview demo ---------- */
function LiveDemo() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="Live demo"
        title={<>Feels like a real <span className="text-gradient">HR round.</span></>}
        sub="Adaptive questions, follow-ups, and real-time scoring. Try it before you sign up."
      />

      <div className="mt-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <ChatDemo />
        <ScoreCard />
      </div>
    </section>
  );
}

function ChatDemo() {
  const script: { who: "ai" | "you"; text: string }[] = [
    { who: "ai", text: "Hi! Tell me about a project you're most proud of." },
    { who: "you", text: "I built a Python tool that scrapes job listings and ranks them." },
    { who: "ai", text: "Nice. What challenges did you face, and why Python?" },
    { who: "you", text: "Rate limiting was tough. I chose Python for its scraping ecosystem." },
    { who: "ai", text: "Good. How would you scale this to 10× the load?" },
  ];

  const [visible, setVisible] = useState<number>(1);
  const [typing, setTyping] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let i = 1;

    const tick = async () => {
      while (!cancelled && i < script.length) {
        const msg = script[i];
        if (msg.who === "ai") {
          setTyping("");
          await wait(700);
          for (let c = 0; c <= msg.text.length; c++) {
            if (cancelled) return;
            setTyping(msg.text.slice(0, c));
            await wait(22);
          }
          setVisible((v) => v + 1);
          setTyping("");
        } else {
          await wait(900);
          setVisible((v) => v + 1);
        }
        i++;
        if (i >= script.length) {
          await wait(2500);
          i = 1;
          setVisible(1);
        }
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="clay p-5 md:p-7 relative">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-2xl clay-sm">
            <Sparkles className="w-4 h-4 text-primary-glow" />
          </span>
          <div>
            <div className="font-semibold text-sm">Strict HR Round</div>
            <div className="text-xs text-muted-foreground">SDE Intern · Adaptive · 12:34</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" /> Live
        </div>
      </div>

      <div className="space-y-3 min-h-[320px]">
        {script.slice(0, visible).map((m, i) => (
          <Bubble key={i} who={m.who} text={m.text} />
        ))}
        {typing && <Bubble who="ai" text={typing} typing />}
      </div>

      <div className="mt-5 flex items-center gap-3 clay-inset px-4 py-3">
        <Mic className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">Tap to record your answer…</span>
        <button className="btn-clay py-2 px-4 text-xs">
          <Volume2 className="w-3.5 h-3.5" /> Speak
        </button>
      </div>
    </div>
  );
}

function Bubble({ who, text, typing }: { who: "ai" | "you"; text: string; typing?: boolean }) {
  const ai = who === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${ai ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          ai
            ? "clay-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-md"
            : "rounded-tl-2xl rounded-bl-2xl rounded-br-md rounded-tr-2xl text-primary-foreground"
        }`}
        style={
          ai
            ? undefined
            : {
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-clay-sm)",
              }
        }
      >
        <span className={typing ? "cursor" : undefined}>{text}</span>
      </div>
    </motion.div>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function ScoreCard() {
  const scores = [
    { label: "Confidence", value: 86 },
    { label: "Communication", value: 92 },
    { label: "Technical", value: 78 },
    { label: "Clarity", value: 88 },
  ];
  return (
    <div className="clay p-7 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Live performance</h3>
        <span className="text-xs px-2.5 py-1 rounded-full clay-inset text-muted-foreground">Beta</span>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <ScoreRing value={87} />
        <div>
          <div className="text-4xl font-display font-bold text-gradient">87</div>
          <div className="text-sm text-muted-foreground">Overall score</div>
        </div>
      </div>
      <div className="mt-7 space-y-4">
        {scores.map((s) => (
          <ScoreBar key={s.label} {...s} />
        ))}
      </div>
      <div className="mt-6 clay-inset p-4 text-xs text-muted-foreground">
        <span className="text-foreground font-medium">Tip:</span> Slow down on technical answers — your pace was 12%
        faster than ideal.
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="oklch(0.28 0.06 278)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke="url(#g)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 277)" />
            <stop offset="100%" stopColor="oklch(0.74 0.21 285)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full clay-inset overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "var(--gradient-primary)" }}
        />
      </div>
    </div>
  );
}

/* ---------- Features ---------- */
function Features() {
  const features = [
    { icon: Brain, title: "Adaptive AI", desc: "Difficulty shifts in real time — no two sessions are alike." },
    { icon: Mic, title: "Voice & text", desc: "Practice speaking out loud or chat in the moment." },
    { icon: FileText, title: "Resume analyzer", desc: "ATS score, skill extraction, and tailored questions." },
    { icon: Trophy, title: "Detailed feedback", desc: "Confidence, grammar, filler words — all scored." },
    { icon: Briefcase, title: "Company packs", desc: "TCS, Infosys, Amazon patterns curated by mentors." },
    { icon: Globe2, title: "English · Hindi · Telugu", desc: "Practice in the language you're most fluent in." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32 relative">
      <SectionHeader
        eyebrow="Features"
        title={<>Everything you need to <span className="text-gradient">land the offer.</span></>}
        sub="Built with the same realism as an actual HR round — minus the awkward silence."
      />
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.06 }}
            whileHover={{ y: -6 }}
            className="clay p-7 group relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl clay-sm grid place-items-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <f.icon className="w-5 h-5 text-primary-glow" />
            </div>
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Modes ---------- */
function Modes() {
  const modes = [
    { icon: MessageSquare, title: "Friendly", desc: "Low pressure, warm-up round.", tag: "Beginner" },
    { icon: Briefcase, title: "Strict HR", desc: "Tough screener, real pace.", tag: "Intermediate" },
    { icon: Zap, title: "Fast pressure", desc: "Quick-fire, 60s per answer.", tag: "Advanced" },
    { icon: GraduationCap, title: "Campus", desc: "Mass-recruiter style.", tag: "Popular" },
  ];
  return (
    <section id="modes" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="Interview modes"
        title={<>Pick your <span className="text-gradient">battlefield.</span></>}
        sub="From relaxed practice to a brutal pressure round — train how you'll fight."
      />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modes.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -6, rotate: -1 }}
            className="clay p-6 flex flex-col"
          >
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Pick role & level", desc: "Choose job role, experience, company type, and mode." },
    { n: "02", title: "Talk to the AI", desc: "Realistic, adaptive questions — voice or text." },
    { n: "03", title: "Get scored & improve", desc: "Confidence, communication, grammar, and weak-area drills." },
  ];
  return (
    <section id="howitworks" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="How it works"
        title={<>Three steps to your <span className="text-gradient">next offer.</span></>}
      />
      <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="clay p-8 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-6 text-7xl font-display font-bold text-primary/20 select-none">
              {s.n}
            </div>
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
type Billing = "monthly" | "yearly";
type PlanKey = "free" | "pro" | "campus";

const PLANS: {
  key: PlanKey;
  name: string;
  tagline: string;
  icon: typeof Star;
  monthly: number;
  yearly: number;
  unit: string;
  badge?: string;
}[] = [
  { key: "free", name: "Free", tagline: "Try the coach", icon: Star, monthly: 0, yearly: 0, unit: "forever" },
  { key: "pro", name: "Pro", tagline: "Most loved by students", icon: Crown, monthly: 199, yearly: 1599, unit: "mo", badge: "Most popular" },
  { key: "campus", name: "Campus", tagline: "Full placement season", icon: Rocket, monthly: 499, yearly: 3999, unit: "sem" },
];

const FEATURE_MATRIX: { label: string; values: Record<PlanKey, boolean | string> }[] = [
  { label: "Mock interviews", values: { free: "3 / week", pro: "Unlimited", campus: "Unlimited" } },
  { label: "Voice AI interviewer", values: { free: false, pro: true, campus: true } },
  { label: "Adaptive difficulty", values: { free: true, pro: true, campus: true } },
  { label: "Resume analyzer & ATS score", values: { free: "Basic", pro: "Advanced", campus: "Advanced+" } },
  { label: "Detailed feedback report", values: { free: "Basic", pro: "Full", campus: "Full" } },
  { label: "Company-specific prep", values: { free: false, pro: true, campus: true } },
  { label: "Languages", values: { free: "English", pro: "EN · HI · TE", campus: "EN · HI · TE" } },
  { label: "Video interview simulation", values: { free: false, pro: false, campus: true } },
  { label: "Priority AI coach", values: { free: false, pro: false, campus: true } },
];

function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [selected, setSelected] = useState<PlanKey>("pro");

  const priceFor = (p: (typeof PLANS)[number]) => (billing === "monthly" ? p.monthly : p.yearly);
  const unitFor = (p: (typeof PLANS)[number]) =>
    p.monthly === 0 ? p.unit : billing === "monthly" ? `/${p.unit}` : "/yr";

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 md:py-32 relative">
      <SectionHeader
        eyebrow="Pricing"
        title={<>Pick a plan. <span className="text-gradient">Watch it light up.</span></>}
        sub="Click any card to compare features live. Cancel anytime."
      />

      {/* Billing toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-10 flex justify-center"
      >
        <div className="clay-inset p-1.5 rounded-full inline-flex relative">
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                billing === b ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {billing === b && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-full -z-10"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {b === "monthly" ? "Monthly" : "Yearly"}
              {b === "yearly" && (
                <span className="ml-2 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-success/20 text-success">
                  -33%
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plan cards */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {PLANS.map((p, i) => {
          const isSelected = selected === p.key;
          return (
            <motion.button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={`clay p-8 flex flex-col text-left relative overflow-hidden transition-all ${
                isSelected ? "glow-primary" : "opacity-90 hover:opacity-100"
              }`}
              aria-pressed={isSelected}
            >
              {/* Selected gradient backdrop */}
              <motion.div
                initial={false}
                animate={{ opacity: isSelected ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top, oklch(0.62 0.22 277 / 0.25), transparent 70%)",
                }}
              />

              <div className="relative flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl clay-sm grid place-items-center">
                    <p.icon className="w-5 h-5 text-primary-glow" />
                  </span>
                  <div>
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.tagline}</div>
                  </div>
                </div>
                {p.badge && (
                  <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Animated price */}
              <div className="relative mt-2 flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">₹</span>
                <motion.span
                  key={`${p.key}-${billing}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-display font-bold"
                >
                  {priceFor(p).toLocaleString("en-IN")}
                </motion.span>
                <span className="text-sm text-muted-foreground">{unitFor(p)}</span>
              </div>
              {billing === "yearly" && p.monthly > 0 && (
                <div className="text-xs text-success mt-1">
                  Save ₹{(p.monthly * 12 - p.yearly).toLocaleString("en-IN")} / year
                </div>
              )}

              {/* Top 4 highlights from matrix */}
              <ul className="relative mt-6 space-y-2.5 text-sm flex-1">
                {FEATURE_MATRIX.slice(0, 5).map((f) => {
                  const v = f.values[p.key];
                  const enabled = v !== false;
                  return (
                    <li key={f.label} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-full grid place-items-center shrink-0 ${
                          enabled ? "clay-sm" : "clay-inset"
                        }`}
                      >
                        {enabled ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground" />
                        )}
                      </span>
                      <span className={enabled ? "text-foreground/90" : "text-muted-foreground/60 line-through"}>
                        {f.label}
                        {typeof v === "string" && <span className="text-muted-foreground"> · {v}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <span
                className={`relative mt-8 ${isSelected ? "btn-clay" : "btn-ghost-clay"}`}
              >
                {isSelected ? <>Get {p.name} <ArrowRight className="w-4 h-4" /></> : "Select plan"}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Live comparison matrix */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mt-14 clay p-2 md:p-3 overflow-hidden"
      >
        <div className="clay-inset rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left font-medium text-muted-foreground p-4">Feature</th>
                {PLANS.map((p) => {
                  const isSel = selected === p.key;
                  return (
                    <th key={p.key} className="p-4 text-center">
                      <button
                        onClick={() => setSelected(p.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isSel ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={
                          isSel
                            ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" }
                            : undefined
                        }
                      >
                        {p.name}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, idx) => (
                <tr
                  key={row.label}
                  className={`border-b border-border/20 last:border-0 ${
                    idx % 2 === 0 ? "bg-foreground/[0.015]" : ""
                  }`}
                >
                  <td className="p-4 text-foreground/90">{row.label}</td>
                  {PLANS.map((p) => {
                    const v = row.values[p.key];
                    const isSel = selected === p.key;
                    return (
                      <td
                        key={p.key}
                        className={`p-4 text-center transition-colors ${
                          isSel ? "bg-primary/8 text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {v === true && <Check className="w-4 h-4 text-success inline" />}
                        {v === false && <X className="w-4 h-4 text-muted-foreground/40 inline" />}
                        {typeof v === "string" && (
                          <span className={isSel ? "font-medium" : ""}>{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Stats band ---------- */
function StatsBand() {
  const items = [
    { value: 50000, suffix: "+", label: "Students trained" },
    { value: 1200000, suffix: "+", label: "Questions answered" },
    { value: 87, suffix: "%", label: "Crack their first interview" },
    { value: 4.9, suffix: "★", label: "Avg. app rating", decimals: 1 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="clay p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center"
          >
            <div className="text-4xl md:text-5xl font-display font-bold text-gradient">
              <CountUp end={s.value} decimals={s.decimals ?? 0} />
              {s.suffix}
            </div>
            <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CountUp({ end, decimals = 0 }: { end: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let started = false;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          const dur = 1600;
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(end * eased);
            if (p < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [end]);
  const formatted =
    decimals > 0
      ? val.toFixed(decimals)
      : Math.floor(val).toLocaleString("en-IN");
  return <span ref={ref}>{formatted}</span>;
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const items = [
    { name: "Priya S.", role: "B.Tech · NIT Trichy", quote: "Got placed at TCS Digital after 2 weeks of practice. The follow-up questions felt scarily real.", score: 94 },
    { name: "Arjun M.", role: "MCA · VIT", quote: "The Hindi voice mode helped me think clearly. My confidence score went from 62 to 91.", score: 91 },
    { name: "Sneha R.", role: "Fresher · Hyderabad", quote: "Resume analyzer found 11 ATS issues I missed. Cleared Infosys screening on the first try.", score: 88 },
    { name: "Karthik V.", role: "B.Tech · Anna University", quote: "Fast pressure mode is brutal in the best way. Amazon's bar-raiser felt easy after this.", score: 96 },
    { name: "Aisha K.", role: "Pre-final year · IIIT", quote: "I love the streak system. 40-day streak, 3 offers, 0 anxiety.", score: 90 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="Loved by students"
        title={<>From <span className="text-gradient">campus</span> to <span className="text-gradient">offer letter.</span></>}
        sub="Real stories from students who cracked their dream interview."
      />
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className={`clay p-6 flex flex-col ${i === 1 || i === 3 ? "lg:translate-y-6" : ""}`}
          >
            <Quote className="w-6 h-6 text-primary-glow opacity-60" />
            <p className="mt-3 text-sm leading-relaxed">{t.quote}</p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full grid place-items-center font-semibold text-sm text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <div className="clay-inset px-2.5 py-1 rounded-full text-xs flex items-center gap-1">
                <Trophy className="w-3 h-3 text-accent" /> {t.score}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="clay p-10 md:p-16 text-center relative overflow-hidden glow-primary"
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <h2 className="relative text-4xl md:text-5xl font-bold leading-tight">
          Your next interview <br className="md:hidden" />
          <span className="text-gradient">starts in 60 seconds.</span>
        </h2>
        <p className="relative mt-4 text-muted-foreground max-w-xl mx-auto">
          No credit card. No spam. Just you, the AI, and your first scored round.
        </p>
        <div className="relative mt-8 flex justify-center gap-3 flex-wrap">
          <MagneticButton href="#" className="btn-clay">
            Start free interview <ArrowRight className="w-4 h-4" />
          </MagneticButton>
          <a href="#pricing" className="btn-ghost-clay">See pricing</a>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Section header ---------- */
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto text-center"
    >
      <span className="text-xs uppercase tracking-[0.2em] text-primary-glow font-semibold">{eyebrow}</span>
      <h2 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-border/40 mt-10 relative z-10">
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
