"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  GitFork, RefreshCw, Search, Zap, Brain, Filter,
  ChevronRight, Sparkles, User, ArrowRight, Target, Info
} from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type {
  KnowledgeGraphData, GraphNode, GraphEdge,
  StrategyRecommendation, PersonalizedGraphData
} from "@/types";
import { toast } from "react-hot-toast";

// ─── Node Type Config ─────────────────────────────────────────────────────────
const NODE_TYPE_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "Trigger":         { bg: "bg-red-950/60",     border: "border-red-500/40",    text: "text-red-300",    badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  "Emotion":         { bg: "bg-pink-950/60",    border: "border-pink-500/40",   text: "text-pink-300",   badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  "Coping Strategy": { bg: "bg-blue-950/60",    border: "border-blue-500/40",   text: "text-blue-300",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "Habit":           { bg: "bg-cyan-950/60",    border: "border-cyan-500/40",   text: "text-cyan-300",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  "Recommendation":  { bg: "bg-purple-950/60",  border: "border-purple-500/40", text: "text-purple-300", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "Outcome":         { bg: "bg-emerald-950/60", border: "border-emerald-500/40",text: "text-emerald-300",badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  "Progress":        { bg: "bg-amber-950/60",   border: "border-amber-500/40",  text: "text-amber-300",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

const EMOTION_NODES = [
  { id: "emo_anxiety", label: "Anxiety" },
  { id: "emo_stress", label: "Stress" },
  { id: "emo_sadness", label: "Sadness" },
  { id: "emo_fear", label: "Fear" },
  { id: "emo_anger", label: "Anger" },
  { id: "emo_loneliness", label: "Loneliness" },
  { id: "emo_burnout", label: "Burnout" },
  { id: "emo_guilt", label: "Guilt" },
  { id: "emo_shame", label: "Shame" },
  { id: "emo_joy", label: "Joy" },
];

// ─── SVG Force Graph Layout ───────────────────────────────────────────────────
type NodePosition = { id: string; x: number; y: number; node: GraphNode };

function computeLayout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): NodePosition[] {
  // Column-based layout: Trigger → Emotion → Coping Strategy → Habit → Recommendation → Outcome → Progress
  const typeOrder = ["Trigger", "Emotion", "Coping Strategy", "Habit", "Recommendation", "Outcome", "Progress"];
  const cols: Record<string, GraphNode[]> = {};
  typeOrder.forEach(t => cols[t] = []);
  nodes.forEach(n => {
    if (cols[n.type]) cols[n.type].push(n);
    else cols["Emotion"].push(n);
  });

  const positions: NodePosition[] = [];
  const colCount = typeOrder.filter(t => cols[t].length > 0).length;
  const usedTypes = typeOrder.filter(t => cols[t].length > 0);
  const colWidth = width / (colCount + 1);

  usedTypes.forEach((type, colIdx) => {
    const colNodes = cols[type];
    const colX = colWidth * (colIdx + 1);
    colNodes.forEach((node, rowIdx) => {
      const rowY = (height / (colNodes.length + 1)) * (rowIdx + 1);
      positions.push({ id: node.id, x: colX, y: rowY, node });
    });
  });

  return positions;
}

function SVGGraph({
  nodes, edges, selectedNode, onNodeClick, width = 900, height = 480
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  onNodeClick: (n: GraphNode) => void;
  width?: number;
  height?: number;
}) {
  const positions = computeLayout(nodes, edges, width, height);
  const posMap: Record<string, NodePosition> = {};
  positions.forEach(p => posMap[p.id] = p);

  const NODE_R = 28;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl" style={{ height: Math.max(300, height) }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6366f1" opacity="0.7" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#0f172a" rx="12" />

      {/* Grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map(x => (
        <line key={x} x1={width * x} y1={0} x2={width * x} y2={height} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" />
      ))}

      {/* Edges */}
      {edges.map((edge, i) => {
        const src = posMap[edge.source];
        const tgt = posMap[edge.target];
        if (!src || !tgt) return null;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return null;

        // Shorten to not overlap node circles
        const ux = dx / dist, uy = dy / dist;
        const x1 = src.x + ux * NODE_R;
        const y1 = src.y + uy * NODE_R;
        const x2 = tgt.x - ux * (NODE_R + 6);
        const y2 = tgt.y - uy * (NODE_R + 6);

        // Highlight if connected to selected
        const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 12;

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isHighlighted ? "#a78bfa" : "#334155"}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeOpacity={isHighlighted ? 1 : 0.5}
              markerEnd="url(#arrowhead)"
            />
            {isHighlighted && (
              <text x={midX} y={midY} textAnchor="middle" fontSize="9" fill="#a78bfa" opacity="0.85">
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {positions.map(({ id, x, y, node }) => {
        const isSelected = selectedNode?.id === id;
        const isConnected = selectedNode && edges.some(e => e.source === selectedNode.id && e.target === id || e.target === selectedNode.id && e.source === id);
        const isDimmed = selectedNode && !isSelected && !isConnected;
        return (
          <g
            key={id}
            style={{ cursor: "pointer" }}
            onClick={() => onNodeClick(node)}
            opacity={isDimmed ? 0.3 : 1}
          >
            {isSelected && (
              <circle cx={x} cy={y} r={NODE_R + 8} fill="none" stroke={node.color} strokeWidth="2" opacity="0.5" filter="url(#glow)" />
            )}
            <circle
              cx={x} cy={y} r={NODE_R}
              fill={node.color + "22"}
              stroke={isSelected ? node.color : node.color + "88"}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            <text x={x} y={y - 2} textAnchor="middle" fontSize="9" fontWeight="bold" fill={node.color}>
              {node.type === "Coping Strategy" ? "COPE" : node.type.slice(0, 4).toUpperCase()}
            </text>
            <text x={x} y={y + 9} textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
              {node.label.length > 12 ? node.label.slice(0, 10) + "…" : node.label}
            </text>
            {/* Efficacy dots for strategy nodes */}
            {node.type === "Coping Strategy" && (
              <circle cx={x + NODE_R - 5} cy={y - NODE_R + 5} r="5" fill="#3b82f6" />
            )}
          </g>
        );
      })}

      {/* Column labels */}
      {["Triggers", "Emotions", "Coping Strategies", "Outcomes", "Progress"].map((label, i) => (
        <text key={label} x={(900 / 6) * (i + 1)} y={18} textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700" letterSpacing="1">
          {label.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KnowledgeGraphVisualizer() {
  const [graph, setGraph] = useState<KnowledgeGraphData | null>(null);
  const [personalizedGraph, setPersonalizedGraph] = useState<PersonalizedGraphData | null>(null);
  const [strategies, setStrategies] = useState<StrategyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeTab, setActiveTab] = useState<"full" | "personalized" | "explore" | "pathfinder">("full");
  const [selectedEmotion, setSelectedEmotion] = useState("emo_anxiety");
  const [filterType, setFilterType] = useState<string>("All");
  const [searchQ, setSearchQ] = useState("");
  const [pathFrom, setPathFrom] = useState("trig_workload");
  const [pathTo, setPathTo] = useState("out_calm");
  const [pathResult, setPathResult] = useState<any>(null);
  const [pathLoading, setPathLoading] = useState(false);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      // Load the full graph — this is the primary data source
      const graphRes = await researchAPI.getKnowledgeGraph();
      setGraph(graphRes.data);
    } catch {
      toast.error("Failed to load Knowledge Graph — is the backend running?");
    } finally {
      setLoading(false);
    }

    // Load personalized graph separately (non-blocking, optional)
    try {
      const persRes = await researchAPI.getPersonalizedGraph();
      setPersonalizedGraph(persRes.data);
    } catch {
      // Silently fail — personalized tab will show a placeholder
    }
  }, []);

  const fetchStrategies = useCallback(async (emotionId: string) => {
    try {
      const emoLabel = EMOTION_NODES.find(e => e.id === emotionId)?.label ?? "Anxiety";
      const res = await researchAPI.recommendStrategies(emoLabel);
      setStrategies(res.data);
    } catch {}
  }, []);

  const findPath = useCallback(async () => {
    setPathLoading(true);
    try {
      const res = await researchAPI.getGraphPath(pathFrom, pathTo);
      setPathResult(res.data);
    } catch {
      toast.error("Path query failed");
    } finally {
      setPathLoading(false);
    }
  }, [pathFrom, pathTo]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);
  useEffect(() => { fetchStrategies(selectedEmotion); }, [selectedEmotion, fetchStrategies]);

  if (loading) {
    return (
      <div className="glass p-10 flex flex-col items-center justify-center gap-4 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm">Building Therapeutic Knowledge Graph…</p>
      </div>
    );
  }

  if (!graph) return null;

  const displayNodes = activeTab === "personalized" && personalizedGraph
    ? personalizedGraph.nodes
    : graph.nodes;
  const displayEdges = activeTab === "personalized" && personalizedGraph
    ? personalizedGraph.edges
    : graph.edges;

  const filteredNodes = displayNodes.filter(n => {
    if (filterType !== "All" && n.type !== filterType) return false;
    if (searchQ && !n.label.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });
  const filteredEdges = displayEdges.filter(e =>
    filteredNodes.some(n => n.id === e.source) && filteredNodes.some(n => n.id === e.target)
  );

  const nodeTypes = ["All", "Trigger", "Emotion", "Coping Strategy", "Outcome", "Progress"];
  const typeCounts: Record<string, number> = {};
  graph.nodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });

  return (
    <div className="glass p-6 space-y-6 border border-amber-500/20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Therapeutic Knowledge Graph</h3>
            <p className="text-xs text-slate-400">
              {graph.total_nodes} nodes · {graph.total_edges} directed edges · Emotions → Triggers → Strategies → Outcomes → Progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = NODE_TYPE_CONFIG[type];
            return (
              <span key={type} className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg?.badge ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {count} {type}s
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {[
          { id: "full", label: "Full Graph", icon: GitFork },
          { id: "personalized", label: "My Graph", icon: User },
          { id: "explore", label: "Emotion Explorer", icon: Brain },
          { id: "pathfinder", label: "Path Finder", icon: Target },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === id
                ? "bg-violet-600/30 text-violet-200 border border-violet-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Full Graph + Personalized Graph ── */}
      {(activeTab === "full" || activeTab === "personalized") && (
        <div className="space-y-4">
          {/* Personalized banner */}
          {activeTab === "personalized" && personalizedGraph && (
            <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs flex items-start gap-3">
              <User className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-violet-300">Your Personalized Subgraph</span> — anchored on your top detected emotions:
                <span className="ml-1 font-bold text-white">
                  {personalizedGraph.top_emotions.map(e => e.label).join(", ")}
                </span>
                <span className="text-slate-400"> (from journal & chat history)</span>
              </div>
            </div>
          )}
          {activeTab === "personalized" && !personalizedGraph && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-slate-400 flex items-center gap-3">
              <User className="w-4 h-4 text-slate-500" />
              Personalized graph will appear after your first journal entry or chat session — showing full graph in the meantime.
            </div>
          )}

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search nodes…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {nodeTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    filterType === t
                      ? (NODE_TYPE_CONFIG[t]?.badge ?? "bg-violet-500/20 text-violet-300 border-violet-500/30")
                      : "border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Graph */}
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <SVGGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNode={selectedNode}
              onNodeClick={n => setSelectedNode(prev => prev?.id === n.id ? null : n)}
              width={880}
              height={Math.min(520, Math.max(300, filteredNodes.length * 30))}
            />
          </div>

          {/* Selected Node Detail Panel */}
          {selectedNode && (
            <div className={`p-4 rounded-xl border space-y-3 ${NODE_TYPE_CONFIG[selectedNode.type]?.bg ?? "bg-slate-900"} ${NODE_TYPE_CONFIG[selectedNode.type]?.border ?? "border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: selectedNode.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${NODE_TYPE_CONFIG[selectedNode.type]?.badge}`}>
                      {selectedNode.type}
                    </span>
                    <h4 className="text-sm font-bold text-white">{selectedNode.label}</h4>
                  </div>
                  {selectedNode.description && (
                    <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
                  )}
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Connected FROM:</span>
                  {displayEdges.filter(e => e.target === selectedNode.id).map(e => {
                    const src = displayNodes.find(n => n.id === e.source);
                    return src ? (
                      <div key={e.source} className="flex items-center gap-1 text-slate-300 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src.color }} />
                        <span>{src.label}</span>
                        <span className="text-slate-500 text-[10px]">→ {e.label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Connects TO:</span>
                  {displayEdges.filter(e => e.source === selectedNode.id).map(e => {
                    const tgt = displayNodes.find(n => n.id === e.target);
                    return tgt ? (
                      <div key={e.target} className="flex items-center gap-1 text-slate-300 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tgt.color }} />
                        <span>{tgt.label}</span>
                        <span className="text-slate-500 text-[10px]">{e.label} ({Math.round(e.weight * 100)}%)</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Node grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {filteredNodes.map(node => {
              const cfg = NODE_TYPE_CONFIG[node.type] ?? { bg: "bg-slate-900", border: "border-slate-800", text: "text-slate-300", badge: "bg-slate-800 text-slate-300 border-slate-700" };
              const isSelected = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(prev => prev?.id === node.id ? null : node)}
                  className={`p-2.5 rounded-xl border text-left space-y-1 transition-all ${cfg.bg} ${isSelected ? cfg.border + " ring-1 ring-violet-500/50" : "border-slate-800 hover:" + cfg.border}`}
                >
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${cfg.badge}`}>{node.type}</span>
                  <p className={`text-xs font-bold ${cfg.text} leading-snug`}>{node.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Emotion Explorer ── */}
      {activeTab === "explore" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Select an Emotion to Explore</label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_NODES.map(emo => (
                <button
                  key={emo.id}
                  onClick={() => setSelectedEmotion(emo.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedEmotion === emo.id
                      ? "bg-pink-500/20 text-pink-200 border-pink-500/40"
                      : "border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {emo.label}
                </button>
              ))}
            </div>
          </div>

          {strategies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Top Coping Strategies for {EMOTION_NODES.find(e => e.id === selectedEmotion)?.label}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strategies.map((strat, i) => (
                  <div key={strat.strategy_id} className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-white">{strat.strategy}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">{strat.description}</p>
                      </div>
                    </div>
                    {/* Efficacy bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Efficacy Score</span>
                        <span className="font-bold text-blue-300">{strat.efficacy_score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                          style={{ width: `${strat.efficacy_score}%`, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
                      <ArrowRight className="w-3 h-3" />
                      {strat.expected_outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subgraph: Triggers that lead to this emotion */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-red-400" />
              Known Triggers
            </h4>
            <div className="flex flex-wrap gap-2">
              {graph.edges
                .filter(e => e.target === selectedEmotion)
                .map(e => {
                  const trigger = graph.nodes.find(n => n.id === e.source && n.type === "Trigger");
                  return trigger ? (
                    <div key={e.source} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/20 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-red-300 font-semibold">{trigger.label}</span>
                      <span className="text-slate-500">({Math.round(e.weight * 100)}%)</span>
                    </div>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Path Finder ── */}
      {activeTab === "pathfinder" && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Target className="w-4 h-4 text-amber-400" />
              BFS Shortest Path Between Any Two Graph Nodes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">From Node</label>
                <select
                  value={pathFrom}
                  onChange={e => setPathFrom(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {graph.nodes.map(n => (
                    <option key={n.id} value={n.id}>[{n.type}] {n.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">To Node</label>
                <select
                  value={pathTo}
                  onChange={e => setPathTo(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {graph.nodes.map(n => (
                    <option key={n.id} value={n.id}>[{n.type}] {n.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={findPath}
              disabled={pathLoading}
              className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
            >
              {pathLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Find Therapeutic Path
            </button>
          </div>

          {pathResult && (
            <div className={`p-4 rounded-xl border space-y-3 ${pathResult.found ? "bg-emerald-950/20 border-emerald-500/20" : "bg-red-950/20 border-red-500/20"}`}>
              {pathResult.found ? (
                <>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Shortest Path Found — {pathResult.path_nodes.length} Hops
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {pathResult.path_nodes.map((node: GraphNode, idx: number) => {
                      const edge = pathResult.path_edges?.[idx];
                      const cfg = NODE_TYPE_CONFIG[node.type];
                      return (
                        <React.Fragment key={node.id}>
                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${cfg?.badge ?? "bg-slate-800 text-slate-300 border-slate-700"}`}>
                            {node.label}
                          </div>
                          {idx < pathResult.path_nodes.length - 1 && (
                            <div className="flex flex-col items-center text-[9px] text-slate-500">
                              <ArrowRight className="w-3 h-3 text-violet-400" />
                              {edge && <span className="italic">{edge.label}</span>}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    This is the evidence-based therapeutic pathway connecting the selected conditions in the knowledge graph.
                  </p>
                </>
              ) : (
                <p className="text-xs text-red-300 font-semibold">
                  No directed path found between these nodes. Try reversing the direction or selecting connected node types.
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Graph Legend
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => (
                <div key={type} className={`px-2.5 py-2 rounded-xl border text-center ${cfg.bg} ${cfg.border}`}>
                  <span className={`text-[10px] font-extrabold ${cfg.text}`}>{type}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Edges are directed (→) and weighted (0–100% efficacy). The graph encodes evidence-based relationships from clinical psychology, CBT, ACT, and positive psychology research.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
