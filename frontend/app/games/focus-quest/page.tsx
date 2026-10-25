"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  FOCUS_CHALLENGES,
  CHALLENGE_TYPE_INFO,
  type FocusChallenge,
  type ChallengeType,
  type Difficulty,
} from "@/lib/games/focusQuestData";
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer as TimerIcon,
  CheckCircle2,
  XCircle,
  Trophy,
  Brain,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Info,
  Zap,
} from "lucide-react";

export default function FocusQuestPage() {
  const { user } = useAuth();

  // Settings state
  const [selectedType, setSelectedType] = useState<ChallengeType | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Active game run state
  const [activeChallenges, setActiveChallenges] = useState<FocusChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Completion modal state
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Web Audio Context for synthesized sound FX
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback(
    (freq: number, type: OscillatorType = "sine", duration = 0.15, gainVal = 0.08) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Silently caught
      }
    },
    [soundEnabled]
  );

  const playCorrectSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      setTimeout(() => playTone(587.33, "sine", 0.25, 0.08), 0);
      setTimeout(() => playTone(880.0, "sine", 0.35, 0.09), 80);
    } catch {
      // Silently caught
    }
  }, [playTone, soundEnabled]);

  const playGentleWrongSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      setTimeout(() => playTone(349.23, "sine", 0.2, 0.06), 0);
      setTimeout(() => playTone(329.63, "sine", 0.25, 0.06), 90);
    } catch {
      // Silently caught
    }
  }, [playTone, soundEnabled]);

  const playVictorySound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => playTone(freq, "triangle", 0.4, 0.08), idx * 110);
      });
    } catch {
      // Silently caught
    }
  }, [playTone, soundEnabled]);

  // Check system reduced-motion preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
    }
  }, []);

  // Shuffle and filter challenges when filters change
  const initializeRun = useCallback(() => {
    let pool = [...FOCUS_CHALLENGES];

    if (selectedType !== "all") {
      pool = pool.filter((c) => c.type === selectedType);
    }
    if (selectedDifficulty !== "all") {
      pool = pool.filter((c) => c.difficulty === selectedDifficulty);
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Standard run length of up to 10 challenges (or fewer if filtered subset is smaller)
    const runSet = pool.slice(0, Math.min(10, pool.length));

    setActiveChallenges(runSet);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setHasAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setIsCompleted(false);
    setSavedXP(null);
  }, [selectedType, selectedDifficulty]);

  useEffect(() => {
    initializeRun();
  }, [initializeRun]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isCompleted && timerEnabled) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isCompleted, timerEnabled]);

  // Current active challenge
  const currentChallenge = activeChallenges[currentIndex];

  // Handle Option Selection
  const handleSelectOption = (optionId: string) => {
    if (hasAnswered || !currentChallenge) return;

    if (!isTimerRunning && timerEnabled) {
      setIsTimerRunning(true);
    }

    setSelectedOptionId(optionId);
    setHasAnswered(true);

    const selected = currentChallenge.options.find((o) => o.id === optionId);
    if (selected?.isCorrect) {
      playCorrectSound();
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
    } else {
      playGentleWrongSound();
    }
  };

  // Keyboard navigation for choices (1-4, Enter/Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextChallenge();
        }
        return;
      }

      if (!currentChallenge) return;

      const key = e.key;
      const indexMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
      if (key in indexMap) {
        const optIndex = indexMap[key];
        if (currentChallenge.options[optIndex]) {
          e.preventDefault();
          handleSelectOption(currentChallenge.options[optIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAnswered, currentChallenge]);

  // Handle Next Challenge or Complete Run
  const handleNextChallenge = async () => {
    if (currentIndex + 1 < activeChallenges.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setHasAnswered(false);
    } else {
      // Completed run
      setIsCompleted(true);
      setIsTimerRunning(false);
      playVictorySound();

      if (user) {
        try {
          setIsSaving(true);
          const finalCorrect = correctCount + (currentChallenge?.options.find((o) => o.id === selectedOptionId)?.isCorrect ? 0 : 0);
          const res = await gamesAPI.recordSession({
            game_slug: "focus-quest",
            score: score,
            total_questions: activeChallenges.length,
            correct_count: correctCount,
            difficulty: `${selectedType}-${selectedDifficulty}`,
            duration_seconds: elapsedSeconds,
          });
          setSavedXP(res.data.xp_awarded ?? correctCount * 10);
        } catch (err) {
          console.error("Failed to save Focus Quest session", err);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Focus Quest — Visual Attention & Patterns" />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Top Bar Navigation & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-purple-400 font-semibold text-xs shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Games Hub</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Reduced Motion Toggle */}
              <button
                type="button"
                onClick={() => setReducedMotion((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                  reducedMotion
                    ? "bg-purple-950/70 text-purple-300 border-purple-800"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
                title="Toggle Reduced Motion"
                aria-label="Toggle Reduced Motion"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {reducedMotion ? "Reduced Motion: On" : "Smooth Transitions"}
                </span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                  soundEnabled
                    ? "bg-purple-950/70 text-purple-300 border-purple-800"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
                title={soundEnabled ? "Mute Sound" : "Enable Sound"}
                aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Muted"}</span>
              </button>

              {/* Timer Toggle */}
              <button
                type="button"
                onClick={() => {
                  setTimerEnabled((prev) => !prev);
                  if (timerEnabled) setIsTimerRunning(false);
                }}
                className={`p-2 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                  timerEnabled
                    ? "bg-purple-950/70 text-purple-300 border-purple-800"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
                title="Toggle Timer"
                aria-label="Toggle Timer"
              >
                <TimerIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {timerEnabled ? "Timer: Active" : "Relaxed Untimed Mode"}
                </span>
              </button>
            </div>
          </div>

          {/* Hero Header with Clinical Safety Disclaimer */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white p-5 sm:p-8 shadow-xl border border-purple-500/20">
            <div className="relative z-10 space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                <Brain className="w-3.5 h-3.5 text-purple-300" />
                <span>Visual Discrimination & Attentional Grounding</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Focus Quest</span>
                <span className="text-2xl">🎯✨</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Train visual feature search, pattern completion, and memory recall with original geometric and symbolic challenges.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-purple-300/80">
                <Shield className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span>
                  Safety Notice: Scores reflect playful attentional focus. This game does NOT diagnose ADHD, cognitive impairment, or evaluate IQ. Visual attention naturally fluctuates with rest and hydration.
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Filter Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Filter Challenges</span>
              </div>

              <button
                type="button"
                onClick={initializeRun}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700/60"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Shuffle New Set</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filters */}
              {(["all", "odd-shape", "pattern-complete", "matching-symbols", "sequence-memory", "spot-difference"] as const).map(
                (typeKey) => {
                  const isSelected = selectedType === typeKey;
                  const label =
                    typeKey === "all"
                      ? "All Types (Mixed)"
                      : CHALLENGE_TYPE_INFO[typeKey].name;
                  const icon = typeKey === "all" ? "🌟" : CHALLENGE_TYPE_INFO[typeKey].icon;

                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setSelectedType(typeKey)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-purple-500/40"
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                }
              )}

              {/* Difficulty Filters */}
              <div className="ml-auto flex items-center gap-1">
                {(["all", "easy", "medium", "hard"] as const).map((diffKey) => {
                  const isSelected = selectedDifficulty === diffKey;
                  return (
                    <button
                      key={diffKey}
                      type="button"
                      onClick={() => setSelectedDifficulty(diffKey)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase transition ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-indigo-400"
                      }`}
                    >
                      {diffKey}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Challenge Arena */}
          {currentChallenge ? (
            <div className="space-y-4">
              {/* Challenge Header & Progress Bar */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 font-extrabold uppercase tracking-wider text-[10px] border border-purple-800">
                      {CHALLENGE_TYPE_INFO[currentChallenge.type].name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[10px] border border-slate-700">
                      {currentChallenge.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-slate-300">
                      Challenge {currentIndex + 1} of {activeChallenges.length}
                    </span>
                    {timerEnabled && (
                      <span className="font-mono font-bold text-indigo-400">
                        ⏱️ {formatTime(elapsedSeconds)}
                      </span>
                    )}
                    <span className="font-extrabold text-amber-500">
                      Score: {score} pts
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentIndex + (hasAnswered ? 1 : 0)) / activeChallenges.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Challenge Card */}
              <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>{CHALLENGE_TYPE_INFO[currentChallenge.type].icon}</span>
                    <span>{currentChallenge.title}</span>
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {currentChallenge.instructions}
                  </p>
                </div>

                {/* Visual Context Presentation Display */}
                <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center min-h-[140px]">
                  {/* Row Layout */}
                  {currentChallenge.visualContext.layoutType === "row" && (
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                      {currentChallenge.visualContext.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs"
                        >
                          <span className="text-4xl filter drop-shadow-xs">{item.symbol}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grid Layout */}
                  {currentChallenge.visualContext.layoutType === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-lg">
                      {currentChallenge.visualContext.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs text-center space-y-1"
                        >
                          <span className="text-4xl filter drop-shadow-xs">{item.symbol}</span>
                          <span className="text-[10px] text-slate-400 font-medium line-clamp-2">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sequence Layout */}
                  {currentChallenge.visualContext.layoutType === "sequence" && (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                      {currentChallenge.visualContext.sequenceItems?.map((seq, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-lg sm:text-xl font-bold shadow-xs flex items-center gap-1 text-white">
                            <span>{seq}</span>
                          </div>
                          {idx < (currentChallenge.visualContext.sequenceItems?.length ?? 0) - 1 && (
                            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comparison Layout (Spot the Difference) */}
                  {currentChallenge.visualContext.layoutType === "comparison" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {/* Left Scene */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          {currentChallenge.visualContext.leftScene?.title}
                        </div>
                        <div className="flex items-center gap-2 text-3xl py-2">
                          {currentChallenge.visualContext.leftScene?.elements.map((el, i) => (
                            <span key={i}>{el}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {currentChallenge.visualContext.leftScene?.details}
                        </p>
                      </div>

                      {/* Right Scene */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                          {currentChallenge.visualContext.rightScene?.title}
                        </div>
                        <div className="flex items-center gap-2 text-3xl py-2">
                          {currentChallenge.visualContext.rightScene?.elements.map((el, i) => (
                            <span key={i}>{el}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {currentChallenge.visualContext.rightScene?.details}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentChallenge.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.isCorrect;

                    let btnStyle =
                      "bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-400 shadow-xs";

                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400";
                      } else if (isSelected && !isCorrect) {
                        btnStyle =
                          "bg-rose-950/60 border-rose-400 text-rose-200 ring-2 ring-rose-400";
                      } else {
                        btnStyle =
                          "bg-slate-950/30 border-slate-800 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={hasAnswered}
                        className={`p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 focus:outline-none focus:ring-4 focus:ring-purple-500/40 ${btnStyle} ${
                          reducedMotion ? "" : "transform active:scale-[0.98]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 text-slate-300 border border-slate-700">
                            {idx + 1}
                          </span>
                          <span className="text-xl shrink-0">{opt.symbol}</span>
                          <span className="text-xs sm:text-sm font-bold leading-snug text-white">
                            {opt.label}
                          </span>
                        </div>

                        {hasAnswered && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Educational Feedback State */}
                {hasAnswered && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/40 border border-purple-800/80 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {currentChallenge.options.find((o) => o.id === selectedOptionId)?.isCorrect ? (
                          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct! +10 Points</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <Info className="w-4 h-4" />
                            <span>Observational Explanation</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                        Cognitive Pattern
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                      {currentChallenge.explanation}
                    </p>

                    <div className="pt-2 border-t border-purple-800/60 flex items-start gap-2 text-[11px] text-purple-300">
                      <Zap className="w-3.5 h-3.5 shrink-0 text-purple-400 mt-0.5" />
                      <span>
                        <strong>Mindful Focus Tip:</strong> {currentChallenge.attentionTip}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextChallenge}
                        className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-500/25 transition flex items-center gap-2"
                      >
                        <span>
                          {currentIndex + 1 < activeChallenges.length
                            ? "Next Challenge"
                            : "Complete Quest & View Score"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-4">
              <p className="text-sm text-slate-400">
                No challenges match this filter combination.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedDifficulty("all");
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Completion Modal */}
          {isCompleted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-800">
                    Focus Quest Completed!
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Attentional Clarity Grounded
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    You engaged your visual perception and working memory across {activeChallenges.length} challenges.
                  </p>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Solved</span>
                    <p className="text-lg font-black text-emerald-400">
                      {correctCount} / {activeChallenges.length}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Time</span>
                    <p className="text-lg font-black text-indigo-400">
                      {timerEnabled ? formatTime(elapsedSeconds) : "Untimed"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Points / XP</span>
                    <p className="text-lg font-black text-amber-500">+{score} XP</p>
                  </div>
                </div>

                {/* Clinical Disclaimer & Reflection */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800 text-left text-xs text-purple-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>MindCare Focus Reflection</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-purple-300">
                    Attentional focus naturally ebbs and flows depending on sleep, screen fatigue, hydration, and nervous system activation. Score is purely an educational game metric, not a clinical assessment of ADHD, executive function, or an IQ score.
                  </p>
                </div>

                {/* Persistence status */}
                {user ? (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    {isSaving
                      ? "Recording session to your MindCare wellness profile..."
                      : `Session saved! Level progress and +${savedXP ?? score} XP added.`}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Playing as guest. Sign in to record long-term attention milestones and earn XP.
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={initializeRun}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition active:scale-95"
                  >
                    Play Again
                  </button>

                  <Link
                    href="/games"
                    className="flex-1 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-sm transition text-center"
                  >
                    Back to Games Hub
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
