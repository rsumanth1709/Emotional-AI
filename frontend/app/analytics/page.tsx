"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { analyticsAPI } from "@/lib/axios";
import type { AnalyticsData } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import EmotionPieChart from "@/components/dashboard/EmotionPieChart";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrend";
import HourlyTimelineChart from "@/components/dashboard/HourlyTimelineChart";
import EmotionRadarChart from "@/components/dashboard/EmotionRadarChart";
import CalendarHeatmap from "@/components/dashboard/CalendarHeatmap";
import PredictiveForecastCard from "@/components/dashboard/PredictiveForecastCard";
import { 
  Heart, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Percent, 
  Zap, 
  AlertCircle,
  Sparkles 
} from "lucide-react";
import { getEmotionEmoji } from "@/lib/utils";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hourly" | "weekly" | "monthly" | "heatmap" | "predictive">("hourly");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getAnalytics();
      setData(res.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Aggregating mood tracking charts...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Mood & Emotion Analytics" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Visual Analytics</h2>
              <p className="text-slate-400 text-sm mt-1">Deep analytics on your emotional distribution and wellness trends.</p>
            </div>
            <button 
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-50 transition-all"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Analyzing logs history...</div>
          ) : !data ? (
            <div className="text-slate-500 text-sm">Failed to load analytics logs.</div>
          ) : (
            <div className="space-y-8">
              {/* Stats overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                
                {/* Average Stress */}
                <div className="glass p-6 space-y-1 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertCircle className="w-12 h-12 text-pink-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Average Stress</span>
                  <p className="text-2xl font-bold text-white">{data.avg_stress.toFixed(1)}/10</p>
                  <p className="text-[10px] text-slate-500 mt-1">Lower is better</p>
                </div>

                {/* Dominant Mood */}
                <div className="glass p-6 space-y-1 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Heart className="w-12 h-12 text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Dominant Mood</span>
                  <p className="text-2xl font-bold text-violet-400 flex items-center gap-1.5">
                    {data.most_frequent_emotion} <span>{getEmotionEmoji(data.most_frequent_emotion)}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Most logged emotional state</p>
                </div>

                {/* Mood Score & Volatility */}
                <div className="glass p-6 space-y-1 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-12 h-12 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Calculated Mood</span>
                  <p className="text-2xl font-bold text-emerald-400">{data.avg_mood.toFixed(1)}/10</p>
                  <p className="text-[10px] text-slate-500 mt-1">Volatility: {data.volatility_score.toFixed(2)} σ</p>
                </div>

                {/* Improvement Score */}
                <div className="glass p-6 space-y-1 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    {data.improvement_score >= 0 ? (
                      <TrendingUp className="w-12 h-12 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-12 h-12 text-rose-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Weekly Progress</span>
                  <p className={`text-2xl font-bold flex items-center gap-1 ${data.improvement_score >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {data.improvement_score >= 0 ? "+" : ""}{data.improvement_score.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">vs Previous 7 days</p>
                </div>

                {/* Streak Tracker */}
                <div className="glass p-6 space-y-1 relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flame className="w-12 h-12 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Log Streak</span>
                  <p className="text-2xl font-bold text-orange-400 flex items-baseline gap-1">
                    {data.streak_stats.current_streak} <span className="text-xs text-slate-500 font-normal">days</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Longest: {data.streak_stats.longest_streak} days</p>
                </div>
              </div>

              {/* Dynamic Timeline Tab Selector */}
              <div className="space-y-4">
                <div className="flex border-b border-white/10 gap-6">
                  <button
                    onClick={() => setActiveTab("hourly")}
                    className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === "hourly"
                        ? "text-violet-400 border-violet-400"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    Daily Timeline (Hourly)
                  </button>
                  <button
                    onClick={() => setActiveTab("weekly")}
                    className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === "weekly"
                        ? "text-violet-400 border-violet-400"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    Weekly Trends
                  </button>
                  <button
                    onClick={() => setActiveTab("monthly")}
                    className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === "monthly"
                        ? "text-violet-400 border-violet-400"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    Monthly Trends
                  </button>
                  <button
                    onClick={() => setActiveTab("heatmap")}
                    className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === "heatmap"
                        ? "text-violet-400 border-violet-400"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    Mood Heatmap Calendar
                  </button>
                  <button
                    onClick={() => setActiveTab("predictive")}
                    className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === "predictive"
                        ? "text-violet-400 border-violet-400"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Predictive Forecast (LSTM)</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="transition-all duration-300">
                  {activeTab === "hourly" && <HourlyTimelineChart data={data.hourly_mood} />}
                  {activeTab === "weekly" && <WeeklyChart data={data.weekly_mood} />}
                  {activeTab === "monthly" && <MonthlyTrendChart data={data.monthly_trend} />}
                  {activeTab === "heatmap" && <CalendarHeatmap data={data.calendar_heatmap} />}
                  {activeTab === "predictive" && <PredictiveForecastCard />}
                </div>
              </div>

              {/* Detailed Distribution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EmotionPieChart data={data.emotion_distribution} />
                <EmotionRadarChart data={data.emotion_distribution} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
