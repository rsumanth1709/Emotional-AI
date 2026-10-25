"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  BREATHING_PATTERNS,
  BreathingPattern,
  BreathingPatternId,
  BreathPhase,
} from "@/lib/games/breathingOdysseyData";
import {
  Wind,
  Heart,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Gamepad2,
  Brain,
  SlidersHorizontal,
  Flame,
  ChevronRight,
  TrendingDown,
  Info,
  Clock,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "pre_check" | "breathing" | "post_check" | "results";

export default function MindfulBreathOdysseyPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Configuration state
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [selectedPatternId, setSelectedPatternId] = useState<BreathingPatternId>("coherence");
  const [targetCycles, setTargetCycles] = useState<number>(8);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Check-in states
  const [preTension, setPreTension] = useState<number>(6);
  const [postTension, setPostTension] = useState<number>(3);

  // Live breathing session state
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 1
  const [phaseRemaining, setPhaseRemaining] = useState<number>(5.5);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [coherenceScore, setCoherenceScore] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);

  // Results & persistence state
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Refs for animation frame & audio
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentOscRef = useRef<OscillatorNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);

  const pattern: BreathingPattern = BREATHING_PATTERNS[selectedPatternId];
  const currentPhase: BreathPhase = pattern.phases[phaseIndex] || pattern.phases[0];

  // Initialize Web Audio on user gesture
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

  // Play harmonic frequency hum for breath phase transition
  const playPhaseSound = useCallback(
    (phaseName: BreathPhase["name"], duration: number) => {
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
        if (phaseName === "Inhale") {
          // Warm ascending swell (220Hz A3 -> 330Hz E4)
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(329.63, now + Math.min(duration, 3));
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.05, now + 0.8);
          gain.gain.linearRampToValueAtTime(0.03, now + duration - 0.2);
        } else if (phaseName === "Hold In") {
          // Steady meditative fifth (330Hz)
          osc.frequency.setValueAtTime(329.63, now);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.035, now + 0.5);
          gain.gain.linearRampToValueAtTime(0.02, now + duration - 0.2);
        } else if (phaseName === "Exhale") {
          // Soothing descending wave (330Hz E4 -> 220Hz A3 -> 164.8Hz E3)
          osc.frequency.setValueAtTime(329.63, now);
          osc.frequency.exponentialRampToValueAtTime(164.81, now + Math.min(duration, 4));
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.045, now + 0.6);
          gain.gain.linearRampToValueAtTime(0.001, now + duration);
        } else {
          // Hold Out: deep ground tone (164.8Hz)
          osc.frequency.setValueAtTime(164.81, now);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.025, now + 0.4);
          gain.gain.linearRampToValueAtTime(0.005, now + duration);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);

        currentOscRef.current = osc;
        currentGainRef.current = gain;
      } catch {
        // Fallback
      }
    },
    [soundEnabled, initAudio]
  );

  // Play session complete celebration chord
  const playCompleteChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const notes = [261.63, 329.63, 392.0, 523.25]; // C major chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 1.3);
      });
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Start breathing odyssey loop
  const startOdysseySession = () => {
    initAudio();
    setCurrentCycle(1);
    setPhaseIndex(0);
    setPhaseProgress(0);
    setPhaseRemaining(pattern.phases[0].durationSeconds);
    setCoherenceScore(0);
    setIsPaused(false);
    setSessionStartTime(Date.now());
    lastTimestampRef.current = null;
    setGameState("breathing");
    playPhaseSound(pattern.phases[0].name, pattern.phases[0].durationSeconds);
  };

  // Respiration Loop using requestAnimationFrame
  useEffect(() => {
    if (gameState !== "breathing" || isPaused) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let currentPhaseIdx = phaseIndex;
    let currentCycleNum = currentCycle;
    let phaseDuration = pattern.phases[currentPhaseIdx].durationSeconds;
    let elapsedInPhase = (1 - phaseRemaining / phaseDuration) * phaseDuration;

    const tick = (now: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = now;
      }
      const deltaSec = (now - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = now;

      elapsedInPhase += deltaSec;

      if (elapsedInPhase >= phaseDuration) {
        // Advance to next phase
        const nextPhaseIdx = currentPhaseIdx + 1;
        if (nextPhaseIdx < pattern.phases.length) {
          currentPhaseIdx = nextPhaseIdx;
          elapsedInPhase = 0;
          phaseDuration = pattern.phases[currentPhaseIdx].durationSeconds;
          setPhaseIndex(currentPhaseIdx);
          playPhaseSound(pattern.phases[currentPhaseIdx].name, phaseDuration);
        } else {
          // Completed an entire cycle!
          const nextCycle = currentCycleNum + 1;
          setCoherenceScore((prev) => prev + 10);

          if (nextCycle <= targetCycles) {
            currentCycleNum = nextCycle;
            currentPhaseIdx = 0;
            elapsedInPhase = 0;
            phaseDuration = pattern.phases[0].durationSeconds;
            setCurrentCycle(currentCycleNum);
            setPhaseIndex(0);
            playPhaseSound(pattern.phases[0].name, phaseDuration);
          } else {
            // Odyssey Completed!
            const totalSec = Math.round((Date.now() - sessionStartTime) / 1000);
            setTotalSecondsElapsed(totalSec);
            playCompleteChime();
            setGameState("post_check");
            return;
          }
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
    gameState,
    isPaused,
    phaseIndex,
    currentCycle,
    pattern,
    targetCycles,
    sessionStartTime,
    playPhaseSound,
    playCompleteChime,
  ]);

  // Keyboard accessibility: Space to pause/resume, Esc to quit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "breathing") {
        if (e.code === "Space") {
          e.preventDefault();
          setIsPaused((p) => !p);
        } else if (e.code === "Escape") {
          e.preventDefault();
          setGameState("welcome");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Persist game session to backend
  const handleSaveAndShowResults = async () => {
    setGameState("results");
    if (!user) return; // Guest mode skips backend write

    setSavingSession(true);
    try {
      const finalScore = targetCycles * 10;
      const res = await gamesAPI.recordSession({
        game_slug: "mindful-breath-odyssey",
        score: finalScore,
        total_questions: targetCycles,
        correct_count: targetCycles,
        difficulty: pattern.id,
        duration_seconds: totalSecondsElapsed || targetCycles * pattern.cycleDurationSeconds,
      });

      setSavedXP(res.data.xp_awarded ?? null);
      toast.success(`Session logged! +${res.data.xp_awarded ?? finalScore} MindCare XP gained! 🎉`);
    } catch {
      toast.error("Could not sync session with server, but your local results are safe.");
    } finally {
      setSavingSession(false);
    }
  };

  // Visual Orb Scale calculation based on phase
  const calculateOrbScale = () => {
    if (currentPhase.name === "Inhale") {
      // Expands from 1.0 to 1.45
      return 1.0 + 0.45 * phaseProgress;
    } else if (currentPhase.name === "Hold In") {
      return 1.45;
    } else if (currentPhase.name === "Exhale") {
      // Contracts from 1.45 to 1.0
      return 1.45 - 0.45 * phaseProgress;
    } else {
      // Hold Out
      return 1.0;
    }
  };

  const orbScale = calculateOrbScale();
  const tensionDelta = preTension - postTension;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Mindful Breath Odyssey" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & CONFIGURATION                            */}
          {/* ============================================================ */}
          {gameState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-teal-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
                      <Wind className="w-3.5 h-3.5 text-teal-300" />
                      Somatic Regulation Mini-Game
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute breath audio" : "Enable breath audio"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Mindful Breath Odyssey 🌊
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Synchronize your respiratory sinus arrhythmia (RSA) and stimulate the vagus nerve.
                    Follow the bioluminescent respiration orb to dissolve nervous tension and achieve heart coherence.
                  </p>
                </div>
              </div>

              {/* Pattern Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Select Respiration Rhythm
                  </h2>
                  <span className="text-xs text-teal-400 font-semibold">
                    Clinically Validated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(Object.keys(BREATHING_PATTERNS) as BreathingPatternId[]).map((pid) => {
                    const p = BREATHING_PATTERNS[pid];
                    const isSelected = selectedPatternId === pid;
                    return (
                      <button
                        key={pid}
                        onClick={() => {
                          setSelectedPatternId(pid);
                          setTargetCycles(p.defaultCycles);
                        }}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? "bg-teal-950/40 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                              {p.name}
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {p.subtitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{p.phases.map((ph) => `${ph.durationSeconds}s ${ph.name}`).join(" • ")}</span>
                          <span className="font-bold text-teal-400">
                            {p.cycleDurationSeconds}s / cycle
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cycle Count Selector */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Session Target Duration
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {targetCycles} cycles • ~{Math.round((targetCycles * pattern.cycleDurationSeconds) / 60 * 10) / 10} minutes total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[4, 6, 8, 10, 12].map((cycles) => (
                    <button
                      key={cycles}
                      onClick={() => setTargetCycles(cycles)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        targetCycles === cycles
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {cycles} Cycles
                    </button>
                  ))}
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
                  onClick={() => setGameState("pre_check")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Begin Mindful Check-in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: PRE-SESSION TENSION CHECK-IN                       */}
          {/* ============================================================ */}
          {gameState === "pre_check" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-3xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400">
                  Step 1 of 3 • Baseline Assessment
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  How tense do you feel right now?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Take a moment to scan your shoulders, jaw, and chest. Rate your current somatic activation.
                </p>
              </div>

              {/* Tension Slider / Rating Blocks */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>1 • Deeply Calm</span>
                  <span>5 • Moderate</span>
                  <span>10 • Overwhelmed</span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                    const isSelected = preTension === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setPreTension(val)}
                        className={`h-12 rounded-xl text-xs sm:text-sm font-black transition-all transform active:scale-95 ${
                          isSelected
                            ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30 scale-105 ring-2 ring-teal-400"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Selected: <strong className="text-teal-400">{preTension}/10</strong>{" "}
                    {preTension <= 3
                      ? "(Relatively relaxed)"
                      : preTension <= 6
                      ? "(Noticeable tension / active stress)"
                      : "(High somatic agitation)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  ← Back to Setup
                </button>

                <button
                  onClick={startOdysseySession}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 transform active:scale-95 transition"
                >
                  <span>Enter Breath Chamber</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: ACTIVE BREATH ODYSSEY CHAMBER                     */}
          {/* ============================================================ */}
          {gameState === "breathing" && (
            <div className="w-full max-w-xl flex flex-col items-center justify-center space-y-6">
              {/* Header: Cycle progress & Coherence Score */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Cycle</span>
                  <span className="text-sm font-extrabold text-teal-400">
                    {currentCycle} / {targetCycles}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Coherence</span>
                  <span className="text-sm font-extrabold text-amber-500">+{coherenceScore} pts</span>
                </div>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  title={soundEnabled ? "Mute" : "Unmute"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Progress bar across cycles */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${((currentCycle - 1 + phaseProgress) / targetCycles) * 100}%`,
                  }}
                />
              </div>

              {/* Main Respiration Stage & Animated Orb */}
              <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center my-4">
                {/* Outer Ripple Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-teal-500/20 bg-teal-500/10"
                  animate={{
                    scale: orbScale * 1.15,
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute inset-4 rounded-full border border-cyan-400/30 bg-cyan-500/15"
                  animate={{
                    scale: orbScale * 1.08,
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Core Bioluminescent Glowing Orb */}
                <motion.div
                  className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-300 shadow-2xl flex flex-col items-center justify-center text-white text-center p-4 cursor-pointer select-none"
                  style={{
                    boxShadow: "0 0 50px rgba(20, 184, 166, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.4)",
                    transform: `scale(${orbScale})`,
                    transition: "transform 0.1s linear",
                  }}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  <span className="text-xs uppercase tracking-widest font-black drop-shadow-sm opacity-90">
                    {pattern.name}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-black drop-shadow tracking-tight my-1">
                    {currentPhase.name}
                  </h2>

                  <div className="text-lg sm:text-xl font-black font-mono tracking-wider drop-shadow-sm opacity-95">
                    {phaseRemaining.toFixed(1)}s
                  </div>
                </motion.div>

                {/* Paused Overlay */}
                {isPaused && (
                  <div className="absolute inset-0 rounded-full bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2 z-20">
                    <Pause className="w-8 h-8 text-amber-400" />
                    <span className="text-sm font-extrabold uppercase tracking-wider">Paused</span>
                    <span className="text-[11px] text-slate-300">Press Space to Resume</span>
                  </div>
                )}
              </div>

              {/* Dynamic Phase Guidance Text */}
              <div className="text-center space-y-2 max-w-md px-4">
                <p className="text-sm font-semibold text-slate-300 min-h-[44px] flex items-center justify-center">
                  "{currentPhase.instruction}"
                </p>

                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  {pattern.vagalMechanism}
                </p>
              </div>

              {/* Controls bar */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2 shadow-sm transition"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-teal-400" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{isPaused ? "Resume (Space)" : "Pause (Space)"}</span>
                </button>

                <button
                  onClick={() => setGameState("welcome")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Exit Chamber (Esc)
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: POST-SESSION TENSION CHECK-IN                      */}
          {/* ============================================================ */}
          {gameState === "post_check" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                  Step 3 of 3 • Outcome Check-in
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Odyssey Complete! How do you feel now?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Take a calm breath. Notice any changes in your muscle relaxation, pulse rate, or mental stillness.
                </p>
              </div>

              {/* Tension Slider */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>1 • Deeply Calm</span>
                  <span>5 • Moderate</span>
                  <span>10 • Overwhelmed</span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                    const isSelected = postTension === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setPostTension(val)}
                        className={`h-12 rounded-xl text-xs sm:text-sm font-black transition-all transform active:scale-95 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Post-session rating: <strong className="text-emerald-400">{postTension}/10</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={handleSaveAndShowResults}
                  className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transform active:scale-95 transition"
                >
                  <span>View Resonance Debrief</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 5: RESULTS & PHYSIOLOGICAL DEBRIEF                   */}
          {/* ============================================================ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Results Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-teal-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Resonance Achieved! 🌟
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  You successfully regulated your respiration across {targetCycles} full cycles of {pattern.name}.
                </p>

                {savedXP !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    +{savedXP} MindCare XP Awarded
                  </div>
                )}
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Tension Relief
                  </span>
                  <div className="text-2xl font-black text-teal-400 flex items-center justify-center gap-1.5">
                    {tensionDelta > 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                        <span>-{tensionDelta} pts</span>
                      </>
                    ) : tensionDelta === 0 ? (
                      <span>Stabilized</span>
                    ) : (
                      <span>+{Math.abs(tensionDelta)} pts</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {preTension}/10 → {postTension}/10
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Total Coherence
                  </span>
                  <div className="text-2xl font-black text-amber-500">
                    +{targetCycles * 10} pts
                  </div>
                  <span className="text-[11px] text-slate-400">
                    +10 pts per synchronized cycle
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Time Mindful
                  </span>
                  <div className="text-2xl font-black text-purple-400">
                    {Math.floor((totalSecondsElapsed || targetCycles * pattern.cycleDurationSeconds) / 60)}m{" "}
                    {(totalSecondsElapsed || targetCycles * pattern.cycleDurationSeconds) % 60}s
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {pattern.subtitle}
                  </span>
                </div>
              </div>

              {/* Physiological & Vagal Debrief Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-teal-400" />
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Clinical Respiration Debrief: What Just Happened in Your Body
                  </h3>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20 space-y-1">
                    <span className="font-bold text-teal-300 block">
                      Autonomous Nervous System Shift
                    </span>
                    <p>
                      By extending your breath and maintaining rhythmic respiration ({pattern.subtitle}),
                      your baroreceptors signaled the brainstem to dial back sympathetic (fight-or-flight) arousal.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                    <span className="font-bold text-purple-300 block">
                      Vagal Brake Engagement
                    </span>
                    <p>{pattern.vagalMechanism}</p>
                  </div>
                </div>

                {/* Educational Disclaimer */}
                <div className="pt-2 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Educational Self-Regulation Safeguard:</strong> Coherence scores are motivational metrics
                    measuring respiration pacing. They do not substitute for medical biometric diagnosis or clinical care.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => {
                    setGameState("welcome");
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Change Pattern / Duration
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={() => {
                      setGameState("pre_check");
                    }}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
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
