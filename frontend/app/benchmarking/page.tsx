"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { benchmarkingAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Award, BarChart2, CheckCircle, Clock, Cpu, Database, RefreshCw, Layers, ShieldCheck,
  Plus, Play, CheckSquare, ChevronRight, Activity, Server, FileText, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface BenchmarkRunItem {
  id: string;
  name: string;
  dataset_id: string;
  status: string;
  random_seed: number;
  git_commit_hash: string;
  started_at?: string;
}

export default function BenchmarkingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [runDetails, setRunDetails] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, mRes, dRes] = await Promise.all([
        benchmarkingAPI.getBenchmarks(),
        benchmarkingAPI.getModels(),
        benchmarkingAPI.getDatasets(),
      ]);
      setBenchmarks(bRes.data);
      setModels(mRes.data);
      setDatasets(dRes.data);

      const targetId = selectedRunId || (bRes.data.length > 0 ? bRes.data[0].id : "");
      if (targetId) {
        setSelectedRunId(targetId);
        const rRes = await benchmarkingAPI.getResults(targetId);
        setRunDetails(rRes.data);
        if (rRes.data.rankings && rRes.data.rankings.length > 0) {
          setSelectedModel(rRes.data.rankings[0]);
        }
      }
    } catch {
      toast.error("Failed to load benchmark evaluation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, selectedRunId]);

  const handleLaunchBenchmark = async () => {
    setLoading(true);
    try {
      const res = await benchmarkingAPI.launchBenchmark({
        name: `Automated Benchmark Suite (${new Date().toLocaleTimeString()})`,
        dataset_id: "fer2013",
      });
      toast.success("Benchmark evaluation suite completed!");
      fetchData();
    } catch {
      toast.error("Failed to execute benchmark suite.");
    } finally {
      setLoading(false);
    }
  };

  const handleReproduce = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    try {
      await benchmarkingAPI.reproduceBenchmark(selectedRunId);
      toast.success("Benchmark 100% REPRODUCED with exact seed & checksums!");
      fetchData();
    } catch {
      toast.error("Failed to reproduce benchmark.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Emotion Detection Benchmarking Suite" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      AI Emotion Benchmarking Suite
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Model-Agnostic Framework
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Standardized, reproducible framework evaluating CNNs, EfficientNet, and Vision Transformers under fixed seeds, SHA256 model checksums, and git commits.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLaunchBenchmark}
                  disabled={loading}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                  <Play className="w-4 h-4" /> Run Benchmark Suite
                </button>
              </div>
            </div>

            {/* Reproducibility Badge Footer */}
            {runDetails && (
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Status: {runDetails.reproducibility_status}
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Seed: {runDetails.random_seed}
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  Git: {runDetails.git_commit_hash}
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                  Dataset: <strong className="text-white">{runDetails.dataset_id} (v{runDetails.dataset_version})</strong>
                </div>
              </div>
            )}
          </div>

          {/* Model Comparison Leaderboard Table */}
          {runDetails && runDetails.rankings && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  Model Comparison Leaderboard &amp; Multi-Objective Rankings
                </h3>
                <button
                  onClick={handleReproduce}
                  disabled={loading}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reproduce Benchmark
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Model Architecture</th>
                      <th className="py-2.5 px-3">Macro F1</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">P95 Latency</th>
                      <th className="py-2.5 px-3">Throughput</th>
                      <th className="py-2.5 px-3">Peak RAM</th>
                      <th className="py-2.5 px-3">Multi-Obj Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {runDetails.rankings.map((r: any) => (
                      <tr
                        key={r.model_id}
                        onClick={() => setSelectedModel(r)}
                        className={`cursor-pointer transition-all ${
                          selectedModel?.model_id === r.model_id ? "bg-blue-500/10 font-bold" : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            r.rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-400"
                          }`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white">{r.model_id}</span>
                            <p className="text-[10px] text-slate-500">v{r.version}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{r.f1_macro}</td>
                        <td className="py-3 px-3">{(r.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 text-cyan-400 font-bold">{r.latency_p95_ms} ms</td>
                        <td className="py-3 px-3">{r.throughput_tps} img/s</td>
                        <td className="py-3 px-3">{r.memory_ram_mb} MB</td>
                        <td className="py-3 px-3 font-extrabold text-blue-400">{r.weighted_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recommendation Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 flex justify-between items-center gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">Recommendation Decision:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {runDetails.recommendation?.status}
                    </span>
                  </div>
                  <p className="text-slate-400">{runDetails.recommendation?.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Per-Class Breakdown & Confusion Matrix Inspector */}
          {selectedModel && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Per-Class Performance Table */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Per-Class Emotion Performance ({selectedModel.model_id})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2">Emotion Class</th>
                        <th className="py-2 px-2">Precision</th>
                        <th className="py-2 px-2">Recall</th>
                        <th className="py-2 px-2">F1 Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {Object.entries(selectedModel.class_wise_metrics || {}).map(([label, m]: any) => (
                        <tr key={label}>
                          <td className="py-2 px-2 font-bold text-white">{label}</td>
                          <td className="py-2 px-2">{m.precision}</td>
                          <td className="py-2 px-2">{m.recall}</td>
                          <td className="py-2 px-2 font-bold text-emerald-400">{m.f1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hardware & Software Environment Inspector */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Hardware &amp; Reproducible Runtime Environment
                </h3>

                {runDetails && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold">CPU:</span>
                      <p className="text-white font-mono">{runDetails.hardware_specs?.cpu}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold">GPU:</span>
                      <p className="text-cyan-400 font-mono">{runDetails.hardware_specs?.gpu}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Python:</span>
                        <strong className="text-white block">{runDetails.software_env?.python}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">PyTorch:</span>
                        <strong className="text-white block">{runDetails.software_env?.pytorch}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
