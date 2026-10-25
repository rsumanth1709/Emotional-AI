"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { evaluationAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Info, Play,
  BarChart2, Award, Zap, Sparkles, Layers, ShieldAlert, Cpu
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface EvalResult {
  delivered_text: string;
  status: string;
  overall_score: number;
  safety_passed: boolean;
  used_fallback: boolean;
  regeneration_count: number;
  scores: {
    empathy: number;
    relevance: number;
    helpfulness: number;
    safety: number;
    factual_reliability: number;
    repetition: number;
    tone_appropriateness: number;
  };
}

export default function QualityEvaluationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [userMsg, setUserMsg] = useState<string>("I feel overwhelmed with everything.");
  const [candidateResp, setCandidateResp] = useState<string>("It sounds like you are dealing with a lot right now. We can take this one step at a time.");
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<EvalResult | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await evaluationAPI.getAnalytics();
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load evaluation analytics.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchAnalytics();
  }, [user, authLoading, router]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMsg.trim() || !candidateResp.trim()) return;
    setEvaluating(true);
    try {
      const res = await evaluationAPI.evaluateResponse(userMsg, candidateResp);
      setResult(res.data);
      toast.success("Response evaluated!");
      fetchAnalytics();
    } catch {
      toast.error("Failed to evaluate response.");
    } finally {
      setEvaluating(false);
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const dimAvgs = analytics?.dimension_averages || {
    empathy: 90.0, relevance: 92.0, helpfulness: 88.0, safety: 98.0,
    factual_reliability: 91.0, repetition: 95.0, tone_appropriateness: 90.0
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Automated Conversation Quality Evaluation System" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Internal Operations Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Conversation Quality Evaluator
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Pre-Delivery Validation Layer
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Automatically evaluates every generated response across 7 core quality dimensions prior to delivery. Enforces safety-first hard gates and targeted prompt regeneration.
                  </p>
                </div>
              </div>
            </div>

            {/* Internal Operations Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Internal Operations Notice:</strong> Evaluation scores, safety gating rules, and model reasoning are internal validation metrics for quality control. They are <strong>NEVER</strong> exposed to end-users by default.
              </p>
            </div>
          </div>

          {/* Operations KPI Metrics Cards */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Overall Average Score</span>
                <p className="text-2xl font-extrabold text-emerald-400">{analytics.average_overall_score} / 100</p>
                <span className="text-[10px] text-slate-500">7-Dimension Weighted Average</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Pass Rate</span>
                <p className="text-2xl font-extrabold text-white">{analytics.pass_rate}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">Pre-Delivery Approval</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Fallback Strategy Rate</span>
                <p className="text-2xl font-extrabold text-rose-400">{analytics.fallback_rate}</p>
                <span className="text-[10px] text-slate-500">Unsafe / Failed Interceptions</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Total Evaluated Responses</span>
                <p className="text-2xl font-extrabold text-white">{analytics.total_evaluations}</p>
                <span className="text-[10px] text-cyan-400 font-semibold">Pre-Delivery Gate</span>
              </div>
            </div>
          )}

          {/* Interactive Evaluation Sandbox Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Live Pre-Delivery Response Evaluator Sandbox
              </h3>

              <form onSubmit={handleEvaluate} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">User Input Message</label>
                  <textarea
                    rows={2}
                    value={userMsg}
                    onChange={(e) => setUserMsg(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Candidate Response Text</label>
                  <textarea
                    rows={3}
                    value={candidateResp}
                    onChange={(e) => setCandidateResp(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={evaluating}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Evaluate 7 Dimensions &amp; Validate Safety
                </button>
              </form>
            </div>

            {/* Evaluation Result Card */}
            {result && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation Payload</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    result.status === "pass" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    Status: {result.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Overall Weighted Score</span>
                    <p className="text-base font-extrabold text-emerald-400">{result.overall_score} / 100</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Safety Gate Result</span>
                    <p className={`text-base font-extrabold ${result.safety_passed ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.safety_passed ? "PASSED" : "FAILED / UNSAFE"}
                    </p>
                  </div>
                </div>

                {/* 7 Dimensions List */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold">7 Quality Dimension Breakdown</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Empathy (15%):</span>
                      <strong className="text-white">{result.scores.empathy}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Relevance (20%):</span>
                      <strong className="text-white">{result.scores.relevance}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Helpfulness (20%):</span>
                      <strong className="text-white">{result.scores.helpfulness}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Safety (20%):</span>
                      <strong className="text-emerald-400">{result.scores.safety}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Factual Rel. (15%):</span>
                      <strong className="text-white">{result.scores.factual_reliability}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Repetition (5%):</span>
                      <strong className="text-white">{result.scores.repetition}</strong>
                    </div>
                  </div>
                </div>

                {/* Final Delivered Text */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold">Final Delivered Text Payload:</span>
                  <p className="text-white font-mono text-[11px]">&ldquo;{result.delivered_text}&rdquo;</p>
                </div>
              </div>
            )}
          </div>

          {/* 7 Dimension Operations Benchmark Gauges */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Operational 7-Dimension Quality Benchmarks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Empathy</span>
                  <span className="text-emerald-400">{dimAvgs.empathy} / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dimAvgs.empathy}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Relevance</span>
                  <span className="text-emerald-400">{dimAvgs.relevance} / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dimAvgs.relevance}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Helpfulness</span>
                  <span className="text-emerald-400">{dimAvgs.helpfulness} / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dimAvgs.helpfulness}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Safety</span>
                  <span className="text-emerald-400">{dimAvgs.safety} / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dimAvgs.safety}%` }} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
