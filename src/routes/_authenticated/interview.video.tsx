import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { effectivePlan } from "@/lib/billing/plans";
import {
  closeDidStream,
  createDidStream,
  sendDidIce,
  sendDidSdpAnswer,
  speakOnDidStream,
  videoInterviewBrain,
} from "@/lib/api/video.functions";

export const Route = createFileRoute("/_authenticated/interview/video")({
  head: () => ({ meta: [{ title: "Video interview — InterviewBro AI" }] }),
  component: VideoInterview,
});

type Turn = { role: "user" | "assistant"; content: string };

function VideoInterview() {
  const { user } = useAuth();
  const userId = user!.id;

  const createFn = useServerFn(createDidStream);
  const sdpFn = useServerFn(sendDidSdpAnswer);
  const iceFn = useServerFn(sendDidIce);
  const speakFn = useServerFn(speakOnDidStream);
  const closeFn = useServerFn(closeDidStream);
  const brainFn = useServerFn(videoInterviewBrain);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-video", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "plan, plan_expires_at, default_job_role, default_experience_level",
        )
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const plan = effectivePlan(
    profile?.plan as string | null,
    profile?.plan_expires_at as string | null,
  );
  const allowed = plan === "premium";

  const [jobRole, setJobRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("fresher");
  useEffect(() => {
    if (profile?.default_job_role) setJobRole(profile.default_job_role as string);
    if (profile?.default_experience_level)
      setExperience(profile.default_experience_level as string);
  }, [profile]);

  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [attention, setAttention] = useState(100);

  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<Turn[]>([]);
  const callActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attentionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    transcriptRef.current = transcript;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    return !!SR && !!navigator.mediaDevices?.getUserMedia;
  }, []);

  function startListening() {
    if (!callActiveRef.current || mutedRef.current) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = "";
      rec.onresult = (e: any) => {
        let it = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else it += r[0].transcript;
        }
        setInterim(it);
      };
      rec.onerror = (e: any) => {
        setListening(false);
        setInterim("");
        if (e.error === "not-allowed") {
          toast.error("Microphone permission denied");
          void endCall();
        }
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        const text = finalText.trim();
        if (text && callActiveRef.current) {
          void handleUserTurn(text);
        } else if (callActiveRef.current && !mutedRef.current) {
          setTimeout(startListening, 250);
        }
      };
      rec.onstart = () => setListening(true);
      recognitionRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }

  async function handleUserTurn(text: string) {
    const next: Turn[] = [
      ...transcriptRef.current,
      { role: "user", content: text },
    ];
    setTranscript(next);
    await handleAssistantTurn(next);
  }

  async function handleAssistantTurn(history: Turn[]) {
    setThinking(true);
    try {
      const res = await brainFn({ data: { jobRole, experience, history } });
      const reply = res.reply;
      if (!reply) throw new Error("Empty AI reply");
      setThinking(false);
      const next: Turn[] = [
        ...history,
        { role: "assistant", content: reply },
      ];
      setTranscript(next);
      if (streamIdRef.current && sessionIdRef.current) {
        await speakFn({
          data: {
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
            text: reply,
          },
        });
      }
      // Listen again shortly after the avatar starts speaking. We can't easily
      // know exactly when D-ID finishes; estimate from text length.
      const estMs = Math.max(2000, Math.min(20000, reply.length * 70));
      window.setTimeout(() => {
        if (callActiveRef.current && !mutedRef.current) startListening();
      }, estMs);
    } catch (e) {
      setThinking(false);
      toast.error(e instanceof Error ? e.message : "AI failed");
    }
  }

  async function startCall() {
    if (!supported) {
      toast.error("Use Chrome on desktop for video mode.");
      return;
    }
    setConnecting(true);
    try {
      // Local camera + mic preview
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      camStreamRef.current = camStream;
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = camStream;
        await selfVideoRef.current.play().catch(() => undefined);
      }

      // D-ID stream
      const stream = await createFn();
      streamIdRef.current = stream.id;
      sessionIdRef.current = stream.session_id;

      const pc = new RTCPeerConnection({ iceServers: stream.ice_servers });
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        if (avatarVideoRef.current && ev.streams[0]) {
          avatarVideoRef.current.srcObject = ev.streams[0];
          avatarVideoRef.current.play().catch(() => undefined);
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !streamIdRef.current || !sessionIdRef.current) return;
        void iceFn({
          data: {
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid ?? null,
            sdpMLineIndex: ev.candidate.sdpMLineIndex ?? null,
          },
        }).catch(() => undefined);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          // ignore — handled in endCall
        }
      };

      await pc.setRemoteDescription(stream.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sdpFn({
        data: {
          streamId: stream.id,
          sessionId: stream.session_id,
          answer: { type: answer.type ?? "answer", sdp: answer.sdp ?? "" },
        },
      });

      setCallActive(true);
      callActiveRef.current = true;
      setConnecting(false);

      // Kick off the conversation
      await handleAssistantTurn([]);

      // Simple attention timer — decreases when window blurred / camera off
      attentionTimerRef.current = window.setInterval(() => {
        setAttention((a) => {
          const focused = document.hasFocus() && camOn && !document.hidden;
          const delta = focused ? 1 : -3;
          return Math.max(0, Math.min(100, a + delta));
        });
      }, 1000);
    } catch (e) {
      setConnecting(false);
      toast.error(e instanceof Error ? e.message : "Could not start call");
      await endCall();
    }
  }

  async function endCall() {
    setCallActive(false);
    callActiveRef.current = false;
    stopListening();
    setInterim("");
    setThinking(false);

    if (attentionTimerRef.current) {
      window.clearInterval(attentionTimerRef.current);
      attentionTimerRef.current = null;
    }

    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {
      // ignore
    }
    pcRef.current = null;

    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    if (avatarVideoRef.current) avatarVideoRef.current.srcObject = null;

    const sid = streamIdRef.current;
    const ssid = sessionIdRef.current;
    streamIdRef.current = null;
    sessionIdRef.current = null;
    if (sid && ssid) {
      try {
        await closeFn({ data: { streamId: sid, sessionId: ssid } });
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    return () => {
      void endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="clay p-8 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-2xl grid place-items-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Crown className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-display font-bold">
            Video simulation is a Premium feature
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Practice on a real video call with an AI interviewer avatar that
            talks, blinks, and reacts in real time. Live captions, webcam
            preview, and attention tracking included.
          </p>
          <Link to="/upgrade" className="btn-clay mt-6 inline-flex">
            <Crown className="w-4 h-4" /> Upgrade to Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="clay-sm px-3 py-1 rounded-full text-[11px] uppercase tracking-widest text-primary-glow flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Video · Premium
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-display font-bold">
        Video Interview Simulation
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Face-to-face with an AI interviewer. English only. Speak naturally —
        captions appear live.
      </p>

      {!callActive && !connecting && (
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <label className="clay-inset rounded-2xl p-4 block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Role
            </div>
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="mt-1 bg-transparent w-full outline-none font-medium"
              placeholder="Software Engineer"
            />
          </label>
          <label className="clay-inset rounded-2xl p-4 block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Experience
            </div>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="mt-1 bg-transparent w-full outline-none font-medium"
            >
              {["fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"].map(
                (x) => (
                  <option key={x} value={x} className="bg-background">
                    {x}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Video stage */}
        <div className="clay p-3 relative overflow-hidden">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60">
            <video
              ref={avatarVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!callActive && (
              <div className="absolute inset-0 grid place-items-center text-center px-6">
                <div>
                  <div
                    className="w-16 h-16 mx-auto rounded-2xl grid place-items-center mb-3"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Video className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="font-display font-semibold text-lg">
                    Your AI interviewer is ready
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Streamed live via D-ID over WebRTC.
                  </div>
                </div>
              </div>
            )}

            {/* Self preview */}
            <div className="absolute bottom-3 right-3 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden ring-2 ring-primary/40 bg-black">
              <video
                ref={selfVideoRef}
                autoPlay
                muted
                playsInline
                className={
                  "w-full h-full object-cover " + (camOn ? "" : "opacity-0")
                }
              />
              {!camOn && (
                <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
                  Camera off
                </div>
              )}
            </div>

            {/* Status pill */}
            {callActive && (
              <div className="absolute top-3 left-3 clay-sm rounded-full px-3 py-1 text-[11px] flex items-center gap-1.5">
                <span
                  className={
                    "w-2 h-2 rounded-full " +
                    (thinking
                      ? "bg-yellow-400 animate-pulse"
                      : listening
                        ? "bg-green-400 animate-pulse"
                        : "bg-primary-glow")
                  }
                />
                {thinking
                  ? "Interviewer thinking…"
                  : listening
                    ? "Listening — speak now"
                    : "Live"}
              </div>
            )}

            {/* Attention HUD */}
            {callActive && (
              <div className="absolute top-3 right-3 clay-sm rounded-full px-3 py-1 text-[11px]">
                Attention: {attention}%
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {!callActive ? (
              <button
                onClick={startCall}
                disabled={connecting}
                className="btn-clay"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> Start video call
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (muted) {
                      setMuted(false);
                      if (!thinking) startListening();
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
                <button
                  onClick={() => {
                    const next = !camOn;
                    setCamOn(next);
                    camStreamRef.current
                      ?.getVideoTracks()
                      .forEach((t) => (t.enabled = next));
                  }}
                  className="btn-ghost-clay"
                >
                  {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {camOn ? "Camera" : "Cam off"}
                </button>
                <button
                  onClick={endCall}
                  className="btn-clay"
                  style={{
                    background: "linear-gradient(135deg,#ef4444,#b91c1c)",
                  }}
                >
                  <PhoneOff className="w-4 h-4" /> End call
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live transcript */}
        <div className="clay p-4 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Live transcript</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              English
            </span>
          </div>
          <div
            ref={scrollRef}
            className="clay-inset rounded-xl p-3 flex-1 overflow-y-auto space-y-2 text-sm"
          >
            {transcript.length === 0 && !interim && (
              <div className="text-muted-foreground text-xs py-6 text-center">
                Captions of both you and the interviewer appear here.
              </div>
            )}
            <AnimatePresence initial={false}>
              {transcript.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    t.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={
                      "max-w-[85%] rounded-2xl px-3 py-2 " +
                      (t.role === "user" ? "clay-sm" : "clay-inset")
                    }
                    style={
                      t.role === "user"
                        ? {
                            background: "var(--gradient-primary)",
                            color: "var(--primary-foreground)",
                          }
                        : undefined
                    }
                  >
                    <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                      {t.role === "user" ? "You" : "Interviewer"}
                    </div>
                    <div className="leading-snug whitespace-pre-wrap">
                      {t.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {interim && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3 py-2 clay-inset text-muted-foreground italic">
                  <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                    You
                  </div>
                  <div className="leading-snug">{interim}…</div>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tip: Allow camera + mic. Best on Chrome desktop. Streaming via D-ID
            uses your Premium credits.
          </p>
        </div>
      </div>
    </div>
  );
}
