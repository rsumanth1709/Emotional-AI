"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api, { chatAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { 
  Eye, HelpCircle, AlertCircle, BarChart3, 
  HelpCircle as QuestionIcon, RefreshCw, MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

import type { SessionSummary } from "@/types";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
}

interface WordExplanation {
  word: string;
  attention_weight: number;
  shap_value: number;
}

interface XAIExplanation {
  chat_id: string;
  message_text: string;
  detected_emotion: string;
  confidence: number;
  sentiment: string;
  stress_score: number;
  keywords: string[];
  words: WordExplanation[];
  decision_rationale: string;
}

export default function ExplainabilityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<XAIExplanation | null>(null);

  // Load user sessions on mount
  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data);
      if (res.data.length > 0) {
        setSelectedSessionId(res.data[0].session_id);
      }
    } catch {
      toast.error("Failed to load conversation history.");
    }
  };

  // Load session messages when session changes
  const fetchSessionMessages = async (session: string) => {
    try {
      const res = await chatAPI.getSession(session);
      // Filter only user messages since XAI explains user inputs
      const userMsgs = res.data.filter((msg) => msg.role === "user");
      setMessages(userMsgs);
      if (userMsgs.length > 0) {
        setSelectedChatId(userMsgs[0].id);
      } else {
        setSelectedChatId("");
        setExplanation(null);
      }
    } catch {
      toast.error("Failed to load message history.");
    }
  };

  // Fetch XAI explanation
  const fetchExplanation = async (chatId: string) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const res = await api.get<XAIExplanation>(`/chat/explain/${chatId}`);
      setExplanation(res.data);
    } catch {
      toast.error("Failed to calculate AI explainability metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionMessages(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedChatId) {
      fetchExplanation(selectedChatId);
    }
  }, [selectedChatId]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading AI transparency suite...
      </div>
    );
  }

  // Get background color intensity for word attention visualization
  const getAttentionColor = (weight: number, maxWeight: number) => {
    const ratio = maxWeight > 0 ? weight / maxWeight : 0;
    // Map ratio to a violet opacity class
    if (ratio > 0.8) return "bg-violet-500 text-white font-bold";
    if (ratio > 0.6) return "bg-violet-500/70 text-white";
    if (ratio > 0.4) return "bg-violet-500/40 text-slate-200";
    if (ratio > 0.2) return "bg-violet-500/20 text-slate-300";
    return "bg-white/5 text-slate-400";
  };

  const maxAttention = explanation?.words.length 
    ? Math.max(...explanation.words.map(w => w.attention_weight)) 
    : 0;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Explainability Portal" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="w-6 h-6 text-violet-400" />
                <span>Explainable AI Suite</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                MindCare AI decisions are fully transparent. Audit model attention vectors, SHAP contributions, and logical pathways.
              </p>
            </div>
            <button 
              onClick={() => selectedChatId && fetchExplanation(selectedChatId)}
              disabled={loading || !selectedChatId}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Session & Message Selectors */}
          <div className="glass p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Select Chat Session</label>
              <select 
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                {sessions.length === 0 ? (
                  <option value="">No chat sessions found</option>
                ) : (
                  sessions.map((s) => (
                    <option key={s.session_id} value={s.session_id}>
                      {s.title || "Session"} ({s.created_at ? new Date(s.created_at).toLocaleDateString() : s.last_active ? new Date(s.last_active).toLocaleDateString() : ""})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Select User Message to Explain</label>
              <select 
                value={selectedChatId}
                disabled={messages.length === 0}
                onChange={(e) => setSelectedChatId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
              >
                {messages.length === 0 ? (
                  <option value="">No user messages in this session</option>
                ) : (
                  messages.map((m) => (
                    <option key={m.id} value={m.id}>
                      &quot;{m.content.length > 60 ? m.content.slice(0, 60) + "..." : m.content}&quot;
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Auditing prediction pathways...</div>
          ) : !explanation ? (
            <div className="glass p-8 text-center text-slate-500 text-sm space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-violet-400" />
              <p>Please select a message to load Explainability outputs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left & Middle Column */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Word Attention Heatmap */}
                <div className="glass p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-slate-300">Model Attention Heatmap</h3>
                    <span className="text-[10px] text-slate-500">Darker highlights indicate higher attention weight</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 py-4">
                    {explanation.words.map((w, idx) => (
                      <div 
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-110 cursor-help relative group ${getAttentionColor(w.attention_weight, maxAttention)}`}
                      >
                        {w.word}
                        <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-xl border border-white/10">
                          Att: {Math.round(w.attention_weight * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHAP Contributions */}
                <div className="glass p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Word SHAP Values (Sentiment Impact)</h3>
                  <div className="space-y-4 py-2">
                    {explanation.words.map((w, idx) => {
                      const isPositive = w.shap_value >= 0;
                      // Max shap for normalization
                      const maxShap = Math.max(...explanation.words.map(x => Math.abs(x.shap_value))) || 1.0;
                      const barPercentage = Math.min(100, (Math.abs(w.shap_value) / maxShap) * 100);

                      return (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-slate-300 font-semibold truncate text-right">{w.word}</span>
                          <div className="flex-1 h-5 bg-white/5 rounded relative flex overflow-hidden">
                            {/* Positive SHAP (Green bar right of center) */}
                            {isPositive ? (
                              <div className="w-1/2 border-r border-white/10" />
                            ) : null}
                            
                            <div className="w-1/2 flex items-center">
                              {!isPositive ? (
                                <div 
                                  className="h-full bg-rose-500/40 border-r border-rose-500 rounded-l ml-auto"
                                  style={{ width: `${barPercentage}%` }}
                                />
                              ) : (
                                <div 
                                  className="h-full bg-emerald-500/40 border-l border-emerald-500 rounded-r"
                                  style={{ width: `${barPercentage}%` }}
                                />
                              )}
                            </div>

                            {!isPositive ? (
                              <div className="w-1/2 border-l border-white/10" />
                            ) : null}
                          </div>
                          <span className={`w-14 font-mono font-bold text-right ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{w.shap_value.toFixed(3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    <span>Negative Sentiment Impact (Red)</span>
                    <span>Positive Sentiment Impact (Green)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Decision Pathways */}
              <div className="space-y-8">
                
                {/* Metric Overview */}
                <div className="glass p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Prediction Summary</h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Classified Emotion:</span>
                      <span className="text-white font-bold px-2 py-0.5 rounded bg-violet-600/30 border border-violet-500/30">
                        {explanation.detected_emotion}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Prediction Confidence:</span>
                      <span className="text-white font-bold">{Math.round(explanation.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sentiment:</span>
                      <span className={`text-xs uppercase font-black ${
                        explanation.sentiment === "positive" ? "text-emerald-400" : 
                        explanation.sentiment === "negative" ? "text-rose-400" : "text-slate-400"
                      }`}>
                        {explanation.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Stress Score:</span>
                      <span className="text-white font-bold">{explanation.stress_score.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>

                {/* Decision Rationale card */}
                <div className="glass p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 border-b border-white/5 pb-3">Response Decision Rationale</h3>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
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
