"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Check, Compass, HelpCircle, ArrowRight, Lightbulb, X } from "lucide-react";
import { journalAPI } from "@/lib/axios";
import type { WritingSuggestionResponse } from "@/types";
import { toast } from "react-hot-toast";

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onApplySuggestion: (suggestionText: string) => void;
}

export default function AISuggestionsModal({
  isOpen,
  onClose,
  title,
  content,
  onApplySuggestion,
}: AISuggestionsModalProps) {
  const [activeTab, setActiveTab] = useState<"continue" | "reframe" | "reflect" | "prompt">("continue");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<WritingSuggestionResponse | null>(null);

  if (!isOpen) return null;

  const fetchSuggestion = async (type: "continue" | "reframe" | "reflect" | "prompt") => {
    setActiveTab(type);
    setLoading(true);
    try {
      // Strip HTML tags for clean API text input
      const plainContent = content.replace(/<[^>]+>/g, "").trim();
      const res = await journalAPI.generateSuggestions({
        title,
        content: plainContent,
        type,
      });
      setSuggestion(res.data);
    } catch {
      toast.error("Failed to generate AI suggestion.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (textToApply: string) => {
    onApplySuggestion(textToApply);
    toast.success("Inserted into your journal!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Writing Assistant</h3>
              <p className="text-xs text-slate-400">Therapeutic prompts, reframing, and thought continuation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => fetchSuggestion("continue")}
            className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "continue"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Continuation</span>
          </button>

          <button
            onClick={() => fetchSuggestion("reframe")}
            className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "reframe"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>CBT Reframe</span>
          </button>

          <button
            onClick={() => fetchSuggestion("reflect")}
            className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "reflect"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Reflections</span>
          </button>

          <button
            onClick={() => fetchSuggestion("prompt")}
            className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === "prompt"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Daily Prompt</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Synthesizing AI suggestion...</p>
            </div>
          ) : !suggestion ? (
            <div className="text-center py-12 space-y-4">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">
                Click one of the buttons above to generate writing prompts or therapeutic guidance.
              </p>
              <button
                onClick={() => fetchSuggestion("continue")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>Generate Suggestion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-2">
                <h4 className="font-bold text-violet-300 text-sm">{suggestion.title}</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{suggestion.text}</p>
              </div>

              {suggestion.reflection_questions && suggestion.reflection_questions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Suggested Questions:</h5>
                  <div className="space-y-2">
                    {suggestion.reflection_questions.map((q, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-start justify-between gap-3 text-sm text-slate-200 group hover:border-violet-500/40"
                      >
                        <span className="flex-1">❓ {q}</span>
                        <button
                          onClick={() => handleApply(`\n\n<p><strong>Reflection: ${q}</strong></p><p></p>`)}
                          className="px-2.5 py-1 rounded-md bg-violet-600/30 text-violet-300 hover:bg-violet-600 hover:text-white text-xs transition-colors shrink-0"
                        >
                          Insert
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.text && (
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    onClick={() => fetchSuggestion(activeTab)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={() => handleApply(`\n<p>${suggestion.text}</p>`)}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-sm font-medium shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Append to Entry</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
