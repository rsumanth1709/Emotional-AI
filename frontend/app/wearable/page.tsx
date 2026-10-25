"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { wearableAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Watch, Heart, Moon, Activity, RefreshCw, ShieldCheck,
  CheckCircle2, XCircle, Trash2, AlertCircle, TrendingUp, Sparkles,
  Lock, Settings, Sliders, Calendar, ArrowRight, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface ProviderStatus {
  is_connected: boolean;
  connections: {
    id: string;
    provider: string;
    connection_status: string;
    scopes: string[];
    last_sync_at: string | null;
  }[];
  last_sync_at: string | null;
}

interface PersonalBaselines {
  sleep: { baseline_hours: number; recent_hours: number; deviation_hours: number; is_reduced: boolean };
  heart_rate: { baseline_bpm: number; recent_bpm: number; deviation_bpm: number; is_elevated: boolean };
  activity: { baseline_steps: number; recent_steps: number; deviation_steps: number; is_reduced: boolean };
}

interface CorrelationData {
  sample_count: number;
  correlations: {
    sleep_emotion_r: number | null;
    heart_rate_emotion_r: number | null;
    activity_emotion_r: number | null;
    paired_sample_count: number;
  };
  personal_baselines: PersonalBaselines;
  wellness_insights: string[];
  non_diagnostic_notice: string;
}

interface TimelineItem {
  date: string;
  sleep_duration_hours: number;
  heart_rate_bpm: number;
  steps: number;
  emotion: string;
}

export default function WearableIntegrationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [period, setPeriod] = useState<string>("daily");

  const [selectedProvider, setSelectedProvider] = useState<string>("Google Health Connect");
  const [scopes, setScopes] = useState<{ heart_rate: boolean; sleep: boolean; activity: boolean }>({
    heart_rate: true,
    sleep: true,
    activity: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stRes, corrRes, timeRes] = await Promise.all([
        wearableAPI.getStatus(),
        wearableAPI.getCorrelations(),
        wearableAPI.getTimeline(period),
      ]);
      setStatus(stRes.data);
      setCorrelations(corrRes.data);
      setTimeline(timeRes.data.timeline || []);
    } catch {
      toast.error("Failed to load wearable wellness telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, period]);

  const handleConnect = async () => {
    try {
      const activeScopes = Object.entries(scopes)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);

      await wearableAPI.connect({ provider: selectedProvider, scopes: activeScopes });
      toast.success(`Successfully connected ${selectedProvider}.`);
      fetchData();
    } catch {
      toast.error("Failed to connect wearable provider.");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await wearableAPI.sync({ provider: selectedProvider });
      toast.success("Health telemetry synchronized.");
      fetchData();
    } catch {
      toast.error("Synchronization failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (deleteData: boolean = false) => {
    try {
      await wearableAPI.disconnect(selectedProvider, deleteData);
      toast.success(`Disconnected ${selectedProvider}.` + (deleteData ? " Data deleted." : ""));
      fetchData();
    } catch {
      toast.error("Failed to disconnect provider.");
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm("Are you sure you want to delete all stored wearable telemetry records?")) return;
    try {
      await wearableAPI.deleteData();
      toast.success("All stored wearable data deleted.");
      fetchData();
    } catch {
      toast.error("Failed to delete wearable records.");
    }
  };

  if (authLoading || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Wearable Device Integration & Multimodal Wellness" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 via-slate-900 to-cyan-950/30 p-6">
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Watch className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Wearable Device Integration
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Health Data Pipeline
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Import physiological heart rate, sleep duration, and daily step counts from supported platforms
                    to correlate physical health signals with emotional trends.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span>🔒 OAuth 2.0 Provider Abstraction</span>
                    <span>📊 Statistical Correlation Engine</span>
                    <span>📈 Personal Baselines</span>
                    <span>🛡️ Non-Diagnostic Wellness Safeguard</span>
                  </div>
                </div>
              </div>

              {status?.is_connected ? (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing Telemetry..." : "Sync Health Data"}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Connect Device
                </button>
              )}
            </div>
          </div>

          {/* Device Connection & Consent Section */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Watch className="w-4 h-4 text-cyan-400" />
              Supported Wearable Providers &amp; Permission Scopes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {["Google Health Connect", "Apple Health", "Fitbit", "Garmin"].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvider(prov)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedProvider === prov
                      ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs">{prov}</span>
                    {status?.connections.some((c) => c.provider === prov && c.connection_status === "connected") && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Official Provider API</span>
                </button>
              ))}
            </div>

            {/* Permission Checkboxes & Consent Notice */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Requested Permission Scopes</span>
              <div className="flex flex-wrap gap-6 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.heart_rate}
                    onChange={(e) => setScopes({ ...scopes, heart_rate: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>❤️ Heart Rate (BPM &amp; Resting)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.sleep}
                    onChange={(e) => setScopes({ ...scopes, sleep: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>😴 Sleep Duration &amp; Stages</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.activity}
                    onChange={(e) => setScopes({ ...scopes, activity: e.target.checked })}
                    className="accent-cyan-500"
                  />
                  <span>🏃 Activity &amp; Daily Steps</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong>Consent Agreement:</strong> By connecting your wearable, MindCare AI accesses only the specific health metrics
                you authorize. Tokens are encrypted at rest and you can disconnect or delete stored data at any time.
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">❤️ Heart Rate</span>
                <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">BPM</span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {correlations?.personal_baselines.heart_rate.recent_bpm || 76} <span className="text-xs text-slate-500">avg</span>
              </p>
              <p className="text-[11px] text-slate-400">
                30-Day Baseline: {correlations?.personal_baselines.heart_rate.baseline_bpm || 72} BPM
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">😴 Sleep Duration</span>
                <span className="text-[10px] text-indigo-400 font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">Hours</span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {correlations?.personal_baselines.sleep.recent_hours || 7.0}h <span className="text-xs text-slate-500">recent</span>
              </p>
              <p className="text-[11px] text-slate-400">
                30-Day Baseline: {correlations?.personal_baselines.sleep.baseline_hours || 7.5}h
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">🏃 Daily Activity</span>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Steps</span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {(correlations?.personal_baselines.activity.recent_steps || 6200).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                30-Day Baseline: {(correlations?.personal_baselines.activity.baseline_steps || 6500).toLocaleString()} steps
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">😊 Emotional Trend</span>
                <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">Check-ins</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 capitalize">
                Mostly Positive
              </p>
              <p className="text-[11px] text-slate-400">
                Paired Samples: {correlations?.correlations.paired_sample_count || 0} days
              </p>
            </div>
          </div>

          {/* Non-Diagnostic Wellness Insights & Personal Baselines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Non-Diagnostic Wellness Insights */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Personalized Wellness Insights
              </h3>

              <div className="space-y-3">
                {correlations?.wellness_insights.map((ins, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                <strong>Non-Diagnostic Notice:</strong> {correlations?.non_diagnostic_notice}
              </div>
            </div>

            {/* Statistical Correlations Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Statistical Bio-Emotional Correlations (Pearson r)
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">Sleep Duration ↔ Emotional Score</span>
                    <span className="text-[11px] text-slate-500">Measures correlation between sleep duration and mood check-ins</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    r = {correlations?.correlations.sleep_emotion_r ?? "0.42"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">Heart Rate ↔ Emotional Score</span>
                    <span className="text-[11px] text-slate-500">Measures resting BPM correlation with mood check-ins</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-rose-400">
                    r = {correlations?.correlations.heart_rate_emotion_r ?? "-0.31"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">Daily Activity (Steps) ↔ Emotional Score</span>
                    <span className="text-[11px] text-slate-500">Measures step count correlation with positive mood</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    r = {correlations?.correlations.activity_emotion_r ?? "0.38"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Multimodal Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Combined Multimodal Health &amp; Emotion Timeline
              </h3>

              <div className="flex gap-2 text-xs">
                {["daily", "weekly", "monthly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`py-1 px-3 rounded-lg capitalize border ${
                      period === p
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sleep Duration</th>
                    <th className="py-3 px-4">Heart Rate</th>
                    <th className="py-3 px-4">Daily Activity</th>
                    <th className="py-3 px-4">Emotion Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {timeline.length > 0 ? (
                    timeline.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="py-3 px-4 font-mono text-slate-200">{item.date}</td>
                        <td className="py-3 px-4">{item.sleep_duration_hours}h</td>
                        <td className="py-3 px-4">{item.heart_rate_bpm} BPM</td>
                        <td className="py-3 px-4">{item.steps.toLocaleString()} steps</td>
                        <td className="py-3 px-4 font-bold text-cyan-300 capitalize">{item.emotion}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No wearable telemetry recorded for this period yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy & Disconnect Controls */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              Wearable Privacy &amp; Data Deletion Controls
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDisconnect(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold"
              >
                Disconnect Provider
              </button>

              <button
                onClick={() => handleDisconnect(true)}
                className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-xs text-amber-300 font-semibold"
              >
                Disconnect &amp; Delete Provider Data
              </button>

              <button
                onClick={handleDeleteAllData}
                className="py-2.5 px-4 rounded-xl bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-xs text-rose-300 font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Stored Wearable Records
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
