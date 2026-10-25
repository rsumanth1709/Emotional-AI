"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { goalAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { getEmotionEmoji } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  Target, CheckSquare, Square, Sparkles, AlertCircle,
  TrendingUp, Calendar, RefreshCw, Zap, Award, CheckCircle2,
  ChevronRight, Layers, ShieldCheck, Activity, Flame, Trash2
} from "lucide-react";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function GoalsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await goalAPI.getGoals();
      setGoals(res.data);
      setSelectedIds([]);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSelectGoal = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllHistory = () => {
    const historyIds = goals.slice(1).map((g) => g.id);
    if (selectedIds.length === historyIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historyIds);
    }
  };

  const handleDeleteSingleGoal = async (id: string) => {
    if (!confirm("Delete this goal from history?")) return;
    try {
      await goalAPI.deleteGoal(id);
      toast.success("Goal deleted!");
      await fetchGoals();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected goals?`)) return;
    try {
      const res = await goalAPI.deleteSelectedGoals(selectedIds);
      toast.success(`Deleted ${res.data.deleted_count} selected goals!`);
      await fetchGoals();
    } catch {
      toast.error("Failed to delete selected goals");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user, fetchGoals]);

  const handleGenerateGoal = async (emotionOverride?: string) => {
    setGenerating(true);
    try {
      await goalAPI.generateGoal(emotionOverride ? { emotion_override: emotionOverride } : {});
      toast.success("New personalized wellness goal generated!", { icon: "🎯" });
      await fetchGoals();
    } catch {
      toast.error("Failed to generate goal");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    setTogglingId(milestoneId);
    try {
      const res = await goalAPI.toggleMilestone(milestoneId);
      const data = res.data;
      if (data.completed) {
        toast.success("Milestone completed!", { icon: "✅" });
      }
      await fetchGoals();
    } catch {
      toast.error("Failed to update milestone");
    } finally {
      setTogglingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your past completed goal history? Active goals will be kept.")) return;
    try {
      const res = await goalAPI.clearHistory();
      toast.success(`Cleared ${res.data.cleared_count} past goals from history!`, { icon: "🧹" });
      await fetchGoals();
    } catch {
      toast.error("Failed to clear goal history");
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const activeGoal = goals.find((g) => g.status === "active") || goals[0];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Goal Planner" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-violet-500/20 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Emotionally-Adaptive Goal Generation
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">AI Mental Wellness Goal Planner</h2>
              <p className="text-slate-400 text-xs mt-1">
                Personalized 4-week wellness goals, weekly action plan milestones, progress monitoring, and automatic emotional trend adjustments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold block sm:inline mr-1">Progression Category:</span>
              {["Anxiety", "Stress", "Sad", "Lonely", "Neutral"].map((emo) => (
                <button
                  key={emo}
                  onClick={() => handleGenerateGoal(emo)}
                  disabled={generating}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-violet-600/30 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>{emo}</span>
                </button>
              ))}
              <button
                onClick={() => handleGenerateGoal()}
                disabled={generating}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 ml-1"
              >
                {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Auto Generate</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="glass p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm">Synthesizing personalized action plans…</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="glass p-12 text-center space-y-4">
              <Target className="w-12 h-12 text-violet-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">No active goals yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Generate your first personalized 4-week wellness action plan tailored to your emotional trends.
              </p>
              <button
                onClick={() => handleGenerateGoal()}
                className="btn-primary py-2.5 px-6 text-xs font-bold"
              >
                Generate First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Goal Spotlight Card */}
              {activeGoal && (
                <div className="glass p-6 md:p-8 space-y-6 border border-violet-500/30 rounded-3xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {activeGoal.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          {getEmotionEmoji(activeGoal.target_emotion)}
                          <span className="capitalize">{activeGoal.target_emotion} Context</span>
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-white">{activeGoal.title}</h3>
                      <p className="text-xs text-slate-400">{activeGoal.description}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-3xl font-black text-emerald-400">{activeGoal.completion_percentage}%</span>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Completion</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Action Plan Progress</span>
                      <span className="text-emerald-300">{activeGoal.completion_percentage}% Completed</span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-700 rounded-full"
                        style={{ width: `${activeGoal.completion_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Motivational Feedback Banner */}
                  <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-500/20 text-xs text-violet-200 flex items-center gap-3">
                    <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{activeGoal.motivational_feedback}</span>
                  </div>

                  {/* Auto-Adjustment Notification */}
                  {activeGoal.auto_adjusted && (
                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">Automatic Trend Adjustment Triggered</span>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">{activeGoal.adjustment_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Weekly Milestone Action Plan Checklist */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-cyan-400" /> Weekly Milestone Action Plan
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeGoal.milestones.map((m: any) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(m.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            m.completed
                              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <button className="mt-0.5 text-emerald-400 focus:outline-none">
                            {m.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                                Week {m.week_number}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                                {m.target_frequency}
                              </span>
                            </div>
                            <h5 className={`text-xs font-bold ${m.completed ? "line-through text-slate-500" : "text-white"}`}>
                              {m.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 leading-snug">{m.action_item}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Goals History List */}
              {goals.length > 1 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === goals.length - 1 && goals.length > 1}
                        onChange={toggleSelectAllHistory}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500 cursor-pointer"
                      />
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Goal History ({goals.length - 1}) {selectedIds.length > 0 && `• ${selectedIds.length} Selected`}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedIds.length > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedIds.length})</span>
                        </button>
                      )}

                      <button
                        onClick={handleClearHistory}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All History</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.slice(1).map((g) => {
                      const isSelected = selectedIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          className={`p-4 rounded-2xl border transition-all space-y-2 text-xs relative ${
                            isSelected
                              ? "bg-violet-950/20 border-violet-500/50"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectGoal(g.id)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500 cursor-pointer"
                              />
                              <span className="font-bold text-white truncate">{g.title}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-extrabold text-emerald-400">{g.completion_percentage}%</span>
                              <button
                                onClick={() => handleDeleteSingleGoal(g.id)}
                                className="p-1 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Delete this goal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-400 text-[11px] leading-snug pl-6">{g.description}</p>
                          <div className="flex justify-between text-[10px] text-slate-500 pl-6 pt-1">
                            <span>Target: {g.target_date}</span>
                            <span className="capitalize text-violet-300 font-semibold">{g.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
