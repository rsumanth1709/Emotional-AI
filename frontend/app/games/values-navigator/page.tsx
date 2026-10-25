"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  VALUES_DILEMMAS,
  DOMAIN_DEFINITIONS,
  ValuesDilemma,
  ValueActionOption,
  ValuesDomainId,
  ActionArchetype,
} from "@/lib/games/valuesNavigatorData";
import {
  Compass,
  HeartHandshake,
  Sprout,
  Briefcase,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Brain,
  BookOpen,
  Volume2,
  VolumeX,
  AlertCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "playing" | "answered" | "results";

interface DilemmaAnswerRecord {
  dilemma: ValuesDilemma;
  selectedOption: ValueActionOption;
  isCorrect: boolean;
}

export default function ValuesNavigatorPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [domainFilter, setDomainFilter] = useState<"all" | ValuesDomainId>("all");
  const [sessionDilemmas, setSessionDilemmas] = useState<ValuesDilemma[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answers, setAnswers] = useState<DilemmaAnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<ValueActionOption | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Web Audio Chimes
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
          // Warm resonant compass fifth (D4 -> A4 -> D5)
          osc.frequency.setValueAtTime(293.66, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440.0, ctx.currentTime + 0.15);
          osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        } else {
          // Gentle dissonance
          osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
          osc.frequency.exponentialRampToValueAtTime(277.18, ctx.currentTime + 0.2); // C#4
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      } catch {
        // Fallback
      }
    },
    [soundEnabled]
  );

  // Start new navigation round
  const startSession = (dom: "all" | ValuesDomainId = domainFilter) => {
    let pool = VALUES_DILEMMAS;
    if (dom !== "all") {
      pool = pool.filter((d) => d.domain === dom);
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    const randomized = shuffled.map((d) => ({
      ...d,
      options: [...d.options].sort(() => 0.5 - Math.random()),
    }));

    setSessionDilemmas(randomized);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setSavedXP(null);
    setGameState("playing");
  };

  const currentDilemma = sessionDilemmas[currentIndex];

  // Option selection
  const handleSelectOption = (option: ValueActionOption) => {
    if (gameState !== "playing") return;

    setSelectedOption(option);
    const isCorrect = option.isValueAligned;

    if (isCorrect) {
      setScore((prev) => prev + 10);
      playChime(true);
    } else {
      playChime(false);
    }

    setAnswers((prev) => [
      ...prev,
      {
        dilemma: currentDilemma,
        selectedOption: option,
        isCorrect,
      },
    ]);

    setGameState("answered");
  };

  // Advance
  const handleNextDilemma = async () => {
    if (currentIndex + 1 < sessionDilemmas.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setGameState("playing");
    } else {
      // Completed all 10 dilemmas!
      setGameState("results");
      setReviewIndex(0);

      if (user) {
        setSavingSession(true);
        try {
          const finalScore = score + (selectedOption?.isValueAligned ? 10 : 0);
          const correctCount = answers.filter((a) => a.isCorrect).length;
          const res = await gamesAPI.recordSession({
            game_slug: "values-navigator",
            score: finalScore,
            total_questions: sessionDilemmas.length,
            correct_count: correctCount,
            difficulty: domainFilter,
            duration_seconds: 150,
          });

          setSavedXP(res.data.xp_awarded ?? null);
          toast.success(`Values session saved! +${res.data.xp_awarded ?? correctCount * 10} XP earned! 🧭`);
        } catch {
          toast.error("Could not sync score with server, but your local results are safe.");
        } finally {
          setSavingSession(false);
        }
      }
    }
  };

  // Keyboard navigation: 1-4 to choose, Space to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing" && currentDilemma) {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentDilemma.options[idx]) {
            handleSelectOption(currentDilemma.options[idx]);
          }
        }
      } else if (gameState === "answered") {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          handleNextDilemma();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentDilemma, currentIndex, sessionDilemmas.length, selectedOption]);

  const correctAnswersCount = answers.filter((a) => a.isCorrect).length;
  const currentDomainInfo = currentDilemma ? DOMAIN_DEFINITIONS[currentDilemma.domain] : null;

  const getDomainIcon = (domainId: ValuesDomainId) => {
    switch (domainId) {
      case "growth":
        return <Sprout className="w-4 h-4 text-emerald-500" />;
      case "relationships":
        return <HeartHandshake className="w-4 h-4 text-rose-500" />;
      case "purpose":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "vitality":
        return <Compass className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Values Compass Navigator" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {/* ============================================================ */}
          {/* SCREEN 1: WELCOME & DOMAIN SELECTION                         */}
          {/* ============================================================ */}
          {gameState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-purple-500/20">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                      <Compass className="w-3.5 h-3.5 text-purple-300" />
                      Acceptance & Commitment Therapy (ACT) Matrix
                    </span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 transition"
                      title={soundEnabled ? "Mute audio" : "Enable audio"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
                    </button>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                    Values Compass Navigator 🧭✨
                  </h1>

                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Values are not goals you cross off; they are the direction your compass points.
                    Learn to navigate life dilemmas by making room for difficult emotions and choosing
                    committed, value-aligned action over experiential avoidance.
                  </p>
                </div>
              </div>

              {/* 4 Cardinal Domains Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(DOMAIN_DEFINITIONS).map(([key, dom]) => (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {getDomainIcon(key as ValuesDomainId)}
                      <h3 className="font-extrabold text-xs text-white">
                        {dom.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {dom.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Domain Filter Selection */}
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  Select Navigation Course
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "all", label: "All 4 Cardinal Domains (30 Cases)" },
                    { id: "growth", label: "Growth & Self-Compassion" },
                    { id: "relationships", label: "Relationships & Intimacy" },
                    { id: "purpose", label: "Work & Contribution" },
                    { id: "vitality", label: "Vitality, Joy & Adventure" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDomainFilter(cat.id as any)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-left ${
                        domainFilter === cat.id
                          ? "bg-purple-500/10 border-purple-500 text-purple-400 ring-2 ring-purple-500/20"
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
                  onClick={() => startSession()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <span>Begin Navigation Course</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2 & 3: ACTIVE PLAYING / ANSWERED SCREEN               */}
          {/* ============================================================ */}
          {(gameState === "playing" || gameState === "answered") && currentDilemma && (
            <div className="space-y-6">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    Dilemma {currentIndex + 1} of {sessionDilemmas.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-800 flex items-center gap-1">
                    {getDomainIcon(currentDilemma.domain)}
                    {currentDilemma.domainLabel}
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
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + (gameState === "answered" ? 1 : 0)) / sessionDilemmas.length) * 100}%`,
                  }}
                />
              </div>

              {/* Dilemma Presentation Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-purple-400" />
                    {currentDilemma.title}
                  </h2>

                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Value: {currentDilemma.coreValue}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentDilemma.scenario}
                </p>

                {/* Internal Emotional Obstacle Callout */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Internal Emotional Obstacle (Discomfort to Make Room For):
                  </span>
                  <p className="text-xs sm:text-sm font-semibold italic text-slate-200">
                    "{currentDilemma.internalObstacle}"
                  </p>
                </div>
              </div>

              {/* 4 Action Options */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                  {gameState === "playing"
                    ? "Choose the committed, value-aligned action (Keys 1-4):"
                    : "Choice Evaluation:"}
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {currentDilemma.options.map((opt, idx) => {
                    const isSelected = selectedOption?.id === opt.id;
                    const isTargetBest = opt.isValueAligned;

                    let cardClass =
                      "bg-slate-900 border-slate-800 hover:border-purple-500";
                    let badgeNode = null;

                    if (gameState === "answered") {
                      if (isTargetBest) {
                        cardClass = "bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30";
                        badgeNode = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Value-Aligned Action
                          </span>
                        );
                      } else if (isSelected && !isTargetBest) {
                        cardClass = "bg-rose-950/40 border-rose-500 shadow-sm";
                        badgeNode = (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> {opt.archetype.replace("_", " ")}
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

              {/* Answer Debrief */}
              {gameState === "answered" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-400" />
                      ACT Matrix Clinical Rationale
                    </span>
                    <span className="text-xs font-extrabold text-purple-400">
                      Core Value: {currentDilemma.coreValue}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentDilemma.actRationale}
                  </p>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextDilemma}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transform active:scale-95 transition"
                    >
                      <span>
                        {currentIndex + 1 < sessionDilemmas.length ? "Next Dilemma (Space)" : "View Compass Results (Space)"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 4: RESULTS & COMPASS MATRIX                          */}
          {/* ============================================================ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Results Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-purple-500/20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-7 h-7" />
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Compass Alignment Calibrated! 🧭🌟
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  You navigated {correctAnswersCount} of {sessionDilemmas.length} dilemmas with committed, value-aligned action.
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
                    Values Score
                  </span>
                  <div className="text-2xl font-black text-amber-500">
                    {score} pts
                  </div>
                  <span className="text-[11px] text-slate-400">
                    +10 pts per committed action
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    True-North Alignment
                  </span>
                  <div className="text-2xl font-black text-purple-400">
                    {Math.round((correctAnswersCount / sessionDilemmas.length) * 100)}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {correctAnswersCount} / {sessionDilemmas.length} dilemmas aligned
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Compass Rank
                  </span>
                  <div className="text-base font-black text-emerald-400">
                    {correctAnswersCount >= 9
                      ? "True North Master"
                      : correctAnswersCount >= 7
                      ? "Grounded Navigator"
                      : "Apprentice Pathfinder"}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ACT Psychological Flexibility
                  </span>
                </div>
              </div>

              {/* Dilemma Review Carousel */}
              {answers.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      Dilemma Log Review ({reviewIndex + 1} of {answers.length})
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
                          {answers[reviewIndex].dilemma.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                          {answers[reviewIndex].dilemma.coreValue}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">
                        {answers[reviewIndex].dilemma.scenario}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                        <span className="font-bold text-slate-200 block">
                          Committed Value-Aligned Action:
                        </span>
                        <p className="text-slate-300">
                          "{answers[reviewIndex].dilemma.options.find((o) => o.isValueAligned)?.text}"
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {answers[reviewIndex].dilemma.actRationale}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Safeguard Notice */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Clinical ACT Safeguard:</strong> Values Compass Navigator trains psychological
                  flexibility and values discernment based on Acceptance & Commitment Therapy. Scores are educational and do not assess clinical functioning.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={() => setGameState("welcome")}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
                >
                  Change Course Domain
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/games"
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 text-center transition"
                  >
                    Games Hub
                  </Link>

                  <button
                    onClick={() => startSession()}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Navigate Again</span>
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
