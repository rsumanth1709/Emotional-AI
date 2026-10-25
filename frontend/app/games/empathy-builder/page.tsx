"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  EMPATHY_SCENARIOS,
  EmpathyScenario,
  EmpathyOption,
  EmpathyCategory,
  ResponseArchetype,
} from "@/lib/games/empathyBuilderData";
import {
  Heart,
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
  MessageSquare,
  BookOpen,
  Volume2,
  VolumeX,
  Gamepad2,
  AlertCircle,
  User,
  Wrench,
  Sun,
  TrendingDown,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "playing" | "answered" | "results";

interface DialogueAnswerRecord {
  scenario: EmpathyScenario;
  selectedOption: EmpathyOption;
  isCorrect: boolean;
}

export default function EmpathyBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [categoryFilter, setCategoryFilter] = useState<"all" | EmpathyCategory>("all");
  const [gameScenarios, setGameScenarios] = useState<EmpathyScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<DialogueAnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<EmpathyOption | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Web Audio chime
  const playChime = useCallback((isSuccess: boolean) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      if (isSuccess) {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.15); // C#5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      } else {
        osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
        osc.frequency.exponentialRampToValueAtTime(293.66, ctx.currentTime + 0.2); // D4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Silent fallback
    }
  }, [soundEnabled]);

  // Start new game
  const startGame = (cat: "all" | EmpathyCategory = categoryFilter) => {
    let pool = [...EMPATHY_SCENARIOS];
    if (cat !== "all") {
      pool = pool.filter((s) => s.category === cat);
    }
    // Shuffle scenarios
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
    setGameScenarios(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setSavedXP(null);
    setGameState("playing");
  };

  const currentScenario = gameScenarios[currentIndex];

  // Option selection
  const handleSelectOption = (opt: EmpathyOption) => {
    if (gameState !== "playing" || !currentScenario) return;

    setSelectedOption(opt);
    const isCorrect = opt.isBestResponse;

    if (isCorrect) {
      setScore((prev) => prev + 10);
      playChime(true);
    } else {
      playChime(false);
    }

    const record: DialogueAnswerRecord = {
      scenario: currentScenario,
      selectedOption: opt,
      isCorrect,
    };

    setAnswers((prev) => [...prev, record]);
    setGameState("answered");
  };

  // Advance
  const handleNextDialogue = async () => {
    if (currentIndex + 1 < gameScenarios.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setGameState("playing");
    } else {
      setGameState("results");
      const finalAnswers = [...answers];
      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
      const finalScore = correctCount * 10;

      if (user) {
        try {
          setSavingSession(true);
          const res = await gamesAPI.recordSession({
            game_slug: "empathy-builder",
            score: finalScore,
            total_questions: gameScenarios.length,
            correct_count: correctCount,
            difficulty: categoryFilter === "all" ? "mixed" : categoryFilter.toLowerCase(),
          });
          if (res.data?.xp_awarded) {
            setSavedXP(res.data.xp_awarded);
          }
        } catch (err) {
          console.warn("Could not record empathy session:", err);
        } finally {
          setSavingSession(false);
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameState === "playing" && currentScenario) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          handleSelectOption(currentScenario.options[0]);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          handleSelectOption(currentScenario.options[1]);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          handleSelectOption(currentScenario.options[2]);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          handleSelectOption(currentScenario.options[3]);
        }
      } else if (gameState === "answered") {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNextDialogue();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentScenario, answers, currentIndex, gameScenarios]);

  // Overall stats
  const correctCount = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers]);
  const accuracyPct = useMemo(
    () => (gameScenarios.length > 0 ? Math.round((correctCount / gameScenarios.length) * 100) : 0),
    [correctCount, gameScenarios]
  );

  // Archetype breakdown
  const archetypeBreakdown = useMemo(() => {
    const counts: Record<ResponseArchetype, number> = {
      empathetic: 0,
      toxic_positivity: 0,
      premature_fixing: 0,
      minimizing: 0,
    };
    answers.forEach((a) => {
      counts[a.selectedOption.archetype] = (counts[a.selectedOption.archetype] || 0) + 1;
    });
    return counts;
  }, [answers]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Empathy Builder" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
          {/* ═══════════════════════════════════════════════════════════════════
              SCREEN 1: WELCOME & BRIEFING
          ════════════════════════════════════════════════════════════════════ */}
          {gameState === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-teal-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold backdrop-blur-md">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>MindCare AI Educational Mini-Game 2</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                    Empathy Builder <span className="text-rose-400">💬🤝</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    Practice deep active listening and emotional presence. Learn to identify and avoid common communication
                    traps like toxic positivity, unsolicited advice, and conversational invalidation.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      🎯 10 Points per Empathetic Choice
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      👂 4 Conversational Archetypes
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      💡 Real-World Communication Science
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Archetypes Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> 🎯 Empathetic & Validating
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Provides non-judgmental presence, mirrors emotional reality, and affirms that the person's feelings are completely natural and understandable.
                  </p>
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sun className="w-4 h-4" /> ☀️ Toxic Positivity
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Forces artificial optimism ("Everything happens for a reason! Just smile!"), making the speaker feel guilty for experiencing natural sorrow or anxiety.
                  </p>
                </div>

                <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-2xl space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <Wrench className="w-4 h-4" /> 🔧 Premature Fixing
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jumps immediately to unsolicited advice or tactical instructions before giving the speaker space to feel heard, seen, and regulated.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <TrendingDown className="w-4 h-4" /> 📉 Minimizing & One-Upmanship
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dismisses distress using comparative suffering ("At least it's not...") or turns the conversation into a competition about who has it harder.
                  </p>
                </div>
              </div>

              {/* Category Filter & Start Button */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select Scenario Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "all", label: "Mixed Scenarios", desc: "All relationship contexts" },
                      { id: "Workplace & Burnout", label: "Workplace Stress", desc: "Teammates & managers" },
                      { id: "Grief & Loss", label: "Grief & Bereavement", desc: "Navigating deep loss" },
                      { id: "Friendship & Social Anxiety", label: "Friendship & Social", desc: "Belonging & peer wounds" },
                      { id: "Relationship & Heartbreak", label: "Romantic & Family", desc: "Partners & heartbreak" },
                      { id: "Health & Physical Stress", label: "Health & Illness", desc: "Pain & recovery" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategoryFilter(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          categoryFilter === item.id
                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                            : "bg-slate-800/60 border-slate-800 text-slate-300 hover:border-teal-500"
                        }`}
                      >
                        <p className="text-xs font-extrabold">{item.label}</p>
                        <p className={`text-[10px] mt-0.5 ${categoryFilter === item.id ? "text-teal-100" : "text-slate-400"}`}>
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1.5"
                      title="Toggle sound chimes"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span>{soundEnabled ? "Audio On" : "Audio Muted"}</span>
                    </button>
                    <Link
                      href="/games"
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Games Hub</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => startGame()}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                  >
                    <span>Begin Empathy Practice</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SCREEN 2 & 3: PLAYING & ANSWERED
          ════════════════════════════════════════════════════════════════════ */}
          {(gameState === "playing" || gameState === "answered") && currentScenario && (
            <div className="space-y-6">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGameState("welcome")}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    title="Return to briefing"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Dialogue {currentIndex + 1} of {gameScenarios.length}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {currentScenario.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/40 border border-teal-900/50">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-teal-300">
                      {score} pts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    title="Toggle audio"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentIndex + (gameState === "answered" ? 1 : 0)) / gameScenarios.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Interpersonal Dialogue Card */}
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {currentScenario.speakerName.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {currentScenario.speakerName}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Relationship: {currentScenario.relationship}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    Context: {currentScenario.context}
                  </span>
                </div>

                {/* Speech Bubble */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-800 relative">
                  <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                    "{currentScenario.statement}"
                  </p>
                </div>
              </motion.div>

              {/* 4 Response Options */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  How do you respond? (Press 1 - 4)
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {currentScenario.options.map((option, idx) => {
                    const isChosen = selectedOption?.id === option.id;

                    let cardStyle =
                      "bg-slate-900 border-slate-800 hover:border-teal-500 hover:shadow-md";

                    if (gameState === "answered") {
                      if (option.isBestResponse) {
                        cardStyle =
                          "bg-emerald-950/40 border-emerald-500 text-emerald-100 ring-2 ring-emerald-400/30";
                      } else if (isChosen && !option.isBestResponse) {
                        cardStyle =
                          "bg-rose-950/40 border-rose-500 text-rose-200";
                      } else {
                        cardStyle = "opacity-40 border-slate-800";
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={gameState === "answered"}
                        onClick={() => handleSelectOption(option)}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative flex items-start gap-4 ${cardStyle} ${
                          gameState === "playing" ? "active:scale-[0.99]" : ""
                        }`}
                      >
                        {/* Shortcut number */}
                        <span className="shrink-0 w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-white">
                            "{option.text}"
                          </p>

                          {/* Archetype pill revealed after answering */}
                          {gameState === "answered" && (
                            <div className="flex items-center gap-2 pt-1">
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                  option.archetype === "empathetic"
                                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                    : option.archetype === "toxic_positivity"
                                    ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                                    : option.archetype === "premature_fixing"
                                    ? "bg-blue-950/60 text-blue-300 border border-blue-500/30"
                                    : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {gameState === "answered" && option.isBestResponse && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {gameState === "answered" && isChosen && !option.isBestResponse && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback and Educational Rationale Drawer */}
              <AnimatePresence>
                {gameState === "answered" && selectedOption && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      {selectedOption.isBestResponse ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          {selectedOption.isBestResponse
                            ? "Deeply Validating Response! (+10 pts)"
                            : `Response Pattern: ${selectedOption.label}`}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {selectedOption.impactFeedback}
                        </p>
                      </div>
                    </div>

                    {/* Educational insight box */}
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        🧠 <strong>Emotional Science:</strong> {currentScenario.educationalInsight}
                      </p>
                      <p className="text-[11px] text-teal-300 italic">
                        💡 <strong>Active Listening Rule:</strong> {currentScenario.communicationTip}
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextDialogue}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-2 transform active:scale-95 transition"
                      >
                        <span>
                          {currentIndex + 1 < gameScenarios.length ? "Next Dialogue (Space / Enter)" : "Inspect Final Debrief"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SCREEN 4: FINAL RESULTS & ACTIVE LISTENING DEBRIEF
          ════════════════════════════════════════════════════════════════════ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Score Showcase Hero */}
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-teal-900 via-indigo-900 to-slate-950 text-white shadow-2xl border border-teal-500/20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/10 text-rose-300 flex items-center justify-center mx-auto border border-white/15 backdrop-blur-md shadow-lg">
                  <Heart className="w-8 h-8 fill-rose-400 text-rose-400" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-teal-200">
                    Empathy Session Completed
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-white">
                    {score} <span className="text-xl sm:text-2xl font-normal text-teal-200">/ {gameScenarios.length * 10} pts</span>
                  </h2>
                </div>

                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {accuracyPct >= 80
                    ? "Incredible interpersonal presence! You intuitively know how to validate distress without rushing to fix or dismiss."
                    : accuracyPct >= 50
                    ? "Great active listening work! You consistently recognized moments requiring gentle presence and solidarity."
                    : "Valuable practice! Empathy is an intentional muscle that strengthens with every conscious conversation."}
                </p>

                {savedXP && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{savedXP} XP Earned toward your MindCare Profile Level!</span>
                  </div>
                )}

                {/* Archetype Breakdown Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto pt-4 text-center">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-base font-extrabold text-emerald-300">{archetypeBreakdown.empathetic}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Validating</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-base font-extrabold text-amber-300">{archetypeBreakdown.toxic_positivity}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Positivity</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-base font-extrabold text-blue-300">{archetypeBreakdown.premature_fixing}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Advice Fixing</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-base font-extrabold text-rose-300">{archetypeBreakdown.minimizing}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Minimizing</p>
                  </div>
                </div>
              </div>

              {/* Educational Safeguard */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Educational Note:</strong> Empathy Builder is designed to build awareness of communication habits.
                  Scores reflect responses to stylized multiple-choice prompts and are not a measure of your personal emotional character.
                </p>
              </div>

              {/* Review Carousel */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    Review Conversation Debrief ({reviewIndex + 1}/{answers.length})
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={reviewIndex === 0}
                      onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-600 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={reviewIndex >= answers.length - 1}
                      onClick={() => setReviewIndex((prev) => Math.min(answers.length - 1, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-600 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {answers[reviewIndex] && (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-400">
                        {answers[reviewIndex].scenario.speakerName} ({answers[reviewIndex].scenario.relationship}):
                      </p>
                      <p className="text-sm font-semibold text-white">
                        "{answers[reviewIndex].scenario.statement}"
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                        <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 ${
                          answers[reviewIndex].isCorrect
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                        }`}>
                          {answers[reviewIndex].isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          Your Response: {answers[reviewIndex].selectedOption.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        "{answers[reviewIndex].selectedOption.text}"
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-900/40 text-xs text-teal-200 space-y-1">
                      <p>
                        💡 <strong>Psychological Rationale:</strong> {answers[reviewIndex].scenario.educationalInsight}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <Link
                  href="/games"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 text-xs font-extrabold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 transition"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Back to Games Hub</span>
                </Link>

                <button
                  type="button"
                  onClick={() => startGame(categoryFilter)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practice Another Case (10 Dialogues)</span>
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
