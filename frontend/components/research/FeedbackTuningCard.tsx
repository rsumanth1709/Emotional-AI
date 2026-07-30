"use client";

import React, { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Sliders, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type { UserPreferencesResponse } from "@/types";
import { toast } from "react-hot-toast";

export default function FeedbackTuningCard() {
  const [prefs, setPrefs] = useState<UserPreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await researchAPI.getUserPreferences();
      setPrefs(res.data);
    } catch {
      toast.error("Failed to load user preferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const handleVote = async (categoryTag: string, rating: number) => {
    setSubmitting(true);
    try {
      await researchAPI.submitFeedback({
        item_type: "recommendation",
        rating,
        category_tag: categoryTag,
        feedback_text: rating > 0 ? "Helpful intervention" : "Not suitable for my mood",
      });
      toast.success(`Feedback recorded for ${categoryTag}!`);
      fetchPrefs();
    } catch {
      toast.error("Failed to record feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm">Calculating Dynamic User Affinity Multipliers...</p>
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="glass p-6 space-y-6 border border-violet-500/20 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Personalized Fine-Tuning & Feedback Loop</h3>
            <p className="text-xs text-slate-400">RLHF-style preference optimization via user thumbs up/down logs</p>
          </div>
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Total Feedbacks Logged</span>
          <span className="text-2xl font-extrabold text-white">{prefs.total_feedback_count} Logged</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Positive Satisfaction</span>
          <span className="text-2xl font-extrabold text-emerald-400">{prefs.positive_rate_pct}%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Top Affinity Category</span>
          <span className="text-sm font-bold text-amber-300 truncate block">
            {prefs.preferred_categories.join(", ")}
          </span>
        </div>
      </div>

      {/* Interactive Voting Test Bench */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <h4 className="font-bold text-xs text-white uppercase tracking-wider">Interactive Category Preference Tuning</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {["Music", "Breathing", "CBT Reframe", "Journaling"].map((cat) => {
            const mult = prefs.affinity_multipliers[cat] || 1.0;
            return (
              <div key={cat} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{cat}</span>
                  <span className="text-xs font-bold text-amber-400">{mult}x</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleVote(cat, 1)}
                    disabled={submitting}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 border border-emerald-500/20"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Up</span>
                  </button>

                  <button
                    onClick={() => handleVote(cat, -1)}
                    disabled={submitting}
                    className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-1 border border-red-500/20"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Down</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
