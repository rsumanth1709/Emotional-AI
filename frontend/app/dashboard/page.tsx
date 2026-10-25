"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { dashboardAPI, memoryAPI } from "@/lib/axios";
import type { DashboardData } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import MindCareLoading from "@/components/ui/MindCareLoading";
import MoodCard from "@/components/dashboard/MoodCard";
import EmotionPieChart from "@/components/dashboard/EmotionPieChart";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrend";
import { Activity, Smile, TrendingUp, AlertCircle, Quote } from "lucide-react";
import { getEmotionEmoji } from "@/lib/utils";
import GamificationStats from "@/components/dashboard/GamificationStats";
import RecommendationWidget from "@/components/dashboard/RecommendationWidget";

const WELLNESS_TIPS = [
  "Take 3 deep box breaths right now: In for 4s, Hold for 4s, Out for 4s.",
  "Hydrate! Drinking water helps regulate bodily stress responses.",
  "Consider stepping outside for a brief 5-minute walk to reset.",
  "If feeling overwhelmed, write down 3 things you are grateful for today.",
  "Remember: thoughts are not facts. Be gentle with yourself.",
];

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [res, memRes] = await Promise.all([
          dashboardAPI.getDashboard(),
          memoryAPI.getMemories()
        ]);
        setData(res.data);
        setMemories(memRes.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchDashboard();
      setTip(WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]);
    }
  }, [user]);

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Delete this memory?")) return;
    try {
      await memoryAPI.deleteMemory(id);
      setMemories(memories.filter((m) => m.id !== id));
    } catch (err) {
      alert("Failed to delete memory");
    }
  };

  const handleClearAllMemories = async () => {
    if (!confirm("Clear ALL memories?")) return;
    try {
      await memoryAPI.deleteAllMemories();
      setMemories([]);
    } catch (err) {
      alert("Failed to clear memories");
    }
  };

  if (authLoading || loading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Dashboard" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Hello, {user.full_name || user.username}</h2>
              <p className="text-slate-400 text-sm mt-1">Here is a snapshot of your emotional landscape today.</p>
            </div>
            {data?.today_emotion && (
              <div className="px-4 py-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold flex items-center gap-2">
                <span>Today&apos;s Dominant Emotion:</span>
                <span className="text-lg">{getEmotionEmoji(data.today_emotion)}</span>
                <span>{data.today_emotion}</span>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MoodCard
              title="Mental Wellness"
              value={`${data?.stats.mental_wellness_score.toFixed(0) ?? 70}%`}
              subtitle="Wellness index based on logs"
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              bgColor="bg-emerald-500/10 border-emerald-500/20"
            />
            <MoodCard
              title="Current Stress"
              value={`${data?.stats.current_stress_level.toFixed(1) ?? 3.0}/10`}
              subtitle="Stress level mapping"
              icon={<AlertCircle className="w-5 h-5 text-pink-400" />}
              bgColor="bg-pink-500/10 border-pink-500/20"
            />
            <MoodCard
              title="Top Emotion"
              value={data?.stats.most_frequent_emotion || "Neutral"}
              subtitle="Most frequent this week"
              icon={<Smile className="w-5 h-5 text-violet-400" />}
              bgColor="bg-violet-500/10 border-violet-500/20"
            />
            <MoodCard
              title="Total Check-ins"
              value={data?.stats.total_chats ?? 0}
              subtitle="Interactions with MindCare"
              icon={<Activity className="w-5 h-5 text-indigo-400" />}
              bgColor="bg-indigo-500/10 border-indigo-500/20"
            />
          </div>

          {/* Daily Tip Widget */}
          <div className="glass p-6 flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-teal-300">Daily Wellness Check-in Tip</h4>
              <p className="text-slate-400 text-xs mt-0.5">{tip}</p>
            </div>
          </div>

          {/* Gamification progress, challenges, badges */}
          <GamificationStats />

          {/* AI Personalized Recommendations Widget */}
          <RecommendationWidget />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data && <EmotionPieChart data={data.emotion_distribution} />}
            {data && <WeeklyChart data={data.weekly_mood} />}
          </div>

          {data && <MonthlyTrendChart data={data.monthly_trend} />}

          {/* Memory Center */}
          <div className="glass p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Memory Center
              </h3>
              {memories.length > 0 && (
                <button
                  onClick={handleClearAllMemories}
                  className="text-xs px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition"
                >
                  Clear All
                </button>
              )}
            </div>
            {memories.length === 0 ? (
              <p className="text-slate-400 text-sm">MindCare AI hasn't memorized any facts yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {memories.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-900/50 rounded-lg flex justify-between items-start border border-slate-700/50">
                    <div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'} mb-2 inline-block`}>
                        {m.role}
                      </span>
                      <p className="text-sm text-slate-300">{m.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-slate-500 hover:text-red-400 transition ml-4"
                      title="Delete memory"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
