"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { journalAPI } from "@/lib/axios";
import type { JournalEntry, JournalAnalyzeResponse } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import RichTextEditor from "@/components/journal/RichTextEditor";
import AISuggestionsModal from "@/components/journal/AISuggestionsModal";
import MonthlyInsightsView from "@/components/journal/MonthlyInsightsView";
import JournalExportPDF from "@/components/journal/JournalExportPDF";
import {
  BookOpen, Plus, Trash2, Calendar, Smile, Search, Sparkles,
  Flame, Printer, Filter, RefreshCw, ChevronDown, ChevronUp,
  Tag, Brain, Lightbulb, Edit3, X, CheckCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function JournalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");

  // Journal Entries List & Search
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Editor Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(5);
  const [emotionTag, setEmotionTag] = useState("Neutral");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);

  // AI Emotion Analysis & Summary State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JournalAnalyzeResponse | null>(null);

  // Modals
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [exportSingleEntry, setExportSingleEntry] = useState<JournalEntry | null>(null);

  // Expanded analysis cards
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      if (searchQuery || selectedEmotionFilter !== "All" || startDate || endDate) {
        const res = await journalAPI.searchEntries({
          q: searchQuery,
          emotion: selectedEmotionFilter !== "All" ? selectedEmotionFilter : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setEntries(res.data);
      } else {
        const res = await journalAPI.getEntries();
        setEntries(res.data);
      }
    } catch {
      toast.error("Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, searchQuery, selectedEmotionFilter, startDate, endDate]);

  // Handle AI Analysis on Editor Content
  const handleRunAIAnalysis = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      toast.error("Please write some text in the editor before running AI analysis.");
      return;
    }

    setAiAnalyzing(true);
    try {
      const res = await journalAPI.analyzeEntry({ title, content: plainText });
      setAnalysisResult(res.data);
      setEmotionTag(res.data.emotion);
      setMoodScore(res.data.mood_score);
      toast.success("AI Emotion Analysis & Summary ready!");
    } catch {
      toast.error("Could not run AI analysis.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Submit Create or Update Journal Entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide a title and content.");
      return;
    }

    try {
      const payload = {
        title,
        content,
        mood_score: moodScore,
        emotion_tag: emotionTag,
        summary: analysisResult?.summary,
        ai_analysis: analysisResult ? JSON.stringify(analysisResult) : undefined,
        tags: analysisResult?.suggested_tags?.join(","),
        entry_date: entryDate,
      };

      if (editingId) {
        await journalAPI.updateEntry(editingId, payload);
        toast.success("Journal entry updated!");
      } else {
        await journalAPI.createEntry(payload);
        toast.success("Journal entry saved! +30 XP awarded");
      }

      resetForm();
      fetchEntries();
    } catch {
      toast.error("Could not save journal entry.");
    }
  };

  const handleEditClick = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMoodScore(entry.mood_score);
    setEmotionTag(entry.emotion_tag || "Neutral");
    setEntryDate(entry.entry_date || entry.created_at.split("T")[0]);
    if (entry.ai_analysis) {
      try {
        setAnalysisResult(JSON.parse(entry.ai_analysis));
      } catch {
        setAnalysisResult(null);
      }
    } else {
      setAnalysisResult(null);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await journalAPI.deleteEntry(id);
      toast.success("Journal entry deleted.");
      fetchEntries();
    } catch {
      toast.error("Failed to delete entry.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMoodScore(5);
    setEmotionTag("Neutral");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setAnalysisResult(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleApplyAISuggestion = (suggestionText: string) => {
    setContent((prev) => prev + suggestionText);
  };

  const openSingleExport = (entry: JournalEntry) => {
    setExportSingleEntry(entry);
    setShowPDFExport(true);
  };

  const openBatchExport = () => {
    setExportSingleEntry(null);
    setShowPDFExport(true);
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  // Calculate quick streak count from entries
  const currentStreak = entries.length > 0 ? Math.min(entries.length, 7) : 0;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Personal Therapeutic Journal" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Bar Header & Navigation Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white">Therapeutic Journaling</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{currentStreak} Day Streak</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Reflect on your daily feelings, run AI emotion analysis, and track monthly growth.
              </p>
            </div>

            {/* Action Buttons & Tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("daily")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === "daily"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Daily Journal
                </button>
                <button
                  onClick={() => setActiveTab("monthly")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === "monthly"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly Insights
                </button>
              </div>

              {activeTab === "daily" && (
                <>
                  <button
                    onClick={openBatchExport}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Printer className="w-4 h-4 text-violet-400" />
                    <span>Export PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      if (showForm) resetForm();
                      else setShowForm(true);
                    }}
                    className="btn-primary flex items-center gap-2 text-xs font-semibold py-2.5 px-4"
                  >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{showForm ? "Cancel" : "New Entry"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* TAB 1: DAILY JOURNAL */}
          {activeTab === "daily" && (
            <div className="space-y-8">
              {/* Daily Prompt Banner */}
              {!showForm && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-slate-900 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
                      <Lightbulb className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">Daily Journal Prompt</h4>
                      <p className="text-sm font-medium text-white mt-0.5">
                        "What made you feel grounded or grateful today, and what is one thought you wish to release?"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setContent("<p><strong>Daily Prompt: What made me feel grounded today...</strong></p><p></p>");
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shrink-0 transition-all shadow-lg shadow-violet-600/30"
                  >
                    Start Writing
                  </button>
                </div>
              )}

              {/* Editor Form Section */}
              {showForm && (
                <form onSubmit={handleSubmit} className="glass p-6 md:p-8 space-y-6 max-w-4xl mx-auto border border-violet-500/30 shadow-2xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-violet-400" />
                      <span>{editingId ? "Edit Journal Entry" : "New Journal Entry"}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Title & Actions toolbar */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Entry Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Evening Reflection on Courage and Balance"
                      className="input-field font-semibold text-white placeholder-slate-500"
                    />
                  </div>

                  {/* Rich Text Editor Component */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Rich Text Journal Content</label>
                      <button
                        type="button"
                        onClick={() => setShowAISuggestions(true)}
                        className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Writing Suggestions</span>
                      </button>
                    </div>
                    <RichTextEditor
                      value={content}
                      onChange={(val) => setContent(val)}
                      placeholder="Write freely about your experiences, thoughts, and emotions..."
                      minHeight="220px"
                    />
                  </div>

                  {/* AI Analysis Button & Results Display */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-violet-400" />
                        <h4 className="font-bold text-white text-sm">AI Emotion & Stress Analyzer</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAIAnalysis}
                        disabled={aiAnalyzing}
                        className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-semibold border border-violet-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${aiAnalyzing ? "animate-spin" : ""}`} />
                        <span>{aiAnalyzing ? "Analyzing..." : "Analyze Draft"}</span>
                      </button>
                    </div>

                    {analysisResult && (
                      <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-2.5 rounded-lg bg-slate-800/60">
                            <span className="text-slate-400 block">Emotion Tag</span>
                            <span className="font-bold text-violet-400">{analysisResult.emotion} ({Math.round(analysisResult.confidence * 100)}%)</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800/60">
                            <span className="text-slate-400 block">Sentiment</span>
                            <span className="font-bold text-emerald-400 capitalize">{analysisResult.sentiment}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800/60">
                            <span className="text-slate-400 block">Stress Rating</span>
                            <span className="font-bold text-orange-400">{analysisResult.stress_score} / 10</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800/60">
                            <span className="text-slate-400 block">Predicted Mood</span>
                            <span className="font-bold text-cyan-400">{analysisResult.mood_score} / 10</span>
                          </div>
                        </div>

                        {analysisResult.summary && (
                          <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-500/20 text-slate-300 leading-relaxed">
                            <span className="font-bold text-violet-300 block mb-1">AI Summary:</span>
                            {analysisResult.summary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mood Score & Feeling Tag controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-semibold">Mood Score ({moodScore}/10)</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={moodScore}
                        onChange={(e) => setMoodScore(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-semibold">Emotion Tag</label>
                      <select
                        value={emotionTag}
                        onChange={(e) => setEmotionTag(e.target.value)}
                        className="input-field py-2.5 text-slate-300"
                      >
                        {["Happy", "Excited", "Hopeful", "Sad", "Lonely", "Angry", "Fear", "Anxiety", "Stress", "Neutral"].map((emo) => (
                          <option key={emo} value={emo} className="bg-slate-900 text-white">{emo}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary flex-1 py-3 font-semibold text-sm">
                      {editingId ? "Update Entry" : "Save Journal Entry"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Search & Filter Toolbar */}
              <div className="glass p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search journal entries by keyword or tag..."
                    className="input-field pl-9 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <select
                    value={selectedEmotionFilter}
                    onChange={(e) => setSelectedEmotionFilter(e.target.value)}
                    className="input-field py-2.5 text-xs text-slate-300"
                  >
                    <option value="All" className="bg-slate-900">All Emotions</option>
                    {["Happy", "Excited", "Hopeful", "Sad", "Lonely", "Angry", "Fear", "Anxiety", "Stress", "Neutral"].map((emo) => (
                      <option key={emo} value={emo} className="bg-slate-900 text-white">{emo}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 w-full"
                  />
                  {(searchQuery || selectedEmotionFilter !== "All" || startDate || endDate) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedEmotionFilter("All");
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Clear filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Entries Feed Grid */}
              {loading ? (
                <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Loading therapeutic logs...</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="glass p-12 text-center max-w-md mx-auto space-y-4">
                  <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
                  <h3 className="font-bold text-white text-lg">No Journal Entries Found</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {searchQuery || selectedEmotionFilter !== "All"
                      ? "No entries match your search filters. Try clearing your filters."
                      : "Writing down your feelings helps reduce stress and organize thoughts. Click 'New Entry' above to begin."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {entries.map((entry) => {
                    let parsedAnalysis: any = null;
                    if (entry.ai_analysis) {
                      try {
                        parsedAnalysis = typeof entry.ai_analysis === "string" ? JSON.parse(entry.ai_analysis) : entry.ai_analysis;
                      } catch {
                        parsedAnalysis = null;
                      }
                    }

                    const isExpanded = expandedAnalysisId === entry.id;

                    return (
                      <div key={entry.id} className="glass p-6 flex flex-col justify-between gap-4 relative group border border-slate-800/80 hover:border-violet-500/40 transition-all">
                        {/* Top Entry Header & Actions */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-bold text-lg text-white leading-snug">{entry.title}</h3>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openSingleExport(entry)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 transition-colors"
                                title="Export PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditClick(entry)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Edit Entry"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Formatted Content */}
                          <div
                            className="text-xs text-slate-300 leading-relaxed whitespace-pre-line prose prose-invert max-w-none line-clamp-6"
                            dangerouslySetInnerHTML={{ __html: entry.content }}
                          />

                          {/* AI Summary Banner if present */}
                          {entry.summary && (
                            <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-slate-300 space-y-1">
                              <span className="font-bold text-violet-400 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Summary:</span>
                              </span>
                              <p className="text-slate-300 leading-relaxed">{entry.summary}</p>
                            </div>
                          )}

                          {/* Toggleable Detailed AI Analysis */}
                          {parsedAnalysis && (
                            <div className="pt-2">
                              <button
                                onClick={() => setExpandedAnalysisId(isExpanded ? null : entry.id)}
                                className="text-xs text-slate-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors"
                              >
                                <Brain className="w-3.5 h-3.5 text-violet-400" />
                                <span>{isExpanded ? "Hide AI Breakdown" : "View Emotion Breakdown"}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {isExpanded && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 animate-fade-in">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-slate-500 block">Emotion Confidence:</span>
                                      <span className="font-bold text-violet-400">{Math.round((parsedAnalysis.confidence || 0.8) * 100)}%</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">Stress Index:</span>
                                      <span className="font-bold text-orange-400">{parsedAnalysis.stress_score} / 10</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Metadata */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{entry.entry_date || new Date(entry.created_at).toLocaleDateString()}</span>
                          </span>

                          <span className="flex items-center gap-1.5 text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                            <Smile className="w-3.5 h-3.5" />
                            <span>Mood: {entry.mood_score}/10 ({entry.emotion_tag || "Neutral"})</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MONTHLY INSIGHTS */}
          {activeTab === "monthly" && <MonthlyInsightsView />}
        </main>
      </div>

      {/* AI Writing Suggestions Modal */}
      <AISuggestionsModal
        isOpen={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
        title={title}
        content={content}
        onApplySuggestion={handleApplyAISuggestion}
      />

      {/* Journal PDF Export Modal */}
      <JournalExportPDF
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        entries={entries}
        singleEntry={exportSingleEntry}
      />
    </div>
  );
}
