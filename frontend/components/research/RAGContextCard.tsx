"use client";

import React, { useState } from "react";
import { Search, Database, Sparkles, BookOpen, ShieldCheck, Tag } from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type { RAGResponse } from "@/types";
import { toast } from "react-hot-toast";

export default function RAGContextCard() {
  const [query, setQuery] = useState("How do I ground myself during an intense anxiety episode?");
  const [emotionContext, setEmotionContext] = useState("Anxiety");
  const [loading, setLoading] = useState(false);
  const [ragData, setRagData] = useState<RAGResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await researchAPI.queryRAG(query, emotionContext, 3);
      setRagData(res.data);
    } catch {
      toast.error("RAG retrieval failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 space-y-6 animate-fade-in border border-violet-500/20">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Emotion-Aware Clinical RAG Engine</h3>
            <p className="text-xs text-slate-400">Retrieves vector embeddings re-ranked by user emotional state</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
          ChromaDB + SentenceTransformers
        </span>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 block mb-1">Therapeutic Search Query</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about coping techniques or clinical guidelines..."
                className="input-field pl-9 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">User Emotion Context</label>
            <select
              value={emotionContext}
              onChange={(e) => setEmotionContext(e.target.value)}
              className="input-field py-2.5 text-xs text-slate-300"
            >
              {["Anxiety", "Fear", "Stress", "Sad", "Lonely", "Angry", "Happy", "Hopeful", "Neutral"].map((emo) => (
                <option key={emo} value={emo} className="bg-slate-900 text-white">{emo}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary py-2.5 text-xs font-semibold flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Retrieving Clinical Vector Embeddings..." : "Run Emotion-Aware RAG Retrieval"}</span>
        </button>
      </form>

      {ragData && (
        <div className="space-y-4 pt-2 border-t border-slate-800 animate-fade-in">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>Retrieved Clinical Passages ({ragData.total_retrieved})</span>
          </h4>

          <div className="space-y-3">
            {ragData.passages.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-300 text-xs">{p.title}</span>
                  <div className="flex items-center gap-2">
                    {p.emotion_boosted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        +Emotion Boosted ({ragData.emotion_context})
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-400">Score: {p.relevance_score}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{p.content}</p>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Category: {p.category} | Target Emotions: {p.target_emotions.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-slate-300">
            <span className="font-bold text-violet-400 block mb-1">LLM Grounding Prompt Context:</span>
            <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
              {ragData.rag_prompt_context}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
