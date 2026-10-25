"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { errorAnalysisAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  AlertTriangle, ShieldCheck, BarChart2, Lightbulb, Play, RefreshCw,
  CheckCircle2, Info, Lock, ArrowUpRight, Zap, Filter, FileText, Layers
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function ErrorAnalysisDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [modelCompare, setModelCompare] = useState<any[]>([]);

  const fetchErrorAnalysis = async () => {
    try {
      setLoading(true);
      const [detailRes, compRes] = await Promise.all([
        errorAnalysisAPI.getDetail("latest"),
        errorAnalysisAPI.compareModelErrors(),
      ]);
      setAnalysisData(detailRes.data);
      setModelCompare(compRes.data.model_error_comparison || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Researcher authorization required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load Error Analysis laboratory data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchErrorAnalysis();
  }, [user, authLoading, router]);

  const handleRunNewAnalysis = async () => {
    setRunning(true);
    try {
      const res = await errorAnalysisAPI.runAnalysis("EXP-2026-00042");
      toast.success(`Error analysis ${res.data.analysis_id} completed.`);
      fetchErrorAnalysis();
    } catch {
      toast.error("Failed to run error analysis pipeline.");
    } finally {
      setRunning(false);
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const breakdown = analysisData?.category_breakdown || {};
  const examples = analysisData?.representative_examples || [];
  const confusionPairs = analysisData?.confusion_pairs || [];
  const recommendations = analysisData?.recommendations || [];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Automated Error Analysis & Model Improvement" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Automated Error Analysis &amp; Model Improvement
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Research &amp; Evaluation Pipeline
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Categorizes false positives/negatives, sarcasm, negation, code-mixed, and short-message failures with privacy redaction and actionable research recommendations.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunNewAnalysis}
                disabled={running}
                className="btn-primary py-2.5 px-4 font-bold flex items-center gap-2 bg-amber-600 hover:bg-amber-500 border-none shadow-lg shadow-amber-500/20"
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Pipeline
              </button>
            </div>

            {/* Non-Clinical Research Guidance Banner */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Research Evaluation Disclaimer:</strong> Automated root-cause explanations are research hypotheses to guide future model development, not clinical conclusions or user diagnoses.
              </span>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Total Samples</span>
              <p className="text-2xl font-extrabold text-white">{analysisData?.total_samples}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Total Errors</span>
              <p className="text-2xl font-extrabold text-rose-400">{analysisData?.total_errors} ({((analysisData?.error_rate || 0) * 100).toFixed(1)}%)</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Top Error Category</span>
              <p className="text-2xl font-extrabold text-amber-400">Negation Failure</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Top Confusion Pair</span>
              <p className="text-2xl font-extrabold text-cyan-400">Stress → Anxiety</p>
            </div>
          </div>

          {/* Error Category Breakdown & Confusion Pairs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Error Category Distribution
              </h3>

              <div className="space-y-3 text-xs">
                {Object.entries(breakdown).map(([cat, cnt]: any) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-slate-300 font-semibold">
                      <span>{cat}</span>
                      <span className="text-slate-400">{cnt} occurrences</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, cnt * 25)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confusion Pair Frequency Table */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-cyan-400" />
                Frequently Confused Emotion Pairs
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">True Emotion</th>
                      <th className="p-2.5">Predicted Emotion</th>
                      <th className="p-2.5">Count</th>
                      <th className="p-2.5">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {confusionPairs.map((cp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white">{cp.true_emotion}</td>
                        <td className="p-2.5 font-bold text-rose-400">{cp.predicted_emotion}</td>
                        <td className="p-2.5 font-mono text-slate-300">{cp.count}</td>
                        <td className="p-2.5 font-mono font-bold text-cyan-400">{cp.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Privacy-Redacted Representative Examples */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              Privacy-Redacted Representative Examples (PII Redacted)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {examples.map((ex: any) => (
                <div key={ex.error_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {ex.primary_category}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">Conf: {(ex.confidence * 100).toFixed(0)}%</span>
                  </div>

                  <p className="text-slate-200 font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    "{ex.redacted_text}"
                  </p>

                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>True: <strong className="text-emerald-400">{ex.true_emotion}</strong></span>
                    <span>Predicted: <strong className="text-rose-400">{ex.predicted_emotion}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Research Recommendations */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Actionable Model Improvement Suggestions
            </h3>

            <div className="space-y-3 text-xs">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-sm">{rec.category}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      rec.priority === "HIGH" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>

                  <p className="text-slate-300">{rec.observation}</p>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Suggested Actions:</span>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                      {rec.suggested_actions.map((act: string, aIdx: number) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
