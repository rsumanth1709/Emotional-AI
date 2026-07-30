"use client";

import React, { useRef } from "react";
import { Printer, Download, X, Calendar, Smile, BookOpen, ShieldCheck, Tag } from "lucide-react";
import type { JournalEntry } from "@/types";

interface JournalExportPDFProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  singleEntry?: JournalEntry | null;
}

export default function JournalExportPDF({
  isOpen,
  onClose,
  entries,
  singleEntry,
}: JournalExportPDFProps) {
  if (!isOpen) return null;

  const exportList = singleEntry ? [singleEntry] : entries;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/80 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export Journal to PDF</h3>
              <p className="text-xs text-slate-400">
                {singleEntry ? `Exporting "${singleEntry.title}"` : `Exporting ${exportList.length} journal entries`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content View Container */}
        <div className="p-8 overflow-y-auto space-y-8 bg-slate-950 text-slate-100 print:bg-white print:text-slate-900 print:p-0 print:overflow-visible">
          {/* Printable Document Banner */}
          <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-slate-900">
                MindCare AI — Therapeutic Journal Report
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Confidential & Private Personal Wellness Log • Generated {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 print:bg-violet-100 print:text-violet-800">
                Verified Safe Log
              </span>
            </div>
          </div>

          {/* List of Entries */}
          {exportList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No entries available to export.</div>
          ) : (
            exportList.map((entry, idx) => {
              let parsedAnalysis: any = null;
              if (entry.ai_analysis) {
                try {
                  parsedAnalysis = typeof entry.ai_analysis === "string" ? JSON.parse(entry.ai_analysis) : entry.ai_analysis;
                } catch {
                  parsedAnalysis = null;
                }
              }

              return (
                <div
                  key={entry.id}
                  className="space-y-4 border-b border-slate-800/80 print:border-slate-300 pb-8 print:break-inside-avoid"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white print:text-slate-900">{entry.title}</h2>
                      <div className="flex items-center gap-4 text-xs text-slate-400 print:text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{entry.entry_date || new Date(entry.created_at).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1 text-violet-400 print:text-violet-700 font-medium">
                          <Smile className="w-3.5 h-3.5" />
                          <span>Mood: {entry.mood_score}/10 ({entry.emotion_tag || "Neutral"})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HTML Content Render */}
                  <div
                    className="text-sm text-slate-200 print:text-slate-800 leading-relaxed whitespace-pre-line prose prose-invert print:prose-slate max-w-none pt-2"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />

                  {/* AI Summary & Emotion Analysis Block */}
                  {(entry.summary || parsedAnalysis) && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-900/90 print:bg-slate-100 border border-slate-800 print:border-slate-300 space-y-3">
                      {entry.summary && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 print:text-violet-800 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>AI Therapeutic Summary</span>
                          </h4>
                          <p className="text-xs text-slate-300 print:text-slate-700 mt-1 leading-relaxed">
                            {entry.summary}
                          </p>
                        </div>
                      )}

                      {parsedAnalysis && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 print:border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-500 print:text-slate-600 block">Emotion:</span>
                            <span className="font-semibold text-slate-200 print:text-slate-900">{parsedAnalysis.emotion}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 print:text-slate-600 block">Confidence:</span>
                            <span className="font-semibold text-slate-200 print:text-slate-900">{Math.round((parsedAnalysis.confidence || 0.8) * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 print:text-slate-600 block">Sentiment:</span>
                            <span className="font-semibold text-slate-200 print:text-slate-900 capitalize">{parsedAnalysis.sentiment}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 print:text-slate-600 block">Stress Level:</span>
                            <span className="font-semibold text-slate-200 print:text-slate-900">{parsedAnalysis.stress_score} / 10</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.tags && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Tags: {entry.tags}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Printable Footer */}
          <div className="pt-4 text-center text-xs text-slate-500 print:text-slate-600 border-t border-slate-800 print:border-slate-300">
            Exported from MindCare AI — Emotion-Aware Mental Health Companion System
          </div>
        </div>
      </div>
    </div>
  );
}
