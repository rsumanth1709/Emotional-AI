"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import api, { chatAPI } from "@/lib/axios";
import type { SessionSummary } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import CrisisModal from "@/components/chat/CrisisModal";
import {
  MessageSquare, Plus, Trash2, Camera, Mic, Video, X, Sparkles,
  Heart, Brain, ShieldAlert, Download, RefreshCw, Activity,
  UserCheck, Compass, GraduationCap, Flame, Feather, ChevronRight,
  PanelLeftClose, PanelLeft, Search, CheckCircle2, MessageCircle,
  Share2, Copy, Link as LinkIcon, Smartphone, FileText, Check
} from "lucide-react";
import { getEmotionEmoji } from "@/lib/utils";
import { toast } from "react-hot-toast";

const PERSONA_METADATA: Record<string, { name: string; tag: string; icon: any; gradient: string; textCol: string; borderCol: string; bgCol: string }> = {
  friendly: {
    name: "Friendly Companion",
    tag: "Warm & Empathetic",
    icon: Heart,
    gradient: "from-pink-500 via-rose-500 to-amber-500",
    textCol: "text-rose-400",
    borderCol: "border-rose-500/40",
    bgCol: "bg-rose-500/10",
  },
  professional: {
    name: "Clinical Therapist",
    tag: "CBT & Evidence-Based",
    icon: Brain,
    gradient: "from-violet-500 via-indigo-500 to-purple-600",
    textCol: "text-violet-400",
    borderCol: "border-violet-500/40",
    bgCol: "bg-violet-500/10",
  },
  motivational: {
    name: "Motivation Catalyst",
    tag: "Energetic & Goal-Driven",
    icon: Flame,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    textCol: "text-amber-400",
    borderCol: "border-amber-500/40",
    bgCol: "bg-amber-500/10",
  },
  coach: {
    name: "Wellness Coach",
    tag: "Practical Health Plans",
    icon: Activity,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    textCol: "text-emerald-400",
    borderCol: "border-emerald-500/40",
    bgCol: "bg-emerald-500/10",
  },
  mentor: {
    name: "Wise Mentor",
    tag: "Patient & Reflective",
    icon: Feather,
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    textCol: "text-cyan-400",
    borderCol: "border-cyan-500/40",
    bgCol: "bg-cyan-500/10",
  },
  student_counselor: {
    name: "Student Counselor",
    tag: "Academic & Stress Guide",
    icon: GraduationCap,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    textCol: "text-blue-400",
    borderCol: "border-blue-500/40",
    bgCol: "bg-blue-500/10",
  },
};

const STARTER_PROMPTS = [
  { text: "I'm feeling overwhelmed by work stress and burnout...", icon: "😰" },
  { text: "Can you guide me through a 5-minute grounding box breathing exercise?", icon: "🫁" },
  { text: "I've been having trouble sleeping due to anxious thoughts...", icon: "🌙" },
  { text: "Let's do a quick gratitude reflection to boost my mood.", icon: "✨" },
];

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    messages,
    isLoading,
    sessionId,
    currentEmotion,
    isCrisis,
    crisisSeverity,
    crisisType,
    crisisResources,
    sendMessage,
    sendMultimodalMessage,
    loadHistory,
    clearSession,
    setIsCrisis,
    activePersona,
    setActivePersona,
    setMessages,
  } = useChat();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showSessionsPanel, setShowSessionsPanel] = useState(true);
  const [personasList, setPersonasList] = useState<Record<string, { name: string; description: string; greeting: string }>>({});

  // Multimodal states
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const res = await api.get("/chat/personas");
        setPersonasList(res.data);
      } catch {
        setPersonasList({
          friendly: { name: "Friendly Companion", description: "Warm, gentle friend.", greeting: "Hey there! I'm here for you. 😊 How are you feeling today?" },
          professional: { name: "Clinical Therapist", description: "Structured, CBT-focused.", greeting: "Welcome to your supportive session. Processing thoughts today?" },
          motivational: { name: "Motivation Catalyst", description: "Energetic and uplifting.", greeting: "Let's do this! 🚀 What is one positive goal right now?" },
          coach: { name: "Wellness Coach", description: "Practical and goal-oriented.", greeting: "Hello! Let's build a healthy plan today. 📋" },
          mentor: { name: "Wise Mentor", description: "Reflective and patient.", greeting: "Greetings. Let us sit quietly with your thoughts for a moment. 🌿" },
          student_counselor: { name: "Student Counselor", description: "Relatable academic guide.", greeting: "Hey! College/school stress can be a lot. 🎓" }
        });
      }
    };
    fetchPersonas();
  }, []);

  const handlePersonaChange = (personaKey: string) => {
    setActivePersona(personaKey);
    const meta = PERSONA_METADATA[personaKey] || PERSONA_METADATA.friendly;
    toast.success(`Switched to ${meta.name}`, { icon: "🤖" });
    if (messages.length <= 1) {
      const targetGreeting = personasList[personaKey]?.greeting || "Hello! I am here to support you.";
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: targetGreeting,
          persona: personaKey,
          created_at: new Date().toISOString(),
        }
      ]);
    }
  };

  const handleNewSession = () => {
    clearSession();
    const targetGreeting = personasList[activePersona]?.greeting || "Hello! I am here to support you.";
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        content: targetGreeting,
        persona: activePersona,
        created_at: new Date().toISOString(),
      }
    ]);
    toast.success("Started a new conversation session!", { icon: "✨" });
  };

  useEffect(() => {
    if (messages.length === 0 && Object.keys(personasList).length > 0) {
      const greeting = personasList[activePersona]?.greeting || "Hello! I am here to support you.";
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: greeting,
          persona: activePersona,
          created_at: new Date().toISOString(),
        }
      ]);
    }
  }, [messages, personasList, activePersona, setMessages]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setMediaStream(stream);
      setShowWebcam(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      toast.error("Could not access webcam camera.");
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedImage(blob);
          setImagePreview(URL.createObjectURL(blob));
          toast.success("Facial Snapshot Captured!", { icon: "📸" });
        }
      }, "image/jpeg", 0.85);
    }
    stopWebcam();
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    setMediaStream(null);
    setShowWebcam(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((t) => t.stop());
        toast.success("Voice note recorded!", { icon: "🎙️" });
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast.error("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (text: string) => {
    if (capturedImage || recordedAudio) {
      await sendMultimodalMessage(text, recordedAudio, capturedImage);
      setCapturedImage(null);
      setImagePreview(null);
      setRecordedAudio(null);
      setAudioUrl(null);
    } else {
      await sendMessage(text);
    }
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [anonymizeShare, setAnonymizeShare] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const getShareableUrl = () => {
    if (typeof window === "undefined") return "";
    const base = window.location.origin + window.location.pathname;
    return sessionId ? `${base}?session_id=${sessionId}` : base;
  };

  const getFormattedTranscript = () => {
    const userDisplayName = anonymizeShare ? "Anonymous User" : user?.full_name || user?.username || "User";
    return messages
      .map((m) => {
        const sender = m.role === "assistant" ? `MindCare AI (${m.persona || activePersona})` : userDisplayName;
        return `[${new Date(m.created_at).toLocaleTimeString()}] ${sender}:\n${m.content}`;
      })
      .join("\n\n---\n\n");
  };

  const handleCopyLink = () => {
    const shareUrl = getShareableUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Session link copied to clipboard!", { icon: "🔗" });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTranscript = () => {
    const transcript = getFormattedTranscript();
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    toast.success("Formatted transcript copied to clipboard!", { icon: "📋" });
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareableUrl();
    const title = `MindCare AI Session (${activePersona})`;
    const text = `Check out my mental wellness check-in with MindCare AI!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        toast.success("Shared successfully!");
      } catch {
        // Share cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const content = getFormattedTranscript();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MindCare_Chat_Export_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported as text log!", { icon: "📥" });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data);
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleDeleteSession = async (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sessId);
      if (sessionId === sessId) {
        clearSession();
      }
      toast.success("Session deleted");
      fetchSessions();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.last_message ? s.last_message.toLowerCase().includes(sessionSearch.toLowerCase()) : true
  );

  const activeMeta = PERSONA_METADATA[activePersona] || PERSONA_METADATA.friendly;
  const ActiveIcon = activeMeta.icon;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-violet-400 mr-3" />
        Starting MindCare Conversational Intelligence Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar title="Empathetic Support Chat" />

        {/* Emotion & Session Intelligence Header Bar */}
        <div className="bg-slate-900/80 border-b border-violet-500/20 py-2.5 px-4 md:px-8 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSessionsPanel((p) => !p)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors hidden md:flex items-center gap-1.5 text-xs font-semibold"
              title="Toggle History Sidebar"
            >
              {showSessionsPanel ? <PanelLeftClose className="w-4 h-4 text-violet-400" /> : <PanelLeft className="w-4 h-4 text-violet-400" />}
              <span>History</span>
            </button>

            {currentEmotion && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-semibold shadow-sm">
                <span className="text-sm animate-pulse">{getEmotionEmoji(currentEmotion)}</span>
                <span>Detected Emotion:</span>
                <span className="capitalize text-white font-bold">{currentEmotion}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              disabled={messages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Share Conversation Session"
            >
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Share</span>
            </button>

            <button
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Export Conversation Log"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Log</span>
            </button>

            <button
              onClick={handleNewSession}
              className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Chat Sessions History Sidebar Panel */}
          {showSessionsPanel && (
            <div className="w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between overflow-y-auto backdrop-blur-md flex-shrink-0 transition-all duration-300">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-violet-400" /> Chat Sessions ({sessions.length})
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search past conversations..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  {filteredSessions.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 text-center">No matching check-ins found.</p>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isAct = sessionId === sess.session_id;
                      return (
                        <div
                          key={sess.session_id}
                          onClick={() => loadHistory(sess.session_id)}
                          className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                            isAct
                              ? "bg-violet-950/40 border-violet-500/40 text-white shadow-lg shadow-violet-500/5"
                              : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                              <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isAct ? "text-violet-400" : "text-slate-500"}`} />
                              <span className="truncate">{sess.last_message || "Empathetic Support"}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">
                              {sess.last_active ? new Date(sess.last_active).toLocaleDateString() : "Just now"}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(sess.session_id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Core Chat Stream & Interactive Workspace Panel */}
          <div className="flex-1 flex flex-col justify-between bg-slate-950 relative overflow-hidden">

            {/* Visual Persona Selector Pill Bar */}
            <div className="bg-slate-900/40 border-b border-slate-800/80 p-3 md:p-4 overflow-x-auto flex items-center gap-2 scrollbar-none backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex-shrink-0 mr-1 hidden sm:inline">
                AI Guide:
              </span>

              {Object.keys(PERSONA_METADATA).map((key) => {
                const meta = PERSONA_METADATA[key];
                const Icon = meta.icon;
                const isSel = activePersona === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePersonaChange(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-200 flex-shrink-0 border ${
                      isSel
                        ? `bg-slate-900 ${meta.textCol} ${meta.borderCol} ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10 scale-[1.02]`
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <div className={`p-1 rounded-xl ${isSel ? meta.bgCol : "bg-slate-800"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="block font-bold truncate">{meta.name.split(" ")[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Persona Banner Details */}
            <div className="bg-slate-900/20 border-b border-white/5 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ActiveIcon className={`w-4 h-4 ${activeMeta.textCol}`} />
                <span className="font-bold text-white">{activeMeta.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-400">{activeMeta.tag}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Model
              </span>
            </div>

            {/* Chat Stream Viewport */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messages.length <= 1 && (
                <div className="my-4 space-y-6 max-w-xl mx-auto">
                  <div className="glass p-6 text-center space-y-3 rounded-3xl border border-violet-500/20 bg-slate-900/40">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-500/20">
                      <Sparkles className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <h3 className="text-base font-bold text-white">How are you feeling right now?</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Express your thoughts freely. MindCare AI adapts to your tone, offers evidence-based guidance, and tracks your emotional stability.
                    </p>
                  </div>

                  {/* Starter Prompt Chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                      Quick Conversation Starters
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {STARTER_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(prompt.text)}
                          className="glass p-3 rounded-2xl border border-slate-800 hover:border-violet-500/40 text-left text-xs text-slate-300 hover:text-white transition-all hover:scale-[1.01] flex items-start gap-2.5 group"
                        >
                          <span className="text-sm">{prompt.icon}</span>
                          <span className="leading-snug group-hover:text-violet-300 transition-colors">{prompt.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Multimodal & Input Area */}
            <div className="bg-slate-900/90 border-t border-slate-800/80 flex flex-col backdrop-blur-md">
              <div className="flex items-center gap-3 px-4 md:px-6 pt-3">
                <button
                  onClick={showWebcam ? stopWebcam : startWebcam}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    showWebcam
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-violet-400" />
                  <span>{showWebcam ? "Close Camera" : "Facial Snapshot"}</span>
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isRecording
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isRecording ? "Stop Recording" : "Voice Note"}</span>
                </button>
              </div>

              {/* Webcam Stream Camera */}
              {showWebcam && (
                <div className="flex flex-col items-center gap-2 p-4 bg-slate-950/80 border-t border-b border-slate-800 my-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-64 h-48 rounded-2xl border border-violet-500/30 bg-black shadow-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={captureSnapshot}
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20"
                    >
                      Capture Snapshot
                    </button>
                    <button
                      onClick={stopWebcam}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Multimodal Preview Bar */}
              {(imagePreview || audioUrl || isRecording) && !showWebcam && (
                <div className="bg-slate-950/60 px-6 py-2.5 flex items-center gap-4 flex-wrap border-b border-slate-800/80">
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        className="w-16 h-12 rounded-xl border border-violet-500/30 object-cover"
                        alt="Face snapshot preview"
                      />
                      <button
                        onClick={() => { setCapturedImage(null); setImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-950 border border-white/20 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  {audioUrl && (
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 px-3 rounded-xl border border-slate-800">
                      <audio src={audioUrl} controls className="h-6 w-44" />
                      <button
                        onClick={() => { setRecordedAudio(null); setAudioUrl(null); }}
                        className="w-4 h-4 rounded-full text-slate-400 hover:text-white flex items-center justify-center text-sm"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500 block" />
                      <span>Recording voice audio...</span>
                      <button
                        onClick={stopRecording}
                        className="ml-2 px-2 py-0.5 bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 rounded text-[10px] transition-all"
                      >
                        Stop
                      </button>
                    </div>
                  )}
                </div>
              )}

              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>

      <CrisisModal
        isOpen={isCrisis}
        severity={crisisSeverity}
        type={crisisType}
        resources={crisisResources}
        onClose={() => setIsCrisis(false)}
      />

      {/* Share Conversation Session Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass max-w-lg w-full p-6 md:p-8 rounded-3xl border border-violet-500/30 space-y-6 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Secure Session Sharing
              </span>
              <h3 className="text-xl font-bold text-white">Share Check-in Conversation</h3>
              <p className="text-xs text-slate-400">
                Share a direct link or copy a formatted transcript of your session with MindCare AI ({activeMeta.name}).
              </p>
            </div>

            {/* Privacy Anonymize Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Anonymize Personal Information</span>
                  <span className="text-[10px] text-slate-400 block">Replaces your user name with "Anonymous User" in shares.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={anonymizeShare}
                onChange={(e) => setAnonymizeShare(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-violet-500 focus:ring-violet-500 cursor-pointer"
              />
            </div>

            {/* Share Options List */}
            <div className="space-y-3">
              {/* Option 1: Direct Session Link */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-violet-400" /> Shareable Session URL
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Copy Rich Text Transcript */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Copy Text Transcript
                  </span>
                  <span className="text-[10px] text-slate-400 block">Copy full formatted conversation text to clipboard.</span>
                </div>
                <button
                  onClick={handleCopyTranscript}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedTranscript ? "Copied!" : "Copy Text"}</span>
                </button>
              </div>

              {/* Option 3: Native Device Share Drawer (WhatsApp, Messages, Email) */}
              <button
                onClick={handleNativeShare}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
              >
                <Smartphone className="w-4 h-4" />
                <span>Share via App (WhatsApp, Messages, Email...)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
