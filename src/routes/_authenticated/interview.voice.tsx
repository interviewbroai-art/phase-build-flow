import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Sparkles,
  Crown,
  Volume2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { effectivePlan } from "@/lib/billing/plans";
import { voiceInterviewTurn } from "@/lib/api/voice.functions";
import { scoreInterview } from "@/lib/api/interview.functions";

export const Route = createFileRoute("/_authenticated/interview/voice")({
  head: () => ({ meta: [{ title: "Voice interview — InterviewBro AI" }] }),
  component: VoiceInterview,
});

type Turn = { role: "user" | "assistant"; content: string };

function VoiceInterview() {
  const { user } = useAuth();
  const userId = user!.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const turnFn = useServerFn(voiceInterviewTurn);
  const scoreFn = useServerFn(scoreInterview);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-voice", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_expires_at, default_job_role, default_experience_level")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const plan = effectivePlan(profile?.plan as string | null, profile?.plan_expires_at as string | null);
  const allowed = plan !== "free";

  const [jobRole, setJobRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("fresher");

  useEffect(() => {
    if (profile?.default_job_role) setJobRole(profile.default_job_role as string);
    if (profile?.default_experience_level) setExperience(profile.default_experience_level as string);
  }, [profile]);

  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<Turn[]>([]);
  const interviewSessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const endingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callActiveRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    endingRef.current = ending;
  }, [ending]);

  useEffect(() => {
    transcriptRef.current = transcript;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR && "speechSynthesis" in window;
  }, []);

  function speak(text: string, onEnd: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en[-_](US|GB|IN)/i.test(v.lang) && /female|samantha|google/i.test(v.name)) ||
      voices.find((v) => /en[-_](US|GB|IN)/i.test(v.lang));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false);
      onEnd();
    };
    utter.onerror = () => {
      setSpeaking(false);
      onEnd();
    };
    window.speechSynthesis.speak(utter);
  }

  function startListening() {
    if (!callActiveRef.current || mutedRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = "";
      rec.onresult = (e: any) => {
        let interimT = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimT += r[0].transcript;
        }
        setInterim(interimT);
      };
      rec.onerror = (e: any) => {
        setListening(false);
        setInterim("");
        if (e.error === "not-allowed") {
          toast.error("Microphone permission denied");
          endCall();
        }
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        const text = finalText.trim();
        if (text && callActiveRef.current) {
          void handleUserTurn(text);
        } else if (callActiveRef.current && !mutedRef.current) {
          // nothing said, listen again
          setTimeout(startListening, 200);
        }
      };
      rec.onstart = () => setListening(true);
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }

  async function handleAssistantTurn(history: Turn[]) {
    setThinking(true);
    try {
      const res = await turnFn({ data: { jobRole, experience, history } });
      const reply = res.reply;
      if (!reply) throw new Error("Empty AI reply");
      setThinking(false);
      const next = [...history, { role: "assistant" as const, content: reply }];
      setTranscript(next);
      speak(reply, () => {
        if (callActiveRef.current) startListening();
      });
    } catch (e: unknown) {
      setThinking(false);
      const msg = e instanceof Error ? e.message : "Failed to get AI reply";
      toast.error(msg);
      endCall();
    }
  }

  async function handleUserTurn(text: string) {
    const next = [...transcriptRef.current, { role: "user" as const, content: text }];
    setTranscript(next);
    await handleAssistantTurn(next);
  }

  async function createInterviewSession() {
    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: userId,
        job_role: jobRole.trim() || "Software Engineer",
        experience_level: experience,
        interview_type: "voice",
        mode: "voice",
        language: "en",
        difficulty: "medium",
        depth: "moderate",
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async function startCall() {
    if (!supported) {
      toast.error("Voice mode isn't supported in this browser. Try Chrome on desktop.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission is required for voice mode.");
      return;
    }
    // Prime voices list
    window.speechSynthesis.getVoices();
    const toastId = toast.loading("Starting voice interview…");
    try {
      const sessionId = await createInterviewSession();
      interviewSessionIdRef.current = sessionId;
      startedAtRef.current = Date.now();
      setTranscript([]);
      setCallActive(true);
      callActiveRef.current = true;
      toast.dismiss(toastId);
      await handleAssistantTurn([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start voice interview", { id: toastId });
    }
  }

  async function endCall() {
    if (endingRef.current) return;
    setCallActive(false);
    callActiveRef.current = false;
    stopListening();
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setSpeaking(false);
    setThinking(false);
    setInterim("");

    const sessionId = interviewSessionIdRef.current;
    const finalTranscript = transcriptRef.current;
    const hasCandidateAnswer = finalTranscript.some((t) => t.role === "user");
    if (!sessionId || !hasCandidateAnswer) return;

    setEnding(true);
    endingRef.current = true;
    const toastId = toast.loading("Scoring your voice interview…");
    try {
      await scoreFn({
        data: {
          sessionId,
          jobRole: jobRole.trim() || "Software Engineer",
          experience,
          difficulty: "medium",
          durationSeconds: Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000)),
          transcript: finalTranscript,
        },
      });
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
      await qc.invalidateQueries({ queryKey: ["sessions", userId] });
      toast.success("Voice interview complete! Score saved and XP awarded.", { id: toastId });
      navigate({ to: "/sessions/$sessionId", params: { sessionId }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed", { id: toastId });
      setEnding(false);
      endingRef.current = false;
    }
  }

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="px-6 py-10 max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="clay p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Crown className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-display font-bold">Voice mode is a Pro feature</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Practise like a real phone interview — speak your answers, hear the AI interviewer respond. English-only, with live transcript.
          </p>
          <Link to="/upgrade" className="btn-clay mt-6 inline-flex">
            <Crown className="w-4 h-4" /> See upgrade options
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="clay-sm px-3 py-1 rounded-full text-[11px] uppercase tracking-widest text-primary-glow flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Voice · English only
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-display font-bold">Voice Interview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real call vibes — talk to the AI interviewer, see live captions of both sides.
      </p>

      {!callActive && (
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <label className="clay-inset rounded-2xl p-4 block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Role</div>
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="mt-1 bg-transparent w-full outline-none font-medium"
              placeholder="Software Engineer"
            />
          </label>
          <label className="clay-inset rounded-2xl p-4 block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Experience</div>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="mt-1 bg-transparent w-full outline-none font-medium"
            >
              {["fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"].map((x) => (
                <option key={x} value={x} className="bg-background">{x}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Call orb */}
      <div className="mt-8 clay p-6 sm:p-10">
        <div className="flex flex-col items-center">
          <motion.div
            animate={
              speaking
                ? { scale: [1, 1.08, 1] }
                : listening
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 1.2, repeat: speaking || listening ? Infinity : 0 }}
            className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full grid place-items-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-clay-sm)" }}
          >
            {speaking ? (
              <Volume2 className="w-12 h-12 text-primary-foreground" />
            ) : thinking ? (
              <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
            ) : listening ? (
              <Mic className="w-12 h-12 text-primary-foreground" />
            ) : (
              <Phone className="w-12 h-12 text-primary-foreground" />
            )}
            {(listening || speaking) && (
              <span className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-ping" />
            )}
          </motion.div>

          <div className="mt-5 text-center">
            <div className="font-semibold">
              {!callActive
                ? "Ready when you are"
                : speaking
                ? "Interviewer is speaking…"
                : thinking
                ? "Thinking…"
                : listening
                ? "Listening… speak now"
                : "Paused"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {jobRole} · {experience}
            </div>
          </div>

          {!callActive ? (
            <button onClick={startCall} className="btn-clay mt-6">
              <Phone className="w-4 h-4" /> Start call
            </button>
          ) : (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (muted) {
                    setMuted(false);
                    if (!speaking && !thinking) startListening();
                  } else {
                    setMuted(true);
                    stopListening();
                  }
                }}
                className="btn-ghost-clay"
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {muted ? "Unmute" : "Mute"}
              </button>
              <button onClick={endCall} className="btn-clay" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
                <PhoneOff className="w-4 h-4" /> End call
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live transcript */}
      <div className="mt-6 clay p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Live transcript</h2>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">English</span>
        </div>
        <div
          ref={scrollRef}
          className="clay-inset rounded-xl p-3 max-h-80 overflow-y-auto space-y-2 text-sm"
        >
          {transcript.length === 0 && !interim && (
            <div className="text-muted-foreground text-xs py-6 text-center">
              Captions appear here as the conversation happens.
            </div>
          )}
          <AnimatePresence initial={false}>
            {transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    "max-w-[85%] rounded-2xl px-3 py-2 " +
                    (t.role === "user"
                      ? "clay-sm text-foreground"
                      : "clay-inset text-foreground")
                  }
                  style={
                    t.role === "user"
                      ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)" }
                      : undefined
                  }
                >
                  <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                    {t.role === "user" ? "You" : "Interviewer"}
                  </div>
                  <div className="leading-snug whitespace-pre-wrap">{t.content}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {interim && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-3 py-2 clay-inset text-muted-foreground italic">
                <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">You</div>
                <div className="leading-snug">{interim}…</div>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Tip: Use Chrome on desktop for best voice recognition. Voice mode is English-only.
        </p>
      </div>
    </div>
  );
}
