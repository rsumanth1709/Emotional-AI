"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  WHEEL_EMOTIONS,
  WHEEL_SCENARIO_QUESTIONS,
  type EmotionWheelSector,
  type WheelScenarioQuestion,
} from "@/lib/games/emotionWheelData";
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Trophy,
  Brain,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lock,
  Heart,
  Save,
  Compass,
  Dices,
  Sliders,
  Eye,
  Check,
  Zap,
} from "lucide-react";

type ModeType = "wheel" | "quiz" | "matching" | "journal";

interface FamilyArc {
  family: "joy" | "peace" | "fear" | "sadness" | "anger";
  label: string;
  emoji: string;
  colorHex: string;
  startAngle: number;
  endAngle: number;
  emotions: EmotionWheelSector[];
}

export default function EmotionWheelPage() {
  const { user } = useAuth();

  // Mode & navigation
  const [activeMode, setActiveMode] = useState<ModeType>("wheel");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [familyFilter, setFamilyFilter] = useState<string>("all");

  // Wheel interaction & active emotion
  const [selectedEmotionId, setSelectedEmotionId] = useState<string>("calmness");
  const [hoveredEmotionId, setHoveredEmotionId] = useState<string | null>(null);
  const [feelingResonance, setFeelingResonance] = useState<number>(5);

  const activeEmotion = useMemo(() => {
    return WHEEL_EMOTIONS.find((e) => e.id === selectedEmotionId) || WHEEL_EMOTIONS[0];
  }, [selectedEmotionId]);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<WheelScenarioQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelectedOptionId, setQuizSelectedOptionId] = useState<string | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizSavedXP, setQuizSavedXP] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Wheel Target Matching state
  const [matchTarget, setMatchTarget] = useState<EmotionWheelSector | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [matchStreak, setMatchStreak] = useState(0);
  const [matchFeedback, setMatchFeedback] = useState<{
    status: "correct" | "incorrect" | null;
    message: string;
  }>({ status: null, message: "" });

  // Private Journal state (100% localStorage)
  const [journalEntries, setJournalEntries] = useState<Record<string, string>>({});
  const [currentJournalText, setCurrentJournalText] = useState("");
  const [journalSaveNotice, setJournalSaveNotice] = useState(false);

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
        if (ctx.state === "suspended") ctx.resume();

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

  const playPopSound = useCallback(() => {
    playTone(520, "sine", 0.08, 0.04);
  }, [playTone]);

  const playMatchChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      setTimeout(() => playTone(523.25, "sine", 0.25, 0.06), 0);
      setTimeout(() => playTone(659.25, "sine", 0.3, 0.07), 80);
      setTimeout(() => playTone(783.99, "sine", 0.4, 0.08), 160);
    } catch {
      // Silently caught
    }
  }, [playTone, soundEnabled]);

  const playVictoryFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => playTone(freq, "triangle", 0.35, 0.08), idx * 110);
      });
    } catch {
      // Silently caught
    }
  }, [playTone, soundEnabled]);

  // Load journal and motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mindcare_emotion_wheel_journal");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setJournalEntries(parsed);
          if (parsed[selectedEmotionId]) {
            setCurrentJournalText(parsed[selectedEmotionId]);
          }
        } catch {
          // Ignore
        }
      }
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
    }
  }, [selectedEmotionId]);

  // Initialize Quiz
  const initializeQuiz = useCallback(() => {
    const shuffled = [...WHEEL_SCENARIO_QUESTIONS].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, 10));
    setQuizIndex(0);
    setQuizSelectedOptionId(null);
    setQuizAnswered(false);
    setQuizScore(0);
    setQuizCorrectCount(0);
    setQuizCompleted(false);
    setQuizSavedXP(null);
  }, []);

  // Initialize Target Matching
  const pickNewMatchTarget = useCallback(() => {
    const random = WHEEL_EMOTIONS[Math.floor(Math.random() * WHEEL_EMOTIONS.length)];
    setMatchTarget(random);
    setMatchFeedback({ status: null, message: "" });
  }, []);

  useEffect(() => {
    initializeQuiz();
    pickNewMatchTarget();
  }, [initializeQuiz, pickNewMatchTarget]);

  // Plutchik-style Dual Ring Family Definitions
  const familyArcs: FamilyArc[] = useMemo(() => {
    return [
      {
        family: "joy",
        label: "Joy & Vitality",
        emoji: "☀️",
        colorHex: "#F59E0B",
        startAngle: -90,
        endAngle: 0,
        emotions: WHEEL_EMOTIONS.filter((e) => e.family === "joy"),
      },
      {
        family: "peace",
        label: "Equilibrium & Rest",
        emoji: "🍃",
        colorHex: "#14B8A6",
        startAngle: 0,
        endAngle: 60,
        emotions: WHEEL_EMOTIONS.filter((e) => e.family === "peace"),
      },
      {
        family: "fear",
        label: "Apprehension & Threat",
        emoji: "⚡",
        colorHex: "#8B5CF6",
        startAngle: 60,
        endAngle: 120,
        emotions: WHEEL_EMOTIONS.filter((e) => e.family === "fear"),
      },
      {
        family: "sadness",
        label: "Grief & Tender Loss",
        emoji: "🌧️",
        colorHex: "#3B82F6",
        startAngle: 120,
        endAngle: 210,
        emotions: WHEEL_EMOTIONS.filter((e) => e.family === "sadness"),
      },
      {
        family: "anger",
        label: "Boundary & Injustice",
        emoji: "🔥",
        colorHex: "#EF4444",
        startAngle: 210,
        endAngle: 270,
        emotions: WHEEL_EMOTIONS.filter((e) => e.family === "anger"),
      },
    ];
  }, []);

  // Handle Sector Click
  const handleSelectEmotion = (emotion: EmotionWheelSector) => {
    playPopSound();
    setSelectedEmotionId(emotion.id);

    if (journalEntries[emotion.id]) {
      setCurrentJournalText(journalEntries[emotion.id]);
    } else {
      setCurrentJournalText("");
    }

    // In Target Matching mode, check answer
    if (activeMode === "matching" && matchTarget) {
      if (emotion.id === matchTarget.id) {
        playMatchChime();
        setMatchScore((prev) => prev + 10);
        setMatchStreak((prev) => prev + 1);
        setMatchFeedback({
          status: "correct",
          message: `Harmonic match! ${emotion.emoji} ${emotion.name} is the target state.`,
        });
        setTimeout(() => {
          pickNewMatchTarget();
        }, 1300);
      } else {
        setMatchStreak(0);
        setMatchFeedback({
          status: "incorrect",
          message: `You selected ${emotion.name} (${emotion.familyLabel}). Clue points to: "${matchTarget.simpleDefinition}".`,
        });
      }
    }
  };

  // Roll Random Emotion
  const handleRollRandom = () => {
    playPopSound();
    const available =
      familyFilter === "all"
        ? WHEEL_EMOTIONS
        : WHEEL_EMOTIONS.filter((e) => e.family === familyFilter);
    const random = available[Math.floor(Math.random() * available.length)];
    if (random) handleSelectEmotion(random);
  };

  // Handle Quiz Option Selection
  const handleQuizSelectOption = (optionId: string) => {
    if (quizAnswered || !quizQuestions[quizIndex]) return;

    setQuizSelectedOptionId(optionId);
    setQuizAnswered(true);

    const question = quizQuestions[quizIndex];
    const selected = question.options.find((o) => o.id === optionId);

    // Also highlight the corresponding emotion on the wheel!
    if (selected) {
      const matchInWheel = WHEEL_EMOTIONS.find((e) => e.id === selected.emotionId);
      if (matchInWheel) setSelectedEmotionId(matchInWheel.id);
    }

    if (selected?.isCorrect) {
      playMatchChime();
      setQuizScore((prev) => prev + 10);
      setQuizCorrectCount((prev) => prev + 1);
    }
  };

  // Next Quiz Question or Complete
  const handleNextQuizQuestion = async () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelectedOptionId(null);
      setQuizAnswered(false);
    } else {
      setQuizCompleted(true);
      playVictoryFanfare();

      if (user) {
        try {
          setIsSaving(true);
          const res = await gamesAPI.recordSession({
            game_slug: "emotion-wheel",
            score: quizScore,
            total_questions: quizQuestions.length,
            correct_count: quizCorrectCount,
            difficulty: "wheel-scenarios",
          });
          setQuizSavedXP(res.data.xp_awarded ?? quizCorrectCount * 10);
        } catch (err) {
          console.error("Failed to save emotion wheel session", err);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  // Save private journal response locally
  const handleSaveJournal = () => {
    const updated = { ...journalEntries, [selectedEmotionId]: currentJournalText };
    setJournalEntries(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("mindcare_emotion_wheel_journal", JSON.stringify(updated));
    }
    setJournalSaveNotice(true);
    setTimeout(() => setJournalSaveNotice(false), 2200);
  };

  // Helper for SVG annular paths
  const describeArc = (
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    startDeg: number,
    endDeg: number
  ) => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + rOuter * Math.cos(startRad);
    const y1 = cy + rOuter * Math.sin(startRad);
    const x2 = cx + rOuter * Math.cos(endRad);
    const y2 = cy + rOuter * Math.sin(endRad);

    const x3 = cx + rInner * Math.cos(endRad);
    const y3 = cy + rInner * Math.sin(endRad);
    const x4 = cx + rInner * Math.cos(startRad);
    const y4 = cy + rInner * Math.sin(startRad);

    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;

    return `M ${x4} ${y4} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 transition-all duration-1000"
        style={{ backgroundColor: activeEmotion.colorHex }}
      />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Navbar title="Emotion Wheel Studio" />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Floating Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-purple-400 font-semibold text-xs shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Games Hub</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Roll Random Feeling */}
              <button
                type="button"
                onClick={handleRollRandom}
                className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-purple-400 text-xs font-bold transition flex items-center gap-1.5 text-purple-400 shadow-sm"
                title="Explore a random feeling"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Roll Feeling 🎲</span>
              </button>

              {/* Reduced Motion Toggle */}
              <button
                type="button"
                onClick={() => setReducedMotion((prev) => !prev)}
                className={`p-2 rounded-2xl border text-xs font-medium transition flex items-center gap-1.5 backdrop-blur-md ${
                  reducedMotion
                    ? "bg-purple-950/70 text-purple-300 border-purple-800"
                    : "bg-slate-900/80 border-slate-800 text-slate-400"
                }`}
                title="Toggle Reduced Motion"
                aria-label="Toggle Reduced Motion"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {reducedMotion ? "Static View" : "Smooth Rotations"}
                </span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-2 rounded-2xl border text-xs font-medium transition flex items-center gap-1.5 backdrop-blur-md ${
                  soundEnabled
                    ? "bg-purple-950/70 text-purple-300 border-purple-800"
                    : "bg-slate-900/80 border-slate-800 text-slate-400"
                }`}
                title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
                aria-label={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Unified Mode Studio Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveMode("wheel")}
                className={`py-2 px-3.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  activeMode === "wheel"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Wheel Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("quiz")}
                className={`py-2 px-3.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  activeMode === "quiz"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>❓</span>
                <span>Scenario Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("matching")}
                className={`py-2 px-3.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  activeMode === "matching"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>🎯</span>
                <span>Target Match</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("journal")}
                className={`py-2 px-3.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                  activeMode === "journal"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Private Journal</span>
              </button>
            </div>

            {/* Quick Filter by Emotion Family */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {["all", "joy", "peace", "fear", "sadness", "anger"].map((famKey) => (
                <button
                  key={famKey}
                  type="button"
                  onClick={() => setFamilyFilter(famKey)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
                    familyFilter === famKey
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {famKey}
                </button>
              ))}
            </div>
          </div>

          {/* DUAL-PANE UNIFIED DASHBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT / CENTER PANE: Dual-Ring Plutchik-Style Emotion Wheel (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activeEmotion.colorHex }} />
                  <span className="font-black uppercase tracking-wider text-slate-300">
                    Dual-Ring Wheel (Plutchik Model)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Inner: 5 Core Families • Outer: 12 Nuances
                </span>
              </div>

              {/* DUAL-RING SVG WHEEL */}
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center p-2">
                <svg
                  viewBox="0 0 500 500"
                  className={`w-full h-full filter drop-shadow-xl select-none ${
                    reducedMotion ? "" : "transition-transform duration-700"
                  }`}
                >
                  <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={activeEmotion.colorHex} stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                    </radialGradient>
                    <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={activeEmotion.colorHex} floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* 1. INNER RING: 5 Primary Emotional Families (R: 70 to 135) */}
                  {familyArcs.map((fam) => {
                    const isFamilyActive = activeEmotion.family === fam.family;
                    const path = describeArc(250, 250, 70, 134, fam.startAngle, fam.endAngle);

                    const midRad = (((fam.startAngle + fam.endAngle) / 2) * Math.PI) / 180;
                    const lx = 250 + 102 * Math.cos(midRad);
                    const ly = 250 + 102 * Math.sin(midRad);

                    return (
                      <g
                        key={fam.family}
                        className="cursor-pointer group"
                        onClick={() => {
                          const firstEmotion = fam.emotions[0];
                          if (firstEmotion) handleSelectEmotion(firstEmotion);
                        }}
                      >
                        <path
                          d={path}
                          fill={fam.colorHex}
                          stroke="#ffffff"
                          strokeWidth={isFamilyActive ? 3 : 1.5}
                          opacity={isFamilyActive ? 0.95 : 0.65}
                          className="transition-all duration-300 hover:opacity-100 group-hover:brightness-110"
                        />
                        <text
                          x={lx}
                          y={ly + 3}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="800"
                          fill="#ffffff"
                          className="pointer-events-none select-none tracking-wider uppercase filter drop-shadow-xs"
                        >
                          {fam.label.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* 2. OUTER RING: 12 Specific Nuanced Emotions (R: 138 to 234) */}
                  {WHEEL_EMOTIONS.map((emotion, index) => {
                    const sectorAngle = 30;
                    const startAngle = -90 + index * sectorAngle;
                    const endAngle = -90 + (index + 1) * sectorAngle;
                    const midRad = ((startAngle + sectorAngle / 2) * Math.PI) / 180;

                    const isSelected = selectedEmotionId === emotion.id;
                    const isHovered = hoveredEmotionId === emotion.id;
                    const isMatchingTarget = activeMode === "matching" && matchTarget?.id === emotion.id;

                    const path = describeArc(250, 250, 138, 234, startAngle, endAngle);

                    const lx = 250 + 186 * Math.cos(midRad);
                    const ly = 250 + 186 * Math.sin(midRad);

                    return (
                      <g
                        key={emotion.id}
                        className="cursor-pointer group"
                        onClick={() => handleSelectEmotion(emotion)}
                        onMouseEnter={() => setHoveredEmotionId(emotion.id)}
                        onMouseLeave={() => setHoveredEmotionId(null)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${emotion.name} (${emotion.familyLabel})`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectEmotion(emotion);
                          }
                        }}
                      >
                        <path
                          d={path}
                          fill={emotion.colorHex}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 4 : 2}
                          opacity={isSelected ? 1 : isHovered ? 0.95 : 0.8}
                          filter={isSelected ? "url(#activeGlow)" : undefined}
                          className="transition-all duration-300 group-hover:opacity-100 group-hover:brightness-115"
                        />

                        {/* Outer Sector Emoji */}
                        <text
                          x={lx}
                          y={ly - 5}
                          textAnchor="middle"
                          fontSize="17"
                          className="pointer-events-none select-none filter drop-shadow-xs"
                        >
                          {emotion.emoji}
                        </text>

                        {/* Outer Sector Title */}
                        <text
                          x={lx}
                          y={ly + 13}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill="#ffffff"
                          className="pointer-events-none select-none filter drop-shadow-xs"
                        >
                          {emotion.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* 3. CENTER HUB: Glassmorphic Core */}
                  <circle
                    cx="250"
                    cy="250"
                    r="64"
                    fill="url(#centerGlow)"
                    stroke={activeEmotion.colorHex}
                    strokeWidth="3.5"
                    className="cursor-pointer transition-all duration-500 hover:scale-105"
                    onClick={handleRollRandom}
                    aria-label="Click to roll a random emotion"
                  />
                  <text
                    x="250"
                    y="240"
                    textAnchor="middle"
                    fontSize="28"
                    className="pointer-events-none select-none filter drop-shadow-sm"
                  >
                    {activeEmotion.emoji}
                  </text>
                  <text
                    x="250"
                    y="268"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="900"
                    fill="#ffffff"
                    className="pointer-events-none select-none uppercase tracking-wider"
                  >
                    {activeEmotion.name}
                  </text>
                </svg>
              </div>

              {/* Intensity Resonance Slider */}
              <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-purple-500" />
                    <span>Personal Felt Resonance:</span>
                  </span>
                  <span className="font-extrabold" style={{ color: activeEmotion.colorHex }}>
                    Level {feelingResonance} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feelingResonance}
                  onChange={(e) => setFeelingResonance(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                  aria-label="Emotion intensity resonance slider"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Subtle Whisper (1)</span>
                  <span>Moderate (5)</span>
                  <span>Overwhelming Surge (10)</span>
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Morphing Context Studio (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* MODE 1: WHEEL EXPLORER STUDIO */}
              {activeMode === "wheel" && (
                <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl space-y-5 animate-in fade-in duration-300">
                  {/* Family Badge & Emoji Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs"
                      style={{ backgroundColor: activeEmotion.colorHex }}
                    >
                      {activeEmotion.familyLabel}
                    </span>
                    <span className="text-4xl filter drop-shadow-xs">{activeEmotion.emoji}</span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      {activeEmotion.name}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {activeEmotion.simpleDefinition}
                    </p>
                  </div>

                  {/* Somatic Felt Sense Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Somatic Bodily Location</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {activeEmotion.somaticCue}
                    </p>
                  </div>

                  {/* Nuanced Branching States */}
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      Nuanced Branching States
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeEmotion.relatedEmotions.map((rel) => (
                        <span
                          key={rel}
                          className="px-2.5 py-1 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800 text-xs font-bold"
                        >
                          {rel}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Journal Prompt Teaser */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Reflective Prompt</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-snug">
                      "{activeEmotion.journalPrompt}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveMode("journal")}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <span>Open in Private Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: SCENARIO QUIZ STUDIO */}
              {activeMode === "quiz" && (
                <div className="space-y-4">
                  {!quizCompleted ? (
                    <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl space-y-5 animate-in fade-in duration-300">
                      {/* Quiz Progress Header */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 font-extrabold uppercase tracking-wider text-[10px]">
                          Scenario {quizIndex + 1} of {quizQuestions.length}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-amber-500">
                            Score: {quizScore} pts
                          </span>
                          <button
                            type="button"
                            onClick={initializeQuiz}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-200"
                            title="Restart Quiz"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scenario Prompt */}
                      {quizQuestions[quizIndex] && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-extrabold text-purple-400">
                            {quizQuestions[quizIndex].title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                            "{quizQuestions[quizIndex].scenario}"
                          </p>
                        </div>
                      )}

                      {/* 4 Choices */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {quizQuestions[quizIndex]?.options.map((opt, idx) => {
                          const isSelected = quizSelectedOptionId === opt.id;
                          const isCorrect = opt.isCorrect;

                          let btnStyle =
                            "bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-400";

                          if (quizAnswered) {
                            if (isCorrect) {
                              btnStyle =
                                "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400";
                            } else if (isSelected && !isCorrect) {
                              btnStyle =
                                "bg-rose-950/60 border-rose-400 text-rose-200 ring-2 ring-rose-400";
                            } else {
                              btnStyle = "opacity-50 border-slate-800";
                            }
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleQuizSelectOption(opt.id)}
                              disabled={quizAnswered}
                              className={`p-3 rounded-xl border text-left transition flex items-center justify-between text-xs font-bold ${btnStyle}`}
                            >
                              <span>{opt.label}</span>
                              {quizAnswered && isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {quizAnswered && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback & Ambivalence Explanation */}
                      {quizAnswered && (
                        <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-800 space-y-2">
                          <p className="text-xs text-purple-200 leading-relaxed">
                            {quizQuestions[quizIndex].explanation}
                          </p>

                          <div className="pt-2 border-t border-purple-800/60 text-[11px] text-purple-300">
                            <strong>Emotional Overlap:</strong>{" "}
                            {quizQuestions[quizIndex].blendedEmotionsNote}
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleNextQuizQuestion}
                              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                            >
                              <span>
                                {quizIndex + 1 < quizQuestions.length
                                  ? "Next Scenario"
                                  : "View Final Results"}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Completion Box */
                    <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Trophy className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-black text-white">Quiz Completed!</h3>
                      <p className="text-xs text-slate-400">
                        Score: {quizCorrectCount} / {quizQuestions.length} ({quizScore} XP)
                      </p>
                      {user && (
                        <p className="text-[11px] text-emerald-400 font-bold">
                          {isSaving ? "Saving session..." : `+${quizSavedXP ?? quizScore} XP added to your profile!`}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={initializeQuiz}
                        className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                      >
                        Play Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: WHEEL TARGET MATCH STUDIO */}
              {activeMode === "matching" && (
                <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-extrabold uppercase tracking-wider text-[10px]">
                      Target Match Mode
                    </span>
                    <div className="flex items-center gap-3 font-extrabold">
                      <span className="text-amber-500">Score: {matchScore}</span>
                      <span className="text-emerald-400">Streak: {matchStreak} 🔥</span>
                    </div>
                  </div>

                  {matchTarget && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-800 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-cyan-400">
                        Target Clue: Click this on the wheel
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        "{matchTarget.simpleDefinition}"
                      </h3>
                      <p className="text-xs text-slate-400">
                        Somatic hint: {matchTarget.somaticCue}
                      </p>
                    </div>
                  )}

                  {matchFeedback.status && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        matchFeedback.status === "correct"
                          ? "bg-emerald-950/60 border-emerald-400 text-emerald-200"
                          : "bg-amber-950/60 border-amber-400 text-amber-200"
                      }`}
                    >
                      {matchFeedback.message}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 text-center">
                    Click either the inner primary family or the outer wedge on the Emotion Wheel to match.
                  </p>
                </div>
              )}

              {/* MODE 4: PRIVATE JOURNAL STUDIO */}
              {activeMode === "journal" && (
                <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Device-Only Safe Reflection</span>
                    </div>
                    <span className="text-xl">{activeEmotion.emoji}</span>
                  </div>

                  <h3 className="text-lg font-black text-white">
                    Journaling on {activeEmotion.name}
                  </h3>

                  <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800 text-xs text-purple-200 italic leading-relaxed">
                    "{activeEmotion.journalPrompt}"
                  </div>

                  <textarea
                    rows={6}
                    value={currentJournalText}
                    onChange={(e) => setCurrentJournalText(e.target.value)}
                    placeholder="Type your private reflection here... Text stays entirely in your browser's private storage."
                    className="w-full p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 text-slate-200 text-xs focus:outline-none focus:ring-4 focus:ring-purple-500/20 leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {journalSaveNotice ? (
                        <span className="text-emerald-400 font-bold">Saved to device!</span>
                      ) : (
                        "Never transmitted to any external AI"
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleSaveJournal}
                      className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Safeguard Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-300">
                Scientific & Clinical Learning Principles
              </span>
              <p className="leading-relaxed">
                Humans naturally experience complex emotional ambivalence — feeling relief and sadness, or anxiety and excitement simultaneously. We never infer a person's authentic internal reality from surface expressions or isolated messages. Scores reflect educational engagement, not psychological diagnosis.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
