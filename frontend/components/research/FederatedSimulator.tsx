"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Cpu, Layers, Activity, Lock, CheckCircle2, ArrowRight, Database, Smartphone, Server } from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type { FederatedStatus } from "@/types";
import { toast } from "react-hot-toast";

export default function FederatedSimulator() {
  const [status, setStatus] = useState<FederatedStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updateLog, setUpdateLog] = useState<any>(null);

  const fetchFLStatus = async () => {
    setLoading(true);
    try {
      const res = await researchAPI.getFLStatus();
      setStatus(res.data);
    } catch {
      toast.error("Failed to load Federated Learning status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFLStatus();
  }, []);

  const handleSimulateUpdate = async () => {
    setSubmitting(true);
    try {
      // Generate synthetic local gradients
      const grads = Array.from({ length: 10 }, () => Number((Math.random() * 0.4 - 0.2).toFixed(4)));
      const clientId = `node-client-${Math.floor(Math.random() * 9000 + 1000)}`;

      const res = await researchAPI.submitFLUpdate(clientId, grads, 45);
      setUpdateLog(res.data);
      toast.success("DP Noisy Gradients aggregated via FedAvg!");
      fetchFLStatus();
    } catch {
      toast.error("Failed to submit local FL update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm">Loading Federated Learning Coordinator Status...</p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="glass p-6 space-y-6 border border-violet-500/20 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Federated Learning & Differential Privacy</h3>
            <p className="text-xs text-slate-400">FedAvg Parameter Aggregation + (ε=1.5, δ=1e-5)-DP Noise Injection</p>
          </div>
        </div>

        <button
          onClick={handleSimulateUpdate}
          disabled={submitting}
          className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
        >
          <Cpu className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
          <span>{submitting ? "Aggregating Gradients..." : "Submit Local DP Update"}</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">FL Global Round</span>
          <span className="text-2xl font-extrabold text-violet-400">Round {status.current_round}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Participating Nodes</span>
          <span className="text-2xl font-extrabold text-cyan-400">{status.total_participating_clients} Clients</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Privacy Budget (ε)</span>
          <span className="text-2xl font-extrabold text-emerald-400">ε = {status.privacy_budget_epsilon}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block">Global Model Accuracy</span>
          <span className="text-2xl font-extrabold text-white">{(status.global_accuracy_score * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Architectural Flow Visualizer */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span>Privacy-Preserving Federated Architecture Flow</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <div className="flex items-center gap-2 text-violet-300 font-bold">
              <Smartphone className="w-4 h-4 text-violet-400" />
              <span>1. On-Device Local Sandbox</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Raw journal logs and chat data are stored exclusively in local SQLite / Browser storage. Zero raw text leaves the client device.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2. (ε, δ)-LDP Noise Injection</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Local gradients are clipped ($S=1.0$) and injected with Gaussian noise ($\sigma$) under Local Differential Privacy ($\epsilon=1.5$).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>3. Central FedAvg Aggregation</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The central coordinator averages noisy gradient vectors across all nodes to improve global model accuracy collaboratively.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
        <span className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Differential Privacy & On-Device Security:</span>
        </span>
        <p className="text-emerald-300 leading-relaxed">{status.on_device_privacy}</p>
      </div>

      {/* Simulation Log */}
      {updateLog && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold text-violet-300">
            <span>Last Client Update Log ({updateLog.client_id})</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{updateLog.differential_privacy_guarantee}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div>Original Gradient Norm: <strong className="text-white">{updateLog.original_gradient_norm}</strong></div>
            <div>DP Noise Sigma: <strong className="text-white">{updateLog.dp_noise_injected_sigma}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
