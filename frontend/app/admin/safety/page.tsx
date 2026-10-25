"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safetyRiskAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ShieldAlert, ShieldCheck, PhoneCall, AlertTriangle, RefreshCw, Play,
  CheckCircle2, Shield, Heart, Activity, Globe, Info, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminSafetyRiskDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Tester Sandbox State
  const [testMessage, setTestMessage] = useState<string>("I feel overwhelmed, helpless, and I want to end my life tonight.");
  const [countryCode, setCountryCode] = useState<string>("US");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState<boolean>(false);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const [ov, ev, rs] = await Promise.all([
        safetyRiskAPI.getOverview(),
        safetyRiskAPI.getEvents(),
        safetyRiskAPI.getAdminResources(),
      ]);

      setOverview(ov.data);
      setEvents(ev.data.events || []);
      setResources(rs.data.resources || []);

      const initRes = await safetyRiskAPI.analyze("demo_conv_101", testMessage, countryCode);
      setTestResult(initRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Admin authorization required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load Safety Risk Engine dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchSafetyData();
  }, [user, authLoading, router]);

  const handleTestAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await safetyRiskAPI.analyze("demo_conv_101", testMessage, countryCode);
      setTestResult(res.data);
      if (res.data.risk_level === "SAFE") toast.success("Classification: SAFE");
      else toast.error(`Risk Classification: ${res.data.risk_level}`);
    } catch {
      toast.error("Safety risk analysis failed.");
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
        <Navbar title="Mental Health Safety Risk Engine" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Conservative Safety Risk Engine
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Non-Diagnostic Safety Support
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Classifies conversation context into SAFE, CONCERNING, HIGH_RISK, and IMMEDIATE_RISK. Overrides normal chat pipeline during elevated risk to dispatch verified regional emergency resources.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Total Safety Assessments</span>
              <p className="text-2xl font-extrabold text-white">{overview?.total_assessments}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Safe Conversations</span>
              <p className="text-2xl font-extrabold text-emerald-400">{overview?.safe_percentage}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">High &amp; Immediate Risk</span>
              <p className="text-2xl font-extrabold text-rose-400">
                {(overview?.distribution?.HIGH_RISK || 0) + (overview?.distribution?.IMMEDIATE_RISK || 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Safety Flow Activations</span>
              <p className="text-2xl font-extrabold text-amber-400">{overview?.safety_flow_activations}</p>
            </div>
          </div>

          {/* Live Safety Risk Inspection Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Live Conversation Safety Risk Analyzer
              </h3>

              <form onSubmit={handleTestAnalyze} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">User Input Message</label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono text-xs"
                    placeholder="e.g. I feel so hopeless and I want to end my life tonight"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Target Region (Helpline Lookup)</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  >
                    <option value="US">United States (988)</option>
                    <option value="IN">India (KIRAN 1800-599-0019)</option>
                    <option value="UK">United Kingdom (Samaritans 116 123)</option>
                    <option value="INTL">International Emergency (112)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={testing}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-500 border-none"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Analyze Safety Risk &amp; Response Flow
                </button>
              </form>
            </div>

            {/* Test Result Inspection Card */}
            {testResult && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Classification Output</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    testResult.risk_level === "SAFE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                    testResult.risk_level === "CONCERNING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                    "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {testResult.risk_level}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-500 font-semibold">Normalized Risk Score</span>
                    <p className="text-lg font-extrabold text-rose-400">{testResult.risk_score?.toFixed(1)} / 100.0</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-500 font-semibold">Pipeline Action</span>
                    <p className="text-sm font-extrabold text-white uppercase">{testResult.requires_safety_override ? "OVERRIDE NORMAL CHAT" : "ALLOW NORMAL CHAT"}</p>
                  </div>
                </div>

                {testResult.bot_response && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5"><PhoneCall className="w-4 h-4 text-rose-400" /> Non-Diagnostic Safety Flow Response:</span>
                    <p className="whitespace-pre-line text-xs font-mono">{testResult.bot_response}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emergency Helpline Database Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              Verified Regional Crisis Helpline Registry
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Country / Region</th>
                    <th className="p-2.5">Helpline Name</th>
                    <th className="p-2.5">Phone Number</th>
                    <th className="p-2.5">Verification Source</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-white">{res.country} ({res.region})</td>
                      <td className="p-2.5 font-semibold text-slate-200">{res.name}</td>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">{res.phone}</td>
                      <td className="p-2.5 text-slate-400">{res.source}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VERIFIED &amp; ACTIVE
                        </span>
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
