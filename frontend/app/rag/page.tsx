"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ragAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Database, CheckCircle2, AlertTriangle, RefreshCw, Info, Play,
  BarChart2, ShieldCheck, Sparkles, Layers, ArrowRight, ExternalLink, Plus, BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface RetrievalResult {
  status: string;
  delivered_text?: string;
  intent?: string;
  risk_level?: string;
  latency_ms: number;
  retrieved_results: Array<{
    document_id: string;
    title: string;
    content: string;
    source_name: string;
    source_url: string;
    relevance_score: number;
  }>;
  citations?: Array<{
    title: string;
    source_name: string;
    url: string;
  }>;
}

export default function RAGDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState<string>("I'm overwhelmed with my upcoming exams.");
  const [emotion, setEmotion] = useState<string>("stress");
  const [retrieving, setRetrieving] = useState<boolean>(false);
  const [result, setResult] = useState<RetrievalResult | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);

  // Ingest document state
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newTopic, setNewTopic] = useState<string>("academic_stress");
  const [newContent, setNewContent] = useState<string>("");
  const [ingesting, setIngesting] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    try {
      const res = await ragAPI.getAnalytics();
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load RAG analytics.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchAnalytics();
  }, [user, authLoading, router]);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRetrieving(true);
    try {
      const res = await ragAPI.generate(query, emotion);
      setResult(res.data);
      toast.success("Trusted knowledge retrieved!");
      fetchAnalytics();
    } catch {
      toast.error("Failed to perform RAG retrieval.");
    } finally {
      setRetrieving(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIngesting(true);
    try {
      const res = await ragAPI.ingestDocument({
        title: newTitle,
        topic: newTopic,
        content: newContent,
      });
      toast.success(res.data.message);
      // Auto approve for demo
      await ragAPI.approveDocument(res.data.document_id);
      toast.success("Document approved for RAG indexing!");
      setShowIngestModal(false);
      setNewTitle("");
      setNewContent("");
      fetchAnalytics();
    } catch {
      toast.error("Failed to ingest knowledge document.");
    } finally {
      setIngesting(false);
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotion-Aware RAG Architecture" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Memory Isolation Notice */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Database className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Emotion-Aware RAG
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Trusted Source Grounding
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Combines user query intent with detected emotional context to retrieve evidence from approved trusted healthcare sources.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIngestModal(true)}
                className="btn-primary py-2 px-4 font-bold text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ingest Document
              </button>
            </div>

            {/* Strict Memory Isolation Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p>
                <strong>Memory Isolation Guarantee:</strong> Personal conversation memory is strictly isolated from trusted knowledge base documents and is <strong>NEVER</strong> treated as medical evidence.
              </p>
            </div>
          </div>

          {/* Operations KPI Cards */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Approved Knowledge Sources</span>
                <p className="text-2xl font-extrabold text-purple-400">{analytics.approved_sources_count}</p>
                <span className="text-[10px] text-slate-500">Government &amp; Medical Orgs</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Approved Documents</span>
                <p className="text-2xl font-extrabold text-white">{analytics.approved_documents_count}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">Indexed Vectors</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Average Retrieval Latency</span>
                <p className="text-2xl font-extrabold text-cyan-400">{analytics.average_latency_ms} ms</p>
                <span className="text-[10px] text-slate-500">Sub-20ms Search</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400">Total Audited Queries</span>
                <p className="text-2xl font-extrabold text-white">{analytics.total_queries}</p>
                <span className="text-[10px] text-purple-400 font-semibold">RAG Pipeline Executions</span>
              </div>
            </div>
          )}

          {/* Interactive RAG Sandbox Console */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Database className="w-4 h-4 text-purple-400" />
                Live Emotion-Aware RAG Retrieval Sandbox
              </h3>

              <form onSubmit={handleRetrieve} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">User Query Message</label>
                  <textarea
                    rows={3}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Detected User Emotion Context</label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="stress">Stress</option>
                    <option value="anxiety">Anxiety</option>
                    <option value="sadness">Sadness</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={retrieving}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {retrieving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Retrieve Trusted Knowledge &amp; Generate RAG Response
                </button>
              </form>
            </div>

            {/* RAG Retrieval Result Card */}
            {result && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">RAG Retrieval Payload</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    result.status === "SUCCESS" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    Status: {result.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Detected Intent</span>
                    <p className="text-sm font-extrabold text-purple-400 font-mono">{result.intent}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-semibold">Retrieval Latency</span>
                    <p className="text-sm font-extrabold text-cyan-400">{result.latency_ms} ms</p>
                  </div>
                </div>

                {/* Retrieved Trusted Documents */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold">Retrieved Trusted Documents ({result.retrieved_results.length})</span>
                  <div className="space-y-2">
                    {result.retrieved_results.map((doc, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-white">{doc.title}</span>
                          <span className="text-emerald-400">Relevance: {doc.relevance_score}%</span>
                        </div>
                        <p className="text-slate-300">{doc.content}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                          <span>Source: {doc.source_name}</span>
                          <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                            Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivered Response */}
                {result.delivered_text && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold">Delivered Evidence-Grounded Response:</span>
                    <p className="text-white font-mono text-[11px]">&ldquo;{result.delivered_text}&rdquo;</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingest Document Modal */}
          {showIngestModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Ingest Knowledge Document
                  </h3>
                  <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleIngest} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Document Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Cognitive Strategies for Mindfulness"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Topic Category</label>
                    <select
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="academic_stress">Academic Stress</option>
                      <option value="sleep_support">Sleep Support</option>
                      <option value="coping_strategy">Coping Strategy</option>
                      <option value="mindfulness">Mindfulness</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Approved Document Content</label>
                    <textarea
                      rows={4}
                      required
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Enter verified educational healthcare content..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowIngestModal(false)} className="btn-secondary py-2 px-3">
                      Cancel
                    </button>
                    <button type="submit" disabled={ingesting} className="btn-primary py-2 px-4">
                      {ingesting ? "Ingesting…" : "Ingest & Approve Document"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
