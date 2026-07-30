"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { 
  Flame, Droplet, Moon, Activity, 
  Sparkles, Award, Edit3, CheckCircle, 
  Plus, Calendar, Heart, ShieldAlert, 
  Settings, Save, X, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

interface Goal {
  water_target_ml: number;
  sleep_target_hours: number;
  exercise_target_mins: number;
  meditation_target_mins: number;
}

interface Log {
  water_intake_ml: number;
  sleep_hours: number;
  sleep_quality: string | null;
  exercise_mins: number;
  exercise_type: string | null;
  meditation_mins: number;
  gratitude_1: string | null;
  gratitude_2: string | null;
  gratitude_3: string | null;
}

interface Badge {
  id: string;
  badge_name: string;
  badge_type: string;
  unlocked_at: string;
}

interface Motivation {
  quote: string;
  author: string;
  category: string;
}

interface Report {
  average_water_ml: number;
  average_sleep_hours: number;
  average_exercise_mins: number;
  average_meditation_mins: number;
  goals_met_count: number;
  total_goals_tracked: number;
  compliance_percentage: number;
  active_days_count: number;
  streak_count: number;
}

export default function WellnessCoachPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [log, setLog] = useState<Log | null>(null);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [report, setReport] = useState<Report | null>(null);

  // Edit states
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoal, setEditedGoal] = useState<Goal>({
    water_target_ml: 2000,
    sleep_target_hours: 8.0,
    exercise_target_mins: 30,
    meditation_target_mins: 10
  });

  // Logging states
  const [sleepInput, setSleepInput] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<string>("Good");
  const [exerciseInput, setExerciseInput] = useState<number>(0);
  const [exerciseType, setExerciseType] = useState<string>("");
  const [meditationInput, setMeditationInput] = useState<number>(0);
  const [gratitude1, setGratitude1] = useState<string>("");
  const [gratitude2, setGratitude2] = useState<string>("");
  const [gratitude3, setGratitude3] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalRes, logRes, motRes, badgeRes, repRes] = await Promise.all([
        api.get<Goal>("/wellness/goal"),
        api.get<Log>("/wellness/log/today"),
        api.get<Motivation>("/wellness/motivation"),
        api.get<Badge[]>("/wellness/badges"),
        api.get<Report>("/wellness/report")
      ]);

      setGoal(goalRes.data);
      setEditedGoal(goalRes.data);
      setLog(logRes.data);
      setMotivation(motRes.data);
      setBadges(badgeRes.data);
      setReport(repRes.data);

      // Preset inputs
      setSleepInput(logRes.data.sleep_hours || 0);
      setSleepQuality(logRes.data.sleep_quality || "Good");
      setExerciseInput(logRes.data.exercise_mins || 0);
      setExerciseType(logRes.data.exercise_type || "");
      setMeditationInput(logRes.data.meditation_mins || 0);
      setGratitude1(logRes.data.gratitude_1 || "");
      setGratitude2(logRes.data.gratitude_2 || "");
      setGratitude3(logRes.data.gratitude_3 || "");

    } catch (err) {
      toast.error("Failed to load coach dashboard.");
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
      fetchData();
    }
  }, [user]);

  // Actions
  const handleSaveGoal = async () => {
    try {
      const res = await api.put<Goal>("/wellness/goal", editedGoal);
      setGoal(res.data);
      setIsEditingGoal(false);
      toast.success("Wellness goals updated!");
      fetchData();
    } catch {
      toast.error("Failed to update targets.");
    }
  };

  const logWater = async (amount: number) => {
    try {
      const res = await api.put<Log>("/wellness/log/today", { water_intake_ml: amount });
      setLog(res.data);
      toast.success(`Logged +${amount}ml water!`);
      // Re-fetch badges and reports to catch live updates
      const [badgeRes, repRes] = await Promise.all([
        api.get<Badge[]>("/wellness/badges"),
        api.get<Report>("/wellness/report")
      ]);
      setBadges(badgeRes.data);
      setReport(repRes.data);
    } catch {
      toast.error("Failed to log water.");
    }
  };

  const saveHabitLogs = async () => {
    try {
      const res = await api.put<Log>("/wellness/log/today", {
        sleep_hours: sleepInput,
        sleep_quality: sleepQuality,
        exercise_mins: exerciseInput,
        exercise_type: exerciseType || null,
        meditation_mins: meditationInput,
        gratitude_1: gratitude1 || null,
        gratitude_2: gratitude2 || null,
        gratitude_3: gratitude3 || null,
      });
      setLog(res.data);
      toast.success("Habits and gratitude logs saved!");
      fetchData();
    } catch {
      toast.error("Failed to save wellness entries.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Aligning wellness targets...
      </div>
    );
  }

  // Helper to draw circular gauges
  const renderProgressCircle = (current: number, target: number, colorClass: string) => {
    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="40" cy="40" r={radius} 
            className="stroke-slate-800" 
            strokeWidth="5" 
            fill="transparent" 
          />
          <circle 
            cx="40" cy="40" r={radius} 
            className={colorClass} 
            strokeWidth="5" 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold text-white">{Math.round(percentage)}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Wellness Coach" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Daily Wellness Coach</h2>
              <p className="text-slate-400 text-sm mt-1">Transform your day with daily goals, habit logs, and personalized motivation.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditingGoal(true)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold"
              >
                <Settings className="w-4 h-4" />
                <span>Adjust Targets</span>
              </button>
              <button 
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Aligning daily logs...</div>
          ) : !goal || !log ? (
            <div className="text-slate-500 text-sm">Failed to connect wellness engine.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Habits Logging */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Motivation Box */}
                {motivation && (
                  <div className="glass p-6 relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent">
                    <div className="absolute right-4 top-4 opacity-5">
                      <Sparkles className="w-24 h-24 text-violet-400" />
                    </div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-2">{motivation.category} Motivation</span>
                    <blockquote className="text-white font-medium italic text-base leading-relaxed">
                      &quot;{motivation.quote}&quot;
                    </blockquote>
                    <p className="text-xs text-slate-400 mt-2">— {motivation.author}</p>
                  </div>
                )}

                {/* Habit Logging Panel */}
                <div className="glass p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Daily Habit Logger</h3>
                  
                  {/* Water Tracker */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                        <Droplet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Water Intake</p>
                        <p className="text-xs text-slate-400">{log.water_intake_ml} / {goal.water_target_ml} ml logged</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex gap-2">
                        <button onClick={() => logWater(250)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>250ml</span>
                        </button>
                        <button onClick={() => logWater(500)} className="px-3 py-1.5 bg-blue-500/25 hover:bg-blue-500/35 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>500ml</span>
                        </button>
                      </div>
                      {renderProgressCircle(log.water_intake_ml, goal.water_target_ml, "stroke-blue-500")}
                    </div>
                  </div>

                  {/* Sleep Tracker */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Sleep Duration</p>
                        <p className="text-xs text-slate-400">Target: {goal.sleep_target_hours} hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.5"
                            value={sleepInput}
                            onChange={(e) => setSleepInput(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-400">hrs</span>
                        </div>
                        <select 
                          value={sleepQuality}
                          onChange={(e) => setSleepQuality(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                      {renderProgressCircle(sleepInput, goal.sleep_target_hours, "stroke-indigo-500")}
                    </div>
                  </div>

                  {/* Exercise Tracker */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Exercise Activity</p>
                        <p className="text-xs text-slate-400">Target: {goal.exercise_target_mins} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={exerciseInput}
                            onChange={(e) => setExerciseInput(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-xs text-slate-400">mins</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Type (e.g. Run)" 
                          value={exerciseType}
                          onChange={(e) => setExerciseType(e.target.value)}
                          className="w-28 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                        />
                      </div>
                      {renderProgressCircle(exerciseInput, goal.exercise_target_mins, "stroke-emerald-500")}
                    </div>
                  </div>

                  {/* Meditation Tracker */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Meditation / Rest</p>
                        <p className="text-xs text-slate-400">Target: {goal.meditation_target_mins} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={meditationInput}
                          onChange={(e) => setMeditationInput(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                        <span className="text-xs text-slate-400">mins</span>
                      </div>
                      {renderProgressCircle(meditationInput, goal.meditation_target_mins, "stroke-violet-500")}
                    </div>
                  </div>

                  {/* Gratitude Journal */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Gratitude Journal</p>
                        <p className="text-xs text-slate-400">Record 3 things you are grateful for today</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="1. Something you appreciate..." 
                        value={gratitude1}
                        onChange={(e) => setGratitude1(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-700"
                      />
                      <input 
                        type="text" 
                        placeholder="2. Someone who made you smile..." 
                        value={gratitude2}
                        onChange={(e) => setGratitude2(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-700"
                      />
                      <input 
                        type="text" 
                        placeholder="3. A small victory today..." 
                        value={gratitude3}
                        onChange={(e) => setGratitude3(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-700"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button 
                    onClick={saveHabitLogs}
                    className="btn-primary py-2.5 w-full flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Daily Entries</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Weekly Report & Achievements */}
              <div className="space-y-8">
                
                {/* Streak Counter */}
                {report && (
                  <div className="glass p-6 text-center space-y-3 relative overflow-hidden group">
                    <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Flame className="w-12 h-12 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Daily Active Streak</span>
                    <p className="text-5xl font-black text-orange-400 flex items-center justify-center gap-2">
                      {report.streak_count} <span className="text-sm font-semibold text-slate-500">Days</span>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Keep logging daily to unlock the <strong className="text-orange-400 font-semibold">Streaker Star</strong> badge!
                    </p>
                  </div>
                )}

                {/* Weekly Summary */}
                {report && (
                  <div className="glass p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Weekly Report</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Goals Tracked:</span>
                        <span className="text-white font-semibold">{report.total_goals_tracked}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Goals Met:</span>
                        <span className="text-white font-semibold">{report.goals_met_count}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Overall Compliance:</span>
                        <span className="text-emerald-400 font-bold">{report.compliance_percentage}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Avg Daily Water:</span>
                        <span className="text-white font-semibold">{report.average_water_ml} ml</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Avg Daily Sleep:</span>
                        <span className="text-white font-semibold">{report.average_sleep_hours} hrs</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Avg Daily Exercise:</span>
                        <span className="text-white font-semibold">{report.average_exercise_mins} mins</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Avg Daily Meditation:</span>
                        <span className="text-white font-semibold">{report.average_meditation_mins} mins</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Badges Panel */}
                <div className="glass p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Achievement Badges</h3>
                  {badges.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                      <Award className="w-8 h-8 mx-auto opacity-30" />
                      <p>No badges unlocked yet. Keep logging your habits to earn achievements!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <div key={badge.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col items-center text-center space-y-1.5 hover:scale-105 transition-all">
                          <div className={`p-2.5 rounded-full ${
                            badge.badge_type === "water" ? "bg-blue-500/20 text-blue-400" :
                            badge.badge_type === "sleep" ? "bg-indigo-500/20 text-indigo-400" :
                            badge.badge_type === "exercise" ? "bg-emerald-500/20 text-emerald-400" :
                            badge.badge_type === "meditation" ? "bg-violet-500/20 text-violet-400" :
                            badge.badge_type === "gratitude" ? "bg-amber-500/20 text-amber-400" :
                            "bg-orange-500/20 text-orange-400"
                          }`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-white block">{badge.badge_name}</span>
                          <span className="text-[8px] text-slate-500">
                            {new Date(badge.unlocked_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Adjust Targets Modal */}
      {isEditingGoal && goal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Adjust Daily Targets</h3>
              <button onClick={() => setIsEditingGoal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Daily Water Target (ml)</label>
                <input 
                  type="number"
                  value={editedGoal.water_target_ml}
                  onChange={(e) => setEditedGoal({ ...editedGoal, water_target_ml: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Daily Sleep Target (hours)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={editedGoal.sleep_target_hours}
                  onChange={(e) => setEditedGoal({ ...editedGoal, sleep_target_hours: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Daily Exercise Target (minutes)</label>
                <input 
                  type="number"
                  value={editedGoal.exercise_target_mins}
                  onChange={(e) => setEditedGoal({ ...editedGoal, exercise_target_mins: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Daily Meditation Target (minutes)</label>
                <input 
                  type="number"
                  value={editedGoal.meditation_target_mins}
                  onChange={(e) => setEditedGoal({ ...editedGoal, meditation_target_mins: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
              <button 
                onClick={() => setIsEditingGoal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveGoal}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Targets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
