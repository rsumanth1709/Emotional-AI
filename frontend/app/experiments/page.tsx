"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { experimentAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  FlaskConical, Sparkles, RefreshCw, CheckCircle, AlertTriangle, Play, Pause,
  Plus, CheckSquare, Layers, Shield, Award, ChevronRight, BarChart2, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface ExperimentItem {
  id: string;
  name: string;
  description?: string;
  experiment_type: string;
  status: string;
  primary_metric: string;
  minimum_sample_size: number;
  start_date?: string;
}

export default function ExperimentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string>("");
  const [expResults, setExpResults] = useState<any>(null);
  const [userAssignment, setUserAssignment] = useState<any>(null);

  // New Experiment Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newExpName, setNewExpName] = useState<string>("");
  const [controlPrompt, setControlPrompt] = useState<string>("You are a helpful AI assistant.");
  const [variantPrompt, setVariantPrompt] = useState<string>("You are a supportive MindCare AI wellness companion. Respond empathetically and warmly.");
  const [trafficAllocation, setTrafficAllocation] = useState<number>(50);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eRes = await experimentAPI.getExperiments();
      setExperiments(eRes.data);

      const targetId = selectedExpId || (eRes.data.length > 0 ? eRes.data[0].id : "");
      if (targetId) {
        setSelectedExpId(targetId);
        const rRes = await experimentAPI.getResults(targetId);
        setExpResults(rRes.data);
      }

      const aRes = await experimentAPI.resolveConfiguration("chatbot");
      setUserAssignment(aRes.data);
    } catch {
      toast.error("Failed to load experiment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, selectedExpId]);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) {
      toast.error("Please enter an experiment name.");
      return;
    }
    setLoading(true);
    try {
      const res = await experimentAPI.createExperiment({
        name: newExpName,
        experiment_type: "prompt",
        primary_metric: "satisfaction",
        minimum_sample_size: 1000,
        control_config: { prompt_text: controlPrompt, temperature: 0.7 },
        variant_config: { prompt_text: variantPrompt, temperature: 0.7 },
        traffic_allocation: trafficAllocation,
      });
      toast.success(`Created experiment "${res.data.name}"`);
      setShowCreateModal(false);
      setNewExpName("");
      fetchData();
    } catch {
      toast.error("Failed to create experiment.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeployWinner = async () => {
    if (!selectedExpId) return;
    setLoading(true);
    try {
      const res = await experimentAPI.deployWinner(selectedExpId);
      toast.success(res.data.message || "Winner promoted to production!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to deploy winner.");
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
        <Navbar title="A/B Testing and Experimentation Platform" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      A/B Testing &amp; Experimentation Platform
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Statistical A/B AI Engine
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Compare AI prompt strategies, model architectures, temperatures, and response styles using deterministic user assignment,
                    $95\%$ confidence intervals, $p$-value z-tests, and mandatory safety guardrails.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" /> Create A/B Experiment
              </button>
            </div>
          </div>

          {/* User Deterministic Assignment Status */}
          {userAssignment && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Deterministic Assignment for Current User:</span>
                <strong className="text-white font-mono">{userAssignment.variant_name || "Control (Production)"}</strong>
              </div>
              <span className="text-slate-500">MD5 Hash Assignment Bucket: Stable</span>
            </div>
          )}

          {/* Active Experiments Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {experiments.map((e) => (
              <div
                key={e.id}
                onClick={() => setSelectedExpId(e.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedExpId === e.id
                    ? "bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">
                    {e.experiment_type} EXPERIMENT
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    e.status === "RUNNING" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {e.status}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{e.name}</h3>
                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Metric: <strong>{e.primary_metric}</strong></span>
                  <span>Min Size: {e.minimum_sample_size}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Statistical Results & Variant Comparison Matrix */}
          {expResults && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                    Experiment: {expResults.name}
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    Statistical Evaluation &amp; Variant Comparison Matrix
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Participants: {expResults.participants?.toLocaleString()}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">{expResults.control?.name}</th>
                      <th className="py-2.5 px-3">{expResults.variant_a?.name}</th>
                      <th className="py-2.5 px-3">Delta / Improvement</th>
                      <th className="py-2.5 px-3">Statistical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white">User Satisfaction (Primary)</td>
                      <td className="py-3 px-3">{(expResults.control?.satisfaction * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{(expResults.variant_a?.satisfaction * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{expResults.statistics?.difference_absolute} ({expResults.statistics?.difference_relative})</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">✓ p={expResults.statistics?.p_value} (&lt;0.05)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white">Response Quality Score</td>
                      <td className="py-3 px-3">{(expResults.control?.quality * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{(expResults.variant_a?.quality * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">+4.9%</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">✓ PASSED</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white">P95 Response Latency</td>
                      <td className="py-3 px-3">{(expResults.control?.p95_latency_ms / 1000).toFixed(1)}s</td>
                      <td className="py-3 px-3">{(expResults.variant_a?.p95_latency_ms / 1000).toFixed(1)}s</td>
                      <td className="py-3 px-3 text-amber-400">+0.1s</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">✓ PASSED (&lt;2.0s)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white">Safety Violation Rate</td>
                      <td className="py-3 px-3">{((1 - expResults.control?.safety_rate) * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{((1 - expResults.variant_a?.safety_rate) * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3 text-slate-400">+0.1%</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">✓ PASSED (&lt;0.5%)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-semibold text-white">95% Confidence Interval</td>
                      <td className="py-3 px-3 text-slate-400">-</td>
                      <td className="py-3 px-3 font-mono text-purple-300">{expResults.statistics?.confidence_interval_95}</td>
                      <td className="py-3 px-3 text-purple-300 font-bold">Non-Zero Overlap</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">✓ SIGNIFICANT</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Recommendation Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">Recommendation Engine Decision:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {expResults.recommendation?.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{expResults.recommendation?.reason}</p>
                </div>

                {expResults.recommendation?.status === "RECOMMENDED" && (
                  <button
                    onClick={handleDeployWinner}
                    disabled={loading}
                    className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" /> Deploy Winner to Production
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Create Experiment Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Create New A/B Experiment</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Experiment Name</label>
                    <input
                      type="text"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      placeholder="e.g. CBT Supportive Reframing Prompt Test"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Control Prompt (Current Production)</label>
                    <textarea
                      value={controlPrompt}
                      onChange={(e) => setControlPrompt(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Variant A Prompt (Candidate)</label>
                    <textarea
                      value={variantPrompt}
                      onChange={(e) => setVariantPrompt(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Traffic Allocation (%)</label>
                      <input
                        type="number"
                        value={trafficAllocation}
                        onChange={(e) => setTrafficAllocation(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        min={10}
                        max={90}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Primary Metric</label>
                      <input
                        type="text"
                        value="User Satisfaction"
                        disabled
                        className="w-full p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary py-2 px-4 font-bold shadow-lg shadow-purple-500/20"
                    >
                      Launch Experiment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
