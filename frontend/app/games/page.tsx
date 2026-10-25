"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import type { GameHistoryData } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Gamepad2,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Flame,
  Brain,
  Compass,
  Trophy,
  Wind,
  Moon,
  Heart,
  Shuffle,
  Clock,
  X,
  Zap,
  CheckCircle2,
  Sparkle,
} from "lucide-react";

interface GameItem {
  id: string;
  title: string;
  emoji: string;
  category:
    | "Emotional Perception"
    | "Somatic & Breath"
    | "CBT & Mindset"
    | "Relationships & Empathy"
    | "Attention & Focus"
    | "Rest & Sanctuary";
  subtitle: string;
  description: string;
  href: string;
  duration: string;
  difficulty: "Effortless" | "Gentle" | "Intermediate" | "Reflective" | "All Levels";
  xpInfo: string;
  gradient: string;
  iconBg: string;
  accentBorder: string;
  badgeColor: string;
  tags: string[];
  clinicalBasis: string;
  featured?: boolean;
}

const ALL_GAMES: GameItem[] = [
  {
    id: "emotion-detective",
    title: "Emotion Detective",
    emoji: "🕵️",
    category: "Emotional Perception",
    subtitle: "Interpersonal Clues & Perception",
    description:
      "Analyze real-world social scenarios, evaluate subtle behavioral cues, and accurately identify 10 distinct emotional states.",
    href: "/games/emotion-detective",
    duration: "3 - 5 min",
    difficulty: "Intermediate",
    xpInfo: "+10 XP / question",
    gradient: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    accentBorder: "group-hover:border-purple-500/50",
    badgeColor: "bg-purple-950/80 text-purple-300 border-purple-800/80",
    tags: ["10 Core Emotions", "Micro-Expressions", "Social Cues", "Interactive Scoring"],
    clinicalBasis: "Affective Granularity & Social Cue Decoding",
    featured: true,
  },
  {
    id: "mindful-breath-odyssey",
    title: "Mindful Breath Odyssey",
    emoji: "🌊",
    category: "Somatic & Breath",
    subtitle: "HRV Coherence & Vagal Resonance",
    description:
      "Stimulate the vagus nerve and regulate the autonomic nervous system using a bioluminescent orb with 4 clinical HRV rhythms.",
    href: "/games/mindful-breath-odyssey",
    duration: "2 - 10 min",
    difficulty: "Gentle",
    xpInfo: "+10 XP / cycle",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentBorder: "group-hover:border-emerald-500/50",
    badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
    tags: ["Heart Coherence", "Box Breathing (4-4-4-4)", "4-7-8 Calm", "Tension Tracker"],
    clinicalBasis: "Heart Rate Variability (HRV) Biofeedback",
    featured: true,
  },
  {
    id: "calm-bubble",
    title: "Calm Bubble",
    emoji: "🫧",
    category: "Somatic & Breath",
    subtitle: "Visual Breathing Sanctuary",
    description:
      "A soothing visual breathing guide with soft expanding bubbles, customizable rhythms, and zero forced breath-holding.",
    href: "/games/calm-bubble",
    duration: "1 - 5 min",
    difficulty: "Effortless",
    xpInfo: "+10 XP / min",
    gradient: "from-sky-500 to-blue-600",
    iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    accentBorder: "group-hover:border-sky-500/50",
    badgeColor: "bg-sky-950/80 text-sky-300 border-sky-800/80",
    tags: ["Natural Flow", "Deep Rest", "Gentle Chimes", "Reduced Motion"],
    clinicalBasis: "Parasympathetic Downregulation",
  },
  {
    id: "grounding-quest",
    title: "Somatic Grounding Quest",
    emoji: "🌿",
    category: "Somatic & Breath",
    subtitle: "5-4-3-2-1 Sensory Anchoring",
    description:
      "De-escalate panic and acute sensory overwhelm. Anchor through your 5 senses across nature sanctuaries or directly in your room.",
    href: "/games/grounding-quest",
    duration: "3 - 5 min",
    difficulty: "Gentle",
    xpInfo: "+10 XP / anchor",
    gradient: "from-cyan-500 to-teal-600",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    accentBorder: "group-hover:border-cyan-500/50",
    badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-800/80",
    tags: ["5-4-3-2-1 Method", "Bamboo Grove", "Ocean Shore", "Room Anchor"],
    clinicalBasis: "Polyvagal Somatic Regulation",
  },
  {
    id: "trigger-detective",
    title: "Trigger Detective",
    emoji: "🔍",
    category: "CBT & Mindset",
    subtitle: "Cognitive Distortion Interception",
    description:
      "Identify catastrophic thinking, mind reading, and black-and-white filters across 30 realistic dilemmas with Socratic reframes.",
    href: "/games/trigger-detective",
    duration: "4 - 7 min",
    difficulty: "Intermediate",
    xpInfo: "+10 XP / reframe",
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accentBorder: "group-hover:border-amber-500/50",
    badgeColor: "bg-orange-950/80 text-orange-300 border-orange-800/80",
    tags: ["30 Case Files", "Catastrophizing", "Mind Reading", "Socratic Dialogue"],
    clinicalBasis: "Cognitive Behavioral Therapy (CBT)",
  },
  {
    id: "values-navigator",
    title: "Values Compass Navigator",
    emoji: "🧭",
    category: "CBT & Mindset",
    subtitle: "Acceptance & Committed Action",
    description:
      "Differentiate true personal values from experiential avoidance. Make room for difficult feelings and chart committed action.",
    href: "/games/values-navigator",
    duration: "5 - 8 min",
    difficulty: "Reflective",
    xpInfo: "+10 XP / alignment",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    accentBorder: "group-hover:border-violet-500/50",
    badgeColor: "bg-purple-950/80 text-purple-300 border-purple-800/80",
    tags: ["30 ACT Dilemmas", "4 Cardinal Domains", "Cognitive Defusion", "Action Steps"],
    clinicalBasis: "Acceptance and Commitment Therapy (ACT)",
  },
  {
    id: "emotion-wheel",
    title: "Emotion Wheel Challenge",
    emoji: "🎡",
    category: "Emotional Perception",
    subtitle: "Granularity & Emotional Ambivalence",
    description:
      "Spin an interactive 12-segment wheel to master nuanced emotional vocabulary, explore mixed feelings, and reflect in a private journal.",
    href: "/games/emotion-wheel",
    duration: "4 - 6 min",
    difficulty: "All Levels",
    xpInfo: "+10 XP / scenario",
    gradient: "from-fuchsia-500 to-rose-600",
    iconBg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    accentBorder: "group-hover:border-fuchsia-500/50",
    badgeColor: "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800/80",
    tags: ["12 Emotions", "Interactive Wheel", "Simultaneous Blends", "Private Reflections"],
    clinicalBasis: "Constructivist Affective Science",
  },
  {
    id: "emotion-memory",
    title: "Emotion Memory Match",
    emoji: "🎴",
    category: "Emotional Perception",
    subtitle: "Working Memory & Coping Tools",
    description:
      "Exercise cognitive recall and affective vocabulary with 3 game modes: identical feelings, emotion naming, or coping strategy pairs.",
    href: "/games/emotion-memory",
    duration: "2 - 5 min",
    difficulty: "All Levels",
    xpInfo: "+10 XP / match",
    gradient: "from-pink-500 to-purple-600",
    iconBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    accentBorder: "group-hover:border-pink-500/50",
    badgeColor: "bg-pink-950/80 text-pink-300 border-pink-800/80",
    tags: ["Twin Match", "Name It to Tame It", "Coping Cards", "3D Card Flips"],
    clinicalBasis: "Executive Working Memory & Associative Priming",
  },
  {
    id: "empathy-builder",
    title: "Empathy Builder",
    emoji: "💬",
    category: "Relationships & Empathy",
    subtitle: "Active Listening & Supportive Presence",
    description:
      "Navigate sensitive conversations. Identify and replace toxic positivity, unsolicited fixing, and dismissal with empathetic listening.",
    href: "/games/empathy-builder",
    duration: "4 - 6 min",
    difficulty: "Intermediate",
    xpInfo: "+10 XP / response",
    gradient: "from-teal-500 to-indigo-600",
    iconBg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    accentBorder: "group-hover:border-teal-500/50",
    badgeColor: "bg-teal-950/80 text-teal-300 border-teal-800/80",
    tags: ["10 Real Dialogues", "Toxic Positivity Check", "Validating Presence", "Scenarios"],
    clinicalBasis: "Rogerian Person-Centered Empathy",
  },
  {
    id: "focus-quest",
    title: "Focus Quest",
    emoji: "🎯",
    category: "Attention & Focus",
    subtitle: "Visual Attention & Pattern Cognition",
    description:
      "Engaging, non-diagnostic visual focus challenges: find odd shapes, complete geometric sequences, spot subtle changes, and recall symbols.",
    href: "/games/focus-quest",
    duration: "3 - 6 min",
    difficulty: "All Levels",
    xpInfo: "+10 XP / challenge",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    accentBorder: "group-hover:border-blue-500/50",
    badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-800/80",
    tags: ["5 Attention Modules", "30 Challenges", "Pattern Chains", "Untimed Mode"],
    clinicalBasis: "Selective Attention & Visual Working Memory",
  },
  {
    id: "mood-garden",
    title: "Virtual Mood Garden",
    emoji: "🌸",
    category: "Rest & Sanctuary",
    subtitle: "Botanical Acceptance Sanctuary",
    description:
      "Cultivate a living botanical sanctuary where all human emotions nourish the soil. Plant seeds and unlock stone lanterns with zero streak guilt.",
    href: "/games/mood-garden",
    duration: "2 - 5 min",
    difficulty: "Gentle",
    xpInfo: "+10 XP / bloom",
    gradient: "from-emerald-500 to-green-600",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentBorder: "group-hover:border-emerald-500/50",
    badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
    tags: ["9 Soil Plots", "6 Unique Blooms", "Garden Ornaments", "Zero Streak Guilt"],
    clinicalBasis: "Compassion-Focused Emotional Acceptance",
  },
  {
    id: "sleep-sanctuary",
    title: "Mindful Sleep Sanctuary",
    emoji: "🌙",
    category: "Rest & Sanctuary",
    subtitle: "Circadian CBT-I Nightfall Ritual",
    description:
      "De-escalate pre-sleep autonomic arousal. Lock nighttime worries in the Worry Vault, simulate amber sunset lighting, and relax somatic tension.",
    href: "/games/sleep-sanctuary",
    duration: "5 - 10 min",
    difficulty: "Effortless",
    xpInfo: "+10 XP / chamber",
    gradient: "from-indigo-500 to-slate-800",
    iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    accentBorder: "group-hover:border-indigo-500/50",
    badgeColor: "bg-indigo-950/80 text-indigo-300 border-indigo-800/80",
    tags: ["The Worry Vault", "Circadian Sunset", "Cool Thermal Reset", "Body Scan"],
    clinicalBasis: "Cognitive Behavioral Therapy for Insomnia (CBT-I)",
  },
];

const CATEGORIES = [
  "All Games",
  "Somatic & Breath",
  "Emotional Perception",
  "CBT & Mindset",
  "Rest & Sanctuary",
  "Relationships & Empathy",
  "Attention & Focus",
] as const;

export default function GamesHubPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<GameHistoryData | null>(null);
  const [, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Games");
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        setLoadingHistory(true);
        const res = await gamesAPI.getHistory("emotion-detective");
        setHistory(res.data);
      } catch {
        // Silently skip if guest or offline
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [user]);

  // Filtered games logic
  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter((game) => {
      const matchesCategory =
        selectedCategory === "All Games" || game.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.subtitle.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.clinicalBasis.toLowerCase().includes(q) ||
        game.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Spotlight featured games
  const featuredGames = useMemo(
    () => ALL_GAMES.filter((g) => g.featured || g.id === "emotion-detective" || g.id === "sleep-sanctuary"),
    []
  );

  const activeSpotlight = featuredGames[spotlightIndex % featuredGames.length];

  // Quick Play / Surprise Me
  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * ALL_GAMES.length);
    const chosenGame = ALL_GAMES[randomIndex];
    router.push(chosenGame.href);
  };

  const handleNextSpotlight = () => {
    setSpotlightIndex((prev) => (prev + 1) % featuredGames.length);
  };

  const upcomingGames = [
    {
      title: "Emotional Weather Map",
      desc: "Metaphoric somatic journaling mapping internal nervous system states to atmospheric micro-climates.",
      icon: Brain,
      tag: "In Development",
      gradient: "from-teal-600/20 to-cyan-600/20 text-teal-400 border-teal-500/20",
    },
    {
      title: "Inner Critic Alchemist",
      desc: "Cognitive defusion and parts-work integration transforming self-sabotaging inner scripts into wise mentors.",
      icon: Sparkles,
      tag: "Planned",
      gradient: "from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/20",
    },
    {
      title: "Gratitude Forest Grove",
      desc: "Neuroplastic rewiring training visual, relational, and somatic gratitude anchors in serene virtual nature.",
      icon: Compass,
      tag: "Planned",
      gradient: "from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotional Wellness Games" />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-indigo-950/50 border border-purple-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            {/* Ambient Background Glow Orbs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-bold tracking-wide">
                  <Gamepad2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>MindCare Wellness Arcade • 12 Active Modules</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Somatic Play & <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    Emotional Resilience
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Evidence-based mini-games grounded in Cognitive Behavioral Therapy (CBT),
                  Acceptance and Commitment Therapy (ACT), Polyvagal Theory, and Heart Rate
                  Variability (HRV) biofeedback.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleSurpriseMe}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transform active:scale-95 transition"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Quick Play (Surprise Me)</span>
                  </button>

                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero Streak Anxiety • Equal Emotional Validity</span>
                  </div>
                </div>
              </div>

              {/* Quick Suite Highlights */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 lg:w-72">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Experiences</span>
                  </div>
                  <p className="text-2xl font-black text-white">12 Games</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Across 6 Modalities</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Clinical</span>
                  </div>
                  <p className="text-2xl font-black text-white">5 Frameworks</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">CBT • ACT • HRV • Polyvagal</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <Sparkle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Rewards</span>
                  </div>
                  <p className="text-2xl font-black text-white">+10 XP</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Per Activity Completed</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-sky-400 mb-1">
                    <Moon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Privacy</span>
                  </div>
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Confidential & Non-Diag</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Career & Level Tracker (when logged in) */}
          {user && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Player Profile: {user.full_name || user.username}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                      Level {user.level || 1} Explorer
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accumulated {user.xp || 0} XP across your wellness journey. No streak loss, ever.
                  </p>
                </div>
              </div>

              {history && history.total_sessions > 0 ? (
                <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Investigations
                    </span>
                    <p className="text-sm font-extrabold text-white">
                      {history.total_sessions} session{history.total_sessions > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      High Score
                    </span>
                    <p className="text-sm font-extrabold text-amber-400">{history.high_score} pts</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Arcade Total
                    </span>
                    <p className="text-sm font-extrabold text-purple-400">{history.total_score} pts</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Choose any module below to start building your emotional toolkit.</span>
                </div>
              )}
            </div>
          )}

          {/* Featured Spotlight Card */}
          {activeSpotlight && (
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 hover:border-slate-700 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Spotlight Experience
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Est. {activeSpotlight.duration}
                    </span>
                    <button
                      onClick={handleNextSpotlight}
                      className="text-xs text-slate-400 hover:text-purple-300 underline font-medium transition"
                    >
                      Cycle spotlight
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">{activeSpotlight.emoji}</span>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {activeSpotlight.title}
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold">{activeSpotlight.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeSpotlight.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {activeSpotlight.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/60 text-xs font-medium">
                      Basis: {activeSpotlight.clinicalBasis}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                  <Link
                    href={activeSpotlight.href}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transform active:scale-95 transition"
                  >
                    <span>Launch {activeSpotlight.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <span className="text-[11px] text-center text-slate-400 font-medium">
                    {user ? `Awards ${activeSpotlight.xpInfo}` : "Guest demo ready"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Navigation: Search & Category Pills */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games by title, CBT, HRV, panic, sleep..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Counter Indicator */}
              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span>Showing</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold">
                  {filteredGames.length} of {ALL_GAMES.length}
                </span>
                <span>experiences</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count =
                  cat === "All Games"
                    ? ALL_GAMES.length
                    : ALL_GAMES.filter((g) => g.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* High-Density Responsive Game Grid */}
          {filteredGames.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No matching games found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or reset category filter.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Games");
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className={`group relative flex flex-col justify-between rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm hover:shadow-2xl hover:border-slate-700 transition-all duration-300 ${game.accentBorder}`}
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${game.iconBg}`}
                        >
                          {game.emoji}
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${game.badgeColor}`}
                          >
                            {game.category}
                          </span>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {game.difficulty}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{game.duration}</span>
                      </div>
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {game.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {game.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {game.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {game.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-medium">
                          +{game.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      {game.xpInfo}
                    </span>

                    <Link
                      href={game.href}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-purple-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all group-hover:bg-purple-600 shadow-sm"
                    >
                      <span>Play Now</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Mini-Games Shelf (R&D Lab) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Upcoming MindCare R&D Modules
                </h2>
                <p className="text-xs text-slate-400">
                  Experiential clinical gamification prototypes in active development
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingGames.map((game, i) => {
                const Icon = game.icon;
                return (
                  <div
                    key={i}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 opacity-80 hover:opacity-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${game.gradient}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {game.tag}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-white">{game.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{game.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Integrity & Ethical Standards Footer Banner */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MindCare Clinical Gaming Pledge</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Zero Streak Anxiety</span>
                <p>Missing days never penalizes progress or kills plants. Engage when you need it.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Equal Recognition</span>
                <p>Sorrow, anger, and anxiety check-ins are valued with the same care as joy.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Non-Diagnostic Space</span>
                <p>All scores reflect engagement and learning practice, never a psychiatric diagnosis.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Confidential by Design</span>
                <p>Reflections and session choices remain strictly private and accessible only to you.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
