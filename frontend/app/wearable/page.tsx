"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { wearableAPI } from "@/lib/axios";
import type { WearableSummary, WearableFusionData, WearableLogEntry } from "@/types";
import { toast } from "react-hot-toast";
import {
  Heart, Activity, Moon, Zap, Bluetooth, Radio, RefreshCw,
  TrendingUp, TrendingDown, Minus, Watch, Wind, Footprints,
  Brain, ShieldCheck, AlertTriangle, CheckCircle2, Clock, BarChart3
} from "lucide-react";

// ─── Sparkline SVG Chart Component ──────────────────────────────────────────
function Sparkline({
  data, color, height = 40, width = 120
}: { data: number[]; color: string; height?: number; width?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ─── Radial gauge ───────────────────────────────────────────────────────────
function RadialGauge({ value, max = 100, label, color, size = 96 }: {
  value: number; max?: number; label: string; color: string; size?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Trend Badge ─────────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend: "improving" | "stable" | "worsening" }) {
  const map = {
    improving: { icon: TrendingDown, label: "Improving", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    stable: { icon: Minus, label: "Stable", cls: "text-slate-300 bg-slate-800/60 border-slate-700" },
    worsening: { icon: TrendingUp, label: "Worsening", cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  };
  const { icon: Icon, label, cls } = map[trend];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Sleep Stage Bar ─────────────────────────────────────────────────────────
function SleepBar({ sleepHours, remPct }: { sleepHours: number; remPct: number }) {
  const deep = Math.round((sleepHours * 0.20) * 10) / 10;
  const rem = Math.round((sleepHours * (remPct / 100)) * 10) / 10;
  const light = Math.round((sleepHours - deep - rem) * 10) / 10;
  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-3 w-full gap-px">
        <div style={{ width: `${(light / sleepHours) * 100}%` }} className="bg-indigo-400/60" title={`Light ${light}h`} />
        <div style={{ width: `${(rem / sleepHours) * 100}%` }} className="bg-violet-500" title={`REM ${rem}h`} />
        <div style={{ width: `${(deep / sleepHours) * 100}%` }} className="bg-cyan-500" title={`Deep ${deep}h`} />
      </div>
      <div className="flex items-center gap-4 text-[10px] font-semibold">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400/60 inline-block" /> Light {light}h</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> REM {rem}h</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> Deep {deep}h</span>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function WearablePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const [fusion, setFusion] = useState<WearableFusionData | null>(null);
  const [history, setHistory] = useState<WearableLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [connected, setConnected] = useState(true);
  const [days, setDays] = useState(7);

  // Manual input state for logging
  const [bpm, setBpm] = useState(78);
  const [hrv, setHrv] = useState(42);
  const [sleepH, setSleepH] = useState(7.0);
  const [remPct, setRemPct] = useState(20);
  const [steps, setSteps] = useState(7500);
  const [eda, setEda] = useState(2.5);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, fusRes, histRes] = await Promise.all([
        wearableAPI.getSummary(days),
        wearableAPI.getFusion(5.0),
        wearableAPI.getHistory(20),
      ]);
      setSummary(sumRes.data);
      setFusion(fusRes.data);
      setHistory(histRes.data);
    } catch {
      // no-op — backend may be offline, will show placeholders
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const handleLogBiometrics = async () => {
    setLogging(true);
    try {
      await wearableAPI.logBiometrics({
        heart_rate_bpm: bpm,
        hrv_ms: hrv,
        sleep_hours: sleepH,
        rem_sleep_percentage: remPct,
        step_count: steps,
        skin_conductance: eda,
      });
      toast.success("✅ Biometrics logged successfully!");
      await fetchAll();
    } catch {
      toast.error("Failed to log biometrics");
    } finally {
      setLogging(false);
    }
  };

  const handleBluetoothPair = () => {
    toast.loading("Scanning for BLE GATT Heart Rate Service (0x180D)...", { duration: 1800 });
    setTimeout(() => {
      setConnected(true);
      toast.success("🔗 Smartwatch paired via Bluetooth PPG sensor!");
    }, 2000);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-pink-400" />
        Loading Wearable Dashboard...
      </div>
    );
  }

  const bpmData = history.slice().reverse().map(h => h.heart_rate_bpm);
  const hrvData = history.slice().reverse().map(h => h.hrv_ms);
  const sleepData = history.slice().reverse().map(h => h.sleep_hours);
  const stepData = history.slice().reverse().map(h => h.step_count);

  const ansState = fusion?.autonomic_nervous_system_state ?? "";
  const isCritical = fusion && fusion.fused_bio_emotional_stress_score >= 7;
  const isOptimal = fusion && fusion.fused_bio_emotional_stress_score <= 3.5;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Wearable Integration" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 via-slate-900 to-violet-950/40 p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(236,72,153,0.08)_0%,_transparent_60%)]" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                    <Watch className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">Wearable Integration</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Smartwatch biometrics enriching your emotional intelligence</p>
                  </div>
                </div>
                <p className="text-slate-500 text-xs max-w-lg">
                  MindCare AI fuses your heart rate, HRV, and sleep patterns with text-based emotion detection for a holistic
                  Bio-Emotional Stress Index — giving your AI therapist the full physiological picture.
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${connected
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  {connected
                    ? <><Radio className="w-3.5 h-3.5 animate-ping" /> Apple Watch / Galaxy Watch (Simulated BLE)</>
                    : <><Bluetooth className="w-3.5 h-3.5" /> No Device Paired</>
                  }
                </div>
                <div className="flex gap-2">
                  <button onClick={handleBluetoothPair} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                    <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                    {connected ? "Re-pair Device" : "Pair Smartwatch"}
                  </button>
                  <button onClick={fetchAll} disabled={loading} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bio-Emotional Fusion Alert ───────────────────────────────── */}
          {fusion && (
            <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
              isCritical
                ? "bg-rose-950/30 border-rose-500/30"
                : isOptimal
                ? "bg-emerald-950/30 border-emerald-500/30"
                : "bg-amber-950/20 border-amber-500/20"
            }`}>
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                isCritical ? "bg-rose-500/10 text-rose-400" : isOptimal ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {isCritical ? <AlertTriangle className="w-5 h-5" /> : isOptimal ? <CheckCircle2 className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${isCritical ? "text-rose-300" : isOptimal ? "text-emerald-300" : "text-amber-300"}`}>
                    Fused Bio-Emotional Stress: {fusion.fused_bio_emotional_stress_score}/10
                  </span>
                  <span className="text-xs text-slate-400">• Confidence: {Math.round(fusion.biometric_fusion_confidence * 100)}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{ansState}</p>
                <p className="text-xs mt-0.5 font-semibold text-slate-300">Recovery: {fusion.recovery_status}</p>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-2xl font-black text-white">{fusion.fused_bio_emotional_stress_score}</div>
                <div className="text-[10px] text-slate-400">/ 10</div>
              </div>
            </div>
          )}

          {/* ── 4 Key Metrics ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Heart Rate", value: `${summary?.avg_heart_rate_bpm ?? 72}`, unit: "BPM",
                icon: Heart, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20",
                data: bpmData, lineColor: "#f87171", sub: "7-day average PPG"
              },
              {
                label: "Heart Rate Variability", value: `${summary?.avg_hrv_ms ?? 45}`, unit: "ms",
                icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20",
                data: hrvData, lineColor: "#22d3ee", sub: "Autonomic tone index"
              },
              {
                label: "Sleep Duration", value: `${summary?.avg_sleep_hours ?? 7.5}`, unit: "h",
                icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20",
                data: sleepData, lineColor: "#818cf8", sub: "Avg nightly rest"
              },
              {
                label: "Daily Steps", value: `${(summary?.avg_step_count ?? 6200).toLocaleString()}`, unit: "steps",
                icon: Footprints, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
                data: stepData.map(s => s / 1000), lineColor: "#34d399", sub: "Activity goal tracking"
              },
            ].map(({ label, value, unit, icon: Icon, color, bg, data, lineColor, sub }) => (
              <div key={label} className={`glass-dark p-4 space-y-3 border ${bg}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{label}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">{value}</span>
                    <span className={`text-xs font-bold ${color}`}>{unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                </div>
                <Sparkline data={data.length > 1 ? data : [value as unknown as number, value as unknown as number]} color={lineColor} height={36} />
              </div>
            ))}
          </div>

          {/* ── Gauges Row ────────────────────────────────────────────────── */}
          <div className="glass-dark border border-slate-800/60 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-400" /> Wellness Index Scores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Derived from {summary?.total_readings ?? 0} biometric readings over {days} days</p>
              </div>
              {summary && <TrendBadge trend={summary.trend} />}
            </div>
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <RadialGauge value={summary?.sleep_quality_score ?? 75} label="Sleep Quality" color="#818cf8" />
              <RadialGauge value={summary?.recovery_index ?? 72} label="Recovery Index" color="#22d3ee" />
              <RadialGauge value={fusion ? Math.max(0, 100 - fusion.fused_bio_emotional_stress_score * 10) : 65} label="Stress Resilience" color="#34d399" />
              <RadialGauge value={fusion ? Math.round(fusion.biometric_fusion_confidence * 100) : 94} label="AI Confidence" color="#a78bfa" />
            </div>
          </div>

          {/* ── Sleep Architecture + Log Panel ──────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sleep Architecture */}
            <div className="glass-dark border border-indigo-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Sleep Architecture</h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Last Night</span>
                  <span className="font-bold text-white">{summary?.avg_sleep_hours ?? 7.5}h total</span>
                </div>
                <SleepBar sleepHours={summary?.avg_sleep_hours ?? 7.5} remPct={summary?.avg_rem_percentage ?? 22} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">REM Sleep</span>
                  <span className="text-lg font-extrabold text-violet-300">{summary?.avg_rem_percentage ?? 22}%</span>
                  <span className="text-[10px] text-slate-500">Target: 20–25%</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Sleep Score</span>
                  <span className="text-lg font-extrabold text-indigo-300">{summary?.sleep_quality_score ?? 75}/100</span>
                  <span className="text-[10px] text-slate-500">
                    {(summary?.sleep_quality_score ?? 75) >= 80 ? "Excellent" : (summary?.sleep_quality_score ?? 75) >= 60 ? "Good" : "Needs Improvement"}
                  </span>
                </div>
              </div>
            </div>

            {/* Log Manual Reading */}
            <div className="glass-dark border border-pink-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-white">Log Biometrics</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "❤️ Heart Rate", value: bpm, set: setBpm, min: 45, max: 150, unit: "BPM", color: "accent-red-500" },
                  { label: "⚡ HRV", value: hrv, set: setHrv, min: 10, max: 120, unit: "ms", color: "accent-cyan-500" },
                  { label: "🌙 Sleep", value: sleepH, set: setSleepH, min: 3, max: 12, step: 0.5, unit: "h", color: "accent-indigo-500" },
                  { label: "💤 REM %", value: remPct, set: setRemPct, min: 5, max: 40, unit: "%", color: "accent-violet-500" },
                ].map(({ label, value, set, min, max, unit, step, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{label}</span>
                      <span className="text-white font-bold">{value} {unit}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step ?? 1}
                      value={value}
                      onChange={e => set(Number(e.target.value))}
                      className={`w-full h-1.5 rounded-full bg-slate-800 appearance-none cursor-pointer ${color}`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleLogBiometrics}
                disabled={logging}
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {logging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Watch className="w-4 h-4" />}
                {logging ? "Logging..." : "Submit Reading to MindCare AI"}
              </button>
            </div>
          </div>

          {/* ── Emotion-Biometric Correlation ────────────────────────────── */}
          {fusion && (
            <div className="glass-dark border border-violet-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Emotion-Biometric Correlation</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold ml-auto">
                  {Math.round(fusion.biometric_fusion_confidence * 100)}% Confidence
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Physiological Stress</span>
                  <div className="text-2xl font-extrabold text-white">{fusion.physiological_stress_score}<span className="text-sm text-slate-400">/10</span></div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${fusion.physiological_stress_score * 10}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">From BPM · HRV · Sleep</p>
                </div>
                <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Text Emotion Stress</span>
                  <div className="text-2xl font-extrabold text-white">{fusion.text_emotion_stress_score}<span className="text-sm text-slate-400">/10</span></div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${fusion.text_emotion_stress_score * 10}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500">From chat & journal NLP</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-pink-500/30 space-y-1 ring-1 ring-pink-500/10">
                  <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider">🧬 Fused Index (50/50)</span>
                  <div className="text-3xl font-black text-white">{fusion.fused_bio_emotional_stress_score}<span className="text-sm text-slate-400">/10</span></div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fusion.fused_bio_emotional_stress_score >= 7 ? "bg-rose-500" : fusion.fused_bio_emotional_stress_score <= 3.5 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${fusion.fused_bio_emotional_stress_score * 10}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Multimodal fusion output</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Autonomic State</span>
                  <span className="font-semibold text-white">{fusion.autonomic_nervous_system_state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recovery Status</span>
                  <span className="font-semibold text-emerald-300">{fusion.recovery_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Recent Readings Table ─────────────────────────────────────── */}
          <div className="glass-dark border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-white">Recent Readings</h3>
              </div>
              <span className="text-xs text-slate-500">{history.length} entries</span>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No readings yet. Log your first biometric reading above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      {["Time", "BPM", "HRV (ms)", "Sleep (h)", "REM %", "Steps"].map(h => (
                        <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 pr-4 text-slate-400">{log.recorded_at ? new Date(log.recorded_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="py-2 pr-4 font-bold text-red-300">{log.heart_rate_bpm}</td>
                        <td className="py-2 pr-4 font-bold text-cyan-300">{log.hrv_ms}</td>
                        <td className="py-2 pr-4 font-bold text-indigo-300">{log.sleep_hours}</td>
                        <td className="py-2 pr-4 font-bold text-violet-300">{log.rem_sleep_percentage}%</td>
                        <td className="py-2 pr-4 font-bold text-emerald-300">{log.step_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── How It Works ─────────────────────────────────────────────── */}
          <div className="glass-dark border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> How Wearable Data Enriches Your Emotion Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[
                {
                  icon: Heart, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20",
                  title: "PPG Heart Rate",
                  desc: "Elevated BPM (>85) signals physiological stress independent of what you say, letting the AI detect masked anxiety."
                },
                {
                  icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20",
                  title: "HRV Autonomic Index",
                  desc: "Low HRV (<35ms) indicates sympathetic dominance (fight-or-flight), enriching emotion models with autonomic tone."
                },
                {
                  icon: Moon, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20",
                  title: "Sleep Architecture",
                  desc: "Poor sleep quality (<6.5h or low REM) predicts next-day negative affect, helping the AI proactively support you."
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className={`p-4 rounded-xl border ${bg} space-y-2`}>
                  <div className={`flex items-center gap-2 ${color} font-bold`}>
                    <Icon className="w-4 h-4" /> {title}
                  </div>
                  <p className="text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
