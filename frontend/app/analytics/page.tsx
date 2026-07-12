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
import { BarChart, Heart, RefreshCw, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Average Stress</span>
                  <p className="text-2xl font-bold text-white">{data.avg_stress.toFixed(1)}/10</p>
                </div>
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Dominant Mood</span>
                  <p className="text-2xl font-bold text-violet-400">{data.most_frequent_emotion}</p>
                </div>
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Calculated Mood Score</span>
                  <p className="text-2xl font-bold text-emerald-400">{data.avg_mood.toFixed(1)}/10</p>
                </div>
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Active Sessions</span>
                  <p className="text-2xl font-bold text-white">{data.total_sessions}</p>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EmotionPieChart data={data.emotion_distribution} />
                <WeeklyChart data={data.weekly_mood} />
              </div>

              <MonthlyTrendChart data={data.monthly_trend} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
