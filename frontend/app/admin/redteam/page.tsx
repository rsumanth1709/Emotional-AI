"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { redteamAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Flame, ShieldCheck, Play, RefreshCw, AlertTriangle, CheckCircle2,
  GitCommit, Activity, ShieldAlert, BarChart2, Layers, Cpu, Compass
} from "lucide-react";
import toast from "react-hot-toast";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminRedTeamDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [regressions, setRegressions] = useState<any[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [selectedSuite, setSelectedSuite] = useState<string>("");

  const fetchRedTeamData = async () => {
    try {
      setLoading(true);
      const [mt, rn, rg] = await Promise.all([
        redteamAPI.getMetrics(),
        redteamAPI.getRuns(),
        redteamAPI.getRegressions(),
      ]);

      setMetrics(mt.data);
      setRuns(rn.data.runs || []);
      setRegressions(rg.data.regressions || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Admin authorization required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load Red-Team evaluation dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchRedTeamData();
  }, [user, authLoading, router]);

  const handleRunSuite = async () => {
    try {
      setRunning(true);
      toast.loading("Executing Red-Team Benchmark Suite…");
      const res = await redteamAPI.runSuite(selectedSuite || undefined);
      toast.dismiss();
      toast.success(`Red-Team Run completed! Run ID: ${res.data.run_id}`);
      fetchRedTeamData();
    } catch {
      toast.dismiss();
      toast.error("Red-team run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSetBaseline = async (runId: string) => {
    try {
      await redteamAPI.setBaseline(runId);
      toast.success("Run marked as reference baseline!");
      fetchRedTeamData();
    } catch {
      toast.error("Failed to set baseline.");
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Red-Team Safety Benchmarking" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Automated AI Red-Team Framework
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Adversarial Safety Evaluation
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Continuously benchmarks MindCare AI against 10 adversarial categories: Harmful Requests, Crisis, Medical Misinformation, Prompt Injection, Manipulation, Toxic Language, Ambiguous Emotion, Sarcasm, Code-Mixed, and Adversarial Inputs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedSuite}
                  onChange={(e) => setSelectedSuite(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">All Test Categories</option>
                  <option value="harmful_requests">Harmful Requests</option>
                  <option value="crisis_scenarios">Crisis Scenarios</option>
                  <option value="medical_misinformation">Medical Misinformation</option>
                  <option value="prompt_injection">Prompt Injection</option>
                  <option value="manipulation">Manipulation</option>
                  <option value="toxic_language">Toxic Language</option>
                  <option value="code_mixed">Code-Mixed</option>
                  <option value="adversarial">Adversarial Inputs</option>
                </select>

                <button
                  type="button"
                  onClick={handleRunSuite}
                  disabled={running}
                  className="btn-primary py-2 px-4 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-500 border-none"
                >
                  {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Trigger Red-Team Suite
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Benchmark Runs</span>
              <p className="text-2xl font-extrabold text-white">{metrics?.total_benchmark_runs}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Average Pass Rate</span>
              <p className="text-2xl font-extrabold text-emerald-400">{metrics?.average_pass_rate}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Active Test Cases</span>
              <p className="text-2xl font-extrabold text-amber-400">{metrics?.total_active_test_cases}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Deployment Gate Status</span>
              <p className={`text-2xl font-extrabold ${metrics?.deployment_gate_status === "PASSED" ? "text-emerald-400" : "text-rose-400"}`}>
                {metrics?.deployment_gate_status}
              </p>
            </div>
          </div>

          {/* Recent Benchmark Runs Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Recent Red-Team Execution Runs
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Run ID</th>
                    <th className="p-2.5">Model Version</th>
                    <th className="p-2.5">Pass / Fail / Review</th>
                    <th className="p-2.5">Pass Rate</th>
                    <th className="p-2.5">Baseline</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">{r.id.slice(0, 8)}…</td>
                      <td className="p-2.5 font-bold text-white">{r.model_version}</td>
                      <td className="p-2.5">
                        <span className="text-emerald-400 font-bold">{r.passed}</span> /{" "}
                        <span className="text-rose-400 font-bold">{r.failed}</span> /{" "}
                        <span className="text-amber-400 font-bold">{r.review}</span>
                      </td>
                      <td className="p-2.5 font-extrabold text-emerald-400">{r.overall_score.toFixed(1)}%</td>
                      <td className="p-2.5">
                        {r.is_baseline ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            REFERENCE BASELINE
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Standard Run</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {!r.is_baseline && (
                          <button
                            type="button"
                            onClick={() => handleSetBaseline(r.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white"
                          >
                            Set Baseline
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
