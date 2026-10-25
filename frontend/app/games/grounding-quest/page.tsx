"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  GROUNDING_REALMS,
  GroundingRealm,
  GroundingRealmId,
  SensoryStage,
  SensoryAnchor,
} from "@/lib/games/groundingQuestData";
import {
  Brain,
  Compass,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Hand,
  Ear,
  Wind,
  Smile,
  Heart,
  TrendingDown,
  Info,
  Clock,
  Zap,
  Flame,
  ChevronRight,
  TreePine,
  Home,
  Waves,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "pre_check" | "questing" | "post_check" | "results";

export default function GroundingQuestPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Configuration state
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [selectedRealmId, setSelectedRealmId] = useState<GroundingRealmId>("forest");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Check-in ratings
  const [preAgitation, setPreAgitation] = useState<number>(7);
  const [postAgitation, setPostAgitation] = useState<number>(3);

  // Active quest state
  const [currentStageNumber, setCurrentStageNumber] = useState<number>(5); // 5 -> 4 -> 3 -> 2 -> 1
  const [anchoredIds, setAnchoredIds] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);

  // Results & persistence state
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const realm: GroundingRealm = GROUNDING_REALMS[selectedRealmId];
  const currentStage: SensoryStage = realm.stages[currentStageNumber] || realm.stages[5];

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
      // Fallback
    }
  }, [soundEnabled]);

  // Play gentle bell sound on sensory anchor
  const playAnchorChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Gentle singing-bowl chime (F5 -> 698.46 Hz)
      osc.frequency.setValueAtTime(698.46, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {
      // Silent fallback
    }
  }, [soundEnabled, initAudio]);

  // Play stage complete warm harmonic chord
  const playStageCompleteChord = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const freqs = [349.23, 440.0, 523.25]; // F major triad
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.85);
      });
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Start Quest
  const startQuest = () => {
    initAudio();
    setCurrentStageNumber(5);
    setAnchoredIds({});
    setScore(0);
    setStartTime(Date.now());
    setGameState("questing");
  };

  // Toggle sensory item anchor
  const handleToggleAnchor = (item: SensoryAnchor) => {
    const isAlreadyAnchored = !!anchoredIds[item.id];
    const newAnchored = { ...anchoredIds, [item.id]: !isAlreadyAnchored };
    setAnchoredIds(newAnchored);

    if (!isAlreadyAnchored) {
      setScore((prev) => prev + 10);
      playAnchorChime();
    } else {
      setScore((prev) => Math.max(prev - 10, 0));
    }
  };

  // Check if current stage items are all anchored
  const currentStageItems = currentStage.items;
  const currentStageCompletedCount = currentStageItems.filter((i) => anchoredIds[i.id]).length;
  const isCurrentStageFinished = currentStageCompletedCount === currentStage.itemCount;

  // Advance to next sensory stage (5 -> 4 -> 3 -> 2 -> 1 -> Finish)
  const handleNextStage = () => {
    playStageCompleteChord();

    if (currentStageNumber > 1) {
      setCurrentStageNumber((prev) => prev - 1);
    } else {
      // All 5 stages complete!
      const totalSec = Math.round((Date.now() - startTime) / 1000);
      setTotalSecondsElapsed(totalSec);
      setGameState("post_check");
    }
  };

  // Keyboard shortcut listener: Space to proceed if stage is finished
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "questing" && isCurrentStageFinished) {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          handleNextStage();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isCurrentStageFinished, currentStageNumber]);

  // Save session to backend
  const handleSaveAndShowResults = async () => {
    setGameState("results");
    if (!user) return; // Guest mode skips backend write

    setSavingSession(true);
    try {
      const finalScore = score;
      const res = await gamesAPI.recordSession({
        game_slug: "grounding-quest",
        score: finalScore,
        total_questions: 15, // 5 + 4 + 3 + 2 + 1 = 15 total anchors
        correct_count: Object.values(anchoredIds).filter(Boolean).length,
        difficulty: realm.id,
        duration_seconds: totalSecondsElapsed || 180,
      });

      setSavedXP(res.data.xp_awarded ?? null);
      toast.success(`Grounding Quest recorded! +${res.data.xp_awarded ?? finalScore} XP earned! 🌿`);
    } catch {
      toast.error("Could not sync score with server, but your local results are safe.");
    } finally {
      setSavingSession(false);
    }
  };

  const agitationDelta = preAgitation - postAgitation;
  const totalAnchorsCompleted = Object.values(anchoredIds).filter(Boolean).length;

  // Icon mapping for sensory stages
  const getStageIcon = (sense: SensoryStage["sense"]) => {
    switch (sense) {
      case "see":
        return <Eye className="w-5 h-5 text-cyan-400" />;
      case "touch":
        return <Hand className="w-5 h-5 text-emerald-400" />;
      case "hear":
        return <Ear className="w-5 h-5 text-purple-400" />;
      case "smell":
        return <Wind className="w-5 h-5 text-amber-400" />;
      case "taste":
        return <Smile className="w-5 h-5 text-rose-400" />;
    }
  };

  const getRealmIcon = (realmId: GroundingRealmId) => {
    switch (realmId) {
      case "forest":
        return <TreePine className="w-5 h-5 text-emerald-400" />;
      case "cabin":
        return <Home className="w-5 h-5 text-amber-400" />;
      case "ocean":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "real_world":
        return <MapPin className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Somatic Grounding Quest" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & REALM SELECTION                          */}
          {/* ============================================================ */}
          {gameState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                      <Compass className="w-3.5 h-3.5 text-emerald-300" />
                      5-4-3-2-1 Sensory Grounding Technique
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute audio" : "Enable audio"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Somatic Grounding Quest 🌿✨
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    When racing thoughts, panic, or emotional overwhelm flood your mind, redirect conscious
                    attention through your 5 sensory channels to awaken present-moment somatic safety.
                  </p>
                </div>
              </div>

              {/* Realm Selection Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    Select Grounding Sanctuary
                  </h2>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Trauma-Informed Sensory Reset
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(Object.keys(GROUNDING_REALMS) as GroundingRealmId[]).map((rid) => {
                    const r = GROUNDING_REALMS[rid];
                    const isSelected = selectedRealmId === rid;
                    return (
                      <button
                        key={rid}
                        onClick={() => setSelectedRealmId(rid)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                              {getRealmIcon(rid)}
                              {r.name}
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {r.ambientToneHz} Hz
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {r.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{r.subtitle}</span>
                          <span className="font-bold text-emerald-400">
                            15 Sensory Anchors
                          </span>
                        </div>
                      </button>
                    );
                  })}
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
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Begin Sensory Check-in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: PRE-QUEST AGITATION ASSESSMENT                    */}
          {/* ============================================================ */}
          {gameState === "pre_check" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                  Step 1 of 3 • Baseline Assessment
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  How agitated or ungrounded do you feel right now?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Notice your pulse, breathing rate, and mental stillness. Rate your current nervous system arousal.
                </p>
              </div>

              {/* Slider Blocks */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>1 • Centered & Calm</span>
                  <span>5 • Moderate Arousal</span>
                  <span>10 • Severe Overwhelm / Panic</span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                    const isSelected = preAgitation === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setPreAgitation(val)}
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
                    Selected: <strong className="text-emerald-400">{preAgitation}/10</strong>{" "}
                    {preAgitation <= 3
                      ? "(Relatively grounded)"
                      : preAgitation <= 6
                      ? "(Active mental buzz / somatic tension)"
                      : "(High autonomic activation)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  ← Back to Realm Choice
                </button>

                <button
                  onClick={startQuest}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transform active:scale-95 transition"
                >
                  <span>Enter Grounding Sanctuary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: ACTIVE 5-4-3-2-1 SENSORY QUEST STAGES             */}
          {/* ============================================================ */}
          {gameState === "questing" && (
            <div className="w-full max-w-2xl space-y-6">
              {/* Header: Stage Tracker & Points */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    Stage {6 - currentStageNumber} of 5
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-800 flex items-center gap-1.5">
                    {getStageIcon(currentStage.sense)}
                    {currentStage.itemCount} Things You Can {currentStage.sense.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-500">
                    <Zap className="w-4 h-4" />
                    <span>+{score} pts</span>
                  </div>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar Across 5 Stages */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${((totalAnchorsCompleted) / 15) * 100}%`,
                  }}
                />
              </div>

              {/* Current Stage Instruction Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    {getStageIcon(currentStage.sense)}
                    {currentStage.senseLabel}
                  </h2>

                  <span className="text-xs font-bold text-emerald-400">
                    {currentStageCompletedCount} / {currentStage.itemCount} Anchored
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentStage.instruction}
                </p>

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Brain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {currentStage.clinicalPurpose}
                </p>
              </div>

              {/* Sensory Anchor Cards */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                  Tap to confirm each sensory anchor (+10 pts each):
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentStage.items.map((item, idx) => {
                    const isAnchored = !!anchoredIds[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleAnchor(item)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                          isAnchored
                            ? "bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isAnchored
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {isAnchored ? "✓" : idx + 1}
                          </span>
                          <div className="space-y-0.5">
                            <p
                              className={`text-xs sm:text-sm font-medium leading-relaxed ${
                                isAnchored
                                  ? "text-emerald-200 font-semibold"
                                  : "text-slate-200"
                              }`}
                            >
                              {item.prompt}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Hint: {item.hint}
                            </p>
                          </div>
                        </div>

                        {isAnchored && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation & Advance Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="text-xs font-bold text-rose-400 hover:underline"
                >
                  Exit Quest
                </button>

                <button
                  disabled={!isCurrentStageFinished}
                  onClick={handleNextStage}
                  className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg flex items-center gap-2 transform active:scale-95 transition ${
                    isCurrentStageFinished
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>
                    {currentStageNumber > 1
                      ? `Complete Stage & Continue (${currentStageNumber - 1} Next)`
                      : "Finish Grounding Quest (Space)"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: POST-QUEST AGITATION ASSESSMENT                    */}
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
                  Sensory Odyssey Complete! How grounded do you feel?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Take a calm breath. Notice your connection to your chair, feet on the floor, and mental clarity.
                </p>
              </div>

              {/* Slider Blocks */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>1 • Deeply Grounded</span>
                  <span>5 • Moderate</span>
                  <span>10 • Severe Overwhelm</span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                    const isSelected = postAgitation === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setPostAgitation(val)}
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
                    Post-quest rating: <strong className="text-emerald-400">{postAgitation}/10</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={handleSaveAndShowResults}
                  className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transform active:scale-95 transition"
                >
                  <span>View Somatic Integration Debrief</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 5: RESULTS & NEUROBIOLOGY DEBRIEF                    */}
          {/* ============================================================ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Results Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Nervous System Re-Anchored! 🌿✨
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  You successfully engaged all 5 sensory pathways across {realm.name}, completing {totalAnchorsCompleted} grounding anchors.
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
                    Arousal Relief Delta
                  </span>
                  <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1.5">
                    {agitationDelta > 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                        <span>-{agitationDelta} pts</span>
                      </>
                    ) : agitationDelta === 0 ? (
                      <span>Stabilized</span>
                    ) : (
                      <span>+{Math.abs(agitationDelta)} pts</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {preAgitation}/10 → {postAgitation}/10
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Grounding Score
                  </span>
                  <div className="text-2xl font-black text-amber-500">
                    +{score} pts
                  </div>
                  <span className="text-[11px] text-slate-400">
                    +10 pts per confirmed anchor
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Time Present
                  </span>
                  <div className="text-2xl font-black text-purple-400">
                    {Math.floor((totalSecondsElapsed || 180) / 60)}m{" "}
                    {(totalSecondsElapsed || 180) % 60}s
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {realm.subtitle.split("•")[0]}
                  </span>
                </div>
              </div>

              {/* Neurobiology Debrief Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Somatic Neurobiology: How 5-4-3-2-1 Resets the Brain
                  </h3>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                    <span className="font-bold text-emerald-300 block">
                      Amygdala Hijack Interruption
                    </span>
                    <p>
                      When you intentionally counted down through 5 visual, 4 tactile, 3 auditory, 2 olfactory,
                      and 1 gustatory anchor, your anterior insula and prefrontal cortex overrode the amygdala's
                      threat reflex with real-time sensory data.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
                    <span className="font-bold text-cyan-300 block">
                      Proprioceptive Re-Containment
                    </span>
                    <p>
                      Feeling the floor beneath your feet and noticing air temperature sends visceral feedback
                      up the spinothalamic tract, reminding your autonomic nervous system that you are physically safe here and now.
                    </p>
                  </div>
                </div>

                {/* Educational Safeguard */}
                <div className="pt-2 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Clinical Somatic Safeguard:</strong> Somatic Grounding Quest provides evidence-based
                    mindfulness and sensory regulation exercises. Scores are motivational markers and do not replace professional psychological care.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Change Sanctuary Realm
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={() => startQuest()}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ground Again</span>
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
