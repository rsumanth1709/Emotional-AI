"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { privacyAnalyticsAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  BarChart2, Shield, Lock, Download, RefreshCw, AlertTriangle, CheckCircle2,
  PieChart, TrendingUp, Layers, Activity, Languages, EyeOff, ShieldCheck, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function PrivacyPreservingAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);
  const [emotions, setEmotions] = useState<any[]>([]);
  const [intensity, setIntensity] = useState<any[]>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [quality, setQuality] = useState<any>(null);
  const [privacyStatus, setPrivacyStatus] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [ov, em, inB, tr, tg, lg, ql, pr] = await Promise.all([
        privacyAnalyticsAPI.getOverview(),
        privacyAnalyticsAPI.getEmotions(),
        privacyAnalyticsAPI.getIntensity(),
        privacyAnalyticsAPI.getTransitions(),
        privacyAnalyticsAPI.getTriggers(),
        privacyAnalyticsAPI.getLanguages(),
        privacyAnalyticsAPI.getQuality(),
        privacyAnalyticsAPI.getPrivacyStatus(),
      ]);

      setOverview(ov.data);
      setEmotions(em.data.emotions || []);
      setIntensity(inB.data.intensity_buckets || []);
      setTransitions(tr.data.transitions || []);
      setTriggers(tg.data.triggers || []);
      setLanguages(lg.data.languages || []);
      setQuality(ql.data.quality_scores || {});
      setPrivacyStatus(pr.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Admin authorization required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load privacy-preserving analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchAnalytics();
  }, [user, authLoading, router]);

  const handleExportAnalytics = async () => {
    try {
      const res = await privacyAnalyticsAPI.exportAnalytics();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privacy-protected-analytics-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast.success("Privacy-protected analytics exported!");
    } catch {
      toast.error("Export failed.");
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Privacy-Preserving Admin Analytics" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Differential Privacy Guarantees */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Privacy-Preserving System Analytics
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Zero PII Tracking
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Monitors system-level trends without exposing, reconstructing, or tracking individual users. Enforces small-group suppression ($N \ge 20$) and Laplace differential privacy ($\epsilon = 0.5$).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportAnalytics}
                className="btn-primary py-2 px-4 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
              >
                <Download className="w-4 h-4" />
                Export Privacy Analytics
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Total Sessions (Noised)</span>
              <p className="text-2xl font-extrabold text-cyan-400">{overview?.total_sessions}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Avg Latency</span>
              <p className="text-2xl font-extrabold text-emerald-400">{overview?.average_response_latency_sec} s</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Top Emotion</span>
              <p className="text-2xl font-extrabold text-pink-400 uppercase">{overview?.most_frequent_emotion}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Response Quality</span>
              <p className="text-2xl font-extrabold text-indigo-400">{overview?.average_quality_score}/100</p>
            </div>
          </div>

          {/* Emotion & Intensity Distribution Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Frequency Distribution */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <PieChart className="w-4 h-4 text-cyan-400" />
                Aggregate Emotion Frequency Distribution
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">Emotion</th>
                      <th className="p-2.5">Count (Noised)</th>
                      <th className="p-2.5">Privacy Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {emotions.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white uppercase">{row.emotion}</td>
                        <td className="p-2.5 font-mono text-cyan-400">{row.count}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            row.suppressed ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5-Bucket Intensity Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Aggregate Emotion Intensity Distribution
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">Intensity Range</th>
                      <th className="p-2.5">Count (Noised)</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {intensity.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white">{row.intensity_range}</td>
                        <td className="p-2.5 font-mono text-emerald-400">{row.count}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Multilingual Usage & Response Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multilingual Usage */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Languages className="w-4 h-4 text-cyan-400" />
                Multilingual Usage Distribution
              </h3>

              <div className="space-y-2 text-xs">
                {languages.map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white">{row.language}</span>
                    <span className="font-mono text-cyan-400 font-bold">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Dimensions */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Response Quality Evaluation (0-100 Aggregate)
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(quality || {}).map(([key, val]: any) => (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-500 font-semibold uppercase text-[9px]">{key.replace("_", " ")}</span>
                    <p className="text-lg font-extrabold text-emerald-400">{val}/100</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Observability Status Footer */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-cyan-400" />
              Internal Privacy Observability Status
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-500 font-semibold">Min Group Size</span>
                <p className="text-base font-extrabold text-cyan-400">N &ge; {privacyStatus?.min_group_size}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-500 font-semibold">Diff Privacy Epsilon</span>
                <p className="text-base font-extrabold text-emerald-400">&epsilon; = {privacyStatus?.epsilon}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-500 font-semibold">Small Groups Suppressed</span>
                <p className="text-base font-extrabold text-amber-400">{privacyStatus?.small_groups_suppressed_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-500 font-semibold">Privacy Budget Remaining</span>
                <p className="text-base font-extrabold text-indigo-400">{privacyStatus?.remaining_privacy_budget} / 10.0</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
