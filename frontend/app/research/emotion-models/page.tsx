"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { researchLabAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  FlaskConical, Cpu, Layers, Play, RefreshCw, CheckCircle2, ArrowRight,
  Database, GitCommit, ShieldAlert, Sparkles, Filter, Info, FileText, BarChart2
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function EmotionModelResearchLabPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [familyFilter, setFamilyFilter] = useState<string>("ALL");
  const [selectedModel, setSelectedModel] = useState<string>("RoBERTa");
  const [seed, setSeed] = useState<number>(42);
  const [running, setRunning] = useState<boolean>(false);

  const [inspectExp, setInspectExp] = useState<any>(null);
  const [reproduceResult, setReproduceResult] = useState<any>(null);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const res = await researchLabAPI.compareModels();
      setExperiments(res.data.comparison || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Researcher authorization required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load Research Laboratory benchmarks.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchExperiments();
  }, [user, authLoading, router]);

  const handleRunExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await researchLabAPI.runExperiment(selectedModel, seed);
      toast.success(`Experiment ${res.data.experiment_id} completed successfully.`);
      fetchExperiments();
    } catch {
      toast.error("Experiment execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleRunBatch = async () => {
    setRunning(true);
    try {
      await researchLabAPI.runBatch();
      toast.success("Batch evaluation across all 8 architectures completed.");
      fetchExperiments();
    } catch {
      toast.error("Batch evaluation failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleInspect = async (expId: string) => {
    try {
      const res = await researchLabAPI.getDetail(expId);
      setInspectExp(res.data);
      setReproduceResult(null);
    } catch {
      toast.error("Failed to load experiment details.");
    }
  };

  const handleReproduce = async (expId: string) => {
    try {
      const res = await researchLabAPI.reproduce(expId);
      setReproduceResult(res.data);
      toast.success(`Reproduced ${expId}: ${res.data.status}`);
    } catch {
      toast.error("Reproduction failed.");
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const filteredExperiments = experiments.filter((e) => {
    if (familyFilter === "ALL") return true;
    return e.model_family === familyFilter;
  });

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotion Model Research Laboratory" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Emotion Model Research Laboratory
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      8 Classification Architectures
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Reproducible evaluation environment comparing Classical Deep Learning (CNN, LSTM, BiLSTM, CNN-LSTM) and Transformer architectures (BERT, DistilBERT, RoBERTa, DeBERTa).
                  </p>
                </div>
              </div>

              {/* Family Filter Tabs */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
                {[
                  { label: "All Models", val: "ALL" },
                  { label: "Classical DL", val: "Classical Deep Learning" },
                  { label: "Transformers", val: "Transformer" },
                ].map((tab) => (
                  <button
                    key={tab.val}
                    onClick={() => setFamilyFilter(tab.val)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      familyFilter === tab.val
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Research Non-Clinical Disclaimer */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Research &amp; Evaluation Component:</strong> Evaluates technical classification accuracy, latency, and resource metrics. Must not be used for clinical diagnoses.
              </span>
            </div>
          </div>

          {/* Interactive Experiment Trigger & Batch Console */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Launch Experiment &amp; Benchmark Runner
            </h3>

            <form onSubmit={handleRunExperiment} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Architecture</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <optgroup label="Classical Deep Learning">
                    <option value="CNN">CNN (Text Convolutional Network)</option>
                    <option value="LSTM">LSTM (Long Short-Term Memory)</option>
                    <option value="BiLSTM">BiLSTM (Bidirectional LSTM)</option>
                    <option value="CNN-LSTM">CNN-LSTM Hybrid Architecture</option>
                  </optgroup>
                  <optgroup label="Transformer Models">
                    <option value="BERT">BERT (bert-base-uncased)</option>
                    <option value="DistilBERT">DistilBERT (distilbert-base-uncased)</option>
                    <option value="RoBERTa">RoBERTa (roberta-base)</option>
                    <option value="DeBERTa">DeBERTa (deberta-base)</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Random Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div className="flex items-end gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={running}
                  className="btn-primary py-2.5 px-4 font-bold flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20"
                >
                  {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run Experiment
                </button>

                <button
                  type="button"
                  onClick={handleRunBatch}
                  disabled={running}
                  className="btn-secondary py-2.5 px-4 font-bold flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Run All 8 Models Batch
                </button>
              </div>
            </form>
          </div>

          {/* Model Comparison Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Multi-Architecture Comparison Registry ({filteredExperiments.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Family</th>
                    <th className="p-2.5">Accuracy</th>
                    <th className="p-2.5">Macro F1</th>
                    <th className="p-2.5">P95 Latency</th>
                    <th className="p-2.5">Model Size</th>
                    <th className="p-2.5">Peak Memory</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredExperiments.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-extrabold text-white">{exp.model_name}</td>
                      <td className="p-2.5 text-slate-400 font-semibold">{exp.model_family}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">{(exp.accuracy * 100).toFixed(1)}%</td>
                      <td className="p-2.5 font-mono font-bold text-cyan-400">{(exp.macro_f1 * 100).toFixed(1)}%</td>
                      <td className="p-2.5 font-mono text-slate-300">{exp.latency_p95} ms</td>
                      <td className="p-2.5 font-mono text-slate-300">{exp.model_size_mb} MB</td>
                      <td className="p-2.5 font-mono text-slate-300">{exp.peak_memory_mb} MB</td>
                      <td className="p-2.5 flex items-center gap-2">
                        <button
                          onClick={() => handleInspect(exp.experiment_id)}
                          className="text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleReproduce(exp.experiment_id)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold"
                        >
                          Reproduce
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Experiment Inspection & Confusion Matrix Drawer */}
          {inspectExp && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white">Experiment Details: {inspectExp.experiment_id}</h3>
                <span className="px-3 py-1 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase text-[10px]">
                  {inspectExp.model_name} ({inspectExp.model_family})
                </span>
              </div>

              {reproduceResult && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 font-mono space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reproducibility Verification Result:</span>
                  <p>Original Macro F1: {reproduceResult.original_macro_f1} | Reproduced Macro F1: {reproduceResult.reproduced_macro_f1} | Status: {reproduceResult.status}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 font-semibold">Macro F1 Score</span>
                  <p className="text-lg font-extrabold text-cyan-400">{(inspectExp.macro_f1 * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 font-semibold">Weighted F1 Score</span>
                  <p className="text-lg font-extrabold text-emerald-400">{(inspectExp.weighted_f1 * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 font-semibold">Parameter Count</span>
                  <p className="text-lg font-extrabold text-purple-400">{inspectExp.param_count_m} M</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 font-semibold">P95 Latency</span>
                  <p className="text-lg font-extrabold text-amber-400">{inspectExp.latency_p95} ms</p>
                </div>
              </div>

              {/* Confusion Matrix Rendering */}
              {inspectExp.confusion_matrix && (
                <div className="space-y-2">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">6x6 Confusion Matrix</span>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto">
                    <div className="grid grid-cols-6 gap-2 text-center">
                      {inspectExp.confusion_matrix.map((row: number[], rIdx: number) =>
                        row.map((val: number, cIdx: number) => (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`p-2 rounded-lg font-bold ${
                              rIdx === cIdx ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-400"
                            }`}
                          >
                            {val}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
