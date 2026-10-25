"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { habitAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { getEmotionEmoji } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  Flame, CheckCircle2, Circle, Plus, Trash2, Sparkles, RefreshCw,
  TrendingDown, TrendingUp, Activity, Brain, Droplets, Moon, Sun,
  Heart, MessageSquare, Wind, Clock, ShieldCheck, Award, X, Zap
} from "lucide-react";
import MindCareLoading from "@/components/ui/MindCareLoading";

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bgCol: string; textCol: string; borderCol: string }> = {
  mindfulness: { label: "Mindfulness", icon: Brain, color: "from-violet-500 to-purple-500", bgCol: "bg-violet-500/10", textCol: "text-violet-400", borderCol: "border-violet-500/30" },
  physical: { label: "Physical Health", icon: Activity, color: "from-cyan-500 to-blue-500", bgCol: "bg-cyan-500/10", textCol: "text-cyan-400", borderCol: "border-cyan-500/30" },
  sleep: { label: "Sleep & Rest", icon: Moon, color: "from-indigo-500 to-blue-600", bgCol: "bg-indigo-500/10", textCol: "text-indigo-400", borderCol: "border-indigo-500/30" },
  social: { label: "Social Belonging", icon: MessageSquare, color: "from-rose-500 to-pink-500", bgCol: "bg-rose-500/10", textCol: "text-rose-400", borderCol: "border-rose-500/30" },
  gratitude: { label: "Gratitude & Joy", icon: Sparkles, color: "from-amber-500 to-orange-500", bgCol: "bg-amber-500/10", textCol: "text-amber-400", borderCol: "border-amber-500/30" },
  custom: { label: "Custom Habit", icon: Zap, color: "from-teal-500 to-emerald-500", bgCol: "bg-teal-500/10", textCol: "text-teal-400", borderCol: "border-teal-500/30" },
};

export default function HabitsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [habitsData, setHabitsData] = useState<{
    habits: any[];
    ai_suggestions: any[];
    correlations: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("mindfulness");
  const [targetEmotion, setTargetEmotion] = useState("Neutral");
  const [submitting, setSubmitting] = useState(false);

  const fetchHabits = useCallback(async (retries = 2) => {
    setLoading(true);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await habitAPI.getHabits();
        setHabitsData(res.data);
        setLoading(false);
        return;
      } catch {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800));
        } else {
          toast.error("Failed to load habit tracker data");
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchHabits();
  }, [user, fetchHabits]);

  const handleToggleCompletion = async (habitId: string) => {
    setTogglingId(habitId);
    try {
      const res = await habitAPI.toggleCompletion(habitId);
      const data = res.data;
      if (data.completed) {
        toast.success(`Habit completed! 🔥 ${data.current_streak} Day Streak`, { icon: "✅" });
      }
      await fetchHabits();
    } catch {
      toast.error("Failed to update habit log");
    } finally {
      setTogglingId(null);
    }
  };

  const handleAdoptSuggestion = async (suggestion: any) => {
    try {
      await habitAPI.createHabit({
        title: suggestion.title,
        category: suggestion.category,
        target_emotion: suggestion.target_emotion,
        icon_name: suggestion.icon_name,
        frequency: "daily",
      });
      toast.success(`Adopted AI Habit: ${suggestion.title}`, { icon: "✨" });
      await fetchHabits();
    } catch {
      toast.error("Failed to adopt habit");
    }
  };

  const handleCreateCustomHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a habit title");
      return;
    }
    setSubmitting(true);
    try {
      await habitAPI.createHabit({
        title,
        category,
        target_emotion: targetEmotion,
        frequency: "daily",
      });
      toast.success("New healthy habit created!", { icon: "🎯" });
      setShowForm(false);
      setTitle("");
      await fetchHabits();
    } catch {
      toast.error("Failed to create habit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    try {
      await habitAPI.deleteHabit(id);
      toast.success("Habit removed");
      await fetchHabits();
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  const getCategoryMeta = (cat: string) => {
    return CATEGORY_META[cat] || CATEGORY_META.mindfulness;
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const habits = habitsData?.habits || [];
  const suggestions = habitsData?.ai_suggestions || [];
  const correlations = habitsData?.correlations;

  const totalStreaks = habits.reduce((acc, h) => acc + h.current_streak, 0);

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Habit Tracker" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-violet-500/20 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Emotional Trend & Habit Intelligence
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">AI Healthy Habit Tracker</h2>
              <p className="text-slate-400 text-xs mt-1">
                Track daily healthy habits, display active completion streaks, correlate habit completions with emotional trends, and receive AI habit suggestions based on mood analysis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Healthy Habit</span>
              </button>
            </div>
          </div>

          {/* Emotional Correlation Analytics Summary Bar */}
          {correlations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Streak Power</span>
                <div className="text-2xl font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
                  <span>{totalStreaks} Days</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Across {habits.length} active habits</span>
              </div>

              <div className="glass p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stress Reduction</span>
                <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <TrendingDown className="w-6 h-6 text-emerald-400" />
                  <span>-{correlations.stress_reduction_pct}%</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Lower stress on habit completion days</span>
              </div>

              <div className="glass p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mood Lift Score</span>
                <div className="text-2xl font-extrabold text-cyan-400 flex items-center gap-1.5">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                  <span>+{correlations.mood_lift_score}/10</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Emotional vitality boost</span>
              </div>

              <div className="glass p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Habit Stress Avg</span>
                <div className="text-2xl font-extrabold text-violet-400">
                  {correlations.average_stress_on_habit_days}/10
                </div>
                <span className="text-[10px] text-slate-500 block">vs {correlations.average_stress_on_missed_days}/10 on missed days</span>
              </div>
            </div>
          )}

          {/* Intelligent AI Habit Suggestions based on Mood Analysis */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Recommended Habits Based on Mood Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((s, idx) => {
                  const meta = getCategoryMeta(s.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={idx}
                      className="glass p-5 rounded-3xl border border-violet-500/30 flex items-start justify-between gap-4 relative overflow-hidden bg-slate-900/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl border ${meta.bgCol} ${meta.textCol} ${meta.borderCol}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bgCol} ${meta.textCol} ${meta.borderCol}`}>
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-violet-300 font-semibold flex items-center gap-1">
                              {getEmotionEmoji(s.dominant_emotion_trigger)}
                              <span>Target: {s.dominant_emotion_trigger}</span>
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{s.title}</h4>
                          <p className="text-xs text-slate-400 leading-snug">{s.reason}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdoptSuggestion(s)}
                        className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adopt</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Healthy Habits Matrix */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Healthy Habits ({habits.length})
              </h3>
              <button
                onClick={() => fetchHabits()}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="glass p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <p className="text-xs">Evaluating habit streaks & emotional correlations...</p>
              </div>
            ) : habits.length === 0 ? (
              <div className="glass p-8 text-center space-y-3">
                <Flame className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Active Habits Tracked</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Adopt" on AI recommendations above or press "New Healthy Habit" to start building your streak!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((h) => {
                  const meta = getCategoryMeta(h.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={h.id}
                      className="glass p-5 rounded-3xl border border-slate-800/80 hover:border-violet-500/40 transition-all space-y-4 relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleCompletion(h.id)}
                            disabled={togglingId === h.id}
                            className="mt-1 focus:outline-none transition-transform active:scale-95"
                          >
                            {h.completed_today ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bgCol} ${meta.textCol} ${meta.borderCol}`}>
                                {meta.label}
                              </span>
                              {h.target_emotion && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                  {getEmotionEmoji(h.target_emotion)}
                                  <span>{h.target_emotion}</span>
                                </span>
                              )}
                            </div>
                            <h4 className={`text-sm font-bold ${h.completed_today ? "line-through text-slate-400" : "text-white"}`}>
                              {h.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-extrabold">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>{h.current_streak}d Streak</span>
                          </div>

                          <button
                            onClick={() => handleDeleteHabit(h.id)}
                            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Habit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 7-Day Completion Heatmap Row */}
                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last 7 Days</span>
                        <div className="flex items-center gap-1.5">
                          {h.last_7_days.map((d: any, idx: number) => (
                            <div
                              key={idx}
                              title={`${d.day_name} (${d.date}): ${d.completed ? "Completed" : "Missed"}`}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                                d.completed
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
                                  : "bg-slate-900 border border-slate-800 text-slate-600"
                              }`}
                            >
                              {d.day_name[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Modal for Creating Custom Habit */}
          {showForm && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass max-w-md w-full p-6 md:p-8 rounded-3xl border border-violet-500/30 space-y-6 relative">
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Create Custom Healthy Habit</h3>
                  <p className="text-xs text-slate-400">Track a new wellness routine and build your streak.</p>
                </div>

                <form onSubmit={handleCreateCustomHabit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Habit Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 15-Min Evening Journal, 10k Steps"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="mindfulness">Mindfulness & Mental Reset</option>
                      <option value="physical">Physical Health & Exercise</option>
                      <option value="sleep">Sleep & Rest Protocol</option>
                      <option value="social">Social Belonging & Connection</option>
                      <option value="gratitude">Gratitude & Positive Reflection</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Target Emotional State</label>
                    <select
                      value={targetEmotion}
                      onChange={(e) => setTargetEmotion(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="Anxiety">Anxiety</option>
                      <option value="Stress">Stress</option>
                      <option value="Sad">Sadness</option>
                      <option value="Lonely">Loneliness</option>
                      <option value="Neutral">Neutral / General Balance</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Create Healthy Habit</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
