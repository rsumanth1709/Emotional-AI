"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hallucinationsAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  FileSearch, CheckCircle, AlertTriangle, RefreshCw, Info, Play,
  BarChart2, ShieldAlert, Sparkles, Layers, ArrowRight, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface VerifyResult {
  original_text: string;
  delivered_text: string;
  hallucination_score: number;
  severity: string;
  has_hallucination: boolean;
  was_rewritten: boolean;
  claims: Array<{
    claim_type: string;
    text: string;
    status: string;
    confidence: number;
    evidence?: string;
  }>;
}

export default function HallucinationDetectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [inputText, setInputText] = useState<string>("A Harvard study proved that this medication 100% cures anxiety.");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await hallucinationsAPI.getAnalytics();
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load hallucination analytics.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchAnalytics();
  }, [user, authLoading, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setVerifying(true);
    try {
      const res = await hallucinationsAPI.verifyResponse(inputText);
      setResult(res.data);
      toast.success("Claims verified!");
      fetchAnalytics();
    } catch {
      toast.error("Failed to verify hallucination.");
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const breakdown = analytics?.claims_breakdown || { medical_claims: 2, statistical_claims: 1, study_claims: 1, conversational: 6 };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Hallucination &amp; Unsupported-Claim Detection Layer" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Internal Operations Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <FileSearch className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Hallucination Detector
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Evidence Verification Engine
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Extract medical, statistical, and study claims, verify against trusted knowledge bases, and rewrite unsupported claims using uncertainty-aware safe language.
                  </p>
                </div>
              </div>
            </div>

            {/* Internal Operations Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>Internal Operations Notice:</strong> Hallucination scores, evidence verification, and claim extraction logs are internal audit metrics. Unsupported claims are rewritten before reaching end-users.
              </p>
            </div>
          </div>

          {/* KPI Metrics Summary Cards */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Average Hallucination Score</span>
                <p className="text-2xl font-extrabold text-cyan-400">{analytics.average_hallucination_score}</p>
                <span className="text-[10px] text-slate-500">0.0 (None) – 1.0 (High)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Hallucination Detection Rate</span>
                <p className="text-2xl font-extrabold text-rose-400">{analytics.hallucination_rate}</p>
                <span className="text-[10px] text-slate-500">Unsupported Claims Intercepted</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Audited Responses</span>
                <p className="text-2xl font-extrabold text-white">{analytics.total_audited_responses}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">Verified by Guard</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Medical Claims Verified</span>
                <p className="text-2xl font-extrabold text-amber-400">{breakdown.medical_claims}</p>
                <span className="text-[10px] text-slate-500">High-Risk Filtered</span>
              </div>
            </div>
          )}

          {/* Interactive Verifier Sandbox Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileSearch className="w-4 h-4 text-cyan-400" />
                Live Response Claim Verifier Sandbox
              </h3>

              <form onSubmit={handleVerify} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Candidate Response Text</label>
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter response text containing medical, statistical, or study claims to test verification..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Verify Claims &amp; Apply Uncertainty Rewriting
                </button>
              </form>
            </div>

            {/* Verification Result Card */}
            {result && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verification Result Payload</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    result.has_hallucination ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    Severity: {result.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Hallucination Score</span>
                    <p className="text-base font-extrabold text-cyan-400">{result.hallucination_score} / 1.0</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Uncertainty Rewritten</span>
                    <p className={`text-base font-extrabold ${result.was_rewritten ? "text-amber-400" : "text-slate-300"}`}>
                      {result.was_rewritten ? "YES (Rewritten)" : "NO (Original Safe)"}
                    </p>
                  </div>
                </div>

                {/* Extracted Claims List */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold">Extracted &amp; Classified Claims</span>
                  <div className="space-y-1.5">
                    {result.claims.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {c.claim_type.replace("_", " ")}
                          </span>
                          <span className={`font-bold capitalize ${c.status === "supported" ? "text-emerald-400" : "text-rose-400"}`}>
                            Status: {c.status}
                          </span>
                        </div>
                        <p className="text-white font-mono">&ldquo;{c.text}&rdquo;</p>
                        {c.evidence && <p className="text-slate-400 text-[10px] italic">Evidence: {c.evidence}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Delivered Text Payload */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold">Final Delivered Response Payload:</span>
                  <p className="text-white font-mono text-[11px]">&ldquo;{result.delivered_text}&rdquo;</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
