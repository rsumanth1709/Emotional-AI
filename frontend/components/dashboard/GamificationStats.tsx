"use client";

import { useEffect, useState } from "react";
import { wellnessAPI } from "@/lib/axios";
import type { GamificationSummary } from "@/types";
import { Award, Flame, CheckCircle, Circle, Trophy, Star } from "lucide-react";

export default function GamificationStats() {
  const [data, setData] = useState<GamificationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await wellnessAPI.getGamification();
        setData(res.data);
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-white/10 rounded-lg w-1/3"></div>
        <div className="h-20 bg-white/5 rounded-2xl"></div>
        <div className="h-40 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (!data) return null;

  // Level progress math
  const currentLevelBase = (data.level - 1) * 200;
  const currentLevelXP = data.xp - currentLevelBase;
  const progressPercent = data.level_progress_percentage;

  // Badge list setup: Show unlocked, show others as locked
  const badgeMilestones = [
    { name: "First Step", desc: "Sent your first support chat message", type: "chat" },
    { name: "Breathe Easy", desc: "Completed your first deep breathing exercise", type: "meditation" },
    { name: "Scribe", desc: "Logged your first gratitude journal entry", type: "journal" },
    { name: "Hydration Hero", desc: "Reached your daily target of 2000ml water logged", type: "water" },
    { name: "Zen Master", desc: "Completed 5 deep breathing sessions", type: "meditation" },
    { name: "Streak Starter", desc: "Maintained a 3-day wellness streak", type: "streak" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── Level & Streak Panel ────────────────────────────────────────── */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Wellness Rank</span>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Level {data.level}
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  Novice
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-1.5 text-amber-300 font-bold text-xs animate-bounce shadow-sm">
              <Flame className="w-4 h-4 fill-amber-500/10" />
              <span>{data.current_streak} Day Streak</span>
            </div>
          </div>

          {/* Level Progress Circle / Bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">{currentLevelXP} / 200 XP</span>
              <span className="text-violet-400">{progressPercent}% to Lvl {data.level + 1}</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-white/30 blur-xs"></div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-6 leading-relaxed">
          Earn XP by journaling (+25), deep breathing (+50), chatting (+10), or hitting habit goals. Level up to prove your wellness dedication!
        </p>
      </div>

      {/* ── Daily Challenges Panel ──────────────────────────────────────── */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quest Log</span>
            <h3 className="text-lg font-bold text-white">Daily Challenges</h3>
          </div>
          <Star className="w-5 h-5 text-violet-400" />
        </div>

        <div className="space-y-3.5">
          {data.daily_challenges.map((challenge) => (
            <div 
              key={challenge.key} 
              className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all ${
                challenge.completed 
                  ? "bg-violet-500/5 border-violet-500/20 text-slate-400" 
                  : "bg-white/5 border-white/5 text-white"
              }`}
            >
              <button className="mt-0.5 transition-transform active:scale-90">
                {challenge.completed ? (
                  <CheckCircle className="w-5 h-5 text-violet-400 fill-violet-400/10" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 hover:text-white" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${challenge.completed ? "line-through text-slate-500" : ""}`}>
                  {challenge.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{challenge.description}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                challenge.completed ? "bg-slate-500/10 text-slate-500" : "bg-violet-500/10 text-violet-300"
              }`}>
                +{challenge.reward_xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Badges Panel ────────────────────────────────────────────────── */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Achievements</span>
            <h3 className="text-lg font-bold text-white">Wellness Badges</h3>
          </div>
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>

        <div className="grid grid-cols-6 gap-3.5">
          {badgeMilestones.map((milestone) => {
            const unlockedBadge = data.unlocked_badges.find(
              (ub) => ub.badge_name === milestone.name
            );
            const isUnlocked = !!unlockedBadge;

            return (
              <div 
                key={milestone.name}
                className="group relative flex flex-col items-center cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isUnlocked 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5 rotate-0 hover:rotate-12" 
                    : "bg-slate-950 border-white/5 text-slate-600 grayscale"
                }`}>
                  <Award className="w-5 h-5" />
                </div>
                
                {/* Micro Tooltip */}
                <div className="absolute bottom-full mb-2 w-48 bg-slate-900 border border-white/10 rounded-xl p-2.5 shadow-xl text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                  <p className="text-xs font-bold text-white">{milestone.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{milestone.desc}</p>
                  <p className={`text-[9px] font-bold mt-1.5 ${isUnlocked ? "text-amber-400" : "text-slate-500"}`}>
                    {isUnlocked ? `Unlocked! ✨` : "Locked"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Zen rewards summary */}
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Weekly Zen Reward</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {data.weekly_reward_completed 
                ? "Weekly bonus collected! Complete challenges next week for more bonus XP." 
                : "Complete 5 daily challenges this week to secure the Weekly Zen Reward! 🎉"
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
