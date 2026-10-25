"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { transitionsAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  GitCommit, Activity, RefreshCw, AlertTriangle, ShieldCheck, Info,
  TrendingUp, Clock, Layers, ArrowRight, CheckCircle, BarChart2
} from "lucide-react";
import toast from "react-hot-toast";

interface TimelineEvent {
  turn: number;
  emotion: string;
  intensity: number;
  confidence: number;
  transition?: string;
  timestamp?: string;
}

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function TransitionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>("conv_001");
  const [analysis, setAnalysis] = useState<any>(null);

  const fetchTransitionData = async () => {
    setLoading(true);
    try {
      const res = await transitionsAPI.getConsolidatedAnalysis(conversationId);
      setAnalysis(res.data);
    } catch {
      toast.error("Failed to load emotion transition analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchTransitionData();
  }, [user, authLoading, router, conversationId]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const timeline: TimelineEvent[] = analysis?.timeline || [];
  const volatility = analysis?.volatility;
  const transitions = analysis?.transitions || [];
  const suddenChanges = analysis?.sudden_changes || [];
  const prolonged = analysis?.prolonged_negative_periods || [];

  const latestTransition = transitions.length > 0 ? transitions[transitions.length - 1] : null;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotion Transition Detection System" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Non-Clinical Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <GitCommit className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Emotion Transition Engine
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Turn-by-Turn Tracking
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Analyze conversation emotional state transitions, calculate emotional volatility, detect sudden changes, and visualize interactive emotional timelines.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchTransitionData}
                disabled={loading}
                className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Analytics
              </button>
            </div>

            {/* Non-Clinical Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>Non-Clinical Notice:</strong> Emotion transition patterns and volatility scores are AI-generated descriptive signals for conversation reflection. They do <strong>NOT</strong> represent medical diagnoses or clinical psychological assessments.
              </p>
            </div>
          </div>

          {/* Consolidated Analytics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Latest Transition Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Latest Transition</span>
              {latestTransition ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-base font-extrabold text-white">
                    <span className="capitalize">{latestTransition.from_emotion}</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                    <span className="capitalize text-cyan-300">{latestTransition.to_emotion}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Strength: <strong>{(latestTransition.strength * 100).toFixed(0)}%</strong> • Turn #{latestTransition.to_turn}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No transitions recorded yet.</p>
              )}
            </div>

            {/* Volatility Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Emotional Volatility</span>
              {volatility && (
                <div className="space-y-1">
                  <p className="text-2xl font-extrabold text-rose-400">{volatility.score} / 100</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Category: {volatility.category}
                  </span>
                </div>
              )}
            </div>

            {/* Sudden Changes Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Sudden Emotional Changes</span>
              <p className="text-2xl font-extrabold text-amber-400">{suddenChanges.length}</p>
              <span className="text-[10px] text-slate-500">Large state shifts detected</span>
            </div>

            {/* Prolonged Periods Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400">Prolonged Negative Periods</span>
              <p className="text-2xl font-extrabold text-indigo-400">{prolonged.length}</p>
              <span className="text-[10px] text-slate-500">Sustained negative sequences</span>
            </div>
          </div>

          {/* Interactive Turn-by-Turn Emotion Timeline Graph Node Flow */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              Interactive Turn-by-Turn Emotion Timeline Graph
            </h3>

            {/* Connected Node Flow */}
            <div className="flex flex-wrap items-center gap-3 py-4 overflow-x-auto">
              {timeline.map((evt, idx) => (
                <div key={evt.turn} className="flex items-center gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 min-w-[120px] text-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Turn #{evt.turn}</span>
                    <h4 className="font-extrabold text-white text-sm capitalize">{evt.emotion}</h4>
                    <p className="text-[11px] text-cyan-400 font-bold">Intensity: {evt.intensity}</p>
                  </div>

                  {idx < timeline.length - 1 && (
                    <div className="flex flex-col items-center text-slate-500">
                      <ArrowRight className="w-5 h-5 text-cyan-400" />
                      {evt.transition && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {evt.transition}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Events Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              Chronological Emotion Timeline Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Turn #</th>
                    <th className="py-2.5 px-3">Emotion State</th>
                    <th className="py-2.5 px-3">Intensity</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Transition Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {timeline.map((evt) => (
                    <tr key={evt.turn} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-400 font-mono">{evt.timestamp || "10:00 AM"}</td>
                      <td className="py-3 px-3 font-bold text-white">#{evt.turn}</td>
                      <td className="py-3 px-3 capitalize font-bold text-cyan-300">{evt.emotion}</td>
                      <td className="py-3 px-3 font-bold text-rose-400">{evt.intensity}</td>
                      <td className="py-3 px-3">{(evt.confidence * 100).toFixed(0)}%</td>
                      <td className="py-3 px-3">
                        {evt.transition ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {evt.transition}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
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
