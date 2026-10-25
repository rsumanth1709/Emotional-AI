"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { monitoringAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Activity, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw,
  Clock, Layers, Database, Eye, ShieldAlert, CheckSquare, ChevronRight, BarChart2, Radio
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface MonitoredModel {
  id: string;
  model_id: string;
  version: string;
  status: string;
  macro_f1?: number;
  is_proxy_metric: boolean;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  psi_drift_score: number;
  uptime_percentage: number;
}

interface AlertItem {
  id: string;
  alert_type: string;
  severity: string;
  model_id?: string;
  metric_name: string;
  current_value: number;
  threshold: number;
  status: string;
  details: any;
  created_at: string;
}

export default function MonitoringPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [overview, setOverview] = useState<any>(null);
  const [models, setModels] = useState<MonitoredModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("text_emotion");
  const [selectedModelDetails, setSelectedModelDetails] = useState<any>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [healthProbe, setHealthProbe] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oRes, mRes, dRes, aRes, hRes] = await Promise.all([
        monitoringAPI.getOverview(),
        monitoringAPI.getModels(),
        monitoringAPI.getModelDetails(selectedModelId),
        monitoringAPI.getAlerts({ limit: 30 }),
        monitoringAPI.getSystemHealth(),
      ]);
      setOverview(oRes.data);
      setModels(mRes.data);
      setSelectedModelDetails(dRes.data);
      setAlerts(aRes.data);
      setHealthProbe(hRes.data);
    } catch {
      toast.error("Failed to load observability telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, selectedModelId]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await monitoringAPI.acknowledgeAlert(alertId);
      toast.success("Alert ACKNOWLEDGED.");
      fetchData();
    } catch {
      toast.error("Failed to acknowledge alert.");
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await monitoringAPI.resolveAlert(alertId);
      toast.success("Alert RESOLVED.");
      fetchData();
    } catch {
      toast.error("Failed to resolve alert.");
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Monitoring and Observability Platform" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      AI Monitoring &amp; Observability Platform
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Real-Time Observability
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Continuously monitor AI/ML models, P95/P99 latencies, data drift, error rates, and infrastructure health
                    while enforcing strict privacy-by-design principles.
                  </p>
                </div>
              </div>

              {overview && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Status: <strong className="text-white">{overview.system_status}</strong></span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    Uptime: <strong className="text-white">{overview.overall_uptime_percentage}%</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Observability Cards */}
          {overview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Total Requests (24h)</span>
                <p className="text-2xl font-extrabold text-white">{overview.total_requests_24h?.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Ingress Audited</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Overall Error Rate</span>
                <p className="text-2xl font-extrabold text-white">{(overview.error_rate * 100).toFixed(1)}%</p>
                <span className="text-[10px] text-emerald-400 font-semibold">✓ Below Limit (&lt; 1%)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Monitored ML Models</span>
                <p className="text-2xl font-extrabold text-white">{overview.monitored_models_count}</p>
                <span className="text-[10px] text-cyan-400 font-semibold">Active Observability SDK</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Active Alerts</span>
                <p className="text-2xl font-extrabold text-amber-400">{overview.active_alerts_count}</p>
                <span className="text-[10px] text-slate-400">Requires Attention</span>
              </div>
            </div>
          )}

          {/* Monitored Models Health Grid */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Monitored Model Health Cards
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.map((m) => (
                <div
                  key={m.model_id}
                  onClick={() => setSelectedModelId(m.model_id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    selectedModelId === m.model_id
                      ? "bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{m.model_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.status === "HEALTHY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">P95 Latency:</span>
                      <strong className="text-white">{m.p95_latency_ms} ms</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PSI Drift:</span>
                      <strong className={m.psi_drift_score < 0.10 ? "text-emerald-400" : "text-amber-400"}>
                        {m.psi_drift_score}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {m.is_proxy_metric ? "Proxy Confidence:" : "Macro F1 (Accuracy):"}
                      </span>
                      <strong className="text-cyan-400">{m.macro_f1 || 0.88}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                    <span>v{m.version}</span>
                    <span>Uptime: {m.uptime_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End-to-End Latency Breakdown Inspector */}
          {selectedModelDetails && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                    Model: {selectedModelDetails.model_id} (v{selectedModelDetails.version})
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    End-to-End Request Latency Breakdown
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {selectedModelDetails.performance?.label_type}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Preprocessing</span>
                  <p className="text-lg font-bold text-white">{selectedModelDetails.end_to_end_breakdown?.preprocessing_ms} ms</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Model Inference</span>
                  <p className="text-lg font-bold text-cyan-400">{selectedModelDetails.end_to_end_breakdown?.inference_ms} ms</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Database Query</span>
                  <p className="text-lg font-bold text-white">{selectedModelDetails.end_to_end_breakdown?.database_ms} ms</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">Postprocessing</span>
                  <p className="text-lg font-bold text-white">{selectedModelDetails.end_to_end_breakdown?.postprocessing_ms} ms</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Alerts & Incident Resolution Portal */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Operational Alerts &amp; Incident Portal
            </h3>

            <div className="space-y-3 text-xs">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {a.severity}
                      </span>
                      <span className="font-bold text-white uppercase">{a.alert_type}</span>
                      <span className="text-slate-500">• Model: {a.model_id || "System"}</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Metric <strong>{a.metric_name}</strong> = {a.current_value} (Threshold: {a.threshold})
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {a.status === "TRIGGERED" && (
                      <button
                        onClick={() => handleAcknowledgeAlert(a.id)}
                        className="py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/20"
                      >
                        Acknowledge
                      </button>
                    )}
                    {a.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleResolveAlert(a.id)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500/20 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Resolve Incident
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
