"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  SCENARIOS,
  EMOTIONS_CONFIG,
  EmotionScenario,
  EmotionType,
  DifficultyLevel,
} from "@/lib/games/emotionDetectiveData";
import {
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
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Flame,
  Gamepad2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type GameState = "welcome" | "playing" | "answered" | "results";

interface AnswerRecord {
  scenario: EmotionScenario;
  selectedEmotion: EmotionType;
  isCorrect: boolean;
}

export default function EmotionDetectivePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Game flow state
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | DifficultyLevel>("all");
  const [gameScenarios, setGameScenarios] = useState<EmotionScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<EmotionType | null>(null);
  const [showClues, setShowClues] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);

  // Play a simple synthesized audio chime using Web Audio API
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      } else {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 0.25); // C4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not permitted or supported; silent fallback
    }
  }, [soundEnabled]);

  // Start new game session
  const startGame = (diff: "all" | DifficultyLevel = difficultyFilter) => {
    let pool = [...SCENARIOS];
    if (diff !== "all") {
      pool = pool.filter((s) => s.difficulty === diff);
    }
    // Shuffle and pick 10
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
    setGameScenarios(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowClues(false);
    setSavedXP(null);
    setGameState("playing");
  };

  const currentScenario = gameScenarios[currentIndex];

  // Answer handler
  const handleSelectAnswer = (chosen: EmotionType) => {
    if (gameState !== "playing" || !currentScenario) return;

    setSelectedOption(chosen);
    const isCorrect = chosen === currentScenario.correctEmotion;

    if (isCorrect) {
      setScore((prev) => prev + 10);
      playChime(true);
    } else {
      playChime(false);
    }

    const newRecord: AnswerRecord = {
      scenario: currentScenario,
      selectedEmotion: chosen,
      isCorrect,
    };

    setAnswers((prev) => [...prev, newRecord]);
    setGameState("answered");
  };

  // Next question or finish
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < gameScenarios.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowClues(false);
      setGameState("playing");
    } else {
      // Finish game
      setGameState("results");
      const finalAnswers = [...answers];
      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
      const finalScore = correctCount * 10;

      // If user is authenticated, save session to backend
      if (user) {
        try {
          setSavingSession(true);
          const res = await gamesAPI.recordSession({
            game_slug: "emotion-detective",
            score: finalScore,
            total_questions: gameScenarios.length,
            correct_count: correctCount,
            difficulty: difficultyFilter,
          });
          if (res.data?.xp_awarded) {
            setSavedXP(res.data.xp_awarded);
          }
        } catch (err) {
          console.warn("Could not record game session to server:", err);
        } finally {
          setSavingSession(false);
        }
      }
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameState === "playing" && currentScenario) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          handleSelectAnswer(currentScenario.options[0]);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          handleSelectAnswer(currentScenario.options[1]);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          handleSelectAnswer(currentScenario.options[2]);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          handleSelectAnswer(currentScenario.options[3]);
        } else if (e.key.toLowerCase() === "h") {
          setShowClues((prev) => !prev);
        }
      } else if (gameState === "answered") {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentScenario, answers, currentIndex, gameScenarios]);

  // Overall accuracy
  const correctCount = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers]);
  const accuracyPct = useMemo(
    () => (gameScenarios.length > 0 ? Math.round((correctCount / gameScenarios.length) * 100) : 0),
    [correctCount, gameScenarios]
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Emotion Detective" />

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
              {/* Header Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>MindCare AI Educational Mini-Game</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                    Emotion Detective <span className="text-amber-400">🕵️</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    Step into the shoes of an emotional detective! Read real-world scenarios, inspect contextual clues,
                    and identify the core emotional states experienced in everyday life.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      🎯 10 Points per Deduction
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      🧠 10 Core Emotions
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                      🛡️ Non-judgmental Learning
                    </span>
                  </div>
                </div>
              </div>

              {/* Rules & Safeguard Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-2.5">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                    Investigation Rules
                  </h3>
                  <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                    <li>• You will be presented with <strong>10 case scenarios</strong> one at a time.</li>
                    <li>• Choose from <strong>4 possible emotional deductions</strong>.</li>
                    <li>• Keyboard shortcuts: Press <strong>1, 2, 3, 4</strong> to answer, and <strong>H</strong> for hints.</li>
                    <li>• Immediate explanations unpack why the emotion fits best.</li>
                    <li>• No penalties or negative scores for incorrect attempts.</li>
                  </ul>
                </div>

                <div className="p-5 bg-amber-950/30 border border-amber-900/40 rounded-2xl shadow-sm space-y-2.5">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    Educational Safeguard
                  </h3>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Human emotions are multifaceted and complex. Real people often experience mixtures of multiple feelings
                    simultaneously. In this game, choices represent the <strong>best pedagogical fit</strong> for emotional literacy,
                    not a clinical evaluation of a person's feelings or your mental health.
                  </p>
                </div>
              </div>

              {/* Difficulty Selection & Start */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select Difficulty Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "all", label: "Mixed Case", desc: "All difficulties" },
                      { id: "easy", label: "Novice", desc: "Clear cues" },
                      { id: "medium", label: "Investigator", desc: "Subtle cues" },
                      { id: "hard", label: "Mastermind", desc: "Complex dilemmas" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficultyFilter(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          difficultyFilter === item.id
                            ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                            : "bg-slate-800/60 border-slate-800 text-slate-300 hover:border-purple-400"
                        }`}
                      >
                        <p className="text-xs font-extrabold">{item.label}</p>
                        <p className={`text-[10px] mt-0.5 ${difficultyFilter === item.id ? "text-purple-100" : "text-slate-400"}`}>
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
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
                      <span>{soundEnabled ? "Audio On" : "Audio Muted"}</span>
                    </button>
                    <Link
                      href="/games"
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Games Hub</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => startGame()}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                  >
                    <span>Begin Investigation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SCREEN 2 & 3: GAMEPLAY (PLAYING / ANSWERED)
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
                        Case {currentIndex + 1} of {gameScenarios.length}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        currentScenario.difficulty === "easy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : currentScenario.difficulty === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {currentScenario.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Audio */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-900/50">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-extrabold text-purple-300">
                      {score} pts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    title="Toggle audio"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentIndex + (gameState === "answered" ? 1 : 0)) / gameScenarios.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Scenario Prompt Card */}
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Search className="w-4 h-4" />
                    <span>Case Incident Report</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClues((prev) => !prev)}
                    className="text-xs text-slate-400 hover:text-purple-400 font-semibold flex items-center gap-1 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showClues ? "Hide Clues (H)" : "Inspect Clues (H)"}</span>
                  </button>
                </div>

                <h2 className="text-base sm:text-xl font-bold leading-relaxed text-white">
                  "{currentScenario.scenario}"
                </h2>

                <p className="text-xs text-slate-400 italic">
                  Context: {currentScenario.context}
                </p>

                {/* Expandable Clues */}
                <AnimatePresence>
                  {showClues && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 space-y-1.5 text-xs text-indigo-200">
                        <span className="font-bold flex items-center gap-1.5">
                          🔍 Detective Clues:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-indigo-300">
                          {currentScenario.clues.map((clue, i) => (
                            <li key={i}>{clue}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 4 Interactive Emotion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentScenario.options.map((emotionName, idx) => {
                  const meta = EMOTIONS_CONFIG[emotionName];
                  const isChosen = selectedOption === emotionName;
                  const isCorrectAnswer = currentScenario.correctEmotion === emotionName;

                  // Compute card styling depending on answered state
                  let cardStyle =
                    "bg-slate-900 border-slate-800 hover:border-purple-400 hover:shadow-md";

                  if (gameState === "answered") {
                    if (isCorrectAnswer) {
                      cardStyle =
                        "bg-emerald-950/50 border-emerald-500 text-emerald-100 ring-2 ring-emerald-400/30";
                    } else if (isChosen && !isCorrectAnswer) {
                      cardStyle =
                        "bg-rose-950/40 border-rose-400 text-rose-200";
                    } else {
                      cardStyle = "opacity-50 border-slate-800";
                    }
                  }

                  return (
                    <button
                      key={emotionName}
                      type="button"
                      disabled={gameState === "answered"}
                      onClick={() => handleSelectAnswer(emotionName)}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative group flex items-start gap-4 ${cardStyle} ${
                        gameState === "playing" ? "active:scale-[0.98]" : ""
                      }`}
                    >
                      {/* Shortcut key indicator */}
                      <span className="shrink-0 w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
                        {idx + 1}
                      </span>

                      {/* Emoji Icon */}
                      <span className="text-3xl shrink-0 select-none">{meta.emoji}</span>

                      {/* Content */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                            {meta.name}
                          </h3>
                          {gameState === "answered" && isCorrectAnswer && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          {gameState === "answered" && isChosen && !isCorrectAnswer && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Explanation Drawer */}
              <AnimatePresence>
                {gameState === "answered" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      {selectedOption === currentScenario.correctEmotion ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          {selectedOption === currentScenario.correctEmotion
                            ? "Spot-On Deduction! (+10 pts)"
                            : `Primary Target: ${currentScenario.correctEmotion}`}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {selectedOption === currentScenario.correctEmotion
                            ? "You correctly matched the emotional context with the behavioral clues."
                            : `You identified ${selectedOption}, but ${currentScenario.correctEmotion} represents the strongest primary fit here.`}
                        </p>
                      </div>
                    </div>

                    {/* Educational explanation */}
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2">
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        💡 <strong>Why this emotion:</strong> {currentScenario.educationalExplanation}
                      </p>
                      {currentScenario.secondaryEmotionsNote && (
                        <p className="text-[11px] text-slate-400 italic">
                          🔄 <strong>Blended emotions note:</strong> {currentScenario.secondaryEmotionsNote}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transform active:scale-95 transition"
                      >
                        <span>
                          {currentIndex + 1 < gameScenarios.length ? "Next Incident (Space / Enter)" : "Inspect Final Case Results"}
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
              SCREEN 4: FINAL RESULTS & CASE DEBRIEF
          ════════════════════════════════════════════════════════════════════ */}
          {gameState === "results" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Score Showcase Hero */}
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white shadow-2xl border border-indigo-500/20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/10 text-amber-300 flex items-center justify-center mx-auto border border-white/15 backdrop-blur-md shadow-lg">
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-purple-200">
                    Investigation Report Closed
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-white">
                    {score} <span className="text-xl sm:text-2xl font-normal text-purple-200">/ {gameScenarios.length * 10} pts</span>
                  </h2>
                </div>

                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {accuracyPct >= 80
                    ? "Outstanding emotional perceptiveness! You deftly uncovered nuances in subtle social scenarios."
                    : accuracyPct >= 50
                    ? "Solid investigation work! You accurately identified several key emotions while exploring complex nuances."
                    : "Great practice! Emotional literacy deepens every time you pause to consider another's experience."}
                </p>

                {savedXP && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{savedXP} XP Earned toward your MindCare Profile Level!</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 text-center">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-lg font-black text-white">{correctCount}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Correct</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-lg font-black text-white">{accuracyPct}%</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-lg font-black text-white">{gameScenarios.length}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Scenarios</p>
                  </div>
                </div>
              </div>

              {/* Educational Disclaimer */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Educational Note:</strong> This mini-game measures pattern recognition of common emotion concepts
                  in written text. It does not rank or diagnose your mental health, psychological resilience, or emotional intelligence.
                </p>
              </div>

              {/* Detailed Incident Review Carousel */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    Review Incident Explanations ({reviewIndex + 1}/{answers.length})
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={reviewIndex === 0}
                      onClick={() => setReviewIndex((prev) => Math.max(0, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={reviewIndex >= answers.length - 1}
                      onClick={() => setReviewIndex((prev) => Math.min(answers.length - 1, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {answers[reviewIndex] && (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                      <p className="text-sm font-semibold text-slate-200">
                        "{answers[reviewIndex].scenario.scenario}"
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 ${
                          answers[reviewIndex].isCorrect
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                            : "bg-rose-950/60 text-rose-300 border border-rose-800"
                        }`}>
                          {answers[reviewIndex].isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          Your Answer: {answers[reviewIndex].selectedEmotion}
                        </span>
                        {!answers[reviewIndex].isCorrect && (
                          <span className="px-2.5 py-1 rounded-xl font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                            Target: {answers[reviewIndex].scenario.correctEmotion}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-900/40 text-xs text-purple-200 space-y-1">
                      <p>
                        💡 <strong>Pedagogical Insight:</strong> {answers[reviewIndex].scenario.educationalExplanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <Link
                  href="/games"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-800 text-xs font-extrabold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Back to Games Hub</span>
                </Link>

                <button
                  type="button"
                  onClick={() => startGame(difficultyFilter)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Another Case (10 Scenarios)</span>
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
