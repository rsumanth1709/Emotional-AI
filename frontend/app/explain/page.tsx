"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { chatAPI, explainAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Eye, RefreshCw, MessageSquare, Zap, Brain, Sparkles,
  Info, ShieldCheck, ChevronRight, Activity, Cpu, Gauge, BarChart3
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

import type { SessionSummary } from "@/types";

interface WordExplanation {
  word: string;
  attention_weight: number;
  shap_value: number;
  impact_direction: string;
  color_intensity: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  margin: number;
}

interface XAIExplanation {
  chat_id?: string;
  message_text: string;
  detected_emotion: string;
  confidence: number;
  sentiment: string;
  stress_score: number;
  keywords: string[];
  words: WordExplanation[];
  decision_rationale: string;

  tokens: string[];
  attention_matrix: number[][];
  head_attentions?: number[][][];
  epistemic_uncertainty: number;
  aleatoric_uncertainty: number;
  confidence_interval: ConfidenceInterval;
  top_emotion_probabilities: Record<string, number>;
  influential_words: Array<{
    word: string;
    attention: number;
    shap: number;
    direction: string;
    intensity: number;
  }>;
}

export default function ExplainabilityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ id: string; content: string }>>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  const [customText, setCustomText] = useState<string>("");
  const [activeHead, setActiveHead] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<XAIExplanation | null>(null);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data);
      if (res.data.length > 0) {
        setSelectedSessionId(res.data[0].session_id);
      }
    } catch {
      toast.error("Failed to load chat history.");
    }
  };

  // Fetch messages in session
  const fetchSessionMessages = async (session: string) => {
    try {
      const res = await chatAPI.getSession(session);
      const userMsgs = res.data.filter((msg: any) => msg.role === "user");
      setMessages(userMsgs);
      if (userMsgs.length > 0) {
        setSelectedChatId(userMsgs[0].id);
      } else {
        setSelectedChatId("");
        setExplanation(null);
      }
    } catch {
      toast.error("Failed to load session messages.");
    }
  };

  // Fetch explanation by chatId
  const fetchExplanation = async (chatId: string) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await explainAPI.getExplanation(chatId);
      setExplanation(res.data);
      setCustomText(res.data.message_text);
    } catch {
      toast.error("Failed to calculate Transformer explainability.");
    } finally {
      setLoading(false);
    }
  };

  // Analyze custom typed text
  const handleAnalyzeCustomText = async () => {
    if (!customText.trim()) return;
    setLoading(true);
    try {
      const res = await explainAPI.analyzeText(customText);
      setExplanation(res.data);
      toast.success("Transformer attention & uncertainty metrics computed!");
    } catch {
      toast.error("Failed to analyze text.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  useEffect(() => {
    if (selectedSessionId) fetchSessionMessages(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedChatId) fetchExplanation(selectedChatId);
  }, [selectedChatId]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const maxAttention = explanation?.words.length
    ? Math.max(...explanation.words.map((w) => w.attention_weight))
    : 1;

  // Active matrix for self-attention visualizer
  const currentMatrix =
    explanation?.head_attentions && explanation.head_attentions[activeHead]
      ? explanation.head_attentions[activeHead]
      : explanation?.attention_matrix || [];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Explainable Transformer AI" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-900 to-indigo-950/30 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.06)_0%,_transparent_60%)]" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Eye className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  Explainable Transformer AI
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl">
                  Inspect real-time Transformer self-attention matrices, multi-head attention weights, word SHAP impact scores,
                  clinical decision rationales, and model uncertainty estimates (Epistemic &amp; Aleatoric).
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                  <span>🧠 Self-Attention Matrix (N × N)</span>
                  <span>🔥 Multi-Head Attention (4 Heads)</span>
                  <span>📊 Word SHAP &amp; Influence</span>
                  <span>🎯 Epistemic &amp; Aleatoric Uncertainty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Tester & Session Selector Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Select Chat Session Message
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {sessions.map((s) => (
                      <option key={s.session_id} value={s.session_id}>
                        {s.title || "Session"} ({s.created_at ? new Date(s.created_at).toLocaleDateString() : ""})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedChatId}
                    disabled={messages.length === 0}
                    onChange={(e) => setSelectedChatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                  >
                    {messages.map((m) => (
                      <option key={m.id} value={m.id}>
                        &quot;{m.content.length > 50 ? m.content.slice(0, 50) + "..." : m.content}&quot;
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Or Test Custom Text Input
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Type any sentence to analyze attention & uncertainty…"
                    className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={handleAnalyzeCustomText}
                    disabled={loading || !customText.trim()}
                    className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 whitespace-nowrap"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
              Computing Transformer attention matrices &amp; model uncertainty bounds…
            </div>
          ) : !explanation ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-violet-400" />
              <p>Select a chat message or type a custom sentence above to view Explainability metrics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Attention Matrix & SHAP Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {/* Word Attention Heatmap */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        Word Attention Weights &amp; Influential Terms
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Darker violet highlights indicate tokens receiving higher attention weight.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 bg-slate-800 text-violet-300 rounded-lg">
                      Tokens: {explanation.tokens.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 py-2">
                    {explanation.words.map((w, idx) => {
                      const ratio = maxAttention > 0 ? w.attention_weight / maxAttention : 0;
                      let bgClass = "bg-slate-800 text-slate-300 border-slate-700";
                      if (ratio > 0.75) bgClass = "bg-violet-600 text-white font-bold border-violet-400 shadow-md shadow-violet-500/20";
                      else if (ratio > 0.45) bgClass = "bg-violet-800/80 text-violet-100 border-violet-600";
                      else if (ratio > 0.25) bgClass = "bg-violet-950/80 text-violet-300 border-violet-800";

                      return (
                        <div
                          key={idx}
                          className={`group relative px-3 py-1.5 rounded-xl border text-xs transition-all hover:scale-105 cursor-pointer ${bgClass}`}
                        >
                          <span>{w.word}</span>
                          <span className="ml-1.5 text-[9px] opacity-75 font-mono">
                            {(w.attention_weight * 100).toFixed(0)}%
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-xl border border-slate-800 space-y-0.5">
                            <div>Word: <span className="font-bold text-violet-400">{w.word}</span></div>
                            <div>Attention Weight: {(w.attention_weight * 100).toFixed(1)}%</div>
                            <div>SHAP Impact: {w.shap_value > 0 ? `+${w.shap_value.toFixed(3)}` : w.shap_value.toFixed(3)}</div>
                            <div>Direction: <span className={w.impact_direction === "positive" ? "text-emerald-400 font-bold" : w.impact_direction === "negative" ? "text-rose-400 font-bold" : "text-slate-400"}>{w.impact_direction}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transformer Self-Attention Heatmap Matrix (N x N) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        Transformer Self-Attention Heatmap (N × N Matrix)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Shows how each token (row) attends to every other token (column) across attention heads.
                      </p>
                    </div>
                    {/* Head Selector Tabs */}
                    <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
                      {["Semantic", "Emotion", "Syntactic", "Safety"].map((headName, hIdx) => (
                        <button
                          key={hIdx}
                          onClick={() => setActiveHead(hIdx)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                            activeHead === hIdx
                              ? "bg-violet-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Head {hIdx + 1}: {headName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-[10px] text-slate-500 uppercase border-b border-slate-800 text-left">Token</th>
                          {explanation.tokens.map((token, colIdx) => (
                            <th key={colIdx} className="p-2 text-[10px] font-bold text-slate-300 border-b border-slate-800 max-w-[60px] truncate">
                              {token}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {explanation.tokens.map((rowToken, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30">
                            <td className="p-2 text-xs font-bold text-slate-300 text-left border-r border-slate-800 truncate max-w-[90px]">
                              {rowToken}
                            </td>
                            {explanation.tokens.map((_, cIdx) => {
                              const val = currentMatrix[rIdx]?.[cIdx] ?? 0;
                              const intensity = Math.min(1.0, val * 2.5);
                              return (
                                <td
                                  key={cIdx}
                                  className="p-1 text-[10px] font-mono border border-slate-800/50"
                                  style={{
                                    backgroundColor: `rgba(139, 92, 246, ${intensity})`,
                                    color: intensity > 0.4 ? "#ffffff" : "#94a3b8",
                                  }}
                                  title={`Row: "${rowToken}" → Col: "${explanation.tokens[cIdx]}": ${(val * 100).toFixed(1)}%`}
                                >
                                  {(val * 100).toFixed(0)}%
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Influential Words & SHAP Values */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Influential Words &amp; SHAP Sentiment Impact
                  </h3>
                  <div className="space-y-3">
                    {explanation.influential_words.map((w, idx) => {
                      const isPos = w.shap >= 0;
                      const absShap = Math.abs(w.shap);
                      const maxAbs = Math.max(...explanation.influential_words.map((x) => Math.abs(x.shap))) || 1.0;
                      const widthPct = Math.min(100, Math.max(10, (absShap / maxAbs) * 100));

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{w.word}</span>
                            <span className={`font-mono text-[11px] font-bold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                              {isPos ? "+" : ""}{w.shap.toFixed(3)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isPos ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Prediction Metrics, Uncertainty & Rationale */}
              <div className="space-y-6">
                {/* Prediction Summary & Confidence Interval */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    Prediction Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Classified Emotion:</span>
                      <span className="font-extrabold text-amber-300 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        {explanation.detected_emotion}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Confidence Score:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {(explanation.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">95% Confidence Interval:</span>
                      <span className="font-mono text-[11px] text-slate-300">
                        [{(explanation.confidence_interval.lower * 100).toFixed(1)}% – {(explanation.confidence_interval.upper * 100).toFixed(1)}%]
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sentiment Polarity:</span>
                      <span className={`text-xs uppercase font-extrabold ${
                        explanation.sentiment === "positive" ? "text-emerald-400" : explanation.sentiment === "negative" ? "text-rose-400" : "text-slate-400"
                      }`}>
                        {explanation.sentiment}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Stress Rating:</span>
                      <span className="font-bold text-white">{explanation.stress_score.toFixed(1)} / 10</span>
                    </div>
                  </div>
                </div>

                {/* Model Uncertainty Estimates (Epistemic & Aleatoric) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    Model Uncertainty Estimates
                  </h3>

                  <div className="space-y-4">
                    {/* Epistemic */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Epistemic Uncertainty (Entropy)</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {(explanation.epistemic_uncertainty * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, explanation.epistemic_uncertainty * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Measures model ignorance / class ambiguity. Low values mean high certainty.
                      </p>
                    </div>

                    {/* Aleatoric */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Aleatoric Uncertainty (Data Noise)</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {(explanation.aleatoric_uncertainty * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, explanation.aleatoric_uncertainty * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Measures inherent variance in input text phrasing and noise.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emotion Probability Distribution */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    Full Emotion Probability Distribution
                  </h3>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(explanation.top_emotion_probabilities)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emo, prob]) => (
                        <div key={emo} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className={emo === explanation.detected_emotion ? "font-bold text-pink-400" : "text-slate-400"}>
                              {emo}
                            </span>
                            <span className="font-mono text-slate-300">{(prob * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${emo === explanation.detected_emotion ? "bg-pink-500" : "bg-slate-700"}`}
                              style={{ width: `${Math.min(100, prob * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Clinical Decision Rationale */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Clinical Decision Rationale
                  </h3>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {explanation.decision_rationale}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
