"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  generateMemoryDeck,
  DIFFICULTY_CONFIG,
  GAME_MODES,
  type GameMode,
  type Difficulty,
  type EmotionCardItem,
} from "@/lib/games/emotionMemoryData";
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer as TimerIcon,
  CheckCircle2,
  Trophy,
  Brain,
  Shield,
  HelpCircle,
  Eye,
  Info,
  Layers,
  Award,
} from "lucide-react";

export default function EmotionMemoryGamePage() {
  const { user } = useAuth();

  // Configuration state
  const [mode, setMode] = useState<GameMode>("emotion-strategy");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Active game session state
  const [deck, setDeck] = useState<EmotionCardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Match insight toast
  const [recentMatch, setRecentMatch] = useState<EmotionCardItem | null>(null);

  // Completion modal & XP state
  const [isComplete, setIsComplete] = useState(false);
  const [savedXP, setSavedXP] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Web Audio Context reference for synthesized soft chimes
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio synthesize helpers
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
        // Audio playback error silently caught
      }
    },
    [soundEnabled]
  );

  const playFlipSound = useCallback(() => {
    playTone(520, "sine", 0.08, 0.04);
  }, [playTone]);

  const playMatchSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // Gentle major triad chord (C5 - E5 - G5)
      setTimeout(() => playTone(523.25, "sine", 0.35, 0.06), 0);
      setTimeout(() => playTone(659.25, "sine", 0.35, 0.06), 80);
      setTimeout(() => playTone(783.99, "sine", 0.45, 0.07), 160);
    } catch {
      // Silently fail
    }
  }, [playTone, soundEnabled]);

  const playVictorySound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => playTone(freq, "triangle", 0.45, 0.08), idx * 120);
      });
    } catch {
      // Silently fail
    }
  }, [playTone, soundEnabled]);

  // Check system reduced-motion preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
    }
  }, []);

  // Initialize or reset game deck
  const startNewGame = useCallback(() => {
    const newDeck = generateMemoryDeck(mode, difficulty);
    setDeck(newDeck);
    setFlippedIndices([]);
    setMatchedPairIds([]);
    setMoveCount(0);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setIsProcessing(false);
    setRecentMatch(null);
    setIsComplete(false);
    setSavedXP(null);
  }, [mode, difficulty]);

  // Restart game when mode or difficulty changes
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isComplete && timerEnabled) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isComplete, timerEnabled]);

  // Handle Card Click
  const handleCardClick = (index: number) => {
    // Prevent clicking if processing match, already 2 flipped, already matched, or clicked same card
    if (isProcessing) return;
    if (flippedIndices.length >= 2) return;
    if (flippedIndices.includes(index)) return;
    const card = deck[index];
    if (matchedPairIds.includes(card.pairId)) return;

    // Start timer on first interaction if enabled
    if (!isTimerRunning && timerEnabled && !isComplete) {
      setIsTimerRunning(true);
    }

    playFlipSound();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If 2 cards are now flipped, evaluate match
    if (newFlipped.length === 2) {
      setMoveCount((prev) => prev + 1);
      setIsProcessing(true);

      const firstCard = deck[newFlipped[0]];
      const secondCard = deck[newFlipped[1]];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND
        playMatchSound();
        const updatedMatches = [...matchedPairIds, firstCard.pairId];
        setMatchedPairIds(updatedMatches);
        setRecentMatch(firstCard);
        setFlippedIndices([]);
        setIsProcessing(false);

        // Check completion
        const requiredPairs = DIFFICULTY_CONFIG[difficulty].pairs;
        if (updatedMatches.length === requiredPairs) {
          handleGameCompletion(updatedMatches.length);
        }
      } else {
        // MISMATCH — flip back after brief pause
        setTimeout(() => {
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 950);
      }
    }
  };

  // Keyboard accessibility handler for cards
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(index);
    }
  };

  // Handle Completion
  const handleGameCompletion = async (totalPairs: number) => {
    setIsComplete(true);
    setIsTimerRunning(false);
    playVictorySound();

    const baseScore = totalPairs * 10;
    // Optional move efficiency bonus (never subtracts)
    const efficiencyBonus = Math.max(0, (totalPairs * 2 - moveCount) * 2);
    const finalScore = baseScore + efficiencyBonus;

    if (user) {
      try {
        setIsSaving(true);
        const res = await gamesAPI.recordSession({
          game_slug: "emotion-memory",
          score: finalScore,
          total_questions: totalPairs,
          correct_count: totalPairs,
          difficulty: `${mode}-${difficulty}`,
          duration_seconds: elapsedSeconds,
        });
        setSavedXP(res.data.xp_awarded ?? totalPairs * 10);
      } catch (err) {
        console.error("Failed to persist emotion memory session", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Format elapsed time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const totalPairs = DIFFICULTY_CONFIG[difficulty].pairs;
  const isAllMatched = matchedPairIds.length === totalPairs;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Emotion Memory Match" />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Top Navigation & Disclaimers */}
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
                  {reducedMotion ? "Reduced Motion: On" : "Smooth 3D: On"}
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
                  {timerEnabled ? "Timer: Active" : "Relaxed Mode (No Timer)"}
                </span>
              </button>
            </div>
          </div>

          {/* Hero Banner with Clinical Safeguard */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white p-5 sm:p-8 shadow-xl border border-purple-500/20">
            <div className="relative z-10 space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                <Brain className="w-3.5 h-3.5 text-purple-300" />
                <span>Cognitive Agility & Emotional Granularity</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Emotion Memory Match</span>
                <span className="text-2xl">🎴🧠</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Flip and pair cards to strengthen visual working memory, emotional vocabulary, and evidence-based self-regulation strategies.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-purple-300/80">
                <Shield className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span>
                  Clinical note: Coping strategies are supportive personal experiments, not one-size-fits-all prescriptions. Scores reflect playful focus, not emotional health.
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Mode & Difficulty Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Game Mode Selector */}
            <div className="md:col-span-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Select Game Mode
                </span>
                <span className="text-[11px] text-purple-400 font-medium">
                  {GAME_MODES[mode].subtitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(GAME_MODES) as GameMode[]).map((key) => {
                  const m = GAME_MODES[key];
                  const isSelected = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent border-purple-500 text-purple-200 ring-2 ring-purple-500/20 shadow-sm"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-purple-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-lg">{m.icon}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs font-bold leading-tight text-white">{m.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {m.explanation}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty & Actions */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Difficulty Level
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
                    const cfg = DIFFICULTY_CONFIG[key];
                    const isSelected = difficulty === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDifficulty(key)}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-indigo-400"
                        }`}
                      >
                        {cfg.label}
                        <div className="text-[9px] font-normal opacity-80 mt-0.5">
                          {cfg.pairs} Pairs
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset / Restart */}
              <button
                type="button"
                onClick={startNewGame}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700/60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Shuffle & Reset Grid</span>
              </button>
            </div>
          </div>

          {/* Live Session Status Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Matched Counter */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                  Pairs Matched
                </span>
                <p className="text-xl font-black text-purple-400 flex items-center gap-1.5">
                  <span>
                    {matchedPairIds.length} / {totalPairs}
                  </span>
                  {isAllMatched && <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />}
                </p>
              </div>

              {/* Moves Counter */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                  Total Flips / Moves
                </span>
                <p className="text-xl font-black text-slate-200">{moveCount}</p>
              </div>

              {/* Stopwatch (if enabled) */}
              {timerEnabled && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                    Elapsed Time
                  </span>
                  <p className="text-xl font-black font-mono text-indigo-400">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
              )}
            </div>

            {/* Score & Potential XP */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                  Score Earned
                </span>
                <p className="text-xl font-black text-amber-500">
                  {matchedPairIds.length * 10} pts
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Educational Insight Toast (Displays after each match) */}
          {recentMatch && !isComplete && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 flex items-start gap-3 shadow-sm transition-all duration-300">
              <span className="text-2xl shrink-0">{recentMatch.emoji}</span>
              <div className="space-y-1">
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>Match Discovered: {recentMatch.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-bold">
                    +10 Points
                  </span>
                </div>
                <p className="text-xs text-emerald-300 leading-relaxed">
                  {recentMatch.detail}
                </p>
              </div>
            </div>
          )}

          {/* Card Memory Grid */}
          <div
            className={`grid gap-3 sm:gap-4 ${DIFFICULTY_CONFIG[difficulty].gridCols}`}
            role="region"
            aria-label="Emotion Memory Card Grid"
          >
            {deck.map((card, index) => {
              const isFlipped = flippedIndices.includes(index);
              const isMatched = matchedPairIds.includes(card.pairId);
              const isOpen = isFlipped || isMatched;

              return (
                <div
                  key={card.id}
                  className="w-full aspect-[3/4] relative perspective-1000"
                >
                  <button
                    type="button"
                    onClick={() => handleCardClick(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={isOpen || isProcessing}
                    aria-label={`Card ${index + 1}: ${
                      isOpen
                        ? `${card.title}, ${card.badgeText}`
                        : "Face down card, press Enter or Space to flip"
                    }`}
                    aria-pressed={isOpen}
                    tabIndex={isOpen ? -1 : 0}
                    className={`w-full h-full rounded-2xl cursor-pointer select-none transition-all duration-500 relative transform-style-3d focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
                      reducedMotion
                        ? ""
                        : isOpen
                        ? "rotate-y-180"
                        : "hover:-translate-y-1 shadow-md hover:shadow-lg"
                    } ${
                      isMatched
                        ? "ring-2 ring-emerald-500/80 shadow-emerald-500/20"
                        : ""
                    }`}
                  >
                    {/* CARD BACK (Face Down) */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl p-4 flex flex-col items-center justify-between backface-hidden border transition ${
                        reducedMotion && isOpen ? "hidden" : "flex"
                      } bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-purple-500/30 text-white shadow-inner`}
                    >
                      <div className="w-full flex justify-between items-center text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider">
                        <span>MindCare</span>
                        <span>#{index + 1}</span>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-purple-200">
                        <Brain className="w-6 h-6 animate-pulse" />
                      </div>

                      <div className="text-[10px] text-purple-200/60 font-medium text-center">
                        Tap to reveal
                      </div>
                    </div>

                    {/* CARD FRONT (Face Up) */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl p-3 sm:p-4 flex flex-col justify-between backface-hidden border transition ${
                        reducedMotion
                          ? isOpen
                            ? "flex"
                            : "hidden"
                          : "rotate-y-180 flex"
                      } ${card.bgLight} ${card.borderTheme} ${
                        isMatched
                          ? "border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400"
                          : "shadow-lg"
                      }`}
                    >
                      {/* Badge & Role */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 border border-slate-800 shadow-2xs">
                          {card.badgeText}
                        </span>

                        {isMatched ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Matched</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {card.cardRole === "primary" ? "A" : "B"}
                          </span>
                        )}
                      </div>

                      {/* Icon & Title */}
                      <div className="my-auto text-center space-y-1.5">
                        <div className="text-3xl sm:text-4xl filter drop-shadow-xs">
                          {card.emoji}
                        </div>
                        <h3 className="text-xs sm:text-sm font-black leading-tight text-white">
                          {card.title}
                        </h3>
                      </div>

                      {/* Subtext / Somatic Cue */}
                      <p className="text-[10px] sm:text-[11px] text-slate-300 line-clamp-3 leading-snug text-center">
                        {card.subtext}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Victory Completion Modal */}
          {isComplete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-800">
                    Memory Run Completed!
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Mindful Harmony Restored
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    You discovered all {totalPairs} emotion pairs across the grid with mindful focus and self-awareness.
                  </p>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Moves</span>
                    <p className="text-lg font-black text-white">{moveCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Time</span>
                    <p className="text-lg font-black text-indigo-400">
                      {timerEnabled ? formatTime(elapsedSeconds) : "Untimed"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">XP Awarded</span>
                    <p className="text-lg font-black text-amber-500">
                      +{totalPairs * 10} XP
                    </p>
                  </div>
                </div>

                {/* Clinical Granularity Takeaway */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800 text-left text-xs text-purple-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>MindCare Learning Insight</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-purple-300">
                    {mode === "match-pairs" &&
                      "Sharpening the distinction between diverse feelings grounds parasympathetic calm and reduces automatic reactivity."}
                    {mode === "emotion-word" &&
                      "Linguistic labeling ('Name it to tame it') actively down-regulates amygdala arousal and connects cognitive with somatic centers."}
                    {mode === "emotion-strategy" &&
                      "Cultivating an expansive coping toolkit lets you respond with curiosity and self-compassion rather than self-judgment."}
                  </p>
                </div>

                {/* Persistence status */}
                {user ? (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    {isSaving
                      ? "Recording session to your MindCare wellness profile..."
                      : `Session saved! Level progress and +${savedXP ?? totalPairs * 10} XP added.`}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Playing as guest. Sign in to track long-term memory milestones and earn XP.
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition active:scale-95"
                  >
                    Play Again
                  </button>

                  <Link
                    href="/games"
                    className="flex-1 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-sm transition text-center border border-slate-700/60"
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
