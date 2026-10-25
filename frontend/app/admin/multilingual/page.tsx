"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { multilingualAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Globe, CheckCircle2, AlertTriangle, RefreshCw, Info, Play,
  BarChart2, ShieldCheck, Sparkles, Layers, ArrowRight, Languages
} from "lucide-react";
import toast from "react-hot-toast";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminMultilingualDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Live Tester State
  const [testText, setTestText] = useState<string>("Naaku exams gurinchi chala tension ga undi");
  const [analysis, setAnalysis] = useState<any>(null);
  const [testing, setTesting] = useState<boolean>(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await multilingualAPI.getEvalDashboard();
      setDashboardData(res.data.languages || []);

      const testRes = await multilingualAPI.analyzeMessage(testText);
      setAnalysis(testRes.data);
    } catch {
      toast.error("Failed to load multilingual evaluation dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchDashboard();
  }, [user, authLoading, router]);

  const handleTestAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await multilingualAPI.analyzeMessage(testText);
      setAnalysis(res.data);
      toast.success("Multilingual message analyzed!");
    } catch {
      toast.error("Analysis failed.");
    } finally {
      setTesting(false);
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Multilingual Model Evaluation Dashboard" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Multilingual &amp; Code-Mixed Benchmarks
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      5 Languages Active
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Evaluates accuracy, F1-scores, safety risk recall, and latency across English, Telugu, Hindi, Tamil, and Kannada in native script, Romanized transliteration, and code-mixed formats.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual Benchmark Matrix Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Language-Specific Performance Benchmark Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Language</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Emotion F1</th>
                    <th className="p-3">Sentiment F1</th>
                    <th className="p-3">Risk Recall</th>
                    <th className="p-3">Code-Mix F1</th>
                    <th className="p-3">Latency (P95)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dashboardData.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-800/30">
                      <td className="p-3 font-extrabold text-white">{row.language}</td>
                      <td className="p-3 font-mono text-cyan-400">{row.code}</td>
                      <td className="p-3 font-semibold text-emerald-400">{(row.emotion_f1 * 100).toFixed(1)}%</td>
                      <td className="p-3 font-semibold text-indigo-400">{(row.sentiment_f1 * 100).toFixed(1)}%</td>
                      <td className="p-3 font-semibold text-amber-400">{(row.risk_recall * 100).toFixed(1)}%</td>
                      <td className="p-3 font-semibold text-pink-400">{(row.code_mix_f1 * 100).toFixed(1)}%</td>
                      <td className="p-3 text-slate-400">{row.latency_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Multilingual Tester Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Languages className="w-4 h-4 text-cyan-400" />
                Live Multilingual &amp; Code-Mixed Inspector
              </h3>

              <form onSubmit={handleTestAnalyze} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Input Message (Native script or Romanized)</label>
                  <textarea
                    rows={3}
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                    placeholder="e.g. Naaku exams gurinchi chala tension ga undi"
                  />
                </div>

                <button
                  type="submit"
                  disabled={testing}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Analyze Language, Emotion &amp; Safety Risk
                </button>
              </form>
            </div>

            {/* Analysis Output Card */}
            {analysis && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Result</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    analysis.language.is_code_mixed ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}>
                    {analysis.language.is_code_mixed ? "Code-Mixed" : "Monolingual"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Primary Language</span>
                    <p className="text-base font-extrabold text-cyan-400 uppercase">{analysis.language.primary_language}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Script</span>
                    <p className="text-base font-extrabold text-white">{analysis.language.script}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Primary Emotion</span>
                    <p className="text-base font-extrabold text-pink-400 uppercase">{analysis.emotion.primary_emotion}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Risk Level</span>
                    <p className={`text-base font-extrabold ${analysis.risk.level === "LOW" ? "text-emerald-400" : "text-rose-400"}`}>{analysis.risk.level}</p>
                  </div>
                </div>

                {analysis.language.token_languages && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-bold">Token-Level Breakdown:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.language.token_languages.map((item: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300">
                          {item.token} <span className="text-cyan-400">({item.lang})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
