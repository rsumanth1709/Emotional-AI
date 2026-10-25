"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { annotationAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Tag, MessageSquare, CheckCircle, Download, Users, RefreshCw, Sparkles,
  BarChart2, ShieldCheck, Layers, FileText, ChevronRight, Play, Award, CheckSquare
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface AnnotationTaskItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  taxonomy: string[];
  min_annotators_per_sample: number;
}

interface ConversationSampleItem {
  id: string;
  conversation_id: string;
  turns: Array<{ turn_id: number; speaker: string; text: string }>;
  consensus_emotion?: string;
  is_consensus_reached: boolean;
  annotations_count: number;
}

export default function AnnotationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<AnnotationTaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [samples, setSamples] = useState<ConversationSampleItem[]>([]);
  const [selectedSample, setSelectedSample] = useState<ConversationSampleItem | null>(null);
  const [agreement, setAgreement] = useState<any>(null);

  // Annotation Form State
  const [selectedPrimaryEmotion, setSelectedPrimaryEmotion] = useState<string>("Anxious");
  const [turnEmotions, setTurnEmotions] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<number>(0.95);
  const [notes, setNotes] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const tRes = await annotationAPI.getTasks();
      setTasks(tRes.data);

      const targetTaskId = selectedTaskId || (tRes.data.length > 0 ? tRes.data[0].id : "");
      if (targetTaskId) {
        setSelectedTaskId(targetTaskId);
        const [sRes, aRes] = await Promise.all([
          annotationAPI.getSamples(targetTaskId),
          annotationAPI.getAgreement(targetTaskId),
        ]);
        setSamples(sRes.data);
        setAgreement(aRes.data);
        if (sRes.data.length > 0 && !selectedSample) {
          setSelectedSample(sRes.data[0]);
        }
      }
    } catch {
      toast.error("Failed to load dataset annotation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, authLoading, router, selectedTaskId]);

  const handleTurnEmotionChange = (turnId: number, emotion: string) => {
    setTurnEmotions((prev) => ({ ...prev, [turnId.toString()]: emotion }));
  };

  const handleSubmitAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample) return;
    setLoading(true);
    try {
      await annotationAPI.annotateSample(selectedSample.id, {
        primary_emotion: selectedPrimaryEmotion,
        turn_emotions: turnEmotions,
        confidence: confidence,
        notes: notes,
      });
      toast.success("Emotion labels submitted successfully!");
      fetchData();
    } catch {
      toast.error("Failed to submit sample annotation.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "json" | "jsonl" | "csv") => {
    if (!selectedTaskId) return;
    try {
      const res = await annotationAPI.exportDataset(selectedTaskId, format);
      const content = typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindcare_emotion_dataset.${format}`;
      a.click();
      toast.success(`Exported dataset in ${format.toUpperCase()} format!`);
    } catch {
      toast.error("Failed to export dataset.");
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const taxonomy = tasks.find((t) => t.id === selectedTaskId)?.taxonomy || [
    "Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral", "Anxious", "Calm", "Frustrated"
  ];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Dataset Annotation Platform" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Dataset Annotation Platform
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Multi-Annotator Labeling
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Annotate emotions in multi-turn conversations, measure Fleiss&apos; &amp; Cohen&apos;s Kappa inter-annotator agreement, and export consensus datasets in JSON, JSONL, or CSV formats.
                  </p>
                </div>
              </div>

              {/* Dataset Exporters */}
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => handleExport("json")}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Export JSON
                </button>
                <button
                  onClick={() => handleExport("jsonl")}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> JSONL
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> CSV
                </button>
              </div>
            </div>

            {/* Inter-Annotator Agreement Header Metrics */}
            {agreement && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Fleiss&apos; Kappa (&kappa;)</span>
                  <p className="text-lg font-extrabold text-amber-400">{agreement.fleiss_kappa}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Cohen&apos;s Kappa</span>
                  <p className="text-lg font-extrabold text-white">{agreement.cohens_kappa}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Percentage Agreement</span>
                  <p className="text-lg font-extrabold text-emerald-400">{agreement.percentage_agreement}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 font-semibold">Agreement Level</span>
                  <p className="text-sm font-extrabold text-cyan-400 truncate">{agreement.agreement_level}</p>
                </div>
              </div>
            )}
          </div>

          {/* Conversation Samples Selector & Annotator Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Samples Sidebar List */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Conversation Samples ({samples.length})
              </h3>

              <div className="space-y-2 text-xs">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSample(s)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      selectedSample?.id === s.id
                        ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white font-mono">{s.conversation_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_consensus_reached ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {s.is_consensus_reached ? `✓ ${s.consensus_emotion}` : "Pending"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-1">
                      {s.turns[0]?.text || "No text preview"}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      Annotators: {s.annotations_count} submitted
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Annotation Console */}
            {selectedSample && (
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                      Sample: {selectedSample.conversation_id}
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      Multi-Turn Emotion Annotation Console
                    </h3>
                  </div>
                </div>

                {/* Multi-Turn Dialogue Display */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400">Multi-Turn Conversation Dialogue</span>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedSample.turns.map((turn) => (
                      <div key={turn.turn_id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-bold ${turn.speaker === "User" ? "text-amber-400" : "text-cyan-400"}`}>
                            {turn.speaker} (Turn #{turn.turn_id})
                          </span>

                          <select
                            value={turnEmotions[turn.turn_id.toString()] || "Anxious"}
                            onChange={(e) => handleTurnEmotionChange(turn.turn_id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-[11px] p-1 font-bold"
                          >
                            {taxonomy.map((e) => (
                              <option key={e} value={e}>{e}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-slate-300 text-xs">{turn.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Conversation Emotion & Confidence Form */}
                <form onSubmit={handleSubmitAnnotation} className="space-y-4 text-xs pt-4 border-t border-slate-800">
                  <div className="space-y-2">
                    <label className="text-slate-400 font-bold block">Primary Conversation Emotion</label>
                    <div className="flex flex-wrap gap-2">
                      {taxonomy.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setSelectedPrimaryEmotion(e)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                            selectedPrimaryEmotion === e
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                              : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Annotator Confidence Level ({(confidence * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min={0.5}
                      max={1.0}
                      step={0.05}
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Submit Emotion Annotation
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
