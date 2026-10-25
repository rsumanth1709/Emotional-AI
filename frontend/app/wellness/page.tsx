"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { wellnessAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Heart, Sparkles, RefreshCw, Play, Pause, RotateCcw, CheckCircle2,
  BookOpen, Wind, Smile, Flame, ThumbsUp, ThumbsDown, Shield, PenTool, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

interface ContentItem {
  id?: string;
  type: string;
  title: string;
  content?: string;
  duration_minutes?: number;
  pattern?: { inhale: number; hold: number; exhale: number; safety: string };
  instructions?: string[];
  prompt?: string;
  follow_up_prompts?: string[];
  safety_note?: string;
  completion_message?: string;
  morning_affirmation?: string;
  afternoon_breathing?: any;
  evening_journal?: any;
}

export default function WellnessPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("affirmation");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("stress");

  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);
  const [dailyPlan, setDailyPlan] = useState<any | null>(null);

  // Breathing Guide State
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingPaused, setBreathingPaused] = useState<boolean>(false);
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [countdown, setCountdown] = useState<number>(4);

  const fetchDailyPlan = async () => {
    try {
      const res = await wellnessAPI.getDailyPlan();
      setDailyPlan(res.data);
    } catch {
      // Ignore if initial fetch fails
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchDailyPlan();
  }, [user, authLoading, router]);

  const handleGenerate = async (typeOverride?: string) => {
    setLoading(true);
    setBreathingActive(false);
    const targetType = typeOverride || selectedType;
    try {
      const res = await wellnessAPI.generateContent({
        type: targetType,
        emotion: selectedEmotion,
        use_emotion: true,
        confidence: 0.80,
      });
      setCurrentContent(res.data.content);
      toast.success(`Generated personalized ${targetType.replace("_", " ")}.`);
    } catch {
      toast.error("Failed to generate wellness content.");
    } finally {
      setLoading(false);
    }
  };

  // Breathing Timer Effect
  useEffect(() => {
    if (!breathingActive || breathingPaused || !currentContent?.pattern) return;
    const pat = currentContent.pattern;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Transition Phases
        if (phase === "Inhale") {
          if (pat.hold > 0) {
            setPhase("Hold");
            return pat.hold;
          } else {
            setPhase("Exhale");
            return pat.exhale;
          }
        } else if (phase === "Hold") {
          setPhase("Exhale");
          return pat.exhale;
        } else {
          setPhase("Inhale");
          return pat.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPaused, phase, currentContent]);

  const startBreathing = () => {
    if (!currentContent?.pattern) return;
    setPhase("Inhale");
    setCountdown(currentContent.pattern.inhale);
    setBreathingActive(true);
    setBreathingPaused(false);
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!currentContent?.id) return;
    try {
      await wellnessAPI.completeContent(currentContent.id, {
        status: "completed",
        helpful: helpful,
      });
      toast.success(`Thank you for your feedback! Marked as ${helpful ? "Helpful 👍" : "Not Helpful 👎"}.`);
    } catch {
      toast.error("Failed to record feedback.");
    }
  };

  const handleWriteInJournal = (promptText?: string) => {
    const promptToUse = promptText || currentContent?.prompt || "";
    router.push(`/journal?prompt=${encodeURIComponent(promptToUse)}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
        Loading Personalized Wellness Generator…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Personalized Wellness Content Generator" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 via-slate-900 to-violet-950/30 p-6">
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Personalized Wellness Content
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Context-Aware Engine
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Generates supportive affirmations, interactive guided breathing scripts, mindfulness exercises,
                    and journal prompts tailored to your current emotional signals and wellness preferences.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span>✨ Context &amp; Emotion-Aware</span>
                    <span>🫁 Interactive Guided Breathing</span>
                    <span>📖 Direct Journal Integration</span>
                    <span>🛡️ Non-Clinical Wellness Guard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Check-In Wellness Card */}
          {dailyPlan && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 space-y-4">
              <div className="flex justify-between items-center border-b border-rose-500/20 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  Today's MindCare Daily Wellness Card
                </h3>
                <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  Optional Check-In
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Morning Affirmation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase block">Morning Affirmation</span>
                  <p className="text-slate-200 italic font-medium leading-relaxed">"{dailyPlan.morning_affirmation}"</p>
                </div>

                {/* Afternoon Breathing */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase block">Afternoon Reset</span>
                    <p className="text-slate-200 font-semibold">{dailyPlan.afternoon_breathing?.title}</p>
                  </div>
                  <button
                    onClick={() => setCurrentContent(dailyPlan.afternoon_breathing)}
                    className="py-1.5 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold w-full text-center border border-cyan-500/30"
                  >
                    Start 2-Min Reset
                  </button>
                </div>

                {/* Evening Reflection */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase block">Evening Journal Prompt</span>
                    <p className="text-slate-200 font-semibold">{dailyPlan.evening_journal?.prompt}</p>
                  </div>
                  <button
                    onClick={() => handleWriteInJournal(dailyPlan.evening_journal?.prompt)}
                    className="py-1.5 px-3 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-bold w-full text-center border border-violet-500/30"
                  >
                    Write in Journal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instant Content Generator Controls */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Generate Personalized Wellness Content
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <button
                onClick={() => { setSelectedType("affirmation"); handleGenerate("affirmation"); }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left space-y-2 transition-all"
              >
                <Smile className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-white block">Affirmations</span>
                <span className="text-slate-500 text-[11px]">Realistic &amp; supportive</span>
              </button>

              <button
                onClick={() => { setSelectedType("breathing"); handleGenerate("breathing"); }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left space-y-2 transition-all"
              >
                <Wind className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white block">Guided Breathing</span>
                <span className="text-slate-500 text-[11px]">Interactive visual guide</span>
              </button>

              <button
                onClick={() => { setSelectedType("mindfulness"); handleGenerate("mindfulness"); }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-left space-y-2 transition-all"
              >
                <Flame className="w-5 h-5 text-violet-400" />
                <span className="font-bold text-white block">Mindfulness</span>
                <span className="text-slate-500 text-[11px]">5-Senses &amp; body scans</span>
              </button>

              <button
                onClick={() => { setSelectedType("journal_prompt"); handleGenerate("journal_prompt"); }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left space-y-2 transition-all"
              >
                <PenTool className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white block">Journal Prompt</span>
                <span className="text-slate-500 text-[11px]">Reflective check-in</span>
              </button>
            </div>
          </div>

          {/* Generated Content Display & Interactive Tools */}
          {currentContent && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-cyan-400 font-extrabold uppercase">{currentContent.type.replace("_", " ")}</span>
                  <h2 className="text-xl font-bold text-white">{currentContent.title}</h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Not Helpful
                  </button>
                </div>
              </div>

              {/* Display: Affirmation */}
              {currentContent.type === "affirmation" && (
                <div className="p-8 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-950 to-violet-950/30 border border-rose-500/30 text-center space-y-4">
                  <p className="text-lg md:text-2xl font-bold text-white leading-relaxed italic">
                    "{currentContent.content}"
                  </p>
                </div>
              )}

              {/* Display: Interactive Visual Guided Breathing */}
              {currentContent.type === "breathing" && currentContent.pattern && (
                <div className="p-8 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-6 text-center">
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    {/* Animated Circle */}
                    <div
                      className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ${
                        phase === "Inhale"
                          ? "scale-110 bg-cyan-500/20 border-cyan-400"
                          : phase === "Hold"
                          ? "scale-100 bg-violet-500/20 border-violet-400"
                          : "scale-75 bg-slate-900 border-slate-700"
                      }`}
                    />
                    <div className="relative z-10 space-y-1">
                      <span className="text-2xl font-black text-white block">{phase}</span>
                      <span className="text-4xl font-extrabold text-cyan-400 font-mono block">{countdown}s</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    {!breathingActive ? (
                      <button
                        onClick={startBreathing}
                        className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Start Breathing Rhythms
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setBreathingPaused(!breathingPaused)}
                          className="py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5"
                        >
                          {breathingPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                          {breathingPaused ? "Resume" : "Pause"}
                        </button>
                        <button
                          onClick={() => setBreathingActive(false)}
                          className="py-2.5 px-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-4 h-4" /> Stop
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 italic">{currentContent.safety_note}</p>
                </div>
              )}

              {/* Display: Mindfulness Exercise */}
              {currentContent.type === "mindfulness" && currentContent.instructions && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    {currentContent.instructions.map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                        {step}
                      </div>
                    ))}
                  </div>
                  {currentContent.completion_message && (
                    <p className="text-cyan-400 font-semibold italic text-center pt-2">{currentContent.completion_message}</p>
                  )}
                </div>
              )}

              {/* Display: Journal Prompt & Integration */}
              {currentContent.type === "journal_prompt" && (
                <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Reflective Prompt</span>
                    <p className="text-lg font-bold text-white">"{currentContent.prompt}"</p>
                  </div>

                  {currentContent.follow_up_prompts && (
                    <div className="space-y-1 text-xs text-slate-400">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Follow-up reflections:</span>
                      {currentContent.follow_up_prompts.map((fp, i) => (
                        <p key={i}>• {fp}</p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleWriteInJournal(currentContent.prompt)}
                    className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <PenTool className="w-4 h-4" /> Write in MindCare Journal <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
