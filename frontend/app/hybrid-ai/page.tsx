"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hybridAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Cpu, ShieldAlert, GitBranch, Zap, RefreshCw, CheckCircle2,
  AlertTriangle, ArrowRight, Play, Server, Lock, Layers, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface ArchitectureComponent {
  name: string;
  type: string;
  latency: string;
  description: string;
}

interface StrategySpec {
  id: string;
  name: string;
  trigger_condition: string;
  action: string;
}

interface ArchitectureOverview {
  architecture_name: string;
  version: string;
  components: ArchitectureComponent[];
  strategies: StrategySpec[];
  mermaid_diagram: string;
}

interface HybridProcessResult {
  query: string;
  selected_strategy: string;
  strategy_description: string;
  response: string;
  detected_emotion: string;
  confidence: number;
  sentiment: string;
  stress_score: number;
  is_crisis: boolean;
  crisis_severity: string;
  triggered_rules: string[];
  graph_reasoning_path?: string;
  latency_ms: number;
  architecture_components: Record<string, string>;
}

export default function HybridAIPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [architecture, setArchitecture] = useState<ArchitectureOverview | null>(null);
  const [queryText, setQueryText] = useState<string>("I am feeling overwhelmed with work stress and having trouble sleeping...");
  const [forcedStrategy, setForcedStrategy] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<HybridProcessResult | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await hybridAPI.getArchitecture();
      setArchitecture(res.data);
    } catch {
      toast.error("Failed to load Hybrid AI Architecture overview.");
    }
  };

  const handleProcessQuery = async (textToRun?: string) => {
    const activeText = textToRun || queryText;
    if (!activeText.trim()) return;
    setProcessing(true);
    try {
      const res = await hybridAPI.processQuery({
        message: activeText,
        force_strategy: forcedStrategy || undefined,
      });
      setResult(res.data);
      toast.success(`Processed via strategy: ${res.data.selected_strategy}`);
    } catch {
      toast.error("Failed to process hybrid AI query.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchOverview();
  }, [user]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const getStrategyBadge = (stratId: string) => {
    switch (stratId) {
      case "SAFETY_CRITICAL_RULE_OVERRIDE":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "SYMBOLIC_KNOWLEDGE_GRAPH_HYBRID":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "FAST_NEURAL_TRANSFORMER":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-violet-500/20 text-violet-300 border-violet-500/40";
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Hybrid AI Architecture" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-indigo-950/30 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(6,182,212,0.06)_0%,_transparent_60%)]" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    Hybrid AI Architecture
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    v2.5.0 Active
                  </span>
                </div>
                <p className="text-slate-400 text-sm max-w-2xl">
                  Combines deterministic rule-based safety interceptors, symbolic Knowledge Graph reasoning,
                  and Transformer deep learning models with an automatic inference strategy switcher.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                  <span>🛡️ Expert Rule Safety Interceptor</span>
                  <span>🤖 Multilingual Transformer Classifier</span>
                  <span>🕸️ Knowledge Graph Symbolic Reasoning</span>
                  <span>⚡ Automatic Strategy Router</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Strategy Router Tester */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Automatic Inference Strategy Switcher Tester
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Real-Time Routing & Audit</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Type any test query..."
                  className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={forcedStrategy}
                  onChange={(e) => setForcedStrategy(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Auto Strategy Router (Recommended)</option>
                  <option value="SAFETY_CRITICAL_RULE_OVERRIDE">Force Safety Rule Override</option>
                  <option value="SYMBOLIC_KNOWLEDGE_GRAPH_HYBRID">Force Symbolic Graph Hybrid</option>
                  <option value="FAST_NEURAL_TRANSFORMER">Force Fast Neural Transformer</option>
                </select>
                <button
                  onClick={() => handleProcessQuery()}
                  disabled={processing || !queryText.trim()}
                  className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 whitespace-nowrap"
                >
                  {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Execute Pipeline
                </button>
              </div>

              {/* Preset Test Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase self-center">Presets:</span>
                <button
                  onClick={() => {
                    const text = "I feel hopeless and want to end it all...";
                    setQueryText(text);
                    handleProcessQuery(text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-[11px] font-medium transition-colors"
                >
                  🛡️ Crisis Safety Interceptor
                </button>
                <button
                  onClick={() => {
                    const text = "I am so stressed about my work overload and can't sleep...";
                    setQueryText(text);
                    handleProcessQuery(text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-[11px] font-medium transition-colors"
                >
                  🧠 Symbolic Knowledge Graph
                </button>
                <button
                  onClick={() => {
                    const text = "Hello! I am having a pleasant morning.";
                    setQueryText(text);
                    handleProcessQuery(text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-medium transition-colors"
                >
                  ⚡ Fast Neural Direct
                </button>
              </div>
            </div>

            {/* Execution Result Box */}
            {result && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 pt-4">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Selected Strategy:</span>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getStrategyBadge(result.selected_strategy)}`}>
                      {result.selected_strategy}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    ⚡ Latency: {result.latency_ms} ms
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Detected Emotion</span>
                    <p className="font-bold text-cyan-300">{result.detected_emotion} ({(result.confidence * 100).toFixed(1)}% conf)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Sentiment &amp; Stress Score</span>
                    <p className="font-bold text-white uppercase">{result.sentiment} • Stress: {result.stress_score}/10</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Safety Status</span>
                    <p className={result.is_crisis ? "font-bold text-rose-400" : "font-bold text-emerald-400"}>
                      {result.is_crisis ? `🚨 Crisis Alert (${result.crisis_severity.toUpperCase()})` : "✅ Cleared Safe"}
                    </p>
                  </div>
                </div>

                {/* Triggered Rules */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Triggered Decision Rules
                  </span>
                  <div className="space-y-1">
                    {result.triggered_rules.map((rule, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graph Reasoning Path if present */}
                {result.graph_reasoning_path && (
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1 text-xs">
                    <span className="text-[10px] font-extrabold text-cyan-400 uppercase">Knowledge Graph Path Traversal</span>
                    <p className="font-mono text-cyan-200">{result.graph_reasoning_path}</p>
                  </div>
                )}

                {/* Generated Response */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Generated Response
                  </span>
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {result.response}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architecture Specification Cards */}
          {architecture && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Components List */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Hybrid Pipeline Components
                </h3>
                <div className="space-y-3">
                  {architecture.components.map((comp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-white">{comp.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-cyan-300 rounded">
                          {comp.latency}
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-semibold block">{comp.type}</span>
                      <p className="text-xs text-slate-400">{comp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Rules List */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Inference Strategy Rules
                </h3>
                <div className="space-y-3">
                  {architecture.strategies.map((strat) => (
                    <div key={strat.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{strat.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStrategyBadge(strat.id)}`}>
                          {strat.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500 font-semibold">Trigger:</span> {strat.trigger_condition}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="text-cyan-400 font-semibold">Action:</span> {strat.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
