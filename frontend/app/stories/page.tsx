"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { storyAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  BookOpen, Sparkles, RefreshCw, Star, Play, Pause, Square,
  ThumbsUp, ThumbsDown, PenTool, Bookmark, Compass, Heart, Layers, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface StoryItem {
  id?: string;
  title: string;
  genre: string;
  theme: string;
  length: string;
  content: string;
  reflection_prompt?: string;
  is_interactive?: boolean;
  is_favorite?: boolean;
  choices?: string[];
}

export default function StoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("hope");
  const [selectedGenre, setSelectedGenre] = useState<string>("realistic");
  const [selectedLength, setSelectedLength] = useState<string>("short");
  const [isInteractive, setIsInteractive] = useState<boolean>(false);

  const [currentStory, setCurrentStory] = useState<StoryItem | null>(null);
  const [history, setHistory] = useState<StoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"reader" | "history">("reader");

  // TTS Audio Player State
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await storyAPI.getHistory({ limit: 20 });
      setHistory(res.data);
    } catch {
      // Ignore initial history failure
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) {
      if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
      fetchHistory();
    }
  }, [user, authLoading, router]);

  const handleGenerateStory = async () => {
    setLoading(true);
    stopTTS();
    try {
      const res = await storyAPI.generateStory({
        theme: selectedTheme,
        genre: selectedGenre,
        length: selectedLength,
        is_interactive: isInteractive,
        use_emotion: true,
      });
      setCurrentStory(res.data);
      setActiveTab("reader");
      toast.success(`Generated story: "${res.data.title}"`);
      fetchHistory();
    } catch {
      toast.error("Failed to generate story.");
    } finally {
      setLoading(false);
    }
  };

  const handleInteractiveChoice = async (index: number, choiceText: string) => {
    if (!currentStory?.id) return;
    setLoading(true);
    stopTTS();
    try {
      const res = await storyAPI.submitChoice(currentStory.id, {
        choice_index: index,
        choice_text: choiceText,
      });
      setCurrentStory((prev) => prev ? {
        ...prev,
        content: prev.content + "\n\n" + res.data.content,
        choices: res.data.choices || [],
      } : null);
      toast.success("Story advanced to next chapter.");
    } catch {
      toast.error("Failed to process interactive choice.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentStory?.id) return;
    try {
      const res = await storyAPI.toggleFavorite(currentStory.id);
      setCurrentStory((prev) => prev ? { ...prev, is_favorite: res.data.is_favorite } : null);
      toast.success(res.data.is_favorite ? "Saved to Favorites ⭐" : "Removed from Favorites.");
      fetchHistory();
    } catch {
      toast.error("Failed to update favorite status.");
    }
  };

  const handleContinueStory = async () => {
    if (!currentStory?.id) return;
    setLoading(true);
    try {
      const res = await storyAPI.continueStory(currentStory.id);
      setCurrentStory((prev) => prev ? { ...prev, content: res.data.content } : null);
      toast.success("Story continued.");
    } catch {
      toast.error("Failed to continue story.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativeEnding = async () => {
    if (!currentStory?.id) return;
    setLoading(true);
    try {
      const res = await storyAPI.generateAlternativeEnding(currentStory.id, "hopeful");
      setCurrentStory((prev) => prev ? { ...prev, content: res.data.content } : null);
      toast.success("Alternative ending generated.");
    } catch {
      toast.error("Failed to generate alternative ending.");
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech (TTS) Controls
  const toggleTTS = () => {
    if (!synthRef.current || !currentStory) return;
    if (isPlayingTTS) {
      synthRef.current.cancel();
      setIsPlayingTTS(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(currentStory.content);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);
      synthRef.current.speak(utterance);
      setIsPlayingTTS(true);
    }
  };

  const stopTTS = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsPlayingTTS(false);
  };

  const handleWriteJournal = (promptText?: string) => {
    const pText = promptText || currentStory?.reflection_prompt || "";
    router.push(`/journal?prompt=${encodeURIComponent(pText)}`);
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="AI Emotional Storytelling Engine" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900 to-indigo-950/30 p-6">
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      AI Emotional Storytelling Engine
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Uplifting Narrative AI
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Generate short, uplifting, and context-aware stories tailored to your preferred themes, goals,
                    and optional emotional check-ins with support for interactive choice narratives.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span>📚 13 Story Types &amp; Genres</span>
                    <span>🎮 Interactive Choice Narratives</span>
                    <span>🎙️ Text-to-Speech Audio Reader</span>
                    <span>🛡️ Non-Clinical Narrative Shield</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Generator Controls */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Configure Story Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Theme Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Theme / Mood</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="hope">Hope &amp; Renewal</option>
                  <option value="resilience">Resilience &amp; Strength</option>
                  <option value="calm">Calm &amp; Peace</option>
                  <option value="friendship">Friendship &amp; Connection</option>
                  <option value="confidence">Confidence &amp; Courage</option>
                  <option value="gratitude">Gratitude &amp; Joy</option>
                </select>
              </div>

              {/* Genre Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="realistic">Realistic</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="adventure">Adventure</option>
                  <option value="slice_of_life">Slice of Life</option>
                  <option value="inspirational">Inspirational</option>
                </select>
              </div>

              {/* Length Selector */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Story Length</label>
                <select
                  value={selectedLength}
                  onChange={(e) => setSelectedLength(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="short">Short (1–2 min)</option>
                  <option value="medium">Medium (3–5 min)</option>
                  <option value="long">Long (5–10 min)</option>
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isInteractive}
                    onChange={(e) => setIsInteractive(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Interactive Choices Mode</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {loading ? "Crafting Story Narrative..." : "Generate Emotional Story"}
            </button>
          </div>

          {/* Navigation Tabs (Reader / History) */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("reader")}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  activeTab === "reader"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                Story Reader
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  activeTab === "history"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                Story History &amp; Favorites ({history.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Distraction-Free Story Reader UI */}
          {activeTab === "reader" && currentStory && (
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                    {currentStory.genre} • {currentStory.theme}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">{currentStory.title}</h2>
                </div>

                <div className="flex gap-2">
                  {/* TTS Audio Button */}
                  <button
                    onClick={toggleTTS}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                      isPlayingTTS
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {isPlayingTTS ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlayingTTS ? "Stop Audio" : "Listen (TTS)"}
                  </button>

                  {/* Favorite Star */}
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      currentStory.is_favorite
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${currentStory.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Story Narrative Content */}
              <div className="text-slate-200 text-sm leading-relaxed space-y-4 font-serif whitespace-pre-wrap">
                {currentStory.content}
              </div>

              {/* Interactive Choices Component */}
              {currentStory.is_interactive && currentStory.choices && currentStory.choices.length > 0 && (
                <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 font-sans">
                  <span className="text-xs font-bold text-amber-400 block">Make your choice for the next chapter:</span>
                  <div className="space-y-2">
                    {currentStory.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleInteractiveChoice(idx, choice)}
                        className="w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-white transition-all flex items-center justify-between"
                      >
                        <span>{choice}</span>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Continuation Controls */}
              {!currentStory.is_interactive && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={handleContinueStory}
                    disabled={loading}
                    className="py-2 px-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300"
                  >
                    Continue Story
                  </button>
                  <button
                    onClick={handleAlternativeEnding}
                    disabled={loading}
                    className="py-2 px-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300"
                  >
                    Generate Alternative Ending
                  </button>
                </div>
              )}

              {/* Reflection Prompt & Journal Route */}
              {currentStory.reflection_prompt && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Optional Story Reflection</span>
                    <p className="text-xs text-slate-300 italic font-medium">"{currentStory.reflection_prompt}"</p>
                  </div>
                  <button
                    onClick={() => handleWriteJournal(currentStory.reflection_prompt)}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Reflect in MindCare Journal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Story History & Favorites */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => { setCurrentStory(story); setActiveTab("reader"); }}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer space-y-3 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">{story.genre} • {story.theme}</span>
                        {story.is_favorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      </div>
                      <h4 className="font-bold text-white text-sm">{story.title}</h4>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{story.content}</p>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/60">
                      <span className="capitalize">{story.length} length</span>
                      <span className="text-amber-400 font-semibold flex items-center gap-1">Read Story <ChevronRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
