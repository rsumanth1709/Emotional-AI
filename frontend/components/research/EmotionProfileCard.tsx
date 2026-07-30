"use client";

import React, { useEffect, useState, useCallback } from "react";
import { researchAPI } from "@/lib/axios";
import { getEmotionEmoji } from "@/lib/utils";
import {
  Brain, ShieldCheck, Zap, Activity, Heart,
  Flame, Sparkles, Filter, RefreshCw, Layers,
  ChevronRight, Lock, MessageSquare, Target
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function EmotionProfileCard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await researchAPI.getEmotionProfile(periodDays);
      setProfile(res.data);
    } catch {
      toast.error("Failed to load Emotion Profile");
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm">Building Personalized Emotion Profile…</p>
      </div>
    );
  }

  if (!profile) return null;

  const {
    dominant_emotion,
    emotion_distribution,
    avg_stress_score,
    stability_metrics,
    recurring_triggers,
    communication_style,
    recommended_coping_strategies,
    privacy_guarantee
  } = profile;

  return (
    <div className="glass p-6 space-y-6 border border-violet-500/20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Personalized Emotion Profile</h3>
            <p className="text-xs text-slate-400">
              Long-term pattern learning · Trigger mining · Adaptive AI communication
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                periodDays === days
                  ? "bg-violet-600/30 text-violet-200 border-violet-500/40"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dominant State</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getEmotionEmoji(dominant_emotion)}</span>
            <span className="text-base font-extrabold text-white">{dominant_emotion}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stability Score</span>
          <div className="text-xl font-extrabold text-emerald-400">{stability_metrics?.stability_score}%</div>
          <span className="text-[10px] text-slate-500 block">Volatility: {stability_metrics?.volatility_index} σ</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resilience Index</span>
          <div className="text-xl font-extrabold text-cyan-400">{stability_metrics?.resilience_index}/100</div>
          <span className="text-[10px] text-slate-500 block">Recovery: {stability_metrics?.recovery_speed}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Stress Level</span>
          <div className="text-xl font-extrabold text-amber-400">{avg_stress_score}/10</div>
          <span className="text-[10px] text-slate-500 block">Based on {profile.total_interactions} sessions</span>
        </div>
      </div>

      {/* 2-Column Section: Triggers & Adaptive AI Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Emotional Triggers */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            Recurring Emotional Triggers Mined
          </h4>

          <div className="space-y-2">
            {recurring_triggers && recurring_triggers.length > 0 ? (
              recurring_triggers.map((trig: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="font-bold text-white">{trig.trigger}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">{trig.category}</span>
                    <span className="font-bold text-rose-300">{trig.frequency}×</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No strong recurring triggers detected yet.</p>
            )}
          </div>
        </div>

        {/* Adaptive AI Communication Strategy */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-violet-500/20 space-y-3">
          <h4 className="font-bold text-xs text-violet-300 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            Adaptive AI Communication Strategy
          </h4>

          {communication_style && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-violet-950/30 border border-violet-500/20">
                <span className="text-slate-400">Recommended Tone:</span>
                <span className="font-bold text-violet-200">{communication_style.recommended_tone}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Conversation Pace:</span>
                <span className="font-semibold text-white">{communication_style.pace}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Empathy Level:</span>
                <span className="font-semibold text-emerald-400">{communication_style.empathy_level}</span>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1 leading-relaxed">
                "{communication_style.instruction}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Coping Strategies */}
      {recommended_coping_strategies && recommended_coping_strategies.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Personalized Coping Strategies (Knowledge Graph Adapted)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recommended_coping_strategies.map((strat: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-white block truncate">{strat.strategy}</span>
                <span className="text-[10px] text-emerald-300 font-semibold block">Efficacy: {strat.efficacy_score}%</span>
                <span className="text-[10px] text-slate-400 block truncate">Outcome: {strat.expected_outcome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Guarantee Footer */}
      <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 font-medium">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{privacy_guarantee}</span>
      </div>
    </div>
  );
}
