"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { intensityAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Flame, BarChart2, Activity, Play, ShieldAlert, CheckCircle, Clock,
  TrendingUp, TrendingDown, Minus, Info, Sparkles, RefreshCw, Layers
} from "lucide-react";
import toast from "react-hot-toast";

interface AnalyzeResult {
  emotion: string;
  intensity: number;
  confidence: number;
  severity: string;
  emotions: Array<{ emotion: string; intensity: number; confidence: number }>;
  evidence: Array<{ text: string; contribution: number }>;
  temporal_context?: string;
}

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function EmotionIntensityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [inputText, setInputText] = useState<string>("I am extremely stressed about tomorrow's presentation.");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  // Filter & History State
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7d");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("all");
  const [trends, setTrends] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [benchmark, setBenchmark] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [tRes, hRes, bRes] = await Promise.all([
        intensityAPI.getTrends(selectedPeriod, selectedEmotion),
        intensityAPI.getHistory(selectedEmotion, selectedPeriod === "7d" ? 7 : (selectedPeriod === "30d" ? 30 : 90)),
        intensityAPI.getBenchmark(),
      ]);
      setTrends(tRes.data);
      setHistory(hRes.data);
      setBenchmark(bRes.data);
    } catch {
      toast.error("Failed to load intensity analytics.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchDashboardData();
  }, [user, authLoading, router, selectedPeriod, selectedEmotion]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await intensityAPI.analyzeIntensity(inputText);
      setResult(res.data);
      toast.success("Emotion intensity calculated!");
      fetchDashboardData();
    } catch {
      toast.error("Failed to analyze emotion intensity.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotion Intensity Detection Module" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Non-Clinical Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Emotion Intensity Detection
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      0–100 Continuous Score
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Descriptive AI-generated emotional intensity tracking, multi-emotion detection, linguistic evidence extraction, and time-series trends.
                  </p>
                </div>
              </div>
            </div>

            {/* Non-Clinical Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>
                <strong>Non-Clinical Notice:</strong> Emotion intensity scores are descriptive AI-generated estimates for self-reflection and wellness monitoring. They are <strong>NOT</strong> medical diagnoses, psychiatric assessments, or clinical severity scores.
              </p>
            </div>
          </div>

          {/* Current Signal Cards */}
          {trends && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Average Intensity</span>
                <p className="text-2xl font-extrabold text-rose-400">{trends.average_intensity} / 100</p>
                <span className="text-[10px] text-slate-500">Period: {trends.period}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Trend Direction</span>
                <div className="flex items-center gap-1.5 text-lg font-extrabold text-white">
                  {trends.trend === "increasing" && <TrendingUp className="w-5 h-5 text-rose-400" />}
                  {trends.trend === "decreasing" && <TrendingDown className="w-5 h-5 text-emerald-400" />}
                  {trends.trend === "stable" && <Minus className="w-5 h-5 text-amber-400" />}
                  <span className="capitalize">{trends.trend}</span>
                </div>
                <span className="text-[10px] text-slate-500">Change: {trends.change > 0 ? `+${trends.change}` : trends.change}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Intensity Range</span>
                <p className="text-2xl font-extrabold text-white">{trends.minimum} – {trends.maximum}</p>
                <span className="text-[10px] text-slate-500">Min / Max Recorded</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Observations</span>
                <p className="text-2xl font-extrabold text-white">{trends.observations}</p>
                <span className="text-[10px] text-cyan-400 font-semibold">Timestamped Inputs</span>
              </div>
            </div>
          )}

          {/* Interactive Intensity Sandbox Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Flame className="w-4 h-4 text-rose-400" />
                Live Emotion Intensity Sandbox Console
              </h3>

              <form onSubmit={handleAnalyze} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Input User Message</label>
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter user message to test intensity, multi-emotions, and evidence extraction..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Analyze Emotion &amp; Intensity Score
                </button>
              </form>
            </div>

            {/* Analysis Output Result Card */}
            {result && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Result Payload</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Level: {result.severity.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Primary Emotion</span>
                    <p className="text-base font-extrabold text-white capitalize">{result.emotion}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Intensity Score</span>
                    <p className="text-base font-extrabold text-rose-400">{result.intensity} / 100</p>
                  </div>
                </div>

                {/* Multi-Emotions List */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold">Multi-Emotion Probability Distribution</span>
                  <div className="space-y-1.5">
                    {result.emotions.map((e) => (
                      <div key={e.emotion} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-300">
                        <span className="capitalize font-bold">{e.emotion}</span>
                        <div className="flex items-center gap-3">
                          <span>Intensity: <strong>{e.intensity}</strong></span>
                          <span className="text-cyan-400 font-bold">Conf: {(e.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supporting Evidence List */}
                {result.evidence.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold">Supporting Evidence Phrases</span>
                    <div className="flex flex-wrap gap-2">
                      {result.evidence.map((ev, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          &ldquo;{ev.text}&rdquo; <strong className="text-amber-400">({ev.contribution > 0 ? `+${ev.contribution}` : ev.contribution})</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Comparison Benchmark Leaderboard Table */}
          {benchmark.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-4 h-4 text-rose-400" />
                Model Comparison Benchmark (Proposed Model vs Baselines 1–4)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Model Architecture</th>
                      <th className="py-2.5 px-3">MAE (Lower Better)</th>
                      <th className="py-2.5 px-3">RMSE</th>
                      <th className="py-2.5 px-3">Pearson r</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Macro F1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {benchmark.map((b: any) => (
                      <tr key={b.model_name} className={b.model_name.includes("Proposed") ? "bg-rose-500/10 font-bold" : "hover:bg-slate-800/40"}>
                        <td className="py-3 px-3 text-white">{b.model_name}</td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">{b.mae}</td>
                        <td className="py-3 px-3">{b.rmse}</td>
                        <td className="py-3 px-3 text-cyan-400 font-bold">{b.pearson_r}</td>
                        <td className="py-3 px-3">{(b.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 text-rose-400 font-bold">{b.macro_f1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
