"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import Sidebar from "@/components/layout/Sidebar";
import { getEmotionEmoji } from "@/lib/utils";
import { voiceAPI } from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Volume2, Sparkles, Copy, RefreshCw,
  ChevronDown, Globe, Zap, Brain, Shield, Flame,
  Trophy, GraduationCap,
} from "lucide-react";

const PERSONAS = [
  { key: "friendly", label: "Friendly", emoji: "😊", icon: Sparkles, color: "from-violet-500 to-fuchsia-500" },
  { key: "professional", label: "Clinical", emoji: "🩺", icon: Shield, color: "from-blue-500 to-cyan-500" },
  { key: "motivational", label: "Motivational", emoji: "🔥", icon: Flame, color: "from-orange-500 to-rose-500" },
  { key: "coach", label: "Coach", emoji: "🏆", icon: Trophy, color: "from-amber-500 to-yellow-500" },
  { key: "mentor", label: "Mentor", emoji: "🧙", icon: Brain, color: "from-emerald-500 to-teal-500" },
  { key: "counselor", label: "Counselor", emoji: "🎓", icon: GraduationCap, color: "from-indigo-500 to-purple-500" },
];

const LANGUAGES = [
  { key: "auto", label: "Auto-Detect", flag: "🌐" },
  { key: "en-US", label: "English", flag: "🇺🇸" },
  { key: "es-ES", label: "Spanish", flag: "🇪🇸" },
  { key: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { key: "fr-FR", label: "French", flag: "🇫🇷" },
  { key: "de-DE", label: "German", flag: "🇩🇪" },
  { key: "zh-CN", label: "Mandarin", flag: "🇨🇳" },
  { key: "ta-IN", label: "Tamil", flag: "🇮🇳" },
  { key: "te-IN", label: "Telugu", flag: "🇮🇳" },
  { key: "ar-SA", label: "Arabic", flag: "🇸🇦" },
  { key: "ja-JP", label: "Japanese", flag: "🇯🇵" },
  { key: "ru-RU", label: "Russian", flag: "🇷🇺" },
  { key: "pt-BR", label: "Portuguese", flag: "🇧🇷" },
  { key: "it-IT", label: "Italian", flag: "🇮🇹" },
];

const QUICK_PROMPTS = [
  "I'm feeling anxious today",
  "Help me calm down",
  "I need some motivation",
  "I'm feeling lonely",
  "Share a breathing exercise",
];

// ── Spectrum Visualizer Component ─────────────────────────────────────────────
function SpectrumBars({ audioLevel, isListening, isSpeaking }: { audioLevel: number; isListening: boolean; isSpeaking: boolean }) {
  const bars = 32;
  const active = isListening || isSpeaking;
  return (
    <div className="flex items-end justify-center gap-[2px] h-14 w-full px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const center = bars / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const baseH = Math.sin((i / bars) * Math.PI) * 30 + 10;
        const dynamicH = active
          ? baseH + (audioLevel / 100) * (50 - distFromCenter * 30) * (0.5 + Math.random() * 0.5)
          : baseH * 0.3;

        return (
          <motion.div
            key={i}
            animate={{ height: `${Math.max(4, Math.min(56, dynamicH))}px` }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={`w-1 rounded-full transition-colors duration-300 ${
              active
                ? isListening
                  ? "bg-gradient-to-t from-cyan-600 to-violet-400"
                  : "bg-gradient-to-t from-emerald-600 to-teal-300"
                : "bg-slate-700"
            }`}
          />
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VoiceAssistantPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState<"user" | "assistant" | null>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    response,
    voiceEmotion,
    activePersona,
    setActivePersona,
    selectedLanguage,
    setSelectedLanguage,
    detectedLanguage,
    audioLevel,
    startListening,
    stopListening,
    interrupt,
    speak,
  } = useVoiceAssistant();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopy = (text: string, type: "user" | "assistant") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isListening) stopListening();
    const fe = new FormData();
    fe.append("text_transcription", prompt);
    fe.append("persona", activePersona);
    fe.append("language", selectedLanguage);
    voiceAPI.processVoice(fe).then((res) => {
      speak(res.data.response_text, activePersona, res.data.detected_language);
    });
  };

  const activeLang = LANGUAGES.find((l) => l.key === selectedLanguage) || LANGUAGES[0];
  const activePersonaData = PERSONAS.find((p) => p.key === activePersona) || PERSONAS[0];

  const getOrbState = () => {
    if (isListening) return "listening";
    if (isProcessing) return "processing";
    if (isSpeaking) return "speaking";
    return "idle";
  };
  const orbState = getOrbState();

  const orbColors: Record<string, string> = {
    idle: "from-violet-600 via-indigo-700 to-purple-900",
    listening: "from-cyan-400 via-violet-500 to-fuchsia-500",
    processing: "from-purple-500 via-indigo-500 to-pink-500",
    speaking: "from-emerald-400 via-teal-400 to-cyan-500",
  };

  const orbShadows: Record<string, string> = {
    idle: "shadow-violet-600/40",
    listening: "shadow-cyan-500/60",
    processing: "shadow-purple-500/60",
    speaking: "shadow-emerald-500/60",
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Sparkles className="w-8 h-8 text-violet-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#05060f]">
      <Sidebar />

      {/* Main Stage */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Ambient Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan-900/15 blur-[100px]" />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-fuchsia-900/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-6 gap-6 overflow-y-auto">

          {/* ── TOP BAR ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> MindCare AI Voice Assistant
              </p>
              <h1 className="text-2xl font-black text-white mt-0.5">
                Real-Time Voice Therapy
              </h1>
            </div>

            {/* Language Picker */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setShowLangDropdown((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 text-white text-xs font-semibold transition-all"
                >
                  <span className="text-base">{activeLang.flag}</span>
                  <span>{activeLang.label}</span>
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showLangDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 right-0 w-52 bg-slate-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 z-50 backdrop-blur-xl"
                    >
                      <div className="max-h-72 overflow-y-auto py-1.5">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.key}
                            onClick={() => { setSelectedLanguage(lang.key); setShowLangDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all hover:bg-violet-500/15 ${
                              selectedLanguage === lang.key ? "text-violet-300 bg-violet-500/10" : "text-slate-300"
                            }`}
                          >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.label}</span>
                            {selectedLanguage === lang.key && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── LEFT: ORBS, SPECTRUM, PERSONA ──────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col items-center gap-8">

              {/* Central Orb */}
              <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>

                {/* Outer Glow Halo */}
                <motion.div
                  animate={{
                    scale: orbState === "listening" ? [1, 1.1 + audioLevel / 200, 1] : [1, 1.04, 1],
                    opacity: orbState === "idle" ? 0.3 : 0.6,
                  }}
                  transition={{ repeat: Infinity, duration: orbState === "listening" ? 0.3 : 2, ease: "easeInOut" }}
                  className={`absolute w-full h-full rounded-full bg-gradient-to-br ${orbColors[orbState]} blur-2xl opacity-30`}
                />

                {/* Orbit Ring */}
                {(orbState === "listening" || orbState === "speaking") && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute w-72 h-72 rounded-full border border-violet-500/20"
                    style={{
                      borderStyle: "dashed",
                      boxShadow: "0 0 30px rgba(139,92,246,0.15) inset",
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-lg shadow-violet-400/80" />
                  </motion.div>
                )}

                {/* Aura Rings */}
                <AnimatePresence>
                  {orbState === "listening" && (
                    <>
                      <motion.div
                        key="ring1"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.05 + audioLevel / 150, opacity: [0, 0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute w-52 h-52 rounded-full border border-cyan-400/40"
                      />
                      <motion.div
                        key="ring2"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.15 + audioLevel / 200, opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, delay: 0.4 }}
                        className="absolute w-52 h-52 rounded-full border border-violet-400/30"
                      />
                    </>
                  )}
                  {orbState === "speaking" && (
                    <motion.div
                      key="speak-ring"
                      animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute w-52 h-52 rounded-full border-2 border-emerald-400/50"
                    />
                  )}
                </AnimatePresence>

                {/* Core Orb Button */}
                <motion.button
                  animate={{
                    scale: orbState === "listening"
                      ? 1 + audioLevel / 300
                      : orbState === "speaking"
                      ? [1, 1.03, 1]
                      : [1, 1.015, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: orbState === "listening" ? 0.1 : 2.5,
                    ease: "easeInOut",
                  }}
                  onClick={isListening ? stopListening : isSpeaking ? interrupt : startListening}
                  whileTap={{ scale: 0.96 }}
                  className={`relative w-52 h-52 rounded-full bg-gradient-to-br ${orbColors[orbState]} shadow-2xl ${orbShadows[orbState]} flex flex-col items-center justify-center cursor-pointer group overflow-hidden`}
                  style={{ boxShadow: `0 0 60px -10px var(--orb-glow, rgba(139,92,246,0.5))` }}
                >
                  {/* Inner glass layer */}
                  <div className="absolute inset-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10" />

                  {/* Icon */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    {isProcessing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                        <Sparkles className="w-11 h-11 text-white" />
                      </motion.div>
                    ) : isSpeaking ? (
                      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <Volume2 className="w-11 h-11 text-white" />
                      </motion.div>
                    ) : isListening ? (
                      <Mic className="w-11 h-11 text-white" />
                    ) : (
                      <Mic className="w-11 h-11 text-white/80 group-hover:text-white transition-colors" />
                    )}

                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
                      {isProcessing ? "Thinking..." : isSpeaking ? "Speaking" : isListening ? "Listening" : "Tap to Speak"}
                    </span>
                  </div>

                  {/* Live mic pulse dot */}
                  {isListening && (
                    <motion.div
                      className="absolute top-5 right-5 w-3 h-3 rounded-full bg-red-500"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </motion.button>
              </div>

              {/* Spectrum Visualizer */}
              <div className="w-full max-w-xs">
                <SpectrumBars audioLevel={audioLevel} isListening={isListening} isSpeaking={isSpeaking} />
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                  <span className="text-sm">{getEmotionEmoji(voiceEmotion)}</span>
                  <span className="capitalize">{voiceEmotion}</span>
                </span>

                <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                  <span>{activeLang.flag}</span>
                  <span>{detectedLanguage || selectedLanguage}</span>
                </span>

                {isSpeaking && (
                  <button
                    onClick={interrupt}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 hover:bg-rose-500/30 transition-all"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Interrupt</span>
                  </button>
                )}
              </div>

              {/* Persona Selector */}
              <div className="w-full max-w-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Therapy Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {PERSONAS.map((p) => {
                    const Icon = p.icon;
                    const isActive = activePersona === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setActivePersona(p.key)}
                        className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-xs font-semibold transition-all ${
                          isActive
                            ? `bg-gradient-to-br ${p.color} border-transparent text-white shadow-lg`
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="text-lg">{p.emoji}</span>
                        <span className="text-[10px] font-bold">{p.label}</span>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{ boxShadow: "0 0 20px rgba(139,92,246,0.3) inset" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT: TRANSCRIPTS + PROMPTS ───────────────────────────── */}
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* Quick Prompts */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Prompts</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-violet-500/15 hover:border-violet-500/30 hover:text-violet-300 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* You Spoke Panel */}
              <div className="flex-1 bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md flex flex-col min-h-44">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${isListening ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">You Spoke</span>
                  </div>
                  {transcript && (
                    <button
                      onClick={() => handleCopy(transcript, "user")}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {copied === "user" ? <span className="text-[10px] text-emerald-400">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <p className={`flex-1 text-sm leading-relaxed font-medium transition-colors ${
                  transcript ? "text-white" : "text-slate-600 italic"
                }`}>
                  {transcript || (isListening ? "Listening to your voice..." : "Tap the orb to start speaking...")}
                </p>

                {/* Volume meter */}
                {isListening && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${audioLevel}%` }}
                        transition={{ duration: 0.05 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono w-10 text-right">{audioLevel}%</span>
                  </div>
                )}
              </div>

              {/* MindCare Reply Panel */}
              <div className="flex-1 bg-white/[0.03] border border-white/8 rounded-3xl p-6 backdrop-blur-md flex flex-col min-h-44">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${isSpeaking ? "bg-emerald-400 animate-pulse" : isProcessing ? "bg-purple-400 animate-pulse" : "bg-slate-600"}`} />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> MindCare Reply
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">— {activePersona} persona</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {response && (
                      <>
                        <button
                          onClick={() => speak(response, activePersona, detectedLanguage || selectedLanguage)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                          title="Re-play"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(response, "assistant")}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                          {copied === "assistant" ? <span className="text-[10px] text-emerald-400">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className={`flex-1 text-sm leading-relaxed font-medium transition-colors ${
                  response ? "text-white" : "text-slate-600 italic"
                }`}>
                  {isProcessing ? (
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                      AI is thinking...
                    </motion.span>
                  ) : response || "Ready to listen and respond with emotional intelligence."}
                </p>

                {isSpeaking && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      </motion.div>
                      <span className="text-[11px] text-emerald-400 font-semibold">Speaking aloud...</span>
                    </div>
                    <button
                      onClick={interrupt}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Square className="w-3 h-3 fill-current" /> Stop
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
