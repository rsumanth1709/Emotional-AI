"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar, Flame, TrendingUp, Heart, Sparkles, RefreshCw,
  Award, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { journalAPI } from "@/lib/axios";
import type { MonthlyInsightsData } from "@/types";
import { toast } from "react-hot-toast";

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#10b981",
  Excited: "#06b6d4",
  Hopeful: "#3b82f6",
  Sad: "#8b5cf6",
  Lonely: "#6366f1",
  Angry: "#ef4444",
  Fear: "#f97316",
  Anxiety: "#ec4899",
  Stress: "#eab308",
  Neutral: "#94a3b8",
};

export default function MonthlyInsightsView() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [data, setData] = useState<MonthlyInsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await journalAPI.getMonthlyInsights(year, month);
      setData(res.data);
    } catch {
      toast.error("Failed to load monthly insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm font-medium">Computing monthly emotional analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span>Monthly Emotional Insights</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deep AI analytics and monthly retrospective for {monthName} {year}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-200 min-w-[120px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Entries Logged</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">{data.total_entries}</h4>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Active Streak</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">{data.current_streak} days</h4>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Avg Mood Score</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5">{data.avg_mood_score} / 10</h4>
          </div>
        </div>

        <div className="glass p-5 flex items-center gap-4 border-l-4 border-l-cyan-500">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Dominant Emotion</p>
            <h4 className="text-xl font-extrabold text-white mt-0.5 capitalize">{data.dominant_emotion}</h4>
          </div>
        </div>
      </div>

      {/* AI Monthly Retrospective Card */}
      <div className="glass p-6 space-y-6 relative overflow-hidden border border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Monthly Retrospective</h3>
            <p className="text-xs text-slate-400">Synthesis of your monthly journaling journey</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {data.ai_retrospective}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Growth Highlights */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Growth Highlights</span>
            </h4>
            <ul className="space-y-2">
              {data.growth_highlights.map((h, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200">
                  ✨ {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Self-care Recommendations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Self-Care Recommendations</span>
            </h4>
            <ul className="space-y-2">
              {data.self_care_tips.map((tip, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200">
                  💡 {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Mood Score Timeline */}
        <div className="glass p-6 space-y-4 lg:col-span-2">
          <h3 className="font-bold text-white text-base">Daily Mood Progression</h3>
          <p className="text-xs text-slate-400">Average mood rating for each day recorded in {monthName}</p>

          <div className="h-64 w-full pt-4">
            {data.daily_timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No daily timeline entries for this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_timeline}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => val.split("-").slice(1).join("/")}
                  />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} / 10`, "Mood Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood_score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#moodGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Emotion Breakdown Distribution */}
        <div className="glass p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Emotion Distribution</h3>
          <p className="text-xs text-slate-400">Share of recorded feelings in {monthName}</p>

          <div className="h-64 w-full flex items-center justify-center">
            {data.emotion_distribution.length === 0 ? (
              <div className="text-slate-500 text-sm">No emotion records for this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.emotion_distribution}
                    dataKey="count"
                    nameKey="emotion"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ emotion, percentage }) => `${emotion} (${percentage}%)`}
                  >
                    {data.emotion_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EMOTION_COLORS[entry.emotion] || "#8b5cf6"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
