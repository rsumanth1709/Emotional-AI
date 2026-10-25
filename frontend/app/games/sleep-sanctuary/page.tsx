"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  COMMON_WORRIES,
  SANCTUARY_SWITCHES,
  BODY_SCAN_NODES,
  WorryItem,
  SanctuarySwitch,
  BodyScanNode,
} from "@/lib/games/sleepSanctuaryData";
import {
  Moon,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Unlock,
  Sun,
  Thermometer,
  Bed,
  Waves,
  Heart,
  Brain,
  SlidersHorizontal,
  ChevronRight,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type ChamberStage = "welcome" | "vault" | "environment" | "scan" | "results";

export default function SleepSanctuaryPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Screen state
  const [stage, setStage] = useState<ChamberStage>("welcome");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Stage 1: The Worry Vault
  const [currentWorryIndex, setCurrentWorryIndex] = useState<number>(0);
  const [vaultedIds, setVaultedIds] = useState<Record<string, boolean>>({});

  // Stage 2: Sanctuary Environment
  const [optimizedSwitches, setOptimizedSwitches] = useState<Record<string, boolean>>({});

  // Stage 3: Somatic Body Scan
  const [releasedNodes, setReleasedNodes] = useState<Record<string, boolean>>({});

  // Score & Gamification
  const [score, setScore] = useState<number>(0);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);

  // Initialize Web Audio
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

  // Play peaceful bedtime tone
  const playBedtimeTone = useCallback(
    (freq: number = 216) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.25);
      } catch {
        // Fallback
      }
    },
    [soundEnabled, initAudio]
  );

  // Play vault lock sound
  const playVaultLock = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(164.81, ctx.currentTime); // E3
      osc.frequency.exponentialRampToValueAtTime(130.81, ctx.currentTime + 0.25); // C3
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Start Chamber Quest
  const startChamber = () => {
    initAudio();
    setCurrentWorryIndex(0);
    setVaultedIds({});
    setOptimizedSwitches({});
    setReleasedNodes({});
    setScore(0);
    setSavedXP(null);
    setStage("vault");
  };

  // Handle Vaulting a worry
  const handleVaultWorry = (worry: WorryItem) => {
    if (vaultedIds[worry.id]) return;

    setVaultedIds((prev) => ({ ...prev, [worry.id]: true }));
    setScore((s) => s + 10);
    playVaultLock();
  };

  // Handle Next Worry in Stage 1
  const handleNextWorry = () => {
    if (currentWorryIndex + 1 < COMMON_WORRIES.length) {
      setCurrentWorryIndex((i) => i + 1);
    } else {
      // Completed all 5 worries! Proceed to Environment Optimization
      playBedtimeTone(324);
      setStage("environment");
    }
  };

  // Handle toggling environment switch in Stage 2
  const handleToggleSwitch = (sw: SanctuarySwitch) => {
    const isAlreadyOptimized = !!optimizedSwitches[sw.id];
    setOptimizedSwitches((prev) => ({ ...prev, [sw.id]: !isAlreadyOptimized }));

    if (!isAlreadyOptimized) {
      setScore((s) => s + 10);
      playBedtimeTone(216);
    } else {
      setScore((s) => Math.max(s - 10, 0));
    }
  };

  // Handle releasing a body scan node in Stage 3
  const handleReleaseNode = (node: BodyScanNode) => {
    const isAlreadyReleased = !!releasedNodes[node.id];
    setReleasedNodes((prev) => ({ ...prev, [node.id]: !isAlreadyReleased }));

    if (!isAlreadyReleased) {
      setScore((s) => s + 2.5); // 4 nodes * 2.5 = 10 pts
      playBedtimeTone(174);
    } else {
      setScore((s) => Math.max(s - 2.5, 0));
    }
  };

  // Check completions
  const isVaultFinished = Object.keys(vaultedIds).length === COMMON_WORRIES.length;
  const isEnvFinished = Object.keys(optimizedSwitches).length === SANCTUARY_SWITCHES.length;
  const isScanFinished = Object.keys(releasedNodes).length === BODY_SCAN_NODES.length;

  // Complete and save session
  const handleCompleteChamber = async () => {
    setStage("results");
    playBedtimeTone(432);

    if (user) {
      setSavingSession(true);
      try {
        const finalScore = Math.round(score);
        const res = await gamesAPI.recordSession({
          game_slug: "sleep-sanctuary",
          score: finalScore,
          total_questions: 10, // 5 worries + 4 switches + 1 body scan
          correct_count: 10,
          difficulty: "nightfall",
          duration_seconds: 180,
        });

        setSavedXP(res.data.xp_awarded ?? null);
        toast.success(`Sleep Sanctuary calibrated! +${res.data.xp_awarded ?? finalScore} XP earned! 🌙`);
      } catch {
        // Silently preserve local state
      } finally {
        setSavingSession(false);
      }
    }
  };

  const getSwitchIcon = (iconName: string) => {
    switch (iconName) {
      case "Sun":
        return <Sun className="w-4 h-4 text-amber-400" />;
      case "Thermometer":
        return <Thermometer className="w-4 h-4 text-cyan-400" />;
      case "Bed":
        return <Bed className="w-4 h-4 text-indigo-400" />;
      case "Waves":
        return <Waves className="w-4 h-4 text-teal-400" />;
      default:
        return <Moon className="w-4 h-4 text-purple-400" />;
    }
  };

  const currentWorry = COMMON_WORRIES[currentWorryIndex];
  const isCurrentWorryVaulted = !!vaultedIds[currentWorry?.id];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Mindful Sleep Sanctuary" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & CHAMBER BRIEFING                         */}
          {/* ============================================================ */}
          {stage === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                      <Moon className="w-3.5 h-3.5 text-indigo-300" />
                      CBT-I Chronobiology Protocol
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute audio" : "Enable sleep audio"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Delta Tone On" : "Muted"}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Mindful Sleep Sanctuary 🌙✨
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Bedtime insomnia and racing thoughts are driven by pre-sleep hyper-arousal.
                    Follow this 3-chamber nightfall ritual to lock away worries, optimize circadian biology,
                    and guide your nervous system into restorative slow-wave rest.
                  </p>
                </div>
              </div>

              {/* 3 Nightfall Chamber Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300">
                    The Worry Vault
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deposit persistent nighttime worries into a locked container with actionable daylight reframes.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-purple-300">
                    Sanctuary Lighting & Air
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Calibrate circadian triggers: drop core temperature, mute blue light, and eliminate bed-work stimuli.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-300">
                    Somatic Body Release
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scan and release muscle contractions from your brow, jaw, shoulders, and legs into the mattress.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <Link
                  href="/games"
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                >
                  ← Back to Games Hub
                </Link>

                <button
                  onClick={startChamber}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Enter Sleep Chamber</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: STAGE 1 — THE WORRY VAULT                          */}
          {/* ============================================================ */}
          {stage === "vault" && currentWorry && (
            <div className="w-full max-w-xl space-y-6">
              {/* Header Status */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Chamber 1 of 3: The Worry Vault ({currentWorryIndex + 1} of {COMMON_WORRIES.length})
                </span>
                <span className="text-xs font-extrabold text-amber-400">+{score} pts</span>
              </div>

              {/* Progress */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{
                    width: `${((currentWorryIndex + (isCurrentWorryVaulted ? 1 : 0)) / COMMON_WORRIES.length) * 100}%`,
                  }}
                />
              </div>

              {/* The Worry Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Category: {currentWorry.category}
                  </span>
                  {isCurrentWorryVaulted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400">
                      <Lock className="w-3.5 h-3.5" /> Locked in Vault
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Unlock className="w-3.5 h-3.5" /> Active Rumination
                    </span>
                  )}
                </div>

                {/* The Rumination Script */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">
                    Late-Night Rumination Thought:
                  </span>
                  <p className="text-sm font-semibold italic text-slate-200">
                    "{currentWorry.worryThought}"
                  </p>
                </div>

                {/* If Vaulted, Reveal the Reframe and Daylight Action */}
                <AnimatePresence>
                  {isCurrentWorryVaulted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-2 border-t border-slate-800"
                    >
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase">
                          Cognitive Parking Reframe:
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {currentWorry.parkingReframe}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                        <span className="font-bold text-slate-400">Daylight Action Scheduled:</span>
                        <span className="font-medium text-emerald-400">{currentWorry.actionNote}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  {!isCurrentWorryVaulted ? (
                    <button
                      onClick={() => handleVaultWorry(currentWorry)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Deposit into Worry Vault (+10 pts)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleNextWorry}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                    >
                      <span>
                        {currentWorryIndex + 1 < COMMON_WORRIES.length
                          ? "Next Worry Script"
                          : "Advance to Sanctuary Optimization"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: STAGE 2 — ENVIRONMENT OPTIMIZATION                */}
          {/* ============================================================ */}
          {stage === "environment" && (
            <div className="w-full max-w-xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Chamber 2 of 3: Circadian Sanctuary Optimization
                </span>
                <span className="text-xs font-extrabold text-amber-400">+{score} pts</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Turn on all 4 biological sleep triggers to prime your pineal gland and core body temperature:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {SANCTUARY_SWITCHES.map((sw) => {
                    const isOptimized = !!optimizedSwitches[sw.id];
                    return (
                      <button
                        key={sw.id}
                        onClick={() => handleToggleSwitch(sw)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                          isOptimized
                            ? "bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/30"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getSwitchIcon(sw.iconName)}
                            <h3 className="font-extrabold text-sm text-slate-100">
                              {sw.name}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-400">
                            {isOptimized ? (
                              <span className="text-emerald-400 font-medium">✓ {sw.optimizedState}</span>
                            ) : (
                              <span className="text-rose-400/90 font-medium">✗ {sw.currentDisruptor}</span>
                            )}
                          </p>

                          <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                            {sw.clinicalRationale}
                          </p>
                        </div>

                        <div className="shrink-0 mt-1">
                          <div
                            className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${
                              isOptimized ? "bg-purple-600" : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                isOptimized ? "transform translate-x-4" : ""
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advance Button */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!isEnvFinished}
                  onClick={() => {
                    playBedtimeTone(216);
                    setStage("scan");
                  }}
                  className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg flex items-center gap-2 transform active:scale-95 transition ${
                    isEnvFinished
                      ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-500/25"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>Proceed to Somatic Body Scan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: STAGE 3 — SOMATIC BODY SCAN                        */}
          {/* ============================================================ */}
          {stage === "scan" && (
            <div className="w-full max-w-xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Chamber 3 of 3: Somatic Wind-Down Scan
                </span>
                <span className="text-xs font-extrabold text-amber-400">+{Math.round(score)} pts</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tap each bodily zone to soften and release residual tension into the mattress:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {BODY_SCAN_NODES.map((node) => {
                    const isReleased = !!releasedNodes[node.id];
                    return (
                      <button
                        key={node.id}
                        onClick={() => handleReleaseNode(node)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                          isReleased
                            ? "bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                            {node.region}
                            {isReleased && <Check className="w-4 h-4 text-cyan-400" />}
                          </h3>

                          <p className="text-xs text-slate-400">
                            {node.releaseInstruction}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Complete Chamber Button */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={!isScanFinished}
                  onClick={handleCompleteChamber}
                  className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg flex items-center gap-2 transform active:scale-95 transition ${
                    isScanFinished
                      ? "bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-cyan-500/25"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>Calibrate Nightfall Sanctuary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 5: RESULTS & SLEEP READINESS                          */}
          {/* ============================================================ */}
          {stage === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Results Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center mx-auto shadow-inner">
                  <Moon className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Nightfall Sanctuary Calibrated 🌙
                </h1>

                <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed italic">
                  "You do not need to force sleep tonight. Simply resting comfortably with closed eyes
                  and steady breath allows your body to perform vital cellular restoration. You are safe."
                </p>

                {savedXP !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    +{savedXP} MindCare XP Awarded
                  </div>
                )}
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sanctuary Score
                  </span>
                  <div className="text-2xl font-black text-amber-400">
                    100 / 100
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Full chronobiology alignment
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Worries Deposited
                  </span>
                  <div className="text-2xl font-black text-indigo-400">
                    5 Locked
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Daylight actions scheduled
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sleep Readiness
                  </span>
                  <div className="text-2xl font-black text-cyan-400">
                    Optimal
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Pre-sleep hyper-arousal softened
                  </span>
                </div>
              </div>

              {/* Safeguard Notice */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>CBT-I Chronobiology Safeguard:</strong> Mindful Sleep Sanctuary uses evidence-based
                  stimulus control and cognitive deceleration to facilitate sleep onset. Scores are motivational
                  educational tools and do not substitute for medical sleep disorder diagnosis.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setStage("welcome")}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Calibrate Again
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={startChamber}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Enter Again</span>
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
