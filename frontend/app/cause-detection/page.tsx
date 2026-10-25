"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { causeAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { getEmotionEmoji } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  Brain, Briefcase, Users, HeartPulse, GraduationCap, DollarSign,
  Heart, Sparkles, Network, RefreshCw, Trash2, Search, AlertCircle,
  Plus, CheckCircle2, ChevronRight, Activity, Zap, MessageCircle
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bgCol: string; textCol: string; borderCol: string }> = {
  work: { label: "Work & Career", icon: Briefcase, color: "from-blue-500 to-indigo-500", bgCol: "bg-blue-500/10", textCol: "text-blue-400", borderCol: "border-blue-500/30" },
  family: { label: "Family & Home", icon: Users, color: "from-purple-500 to-pink-500", bgCol: "bg-purple-500/10", textCol: "text-purple-400", borderCol: "border-purple-500/30" },
  health: { label: "Health & Vitality", icon: HeartPulse, color: "from-emerald-500 to-teal-500", bgCol: "bg-emerald-500/10", textCol: "text-emerald-400", borderCol: "border-emerald-500/30" },
  studies: { label: "Academic & Studies", icon: GraduationCap, color: "from-cyan-500 to-blue-600", bgCol: "bg-cyan-500/10", textCol: "text-cyan-400", borderCol: "border-cyan-500/30" },
  finances: { label: "Finances & Bills", icon: DollarSign, color: "from-amber-500 to-emerald-500", bgCol: "bg-amber-500/10", textCol: "text-amber-400", borderCol: "border-amber-500/30" },
  relationships: { label: "Relationships", icon: Heart, color: "from-rose-500 to-pink-500", bgCol: "bg-rose-500/10", textCol: "text-rose-400", borderCol: "border-rose-500/30" },
  lifestyle: { label: "Lifestyle & Routine", icon: Sparkles, color: "from-violet-500 to-purple-600", bgCol: "bg-violet-500/10", textCol: "text-violet-400", borderCol: "border-violet-500/30" },
};

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function CauseDetectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<{
    triggers: any[];
    category_distribution: any[];
    network: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual analysis input state
  const [inputText, setInputText] = useState("");
  const [inputEmotion, setInputEmotion] = useState("Stress");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchDashboard = useCallback(async (retries = 2) => {
    setLoading(true);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await causeAPI.getDashboard();
        setDashboardData(res.data);
        setLoading(false);
        return;
      } catch {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800));
        } else {
          toast.error("Failed to load emotion cause detection data");
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
    if (user) fetchDashboard();
  }, [user, fetchDashboard]);

  const handleAnalyzeText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      toast.error("Please enter text to analyze causes");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await causeAPI.analyzeText({ text: inputText, emotion: inputEmotion });
      toast.success(res.data.message || "Extracted causes successfully!", { icon: "🔎" });
      setInputText("");
      await fetchDashboard();
    } catch {
      toast.error("Failed to analyze cause text");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    try {
      await causeAPI.deleteTrigger(id);
      toast.success("Trigger phrase removed");
      await fetchDashboard();
    } catch {
      toast.error("Failed to remove trigger");
    }
  };

  const getCategoryMeta = (cat: string) => {
    return CATEGORY_META[cat] || CATEGORY_META.lifestyle;
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const triggers = dashboardData?.triggers || [];
  const distribution = dashboardData?.category_distribution || [];
  const network = dashboardData?.network;

  const filteredTriggers = selectedCategory === "all"
    ? triggers
    : triggers.filter((t) => t.category === selectedCategory);

  const topStressor = triggers[0];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotion Cause Detection Engine" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-violet-500/20 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-400" /> Causal Extraction & Recurring Stressor Intelligence
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Emotion Cause Detection</h2>
              <p className="text-slate-400 text-xs mt-1">
                Extracts underlying emotional causes, categorizes triggers into Work, Family, Health, Studies, Finances, Relationships, and Lifestyle, and visualizes trigger networks.
              </p>
            </div>

            <button
              onClick={() => fetchDashboard()}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Analysis
            </button>
          </div>

          {/* Top Stressor & Category Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Stressor Card */}
            {topStressor && (
              <div className="glass p-6 rounded-3xl border border-rose-500/30 space-y-4 bg-slate-900/40 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Primary Recurring Stressor
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                    {topStressor.frequency_count}x Occurrences
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {getEmotionEmoji(topStressor.emotion)} {topStressor.emotion}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] text-cyan-400 font-semibold">{topStressor.category_label}</span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{topStressor.cause_phrase}</h3>
                </div>

                {topStressor.sample_quotes?.[0] && (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                    "{topStressor.sample_quotes[0]}"
                  </div>
                )}
              </div>
            )}

            {/* Category Frequency Breakdown Bars */}
            <div className="md:col-span-2 glass p-6 rounded-3xl border border-slate-800 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Category Trigger Frequency Breakdown
              </span>

              <div className="space-y-3">
                {distribution.map((cat, idx) => {
                  const meta = getCategoryMeta(cat.category);
                  const Icon = meta.icon;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${meta.textCol}`} /> {meta.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {cat.count} triggers ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
                          style={{ width: `${Math.max(5, cat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Cause Extraction Tester Bar */}
          <div className="glass p-6 rounded-3xl border border-violet-500/20 space-y-4 bg-slate-900/30">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-violet-400" /> Real-Time Cause Extraction Tester
            </span>

            <form onSubmit={handleAnalyzeText} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste or type a conversation snippet (e.g., 'Worried about college exams and late work projects...')"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <select
                  value={inputEmotion}
                  onChange={(e) => setInputEmotion(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="Stress">Stress</option>
                  <option value="Anxiety">Anxiety</option>
                  <option value="Sad">Sadness</option>
                  <option value="Angry">Anger</option>
                  <option value="Fear">Fear</option>
                </select>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="btn-primary py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 flex-shrink-0"
                >
                  {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Extract Cause</span>
                </button>
              </div>
            </form>
          </div>

          {/* Visualize Emotional Trigger Network */}
          {network && (
            <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-400" /> Emotional Trigger Network Graph
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {network.total_nodes} Nodes • {network.total_edges} Connectors
                </span>
              </div>

              {/* Visual Node Links Network Display */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 min-h-[220px] flex flex-wrap items-center justify-center gap-3">
                {network.nodes.map((node: any) => (
                  <div
                    key={node.id}
                    className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                      node.type === "emotion"
                        ? "bg-purple-950/60 border-purple-500/50 text-purple-300 scale-105"
                        : node.type === "category"
                        ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: node.color }} />
                    <span>{node.label}</span>
                    {node.frequency && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white">
                        {node.frequency}x
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Extracted Triggers List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" /> Extracted Cause Triggers ({triggers.length})
              </h3>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                    selectedCategory === "all"
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  All Categories
                </button>
                {Object.keys(CATEGORY_META).map((catKey) => {
                  const meta = CATEGORY_META[catKey];
                  const isSel = selectedCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border flex-shrink-0 ${
                        isSel
                          ? `bg-slate-900 ${meta.textCol} ${meta.borderCol}`
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="glass p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <p className="text-xs">Extracting cause triggers from conversations...</p>
              </div>
            ) : filteredTriggers.length === 0 ? (
              <div className="glass p-8 text-center space-y-2">
                <Brain className="w-10 h-10 text-violet-400 mx-auto opacity-50" />
                <p className="text-xs text-slate-500">No triggers extracted under this category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTriggers.map((t) => {
                  const meta = getCategoryMeta(t.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={t.id}
                      className="glass p-5 rounded-3xl border border-slate-800 hover:border-violet-500/40 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl border ${meta.bgCol} ${meta.textCol} ${meta.borderCol}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              {getEmotionEmoji(t.emotion)} Trigger: {t.emotion}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                            {t.frequency_count}x Recurred
                          </span>
                          <button
                            onClick={() => handleDeleteTrigger(t.id)}
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Dismiss Trigger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white">{t.cause_phrase}</h4>

                      {t.sample_quotes?.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 italic">
                          "{t.sample_quotes[0]}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
