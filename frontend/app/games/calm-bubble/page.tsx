"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  BREATHING_RHYTHMS,
  DURATION_OPTIONS,
  CALMING_MESSAGES,
  BreathingRhythm,
} from "@/lib/games/calmBubbleConfig";
import {
  Wind,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Heart,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type ScreenState = "welcome" | "breathing" | "complete";
type BreathPhase = "inhale" | "exhale";

export default function CalmBubblePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Screen & settings state
  const [screenState, setScreenState] = useState<ScreenState>("welcome");
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState<number>(180); // 3 minutes default
  const [selectedRhythmId, setSelectedRhythmId] = useState<string>("gentle"); // 4s in, 4s out default
  const [showTextInstructions, setShowTextInstructions] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false); // Disabled by default as requested
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Live session state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 1
  const [phaseRemaining, setPhaseRemaining] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [calmingMessage, setCalmingMessage] = useState<string>("");

  // Persistence state
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Animation & audio refs
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentOscRef = useRef<OscillatorNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);

  const activeRhythm: BreathingRhythm =
    BREATHING_RHYTHMS.find((r) => r.id === selectedRhythmId) || BREATHING_RHYTHMS[0];

  // Initialize Web Audio API on demand
  const initAudio = useCallback(() => {
    if (typeof window === "undefined" || !soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  // Gentle soft sine tone on phase change (optional sound)
  const playPhaseSound = useCallback(
    (phase: BreathPhase, durationSec: number) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        // Clean up previous sound
        if (currentOscRef.current && currentGainRef.current) {
          try {
            currentGainRef.current.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            currentOscRef.current.stop(ctx.currentTime + 0.12);
          } catch {
            // Ignored
          }
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const now = ctx.currentTime;

        if (phase === "inhale") {
          // Soft ascending wave (261.63Hz C4 -> 329.63Hz E4)
          osc.frequency.setValueAtTime(261.63, now);
          osc.frequency.exponentialRampToValueAtTime(329.63, now + Math.min(durationSec, 3));
          gain.gain.setValueAtTime(0.005, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.8);
          gain.gain.linearRampToValueAtTime(0.02, now + durationSec - 0.2);
        } else {
          // Soft descending wave (329.63Hz E4 -> 220Hz A3)
          osc.frequency.setValueAtTime(329.63, now);
          osc.frequency.exponentialRampToValueAtTime(220.0, now + Math.min(durationSec, 3.5));
          gain.gain.setValueAtTime(0.005, now);
          gain.gain.linearRampToValueAtTime(0.03, now + 0.8);
          gain.gain.linearRampToValueAtTime(0.001, now + durationSec);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSec);

        currentOscRef.current = osc;
        currentGainRef.current = gain;
      } catch {
        // Fallback
      }
    },
    [soundEnabled, initAudio]
  );

  // Play peaceful completion chime
  const playCompletionChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const notes = [293.66, 369.99, 440.0, 587.33]; // D major 7th chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
      });
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Start breathing session
  const startSession = () => {
    initAudio();
    setSecondsElapsed(0);
    setCurrentPhase("inhale");
    setPhaseProgress(0);
    setPhaseRemaining(activeRhythm.inhaleSeconds);
    setCompletedCycles(0);
    setIsPaused(false);
    lastTimestampRef.current = null;
    setScreenState("breathing");
    playPhaseSound("inhale", activeRhythm.inhaleSeconds);
  };

  // End session early or on completion
  const endSession = useCallback(
    async (isNaturalCompletion: boolean) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      if (isNaturalCompletion) {
        playCompletionChime();
      }

      // Pick a calming message
      const randomMsg =
        CALMING_MESSAGES[Math.floor(Math.random() * CALMING_MESSAGES.length)];
      setCalmingMessage(randomMsg);
      setScreenState("complete");

      // Save session for authenticated users if they spent at least 30 seconds
      if (user && secondsElapsed >= 30) {
        setSavingSession(true);
        try {
          const minutesPracticed = Math.max(Math.round(secondsElapsed / 60), 1);
          const score = minutesPracticed * 10;
          const res = await gamesAPI.recordSession({
            game_slug: "calm-bubble",
            score,
            total_questions: selectedDurationSeconds / 60,
            correct_count: minutesPracticed,
            difficulty: selectedRhythmId,
            duration_seconds: secondsElapsed,
          });

          setSavedXP(res.data.xp_awarded ?? null);
          toast.success(`Calm Bubble session saved! +${res.data.xp_awarded ?? score} XP gained! 🫧`);
        } catch {
          // Silently handle offline/error
        } finally {
          setSavingSession(false);
        }
      }
    },
    [
      user,
      secondsElapsed,
      selectedDurationSeconds,
      selectedRhythmId,
      playCompletionChime,
    ]
  );

  // Main Breathing Animation Loop (requestAnimationFrame for high precision)
  useEffect(() => {
    if (screenState !== "breathing" || isPaused) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let phase: BreathPhase = currentPhase;
    let phaseDuration =
      phase === "inhale" ? activeRhythm.inhaleSeconds : activeRhythm.exhaleSeconds;
    let elapsedInPhase = (1 - phaseRemaining / phaseDuration) * phaseDuration;
    let totalSec = secondsElapsed;

    const tick = (now: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = now;
      }
      const deltaSec = (now - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = now;

      elapsedInPhase += deltaSec;
      totalSec += deltaSec;
      setSecondsElapsed(Math.floor(totalSec));

      // Check if session reached target duration
      if (totalSec >= selectedDurationSeconds) {
        endSession(true);
        return;
      }

      // Transition between Inhale and Exhale
      if (elapsedInPhase >= phaseDuration) {
        elapsedInPhase = 0;
        if (phase === "inhale") {
          phase = "exhale";
          phaseDuration = activeRhythm.exhaleSeconds;
          setCurrentPhase("exhale");
          playPhaseSound("exhale", phaseDuration);
        } else {
          phase = "inhale";
          phaseDuration = activeRhythm.inhaleSeconds;
          setCurrentPhase("inhale");
          setCompletedCycles((c) => c + 1);
          playPhaseSound("inhale", phaseDuration);
        }
      }

      const progress = Math.min(Math.max(elapsedInPhase / phaseDuration, 0), 1);
      const remaining = Math.max(phaseDuration - elapsedInPhase, 0);

      setPhaseProgress(progress);
      setPhaseRemaining(remaining);

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [
    screenState,
    isPaused,
    currentPhase,
    activeRhythm,
    selectedDurationSeconds,
    endSession,
    playPhaseSound,
  ]);

  // Keyboard accessibility: Space to pause/resume, Escape to end session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenState === "breathing") {
        if (e.code === "Space") {
          e.preventDefault();
          setIsPaused((p) => !p);
        } else if (e.code === "Escape") {
          e.preventDefault();
          endSession(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenState, endSession]);

  // Calculate bubble visual scale
  // Expands smoothly from 1.0 to 1.5 during inhale; shrinks from 1.5 to 1.0 during exhale
  const calculateBubbleScale = () => {
    if (reducedMotion) return 1.15; // Stable gentle scale if reduced motion preferred
    if (currentPhase === "inhale") {
      return 1.0 + 0.5 * phaseProgress;
    } else {
      return 1.5 - 0.5 * phaseProgress;
    }
  };

  const bubbleScale = calculateBubbleScale();
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Calm Bubble" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & CUSTOMIZATION SCREEN                     */}
          {/* ============================================================ */}
          {screenState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-sky-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold">
                      <Wind className="w-3.5 h-3.5 text-sky-300" />
                      Visual Breathing Guide
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute audio" : "Enable gentle sound"}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-sky-300" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-[11px] hidden sm:inline">
                        {soundEnabled ? "Gentle Tone On" : "Sound Off (Default)"}
                      </span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Calm Bubble 🫧
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    A soothing, non-demanding visual breathing guide. Watch the soft bubble expand and
                    contract at a natural, comfortable pace. No forced holding—just a gentle moment to unwind.
                  </p>
                </div>
              </div>

              {/* Duration Settings */}
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  Choose Session Duration
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DURATION_OPTIONS.map((d) => {
                    const isSelected = selectedDurationSeconds === d.seconds;
                    return (
                      <button
                        key={d.seconds}
                        onClick={() => setSelectedDurationSeconds(d.seconds)}
                        className={`p-4 rounded-2xl text-left border transition-all duration-200 space-y-1 ${
                          isSelected
                            ? "bg-sky-500/10 border-sky-500 shadow-md ring-2 ring-sky-500/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-sm text-white">
                            {d.label}
                          </h3>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                        </div>
                        <p className="text-xs text-slate-400">
                          {d.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rhythm Settings */}
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  Select Comfortable Breathing Cadence
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BREATHING_RHYTHMS.map((r) => {
                    const isSelected = selectedRhythmId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRhythmId(r.id)}
                        className={`p-4 rounded-2xl text-left border transition-all duration-200 space-y-1 ${
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-sm text-white">
                            {r.name}
                          </h3>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <p className="text-xs text-slate-400">
                          {r.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual & Accessibility Toggles */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  {/* Instructions Toggle */}
                  <button
                    onClick={() => setShowTextInstructions(!showTextInstructions)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-sky-400 transition"
                  >
                    {showTextInstructions ? <Eye className="w-4 h-4 text-sky-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    <span>{showTextInstructions ? "Text Guide: Visible" : "Text Guide: Hidden"}</span>
                  </button>

                  {/* Sound Toggle */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-sky-400 transition"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>{soundEnabled ? "Gentle Tone: On" : "Sound: Off"}</span>
                  </button>

                  {/* Reduced Motion Toggle */}
                  <button
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-indigo-400 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{reducedMotion ? "Reduced Motion: On" : "Reduced Motion: Off"}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Link
                  href="/games"
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                >
                  ← Back to Games Hub
                </Link>

                <button
                  onClick={startSession}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Start Calm Session</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: ACTIVE CALM BUBBLE SESSION SCREEN                  */}
          {/* ============================================================ */}
          {screenState === "breathing" && (
            <div className="w-full max-w-xl flex flex-col items-center justify-center space-y-6">
              {/* Header: Time & Controls */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {formatTime(secondsElapsed)} / {formatTime(selectedDurationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowTextInstructions(!showTextInstructions)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    title={showTextInstructions ? "Hide text guide" : "Show text guide"}
                  >
                    {showTextInstructions ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    title={soundEnabled ? "Mute audio" : "Enable gentle tone"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 transition-all duration-300"
                  style={{
                    width: `${Math.min((secondsElapsed / selectedDurationSeconds) * 100, 100)}%`,
                  }}
                />
              </div>

              {/* Main Animated Calm Bubble Stage */}
              <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center my-6 select-none">
                {/* Outer Ambient Glow Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-sky-400/20 bg-sky-400/10"
                  animate={{
                    scale: bubbleScale * 1.15,
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute inset-4 rounded-full border border-purple-400/20 bg-purple-400/15"
                  animate={{
                    scale: bubbleScale * 1.08,
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* The Translucent Bioluminescent Calm Bubble */}
                <motion.div
                  className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-center p-4 cursor-pointer backdrop-blur-md"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.6), rgba(186, 230, 253, 0.35) 40%, rgba(199, 210, 254, 0.45) 70%, rgba(233, 213, 255, 0.5) 100%)",
                    boxShadow:
                      "0 0 60px rgba(125, 211, 252, 0.45), inset 0 0 25px rgba(255, 255, 255, 0.7), inset -10px -10px 30px rgba(165, 180, 252, 0.5)",
                    transform: `scale(${bubbleScale})`,
                    transition: reducedMotion ? "none" : "transform 0.1s linear",
                  }}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {/* Subtle specular bubble highlight curve */}
                  <div className="absolute top-4 left-6 w-12 h-6 rounded-full bg-white/60 blur-[1px] transform -rotate-35 pointer-events-none" />

                  {/* Optional Text Instructions */}
                  {showTextInstructions ? (
                    <div className="space-y-1 text-slate-900 drop-shadow-sm">
                      <span className="text-xs uppercase tracking-widest font-black opacity-70">
                        {currentPhase === "inhale" ? "Breathe In" : "Breathe Out"}
                      </span>
                      <h2 className="text-3xl font-black tracking-tight font-mono">
                        {phaseRemaining.toFixed(1)}s
                      </h2>
                    </div>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-white/80 shadow-md" />
                  )}
                </motion.div>

                {/* Pause Overlay */}
                {isPaused && (
                  <div className="absolute inset-0 rounded-full bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-20">
                    <Pause className="w-8 h-8 text-sky-300" />
                    <span className="text-sm font-extrabold uppercase tracking-wider">Paused</span>
                    <span className="text-[11px] text-slate-300">Press Space to Resume</span>
                  </div>
                )}
              </div>

              {/* Gentle Phase Guidance Text */}
              {showTextInstructions && (
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-300">
                    {currentPhase === "inhale"
                      ? "Gently expand with the bubble..."
                      : "Softly release and let tension settle..."}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {activeRhythm.name}
                  </p>
                </div>
              )}

              {/* Session Control Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 shadow-sm transition"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-sky-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{isPaused ? "Resume (Space)" : "Pause (Space)"}</span>
                </button>

                <button
                  onClick={() => endSession(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  End Session (Esc)
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: CALM COMPLETION SCREEN                             */}
          {/* ============================================================ */}
          {screenState === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Completion Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-sky-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center mx-auto shadow-inner">
                  <Heart className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Session Completed 🫧
                </h1>

                <p className="text-sm sm:text-base text-sky-100 max-w-lg mx-auto leading-relaxed italic">
                  "{calmingMessage}"
                </p>

                {savedXP !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    +{savedXP} MindCare XP Added
                  </div>
                )}
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Time in Stillness
                  </span>
                  <div className="text-2xl font-black text-sky-400">
                    {formatTime(secondsElapsed)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Gentle self-care practice
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Breathing Cycles
                  </span>
                  <div className="text-2xl font-black text-indigo-400">
                    {completedCycles} Cycles
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {activeRhythm.name.split("(")[0]}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Pacing
                  </span>
                  <div className="text-base font-black text-purple-400 pt-1">
                    Self-Directed
                  </div>
                  <span className="text-[11px] text-slate-400">
                    No pressure, no judgment
                  </span>
                </div>
              </div>

              {/* Gentle Educational Safeguard */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Wellness Invitation:</strong> Calm Bubble is a gentle visual relaxation companion.
                  Breathing pacing is completely voluntary and is not a clinical assessment or measure of mental health.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setScreenState("welcome")}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Adjust Duration & Rhythm
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={startSession}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Breathe Again</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
