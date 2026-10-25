"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  TRIGGER_SCENARIOS,
  DISTORTION_DEFINITIONS,
  TriggerScenario,
  ReframeOption,
  TriggerCategory,
  DistortionType,
  ReframeArchetype,
} from "@/lib/games/triggerDetectiveData";
import {
  Flame,
  Search,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Brain,
  BookOpen,
  Volume2,
  VolumeX,
  Gamepad2,
  AlertCircle,
  Info,
  Lightbulb,
  FileSearch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "playing" | "answered" | "results";

interface CaseAnswerRecord {
  scenario: TriggerScenario;
  selectedOption: ReframeOption;
  isCorrect: boolean;
}

export default function TriggerDetectivePage() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TriggerCategory>("all");
  const [gameScenarios, setGameScenarios] = useState<TriggerScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answers, setAnswers] = useState<CaseAnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<ReframeOption | null>(null);
  const [showClues, setShowClues] = useState<boolean>(false);
  const [showDistortionGuide, setShowDistortionGuide] = useState<boolean>(false);
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Web Audio chime for feedback
  const playChime = useCallback(
    (isSuccess: boolean) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        if (isSuccess) {
          // Sleuth discovery ascending major arpeggio (C5 -> E5 -> G5 -> C6)
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
          osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.24);
          osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.36);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        } else {
          // Soft reflective tone
          osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
          osc.frequency.exponentialRampToValueAtTime(293.66, ctx.currentTime + 0.2); // D4
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch {
        // Fallback
      }
    },
    [soundEnabled]
  );

  // Start new game session
  const startGame = (cat: "all" | TriggerCategory = categoryFilter) => {
    let pool = TRIGGER_SCENARIOS;
    if (cat !== "all") {
      pool = pool.filter((s) => s.category === cat);
    }

    // Shuffle and pick 10 scenarios
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    // Shuffle the options within each scenario
    const randomized = shuffled.map((s) => ({
      ...s,
      options: [...s.options].sort(() => 0.5 - Math.random()),
    }));

    setGameScenarios(randomized);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowClues(false);
    setSavedXP(null);
    setGameState("playing");
  };

  const currentScenario = gameScenarios[currentIndex];

  // Handle player selecting a reframe strategy
  const handleSelectOption = (option: ReframeOption) => {
    if (gameState !== "playing") return;

    setSelectedOption(option);
    const isCorrect = option.isBestReframe;

    if (isCorrect) {
      setScore((prev) => prev + 10);
      playChime(true);
    } else {
      playChime(false);
    }

    setAnswers((prev) => [
      ...prev,
      {
        scenario: currentScenario,
        selectedOption: option,
        isCorrect,
      },
    ]);

    setGameState("answered");
  };

  // Advance to next question or complete game
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < gameScenarios.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowClues(false);
      setGameState("playing");
    } else {
      // Completed all 10 cases!
      setGameState("results");
      setReviewIndex(0);

      // Save session for authenticated users
      if (user) {
        setSavingSession(true);
        try {
          const finalScore = score + (selectedOption?.isBestReframe ? 10 : 0);
          const correctCount = answers.filter((a) => a.isCorrect).length;
          const res = await gamesAPI.recordSession({
            game_slug: "trigger-detective",
            score: finalScore,
            total_questions: gameScenarios.length,
            correct_count: correctCount,
            difficulty: categoryFilter,
            duration_seconds: 140,
          });

          setSavedXP(res.data.xp_awarded ?? null);
          toast.success(`Detective session saved! +${res.data.xp_awarded ?? correctCount * 10} XP earned! 🎉`);
        } catch {
          toast.error("Could not sync score with server, but your local results are safe.");
        } finally {
          setSavingSession(false);
        }
      }
    }
  };

  // Keyboard shortcut listener: 1-4 for options, H for clue, Space for proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing" && currentScenario) {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentScenario.options[idx]) {
            handleSelectOption(currentScenario.options[idx]);
          }
        } else if (e.key.toLowerCase() === "h") {
          setShowClues((prev) => !prev);
        }
      } else if (gameState === "answered") {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentScenario, currentIndex, gameScenarios.length, selectedOption]);

  const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
  const currentDistortionInfo = currentScenario
    ? DISTORTION_DEFINITIONS[currentScenario.distortion]
    : null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Trigger Detective" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & CASE BRIEFING                            */}
          {/* ============================================================ */}
          {gameState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950 via-amber-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-orange-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5 text-orange-300" />
                      Cognitive Reframe Mystery
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute audio" : "Enable audio"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Trigger Detective 🔍⚡
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Uncover cognitive distortions in real-world scenarios. Intercept catastrophic spirals,
                    toxic positivity, and avoidance traps with evidence-based CBT thought reframing.
                  </p>
                </div>
              </div>

              {/* Game Rules & Distortion Field Guide Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                    Inspect the Case
                  </h3>
                  <p className="text-xs text-slate-400">
                    Analyze the trigger situation and unmask the underlying automatic distortion.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                    Select the Reframe
                  </h3>
                  <p className="text-xs text-slate-400">
                    Find the grounded cognitive reframe while steering clear of toxic positivity or spiral traps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                    Earn Mastery (+10 XP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Award +10 points per successful reframe to advance your MindCare detective rank.
                  </p>
                </div>
              </div>

              {/* Category Filter Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileSearch className="w-3.5 h-3.5 text-orange-500" />
                    Select Investigation Docket
                  </h2>
                  <button
                    onClick={() => setShowDistortionGuide(!showDistortionGuide)}
                    className="text-xs text-orange-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {showDistortionGuide ? "Hide Distortion Guide" : "View 8 Distortions Guide"}
                  </button>
                </div>

                {/* Distortion Guide Modal / Accordion */}
                <AnimatePresence>
                  {showDistortionGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 rounded-2xl bg-orange-950/20 border border-orange-500/20 space-y-3 overflow-hidden"
                    >
                      <h3 className="font-extrabold text-sm text-orange-300">
                        CBT Cognitive Distortions Field Guide
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.values(DISTORTION_DEFINITIONS).map((d) => (
                          <div
                            key={d.name}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                          >
                            <span className="font-bold text-white block">
                              {d.name}
                            </span>
                            <p className="text-[11px] text-slate-400">
                              {d.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "all", label: "All Life Domains (30 Cases)" },
                    { id: "workplace", label: "Workplace & Career" },
                    { id: "relationships", label: "Romantic & Interpersonal" },
                    { id: "social", label: "Social Dynamics" },
                    { id: "academics_finance", label: "Academics & Finance" },
                    { id: "health_body", label: "Health & Somatics" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id as any)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-left ${
                        categoryFilter === cat.id
                          ? "bg-orange-500/10 border-orange-500 text-orange-400 ring-2 ring-orange-500/20"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
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
                  onClick={() => startGame()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Start Investigation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2 & 3: ACTIVE PLAYING / ANSWERED SCREEN               */}
          {/* ============================================================ */}
          {(gameState === "playing" || gameState === "answered") && currentScenario && (
            <div className="space-y-6">
              {/* Top Navigation & Status Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    Case {currentIndex + 1} of {gameScenarios.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-950/60 text-orange-300 text-[10px] font-extrabold uppercase border border-orange-800">
                    {currentScenario.categoryLabel}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-500">
                    <Award className="w-4 h-4" />
                    <span>{score} pts</span>
                  </div>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + (gameState === "answered" ? 1 : 0)) / gameScenarios.length) * 100}%`,
                  }}
                />
              </div>

              {/* Case Investigation Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-orange-500" />
                    {currentScenario.title}
                  </h2>

                  {/* Distortion Badge (Revealed in Answered State, or subtle hint) */}
                  {gameState === "answered" && currentDistortionInfo && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${currentDistortionInfo.tagClass}`}>
                      {currentDistortionInfo.name}
                    </span>
                  )}
                </div>

                {/* Situation text */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentScenario.situation}
                </p>

                {/* Automatic Thought Callout */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unchecked Automatic Thought:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold italic text-slate-200">
                    {currentScenario.automaticThought}
                  </p>
                </div>

                {/* Inspectable Clues Toggle */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowClues(!showClues)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showClues ? "Hide Detective Clues (H)" : "Inspect Thought-Record Clues (H)"}</span>
                  </button>

                  <AnimatePresence>
                    {showClues && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs space-y-1.5"
                      >
                        <span className="font-bold text-amber-300 block">
                          Socratic Inquiry Clues:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                          {currentScenario.clues.map((clue, idx) => (
                            <li key={idx}>{clue}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 4 Reframe Strategy Options */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                  {gameState === "playing"
                    ? "Select the grounded CBT cognitive reframe (Keys 1-4):"
                    : "Strategy Evaluation:"}
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {currentScenario.options.map((opt, idx) => {
                    const isSelected = selectedOption?.id === opt.id;
                    const isTargetBest = opt.isBestReframe;

                    let cardClass =
                      "bg-slate-900 border-slate-800 hover:border-orange-500";
                    let badgeNode = null;

                    if (gameState === "answered") {
                      if (isTargetBest) {
                        cardClass = "bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30";
                        badgeNode = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Best Cognitive Reframe
                          </span>
                        );
                      } else if (isSelected && !isTargetBest) {
                        cardClass = "bg-rose-950/40 border-rose-500 shadow-sm";
                        badgeNode = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> Trap: {opt.archetype.replace("_", " ")}
                          </span>
                        );
                      } else {
                        cardClass = "opacity-40 border-slate-800 bg-slate-900";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={gameState === "answered"}
                        onClick={() => handleSelectOption(opt)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 space-y-2 ${cardClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                              "{opt.text}"
                            </p>
                          </div>
                          {badgeNode}
                        </div>

                        {/* Impact feedback in answered state */}
                        {gameState === "answered" && (isSelected || isTargetBest) && (
                          <div className="pl-9 text-[11px] text-slate-400">
                            {opt.impactFeedback}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Answer Feedback Debrief & Proceed Button */}
              {gameState === "answered" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-orange-500" />
                      CBT Thought-Record Breakdown
                    </span>
                    <span className="text-xs font-extrabold text-orange-400">
                      Distortion: {currentScenario.distortion}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentScenario.cbtRationale}
                  </p>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 transform active:scale-95 transition"
                    >
                      <span>
                        {currentIndex + 1 < gameScenarios.length ? "Next Case File (Space)" : "Review Case Results (Space)"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: CASE RESULTS & REVIEW CAROUSEL                    */}
          {/* ============================================================ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Results Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950 via-amber-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-orange-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-400/30 text-orange-300 flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Case Investigation Complete! 🕵️✨
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  You resolved {correctAnswersCount} of {gameScenarios.length} triggers with grounded cognitive reframes.
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
                    Total Score
                  </span>
                  <div className="text-2xl font-black text-amber-500">
                    {score} pts
                  </div>
                  <span className="text-[11px] text-slate-400">
                    +10 pts per optimal reframe
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Accuracy Rate
                  </span>
                  <div className="text-2xl font-black text-orange-400">
                    {Math.round((correctAnswersCount / gameScenarios.length) * 100)}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {correctAnswersCount} / {gameScenarios.length} cases solved
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Detective Rank
                  </span>
                  <div className="text-base font-black text-purple-400">
                    {correctAnswersCount >= 9
                      ? "Master Cognitive Sleuth"
                      : correctAnswersCount >= 7
                      ? "Senior Reframe Analyst"
                      : "Apprentice Detective"}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    CBT Thought Discernment
                  </span>
                </div>
              </div>

              {/* Interactive Case Debrief Carousel */}
              {answers.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      Case Dossier Review ({reviewIndex + 1} of {answers.length})
                    </h3>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setReviewIndex((i) => Math.max(i - 1, 0))}
                        disabled={reviewIndex === 0}
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReviewIndex((i) => Math.min(i + 1, answers.length - 1))}
                        disabled={reviewIndex === answers.length - 1}
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {answers[reviewIndex] && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          {answers[reviewIndex].scenario.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-bold">
                          {answers[reviewIndex].scenario.distortion}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">
                        {answers[reviewIndex].scenario.situation}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                        <span className="font-bold text-slate-200 block">
                          Balanced Reframe:
                        </span>
                        <p className="text-slate-300">
                          "{answers[reviewIndex].scenario.options.find((o) => o.isBestReframe)?.text}"
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {answers[reviewIndex].scenario.cbtRationale}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Safeguard Notice */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Educational Safeguard:</strong> Trigger Detective exercises train cognitive flexibility
                  using evidence-based Cognitive Behavioral Therapy principles. Scores represent educational mastery and do not measure clinical mental health.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Change Category Docket
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={() => startGame()}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Investigate Again</span>
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
