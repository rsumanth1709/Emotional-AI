"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { recommendationAPI, researchAPI } from "@/lib/axios";
import type { RecommendationItem, RecommendationCategory, UserPreferencesResponse } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { getEmotionEmoji } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { 
  Sparkles, Brain, Music, Headphones, BookOpen, 
  Video, Wind, Activity, ExternalLink, Filter, Compass,
  ThumbsUp, ThumbsDown, Sliders, CheckCircle2, TrendingUp,
  BrainCircuit, ShieldCheck, RefreshCw, BarChart2
} from "lucide-react";

const EMOTION_OPTIONS = [
  { key: "Auto", label: "Auto (Detected Mood)", emoji: "✨" },
  { key: "Anxiety", label: "Anxiety", emoji: "🌿" },
  { key: "Stress", label: "Stress", emoji: "🫂" },
  { key: "Sad", label: "Sadness", emoji: "💙" },
  { key: "Lonely", label: "Loneliness", emoji: "🌧️" },
  { key: "Angry", label: "Frustration", emoji: "😤" },
  { key: "Fear", label: "Fear / Worry", emoji: "💛" },
  { key: "Happy", label: "Joy", emoji: "😊" },
  { key: "Hopeful", label: "Hopeful", emoji: "🌈" },
];

const MOOD_EFFECT_OPTIONS = [
  { key: "all", label: "All Target Effects" },
  { key: "soothe", label: "Soothe & Calm" },
  { key: "uplift", label: "Uplift & Healing" },
  { key: "ground", label: "Ground & Focus" },
  { key: "energize", label: "Energize & Empower" },
];

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function RecommendationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedEmotion, setSelectedEmotion] = useState<string>("Auto");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEffect, setSelectedEffect] = useState<string>("all");

  const [categories, setCategories] = useState<RecommendationCategory[]>([]);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [activeEmotionContext, setActiveEmotionContext] = useState<string>("Neutral");
  const [loading, setLoading] = useState<boolean>(true);

  // Fine-tuning state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<UserPreferencesResponse | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await recommendationAPI.getCategories();
        setCategories(res.data);
      } catch {
        // Fallback categories handled cleanly
      }
    };
    if (user) fetchCategories();
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await researchAPI.getFeedbackPreferences();
      setPreferences(res.data);
    } catch {
      // Preference load failure silently ignored
    }
  }, []);

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user, fetchPreferences]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedEmotion !== "Auto") params.emotion = selectedEmotion;
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (selectedEffect !== "all") params.mood_target = selectedEffect;

      const res = await recommendationAPI.getRecommendations(params);
      const recs = res.data.recommendations;
      setItems(recs);
      setActiveEmotionContext(res.data.emotion_context);

      // Fetch user's existing thumbs up/down ratings for these items
      if (recs.length > 0) {
        try {
          const itemIds = recs.map(i => i.id);
          const feedbackRes = await researchAPI.getItemFeedback(itemIds);
          setRatings(feedbackRes.data);
        } catch {
          // Ratings fetch error non-blocking
        }
      }
    } catch {
      // Safe catch
    } finally {
      setLoading(false);
    }
  }, [selectedEmotion, selectedCategory, selectedEffect]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user, fetchRecommendations]);

  // Handle Thumbs Up (+1) or Thumbs Down (-1) feedback click
  const handleRateItem = async (item: RecommendationItem, ratingValue: number) => {
    const currentRating = ratings[item.id];
    // Toggle off if already selected
    const newRating = currentRating === ratingValue ? 0 : ratingValue;

    setRatings(prev => ({ ...prev, [item.id]: newRating }));
    setRatingLoading(prev => ({ ...prev, [item.id]: true }));

    try {
      await researchAPI.submitFeedback({
        item_type: "recommendation",
        rating: newRating,
        item_id: item.id,
        category_tag: item.category,
        feedback_text: `User rated item "${item.title}" (${item.category}) with ${newRating > 0 ? "thumbs up" : "thumbs down"}`
      });

      if (newRating > 0) {
        toast.success(`Liked! Fine-tuning engine will recommend more ${item.category}.`, { icon: "👍" });
      } else if (newRating < 0) {
        toast.success(`Noted. Fine-tuning engine will reduce ${item.category} recommendations.`, { icon: "👎" });
      }

      // Refresh learned preferences & re-rank
      await fetchPreferences();
    } catch {
      // Revert on failure
      setRatings(prev => ({ ...prev, [item.id]: currentRating }));
      toast.error("Failed to record feedback");
    } finally {
      setRatingLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const getCategoryIcon = (catKey: string) => {
    switch (catKey.toLowerCase()) {
      case "meditation": return <Brain className="w-4 h-4 text-purple-400" />;
      case "music": return <Music className="w-4 h-4 text-blue-400" />;
      case "podcasts": return <Headphones className="w-4 h-4 text-cyan-400" />;
      case "books": return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case "videos": return <Video className="w-4 h-4 text-rose-400" />;
      case "breathing": return <Wind className="w-4 h-4 text-teal-400" />;
      case "yoga": return <Activity className="w-4 h-4 text-amber-400" />;
      default: return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  const getEffectColor = (effect: string) => {
    switch (effect.toLowerCase()) {
      case "soothe": return "bg-blue-500/10 border-blue-500/20 text-blue-300";
      case "uplift": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "ground": return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      case "energize": return "bg-rose-500/10 border-rose-500/20 text-rose-300";
      default: return "bg-slate-500/10 border-slate-500/20 text-slate-300";
    }
  };

  const getMultiplierBadge = (category: string) => {
    if (!preferences?.affinity_multipliers) return null;
    const mult = preferences.affinity_multipliers[category.toLowerCase()] ?? 1.0;
    if (mult >= 1.20) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title={`Fine-tuned boost: ${mult}x`}>
          +{Math.round((mult - 1) * 100)}% Boost
        </span>
      );
    } else if (mult <= 0.80) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30" title={`Fine-tuned reduction: ${mult}x`}>
          -{Math.round((1 - mult) * 100)}% Reduced
        </span>
      );
    }
    return null;
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Recommendation Engine" />

        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Emotionally-Adaptive Guidance
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Personalized Recommendations</h2>
              <p className="text-slate-400 text-xs mt-1">
                Curated meditations, relaxation music, podcasts, books, videos, breathing, and yoga matched to how you feel.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all ${
                  showPreferences
                    ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                    : "bg-slate-900 border-white/10 text-slate-300 hover:bg-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                <span>Fine-Tuned Profile</span>
                {preferences && preferences.total_feedback_count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                    {preferences.total_feedback_count}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-2xl text-xs font-semibold text-violet-300">
                <span>Active Context:</span>
                <span className="text-base">{getEmotionEmoji(activeEmotionContext)}</span>
                <span className="capitalize">{activeEmotionContext}</span>
              </div>
            </div>
          </div>

          {/* Fine-Tuned Preference Profile Dashboard Dropdown */}
          {showPreferences && preferences && (
            <div className="bg-slate-900/80 border border-violet-500/30 p-6 rounded-3xl space-y-5 backdrop-blur-md animate-fade-in">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Learned Preference Profile</h3>
                    <p className="text-xs text-slate-400">
                      Online fine-tuning model adapts category weights in real time based on your 👍 / 👎 ratings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Model Status</span>
                    <span className="font-bold text-emerald-400 capitalize">{preferences.learning_status.replace("_", " ")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Confidence</span>
                    <span className="font-bold text-cyan-300">{preferences.model_confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Total Feedback Logged</span>
                  <span className="text-xl font-bold text-white">{preferences.total_feedback_count}</span>
                  <div className="flex gap-2 text-[10px] text-slate-500 pt-1">
                    <span className="text-emerald-400 font-semibold">👍 {preferences.positive_count}</span>
                    <span className="text-rose-400 font-semibold">👎 {preferences.negative_count}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Satisfaction Rate</span>
                  <span className="text-xl font-bold text-emerald-400">{preferences.positive_rate_pct}%</span>
                  <span className="text-[10px] text-slate-500 block">positive interaction ratio</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1.5 col-span-2">
                  <span className="text-slate-400 block text-[10px]">Category Affinity Multipliers</span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {Object.entries(preferences.affinity_multipliers).map(([cat, mult]) => {
                      const isBoosted = mult >= 1.20;
                      const isSuppressed = mult <= 0.80;
                      return (
                        <div
                          key={cat}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 capitalize ${
                            isBoosted
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : isSuppressed
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                              : "bg-slate-900 border-white/10 text-slate-400"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="font-mono text-[10px] opacity-80">{mult}x</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emotion Selector Toolbar */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Select Feeling State</span>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map((opt) => {
                const isSelected = selectedEmotion === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedEmotion(opt.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                        : "bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Effect Filters Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-white/5">
            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedCategory === "all"
                    ? "bg-white/15 border-white/20 text-white"
                    : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all capitalize ${
                    selectedCategory === cat.key
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {getCategoryIcon(cat.key)}
                  <span>{cat.label}</span>
                  {getMultiplierBadge(cat.key)}
                </button>
              ))}
            </div>

            {/* Target Mood Effect Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedEffect}
                onChange={(e) => setSelectedEffect(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {MOOD_EFFECT_OPTIONS.map((eff) => (
                  <option key={eff.key} value={eff.key}>
                    {eff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recommendations Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 h-56 animate-pulse space-y-4">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-6 bg-white/10 rounded w-3/4"></div>
                  <div className="h-16 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No matches found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try switching categories or selecting a different feeling state filter above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const itemRating = ratings[item.id] || 0;
                const isLoadingRating = ratingLoading[item.id];
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/40 border border-white/5 hover:border-violet-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white flex items-center gap-1.5 capitalize">
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </span>
                          {getMultiplierBadge(item.category)}
                        </div>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.duration}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{item.author}</p>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${getEffectColor(item.mood_effect)}`}>
                          {item.mood_effect}
                        </span>

                        {/* Thumbs Up / Thumbs Down Fine-Tuning Controls */}
                        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => handleRateItem(item, 1)}
                            disabled={isLoadingRating}
                            title="Fine-tune: Recommend more like this"
                            className={`p-1.5 rounded-lg transition-all ${
                              itemRating === 1
                                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-white/5"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRateItem(item, -1)}
                            disabled={isLoadingRating}
                            title="Fine-tune: Recommend less like this"
                            className={`p-1.5 rounded-lg transition-all ${
                              itemRating === -1
                                ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                                : "text-slate-400 hover:text-rose-400 hover:bg-white/5"
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <span>Explore</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
