"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { chatAPI } from "@/lib/axios";
import type { SessionSummary } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import ChatBubble from "@/components/chat/ChatBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import CrisisModal from "@/components/chat/CrisisModal";
import MindCareLoading from "@/components/ui/MindCareLoading";
import {
  MessageSquare, Plus, Trash2, Camera, Sparkles,
  ShieldAlert, Download, Share2, Copy, Link as LinkIcon,
  FileText, Check, PanelLeftClose, PanelLeft, Search, X,
  ExternalLink, Heart, Compass, Moon, Smile, RefreshCw
} from "lucide-react";
import { getEmotionEmoji, getEmotionColor, getEmotionBgColor, formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const STARTER_PROMPTS = [
  {
    title: "Manage Burnout & Stress",
    text: "I'm feeling overwhelmed by work pressure and burnout. Help me decompress and regain balance.",
    icon: "😰",
    category: "Stress Relief",
    gradient: "from-amber-500/10 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40"
  },
  {
    title: "5-Minute Box Breathing",
    text: "Can you guide me step-by-step through a calming box breathing exercise?",
    icon: "🫁",
    category: "Mindfulness",
    gradient: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20 hover:border-cyan-500/40"
  },
  {
    title: "Bedtime Anxiety & Sleep",
    text: "I'm having trouble sleeping because of racing thoughts. What are soothing techniques for tonight?",
    icon: "🌙",
    category: "Sleep & Calm",
    gradient: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20 hover:border-indigo-500/40"
  },
  {
    title: "Analyze My Document or Journal",
    text: "I'd like to share my thoughts or a document for you to review and offer emotional insights on.",
    icon: "📎",
    category: "Multimodal AI",
    gradient: "from-purple-500/10 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40"
  },
];

const QUICK_MOOD_CHECKINS = [
  { emoji: "🌿", label: "Calm & Centered", prompt: "I'm feeling calm and reflective today. Let's do a quick mindful check-in." },
  { emoji: "😰", label: "Stressed / Overwhelmed", prompt: "I'm feeling really stressed and overwhelmed right now. Can we talk through it?" },
  { emoji: "⚡", label: "Anxious Thoughts", prompt: "I'm dealing with anxious thoughts today. Can you guide me through a grounding technique?" },
  { emoji: "😔", label: "Low Energy / Down", prompt: "I'm feeling a bit low and unmotivated today. Could use some gentle encouragement." },
  { emoji: "🌟", label: "Inspired & Hopeful", prompt: "I'm feeling positive and inspired today! Let's channel this into healthy habits." },
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
    setMessages,
  } = useChat();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showSessionsPanel, setShowSessionsPanel] = useState(true);

  // Multimodal & File states
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleNewSession = () => {
    clearSession();
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        content: "Hello! I am MindCare AI. Express your thoughts, feelings, or concerns freely — I adapt dynamically to your input.",
        created_at: new Date().toISOString(),
      }
    ]);
    toast.success("Started a new chat session", { icon: "✨" });
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "initial-greeting",
          role: "assistant",
          content: "Hello! I am MindCare AI. Express your thoughts, feelings, or concerns freely — I adapt dynamically to your input.",
          created_at: new Date().toISOString(),
        }
      ]);
    }
  }, [messages, setMessages]);

  const startWebcam = async () => {
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch {
            stream = null;
          }
        }
        if (stream) {
          setMediaStream(stream);
          setShowWebcam(true);
          setTimeout(() => {
            if (videoRef.current) videoRef.current.srcObject = stream;
          }, 150);
          return;
        }
      }
    } catch {
      // Fallback silently if camera access fails
    }
    // Directly open native file picker if camera stream fails
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      setAttachedFileName(file.name);
      if (file.type.startsWith("image/")) {
        setCapturedImage(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setCapturedImage(null);
        setImagePreview(null);
      }
      stopWebcam();
      toast.success(`Attached: ${file.name}`, { icon: "📎" });
    }
    e.target.value = "";
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
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (text: string) => {
    if (attachedFile || capturedImage || recordedAudio) {
      if (attachedFile) {
        toast(`Analyzing file "${attachedFile.name}"...`, { icon: "📄" });
      } else {
        toast("Analyzing facial expression & voice tone...", { icon: "🧠" });
      }
      await sendMultimodalMessage(
        text,
        recordedAudio,
        capturedImage,
        attachedFile,
        attachedFileName || undefined
      );
      setAttachedFile(null);
      setAttachedFileName(null);
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
        const sender = m.role === "assistant" ? "MindCare AI" : userDisplayName;
        return `[${new Date(m.created_at).toLocaleTimeString()}] ${sender}:\n${m.content}`;
      })
      .join("\n\n---\n\n");
  };

  const handleCopyLink = () => {
    const shareUrl = getShareableUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Session link copied!", { icon: "🔗" });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTranscript = () => {
    const transcript = getFormattedTranscript();
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    toast.success("Transcript copied!", { icon: "📋" });
    setTimeout(() => setCopiedTranscript(false), 2500);
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
    toast.success("Conversation exported!", { icon: "📥" });
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
      // Ignore error
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

  if (authLoading || !user) {
    return <MindCareLoading message="Connecting to MindCare Emotional AI..." />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-950 text-slate-100 font-sans relative">
      {/* Ambient Radial Atmospheric Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[250px] bg-cyan-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Main App Sidebar */}
      <Sidebar />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 min-h-0 overflow-hidden relative z-10">
        {/* Sleek Modern Glass Header */}
        <header className="h-16 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-2xl z-20 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSessionsPanel((p) => !p)}
              className="p-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
              title={showSessionsPanel ? "Collapse Recent Chats" : "Open Recent Chats"}
            >
              {showSessionsPanel ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>

            {/* Model & Adaptability Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              <span className="text-xs font-bold text-slate-200">MindCare Emotion Engine</span>
              <span className="text-[10px] text-purple-300 font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-500/20">
                v2.0
              </span>
            </div>

            {/* Live Detected Emotion Indicator */}
            {currentEmotion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-sm ${getEmotionBgColor(
                  currentEmotion
                )}`}
              >
                <span>{getEmotionEmoji(currentEmotion)}</span>
                <span className="text-slate-300">Tone Estimate:</span>
                <strong className={`capitalize ${getEmotionColor(currentEmotion)}`}>{currentEmotion}</strong>
              </motion.div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              disabled={messages.length === 0}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white transition-all disabled:opacity-40"
              title="Share Session"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white transition-all disabled:opacity-40"
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleNewSession}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/25 active:scale-95"
              title="Start a fresh chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Content Body: Sidebar Drawer + Chat Stream */}
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
          {/* History Sessions Drawer */}
          <AnimatePresence>
            {showSessionsPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 overflow-hidden z-10 p-3 space-y-3 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Recent Check-ins</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    {sessions.length}
                  </span>
                </div>

                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search recent check-ins..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-all"
                  />
                  {sessionSearch && (
                    <button
                      onClick={() => setSessionSearch("")}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto min-h-0 flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredSessions.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-600">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-slate-500">No check-ins found.</p>
                    </div>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isAct = sessionId === sess.session_id;
                      return (
                        <div
                          key={sess.session_id}
                          onClick={() => loadHistory(sess.session_id)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${
                            isAct
                              ? "bg-slate-900 text-white font-bold border border-purple-500/40 shadow-sm shadow-purple-950/50"
                              : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2 flex items-center gap-2.5">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isAct ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs truncate block">{sess.last_message || "Empathetic Session"}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {sess.created_at ? formatTime(sess.created_at) : (sess.last_active ? formatTime(sess.last_active) : "Recent")}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(sess.session_id, e)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            aria-label="Delete Chat"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={handleNewSession}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group shrink-0"
                >
                  <Plus className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Start New Session</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Central Chat Stream & Viewport */}
          <div className="flex-1 flex flex-col justify-between h-full min-w-0 min-h-0 overflow-hidden bg-slate-950/70 relative">
            {/* Scrollable Message Stream */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6 md:px-8 space-y-6 max-w-4xl w-full mx-auto scrollbar-thin scrollbar-thumb-slate-800/80">
              {/* Hero State (When Conversation is Fresh) */}
              {messages.length <= 1 && (
                <div className="py-6 md:py-10 space-y-8 max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-400">
                  {/* Glowing Emblem & Greeting */}
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 blur-xl opacity-40 animate-pulse" />
                      <img
                        src="/logo.png"
                        alt="MindCare AI Logo"
                        className="relative w-20 h-20 rounded-full object-cover border-2 border-purple-400/40 shadow-2xl mx-auto"
                      />
                    </div>

                    <div>
                      <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-200 via-indigo-100 to-cyan-200 bg-clip-text text-transparent">
                        Hello, {user.full_name?.split(" ")[0] || user.username}
                      </h1>
                      <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed font-medium mt-2">
                        How are you feeling today? MindCare AI senses your emotion, acoustic tone, and text to adapt empathetically.
                      </p>
                    </div>
                  </div>

                  {/* Quick Mood Check-in Selector Bar */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> One-Tap Mood Check-in
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                      {QUICK_MOOD_CHECKINS.map((mood, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(mood.prompt)}
                          className="px-3 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                          <span className="text-base">{mood.emoji}</span>
                          <span>{mood.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Categorized Starter Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
                    {STARTER_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.text)}
                        className={`p-4 rounded-3xl bg-slate-900/60 border ${prompt.gradient} hover:bg-slate-900/90 transition-all duration-200 group flex flex-col justify-between gap-3 shadow-lg hover:scale-[1.015] active:scale-[0.99]`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl p-2 rounded-2xl bg-white/5">{prompt.icon}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {prompt.category}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
                            {prompt.title}
                          </h4>
                          <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                            {prompt.text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Messages */}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Chat Input Dock */}
            <div className="shrink-0 p-3 md:px-6 md:pb-5 max-w-4xl w-full mx-auto">
              {/* Hidden File Input for All Files */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />

              <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                onWebcamClick={showWebcam ? stopWebcam : startWebcam}
                onFileUploadClick={() => fileInputRef.current?.click()}
                onVoiceRecordClick={isRecording ? stopRecording : startRecording}
                imagePreview={imagePreview}
                attachedFileName={attachedFileName}
                audioUrl={audioUrl}
                isRecording={isRecording}
                onRemoveImage={() => { setCapturedImage(null); setImagePreview(null); setAttachedFile(null); setAttachedFileName(null); }}
                onRemoveFile={() => { setAttachedFile(null); setAttachedFileName(null); setCapturedImage(null); setImagePreview(null); }}
                onRemoveAudio={() => { setRecordedAudio(null); setAudioUrl(null); }}
                onStopRecording={stopRecording}
              />

              {/* Disclaimer Notice */}
              <p className="text-[10px] text-slate-500 text-center font-medium mt-2">
                MindCare AI is an empathetic wellness companion. For acute distress or clinical diagnosis, please consult a licensed healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {showWebcam && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={stopWebcam}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Facial Emotion Capture
                </span>
                <h3 className="text-lg font-bold text-white">Camera Check-in</h3>
                <p className="text-xs text-slate-400">Position your face in good lighting to read emotional cues.</p>
              </div>

              {/* Video Feed */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face Framing Reticle */}
                <div className="absolute inset-8 border border-dashed border-purple-400/30 rounded-2xl pointer-events-none" />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={captureSnapshot}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Snapshot</span>
                </button>
                <button
                  onClick={stopWebcam}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crisis Safety Modal */}
      <CrisisModal
        isOpen={isCrisis}
        severity={crisisSeverity}
        type={crisisType}
        resources={crisisResources}
        onClose={() => setIsCrisis(false)}
      />

      {/* Share Session Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full bg-slate-900 border border-purple-500/30 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Secure Session Sharing
                </span>
                <h3 className="text-xl font-bold text-white">Share Check-in Conversation</h3>
                <p className="text-xs text-slate-400">
                  Share a direct link or copy a formatted transcript of your session with MindCare AI.
                </p>
              </div>

              {/* Privacy Anonymize Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Anonymize Personal Information</span>
                    <span className="text-[10px] text-slate-400 block">Replaces your user name with &quot;Anonymous User&quot; in shares.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={anonymizeShare}
                  onChange={(e) => setAnonymizeShare(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-purple-400" /> Shareable Session Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareableUrl()}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> Copy Text Transcript
                    </span>
                    <span className="text-[10px] text-slate-400 block">Copy full formatted conversation to clipboard.</span>
                  </div>
                  <button
                    onClick={handleCopyTranscript}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedTranscript ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
