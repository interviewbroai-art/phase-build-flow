import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Crown,
  Eye,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Sparkles,
  Video,
  VideoOff,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { scoreInterview } from "@/lib/api/interview.functions";
import {
  attachAvatarMetrics,
  closeDidStream,
  createDidStream,
  getAvatarAccess,
  sendDidIce,
  sendDidSdpAnswer,
  speakOnDidStream,
  videoInterviewBrain,
} from "@/lib/api/video.functions";

export const Route = createFileRoute("/_authenticated/interview/video")({
  head: () => ({ meta: [{ title: "Avatar Interview — InterviewBro AI" }] }),
  component: VideoInterview,
});

type Turn = { role: "user" | "assistant"; content: string };
type Stage = "intro" | "devicetest" | "live" | "ending";

const FILLERS = ["um", "uh", "like", "actually", "basically", "you know", "i mean", "sort of"];

function countFillers(text: string): number {
  const lower = " " + text.toLowerCase().replace(/[^a-z' ]+/g, " ") + " ";
  let n = 0;
  for (const f of FILLERS) {
    const re = new RegExp(`\\s${f.replace(/'/g, "\\'")}\\s`, "g");
    const m = lower.match(re);
    if (m) n += m.length;
  }
  return n;
}

function readinessFor(score: number): "Beginner" | "Improving" | "Interview Ready" | "Strong" {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Interview Ready";
  if (score >= 50) return "Improving";
  return "Beginner";
}

function VideoInterview() {
  const { user } = useAuth();
  const userId = user!.id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createFn = useServerFn(createDidStream);
  const sdpFn = useServerFn(sendDidSdpAnswer);
  const iceFn = useServerFn(sendDidIce);
  const speakFn = useServerFn(speakOnDidStream);
  const closeFn = useServerFn(closeDidStream);
  const brainFn = useServerFn(videoInterviewBrain);
  const scoreFn = useServerFn(scoreInterview);
  const metricsFn = useServerFn(attachAvatarMetrics);
  const accessFn = useServerFn(getAvatarAccess);

  // Access check (premium OR <1 free avatar session)
  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ["avatar-access", userId],
    queryFn: () => accessFn({}),
    refetchOnWindowFocus: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-video", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("default_job_role, default_experience_level")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [jobRole, setJobRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("fresher");
  useEffect(() => {
    if (profile?.default_job_role) setJobRole(profile.default_job_role as string);
    if (profile?.default_experience_level)
      setExperience(profile.default_experience_level as string);
  }, [profile]);

  // ---- Browser capability flags ----
  const support = useMemo(() => {
    if (typeof window === "undefined")
      return { webrtc: false, stt: false, tts: false, mediapipe: false };
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    return {
      webrtc: !!(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia),
      stt: !!SR,
      tts: typeof window.speechSynthesis !== "undefined",
      mediapipe: typeof WebAssembly !== "undefined",
    };
  }, []);

  // ---- Stage state ----
  const [stage, setStage] = useState<Stage>("intro");
  const [connecting, setConnecting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [interim, setInterim] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [transcript, setTranscript] = useState<Turn[]>([]);

  // ---- Device test state ----
  const [permGranted, setPermGranted] = useState<null | boolean>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [sttFallback, setSttFallback] = useState(false); // user opted into typed mode

  // ---- Live behavior tracking ----
  const [attention, setAttention] = useState(100);
  const [facePresent, setFacePresent] = useState(false);
  const [eyeContact, setEyeContact] = useState(false);

  // ---- Refs ----
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const interviewSessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<Turn[]>([]);
  const stageRef = useRef<Stage>("intro");
  const mutedRef = useRef(false);
  const streamReadyRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  // MediaPipe + behavior aggregation
  const faceLandmarkerRef = useRef<any>(null);
  const trackingRafRef = useRef<number | null>(null);
  const attentionTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micMeterRafRef = useRef<number | null>(null);
  const sampleCountRef = useRef(0);
  const facePresentCountRef = useRef(0);
  const eyeContactCountRef = useRef(0);
  const attentionSumRef = useRef(0);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
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

  // ---- Mic meter for device test ----
  function startMicMeter(stream: MediaStream) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      micAnalyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setMicLevel(Math.min(100, Math.round(rms * 220)));
        micMeterRafRef.current = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // ignore
    }
  }

  function stopMicMeter() {
    if (micMeterRafRef.current) cancelAnimationFrame(micMeterRafRef.current);
    micMeterRafRef.current = null;
    try {
      audioCtxRef.current?.close();
    } catch {
      // ignore
    }
    audioCtxRef.current = null;
  }

  // ---- Device test entry point ----
  async function beginDeviceTest() {
    setStage("devicetest");
    setPermError(null);
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      camStreamRef.current = camStream;
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = camStream;
        await selfVideoRef.current.play().catch(() => undefined);
      }
      startMicMeter(camStream);
      setPermGranted(true);
    } catch (e) {
      setPermGranted(false);
      setPermError(
        e instanceof Error
          ? e.message
          : "Camera or microphone access denied",
      );
    }
  }

  // ---- MediaPipe FaceLandmarker ----
  async function startFaceTracking() {
    if (!support.mediapipe) return;
    if (!selfVideoRef.current || !camStreamRef.current) return;
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      const flm = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
      });
      faceLandmarkerRef.current = flm;

      const loop = () => {
        if (stageRef.current !== "live") return;
        const v = selfVideoRef.current;
        if (v && v.readyState >= 2) {
          try {
            const res = flm.detectForVideo(v, performance.now());
            const lms = res?.faceLandmarks?.[0];
            sampleCountRef.current += 1;
            if (lms && lms.length > 0) {
              facePresentCountRef.current += 1;
              setFacePresent(true);
              // Approximate eye-contact via nose-tip horizontal centering.
              // Landmark 1 = nose tip in MediaPipe Face Landmarker (468 pts).
              const nose = lms[1];
              const centered = Math.abs(nose.x - 0.5) < 0.12 && Math.abs(nose.y - 0.5) < 0.18;
              if (centered) {
                eyeContactCountRef.current += 1;
                setEyeContact(true);
              } else {
                setEyeContact(false);
              }
            } else {
              setFacePresent(false);
              setEyeContact(false);
            }
          } catch {
            // ignore single-frame failures
          }
        }
        trackingRafRef.current = window.requestAnimationFrame(loop);
      };
      trackingRafRef.current = window.requestAnimationFrame(loop);
    } catch (e) {
      console.warn("MediaPipe failed to load", e);
    }
  }

  function stopFaceTracking() {
    if (trackingRafRef.current) cancelAnimationFrame(trackingRafRef.current);
    trackingRafRef.current = null;
    try {
      faceLandmarkerRef.current?.close?.();
    } catch {
      // ignore
    }
    faceLandmarkerRef.current = null;
  }

  // ---- STT ----
  function startListening() {
    if (stageRef.current !== "live" || mutedRef.current || sttFallback) return;
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
        } else if (e.error === "no-speech" || e.error === "audio-capture") {
          // silently restart
          if (stageRef.current === "live" && !mutedRef.current) {
            setTimeout(startListening, 400);
          }
        }
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        const text = finalText.trim();
        if (text && stageRef.current === "live") {
          void handleUserTurn(text);
        } else if (stageRef.current === "live" && !mutedRef.current) {
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

  async function waitForStreamReady() {
    for (let i = 0; i < 30; i += 1) {
      if (streamReadyRef.current) return;
      await new Promise((r) => window.setTimeout(r, 150));
    }
  }

  async function createInterviewSession() {
    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: userId,
        job_role: jobRole.trim() || "Software Engineer",
        experience_level: experience,
        interview_type: "video",
        mode: "video",
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

  async function handleUserTurn(text: string) {
    const next: Turn[] = [
      ...transcriptRef.current,
      { role: "user", content: text },
    ];
    setTranscript(next);
    setTypedAnswer("");
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
        await waitForStreamReady();
        await speakFn({
          data: {
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
            text: reply,
          },
        });
      }
      const estMs = Math.max(2000, Math.min(20000, reply.length * 70));
      window.setTimeout(() => {
        if (stageRef.current === "live" && !mutedRef.current && !sttFallback)
          startListening();
      }, estMs);
    } catch (e) {
      setThinking(false);
      toast.error(e instanceof Error ? e.message : "AI failed");
    }
  }

  // ---- Start the actual interview after device test passes ----
  async function startCall() {
    if (!camStreamRef.current) {
      toast.error("Camera/mic not ready");
      return;
    }
    setConnecting(true);
    try {
      stopMicMeter();
      const stream = await createFn();
      streamIdRef.current = stream.id;
      sessionIdRef.current = stream.session_id;

      const pc = new RTCPeerConnection({ iceServers: stream.ice_servers });
      pcRef.current = pc;
      streamReadyRef.current = false;

      const dataChannel = pc.createDataChannel("JanusDataChannel");
      dataChannel.addEventListener("message", (message) => {
        if (String(message.data).startsWith("stream/ready")) {
          window.setTimeout(() => {
            streamReadyRef.current = true;
          }, 1000);
        }
      });

      pc.ontrack = (ev) => {
        if (avatarVideoRef.current && ev.streams[0]) {
          avatarVideoRef.current.srcObject = ev.streams[0];
          avatarVideoRef.current.play().catch(() => undefined);
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !streamIdRef.current || !sessionIdRef.current)
          return;
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

      interviewSessionIdRef.current = await createInterviewSession();
      startedAtRef.current = Date.now();

      setStage("live");
      stageRef.current = "live";
      setConnecting(false);

      // Reset behavior counters
      sampleCountRef.current = 0;
      facePresentCountRef.current = 0;
      eyeContactCountRef.current = 0;
      attentionSumRef.current = 0;
      setAttention(100);

      // Kick off conversation
      await handleAssistantTurn([]);

      // Attention sampler — uses MediaPipe-detected face/eye contact + window focus.
      attentionTimerRef.current = window.setInterval(() => {
        setAttention((a) => {
          const focused = document.hasFocus() && camOn && !document.hidden;
          const present = facePresent;
          const contact = eyeContact;
          let delta = -2;
          if (focused && present && contact) delta = 2;
          else if (focused && present) delta = 0;
          const next = Math.max(0, Math.min(100, a + delta));
          attentionSumRef.current += next;
          return next;
        });
      }, 1000);

      void startFaceTracking();
    } catch (e) {
      setConnecting(false);
      toast.error(e instanceof Error ? e.message : "Could not start call");
      await endCall();
    }
  }

  async function endCall() {
    if (stageRef.current === "ending") return;
    const wasLive = stageRef.current === "live";
    setStage("ending");
    stageRef.current = "ending";
    stopListening();
    setInterim("");
    setThinking(false);
    stopFaceTracking();

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
    stopMicMeter();

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

    const interviewSessionId = interviewSessionIdRef.current;
    const finalTranscript = transcriptRef.current;
    const hasCandidateAnswer = finalTranscript.some((t) => t.role === "user");
    if (!wasLive || !interviewSessionId || !hasCandidateAnswer) {
      setStage("intro");
      stageRef.current = "intro";
      return;
    }

    const toastId = toast.loading("Scoring your avatar interview…");
    try {
      const userText = finalTranscript
        .filter((t) => t.role === "user")
        .map((t) => t.content)
        .join(" ");
      const fillers = countFillers(userText);
      const samples = Math.max(1, sampleCountRef.current);
      const facePct = Math.round((facePresentCountRef.current / samples) * 100);
      const eyePct = Math.round((eyeContactCountRef.current / samples) * 100);
      const avgAttention = Math.round(attentionSumRef.current / samples);

      const r = await scoreFn({
        data: {
          sessionId: interviewSessionId,
          jobRole: jobRole.trim() || "Software Engineer",
          experience,
          difficulty: "medium",
          durationSeconds: Math.max(
            1,
            Math.floor((Date.now() - startedAtRef.current) / 1000),
          ),
          transcript: finalTranscript,
        },
      });

      await metricsFn({
        data: {
          sessionId: interviewSessionId,
          behaviorMetrics: {
            avgAttention: Math.max(0, Math.min(100, avgAttention)),
            eyeContactPct: eyePct,
            facePresencePct: facePct,
            fillerWords: fillers,
            roleReadiness: readinessFor(r.overall),
          },
          browserSupport: support,
        },
      });

      await qc.invalidateQueries({ queryKey: ["profile", userId] });
      await qc.invalidateQueries({ queryKey: ["sessions", userId] });
      await qc.invalidateQueries({ queryKey: ["avatar-access", userId] });
      toast.success("Interview complete! Score saved and XP awarded.", {
        id: toastId,
      });
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: interviewSessionId },
        replace: true,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed", {
        id: toastId,
      });
      setStage("intro");
      stageRef.current = "intro";
    }
  }

  useEffect(() => {
    return () => {
      void endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Render ----------------

  if (accessLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />
      </div>
    );
  }

  if (!access?.allowed) {
    return (
      <div className="px-4 sm:px-6 py-10 max-w-2xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="clay p-6 sm:p-8 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-2xl grid place-items-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Crown className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-display font-bold">
            Free Avatar Interview used
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {access?.reason ??
              "You've completed your free Avatar Interview. Upgrade to Premium for unlimited face-to-face mock interviews with a live AI interviewer."}
          </p>
          <Link to="/upgrade" className="btn-clay mt-6 inline-flex">
            <Crown className="w-4 h-4" /> Upgrade to Premium
          </Link>
        </div>
      </div>
    );
  }

  const callActive = stage === "live";
  const showDeviceTest = stage === "devicetest";
  const showIntro = stage === "intro";

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="clay-sm px-3 py-1 rounded-full text-[10px] sm:text-[11px] uppercase tracking-widest text-primary-glow flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Avatar Interview
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold">
        Avatar Interview Mode
      </h1>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        Real-time AI interviewer. English only. Requires camera, mic, and a
        stable connection.
        {access.allowed && access.plan !== "premium" && (
          <>
            {" "}
            <span className="text-primary-glow">
              Free trial — {access.remainingFree} session left.
            </span>
          </>
        )}
      </p>

      {/* INTRO STAGE — role/experience picker */}
      {showIntro && (
        <>
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

          <div className="mt-5 clay p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl grid place-items-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-semibold text-base">
                  What to expect
                </h2>
                <ul className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1">
                  <li>• A lifelike AI interviewer streams over WebRTC.</li>
                  <li>• Your camera enables on-device attention & eye-contact tracking (no video leaves your browser).</li>
                  <li>• You speak — captions appear live. Typed answers also work.</li>
                  <li>• End the call any time to get a scored report with behavior coaching.</li>
                </ul>
                <button
                  onClick={() => void beginDeviceTest()}
                  className="btn-clay mt-4"
                >
                  <Camera className="w-4 h-4" /> Continue to device test
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DEVICE TEST STAGE */}
      {showDeviceTest && (
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <div className="clay p-4">
            <h2 className="font-display font-semibold mb-3 text-sm">
              Camera preview
            </h2>
            <div className="aspect-video rounded-xl overflow-hidden bg-black/60 relative">
              <video
                ref={selfVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {permGranted === false && (
                <div className="absolute inset-0 grid place-items-center text-center px-4 text-xs text-muted-foreground">
                  <div>
                    <XCircle className="w-6 h-6 mx-auto text-red-400 mb-2" />
                    {permError ?? "Camera blocked"}
                    <div className="mt-2">
                      Allow camera & mic in your browser, then retry.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => void beginDeviceTest()}
              className="btn-ghost-clay mt-3 w-full justify-center"
            >
              <Camera className="w-4 h-4" /> Retry permissions
            </button>
          </div>

          <div className="clay p-4 flex flex-col">
            <h2 className="font-display font-semibold mb-3 text-sm">
              Compatibility check
            </h2>
            <ul className="space-y-2 text-sm">
              {[
                { ok: support.webrtc, label: "WebRTC video streaming" },
                { ok: support.stt, label: "Speech-to-text (Chrome recommended)" },
                { ok: support.tts, label: "Speech synthesis" },
                { ok: support.mediapipe, label: "On-device face tracking" },
                {
                  ok: permGranted === true,
                  label: "Camera & microphone permission",
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="clay-inset rounded-xl px-3 py-2 flex items-center gap-2"
                >
                  {row.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="flex-1">{row.label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 clay-inset rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Mic level — say "hello"
              </div>
              <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full transition-[width] duration-100"
                  style={{
                    width: `${micLevel}%`,
                    background: "var(--gradient-primary)",
                  }}
                />
              </div>
            </div>

            {!support.stt && (
              <label className="mt-3 clay-inset rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sttFallback}
                  onChange={(e) => setSttFallback(e.target.checked)}
                />
                Use typed answers (your browser does not support voice input)
              </label>
            )}

            <div className="mt-auto pt-4 flex gap-2">
              <button
                onClick={() => {
                  camStreamRef.current?.getTracks().forEach((t) => t.stop());
                  camStreamRef.current = null;
                  stopMicMeter();
                  setStage("intro");
                }}
                className="btn-ghost-clay flex-1 justify-center"
              >
                Back
              </button>
              <button
                onClick={() => void startCall()}
                disabled={
                  connecting ||
                  permGranted !== true ||
                  !support.webrtc ||
                  (!support.stt && !sttFallback)
                }
                className="btn-clay flex-1 justify-center"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> Start Avatar Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE STAGE */}
      {(callActive || stage === "ending") && (
        <div className="mt-5 grid lg:grid-cols-[1.4fr_1fr] gap-4">
          {/* Video stage */}
          <div className="clay p-3 relative overflow-hidden">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60">
              <video
                ref={avatarVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Self preview */}
              <div className="absolute bottom-3 right-3 w-28 sm:w-40 aspect-video rounded-xl overflow-hidden ring-2 ring-primary/40 bg-black">
                <video
                  ref={selfVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={
                    "w-full h-full object-cover " +
                    (camOn ? "" : "opacity-0")
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
                    ? "Thinking…"
                    : listening
                      ? "Listening"
                      : "Speaking"}
                </div>
              )}

              {/* Behavior HUD */}
              {callActive && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <div className="clay-sm rounded-full px-3 py-1 text-[11px]">
                    Attention: {attention}%
                  </div>
                  <div className="clay-sm rounded-full px-3 py-1 text-[11px] flex items-center gap-1.5">
                    <Eye
                      className={
                        "w-3 h-3 " +
                        (eyeContact ? "text-green-400" : "text-muted-foreground")
                      }
                    />
                    {facePresent ? (eyeContact ? "Eye contact" : "Look at camera") : "No face"}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  if (muted) {
                    setMuted(false);
                    if (!thinking && !sttFallback) startListening();
                  } else {
                    setMuted(true);
                    stopListening();
                  }
                }}
                className="btn-ghost-clay"
                disabled={stage === "ending"}
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
                disabled={stage === "ending"}
              >
                {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                {camOn ? "Camera" : "Cam off"}
              </button>
              <button
                onClick={() => void endCall()}
                className="btn-clay"
                style={{
                  background: "linear-gradient(135deg,#ef4444,#b91c1c)",
                }}
                disabled={stage === "ending"}
              >
                {stage === "ending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scoring…
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-4 h-4" /> End interview
                  </>
                )}
              </button>
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

            {/* Typed-answer fallback — always available */}
            {callActive && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = typedAnswer.trim();
                  if (!t || thinking) return;
                  void handleUserTurn(t);
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder={
                    sttFallback ? "Type your answer…" : "Or type your answer…"
                  }
                  className="flex-1 clay-inset rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={thinking || stage === "ending"}
                />
                <button
                  type="submit"
                  className="btn-clay shrink-0"
                  disabled={!typedAnswer.trim() || thinking || stage === "ending"}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground">
              Tip: Use Chrome on desktop for the best speech-to-text. Face
              tracking runs locally — only summary metrics are saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
