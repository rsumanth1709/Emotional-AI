"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";
import { getEmotionEmoji, getEmotionColor, getEmotionBgColor, formatTime } from "@/lib/utils";
import {
  AlertTriangle, ThumbsUp, ThumbsDown, Volume2, VolumeX, Sparkles,
  Copy, Check, Share2, User, FileText, ExternalLink, Download, Maximize2, X,
  ChevronDown, ChevronUp, ShieldCheck
} from "lucide-react";
import { researchAPI } from "@/lib/axios";
import { toast } from "react-hot-toast";

function MessageRatingControl({ messageId, persona }: { messageId: string; persona?: string }) {
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRate = async (newRating: number) => {
    const target = rating === newRating ? 0 : newRating;
    setRating(target);
    setLoading(true);
    try {
      await researchAPI.submitFeedback({
        item_type: "chat_response",
        rating: target,
        item_id: messageId,
        category_tag: persona || "friendly",
        feedback_text: `Chat message ${messageId} rated ${target > 0 ? "thumbs up" : "thumbs down"}`
      });
      if (target > 0) {
        toast.success("Feedback saved! MindCare AI will reinforce this empathetic style.", { icon: "👍" });
      } else if (target < 0) {
        toast.success("Feedback saved! MindCare AI will adjust future responses.", { icon: "👎" });
      }
    } catch {
      toast.error("Failed to save feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-full border border-slate-800 shadow-sm">
      <button
        onClick={() => handleRate(1)}
        disabled={loading}
        title="Helpful & Empathetic"
        className={`p-1.5 rounded-full transition-all ${
          rating === 1
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
            : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80"
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => handleRate(-1)}
        disabled={loading}
        title="Needs Improvement"
        className={`p-1.5 rounded-full transition-all ${
          rating === -1
            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
            : "text-slate-400 hover:text-rose-400 hover:bg-slate-800/80"
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const formatPersonaName = (personaKey?: string) => {
  switch (personaKey) {
    case "friendly": return "Friendly Companion";
    case "professional": return "Clinical Therapist";
    case "motivational": return "Motivation Catalyst";
    case "coach": return "Wellness Coach";
    case "mentor": return "Wise Mentor";
    case "student_counselor": return "Student Counselor";
    default: return "";
  }
};

export default function ChatBubble({ message }: { message: Message }) {
  const isBot = message.role === "assistant";
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const cleanText = message.content.replace(/[*_#`~]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Response copied to clipboard!", { icon: "📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className={`flex gap-3.5 w-full ${isBot ? "items-start" : "items-end justify-end"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Bot Avatar Icon */}
      {isBot && (
        <div className="relative shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 border border-purple-400/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
        </div>
      )}

      {/* Message Body & Controls */}
      <div className={`flex flex-col gap-1.5 max-w-[88%] md:max-w-[82%] ${isBot ? "items-start" : "items-end"}`}>
        {/* Header Label & Timestamp */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold">
            {isBot ? (
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="font-extrabold text-white">MindCare AI</span>
                {message.persona && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                    {formatPersonaName(message.persona)}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-300 font-semibold">You</span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{formatTime(message.created_at)}</span>
        </div>

        {/* Bubble Card Container */}
        <div
          className={`text-sm leading-relaxed ${
            isBot
              ? "bg-slate-900/80 border border-slate-800/90 rounded-3xl rounded-tl-sm p-4 md:p-5 text-slate-100 shadow-xl backdrop-blur-2xl w-full hover:border-slate-700/80 transition-colors"
              : "bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 text-white rounded-3xl rounded-tr-sm p-3.5 px-4 md:px-5 shadow-lg shadow-purple-900/20 border border-purple-400/20 font-medium"
          }`}
        >
          {isBot ? (
            <>
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-300 hover:text-white underline font-semibold transition-colors bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20"
                  >
                    <span>{children}</span>
                    <ExternalLink className="w-3 h-3 inline shrink-0 opacity-70" />
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-extrabold text-white">{children}</strong>
                ),
                p: ({ children }) => (
                  <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-black text-white mt-3.5 mb-2 border-b border-slate-800 pb-1">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold text-purple-300 mt-2.5 mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 my-2.5 text-slate-200">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 my-2.5 text-slate-200">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-purple-500 pl-3 py-1.5 my-2.5 italic text-purple-200 bg-purple-950/25 rounded-r-xl">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-slate-950 px-2 py-0.5 rounded-lg text-purple-300 font-mono text-xs border border-slate-800 shadow-inner">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Verified Clinical RAG Knowledge Sources */}
            {isBot && message.sources && message.sources.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowSources((prev) => !prev)}
                  className="flex items-center justify-between w-full text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors py-1 px-1.5 rounded-lg hover:bg-purple-950/20"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Knowledge Sources ({message.sources.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                    {showSources ? "Hide" : "View Sources"}
                    {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </button>

                {showSources && (
                  <div className="mt-2 space-y-2">
                    {message.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-[12px]">{src.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold shrink-0">
                            Verified Source
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>{src.source_name}</span>
                          {src.source_url && (
                            <a
                              href={src.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 font-medium"
                            >
                              <span>Official Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
          ) : (
            <div className="space-y-2.5">
              {/* User File Attachment Card */}
              {message.file_name && (
                <div className="flex items-center gap-3 bg-black/35 px-3.5 py-2.5 rounded-2xl border border-white/20 max-w-sm shadow-md backdrop-blur-md">
                  <div className="p-2 rounded-xl bg-purple-500/25 text-purple-200 shrink-0 border border-purple-400/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white truncate">{message.file_name}</span>
                    <span className="block text-[10px] text-purple-200 font-medium">Attached File • Processed</span>
                  </div>
                  {message.file_url && (
                    <a
                      href={message.file_url}
                      download={message.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-all shrink-0"
                      title="Download or View"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* User Camera Snapshot Card */}
              {message.image_url && !message.file_name && (
                <div className="relative rounded-2xl overflow-hidden border border-white/25 max-w-xs shadow-lg group">
                  <img
                    src={message.image_url}
                    alt="Attached camera snapshot"
                    className="w-full h-auto object-cover max-h-48 cursor-pointer group-hover:scale-105 transition-transform duration-200"
                    onClick={() => setImageModalOpen(true)}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-between">
                    <span className="text-[10px] text-purple-200 font-bold flex items-center gap-1">
                      📸 Facial Snapshot
                    </span>
                    <button
                      onClick={() => setImageModalOpen(true)}
                      className="p-1 rounded bg-black/40 hover:bg-black/60 text-white text-[10px]"
                      title="Enlarge"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* User Audio Note Card */}
              {message.audio_url && (
                <div className="bg-black/30 p-2.5 rounded-2xl border border-white/20 max-w-xs shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-200 font-bold mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>🎙️ Voice Check-in Attached</span>
                  </div>
                  <audio src={message.audio_url} controls className="h-8 w-56 rounded" />
                </div>
              )}

              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}
        </div>

        {/* Assistant Bottom Action & Emotion Insights Bar */}
        {isBot && (
          <div className="flex flex-wrap gap-2 items-center pt-1 px-1">
            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="p-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm"
              title="Copy response to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {/* Read Aloud TTS Button */}
            <button
              onClick={handleSpeak}
              className={`p-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                speaking
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse shadow-sm shadow-purple-500/20"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
              }`}
              title={speaking ? "Stop Speech Reading" : "Read Response Aloud"}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
              <span>{speaking ? "Stop" : "Listen"}</span>
            </button>

            {/* RLHF Thumbs Up / Down Rating */}
            <MessageRatingControl messageId={message.id} persona={message.persona} />
          </div>
        )}

        {/* Estimated User Tone Tag (Estimate, Not Fact - Distinguishes Speaker) or Physical Symptom Badge */}
        {!isBot && (message.intent === "PHYSICAL_SYMPTOM" ? (
          <div className="flex items-center gap-1.5 px-2 pt-0.5">
            <span
              className="text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-medium flex items-center gap-1 shadow-sm"
              title="Physical bodily symptom reported (health-safety guidance, not an emotional diagnosis)"
            >
              <span>🩺</span>
              <span className="text-amber-200 font-semibold">Physical Symptom</span>
            </span>
          </div>
        ) : message.emotion ? (
          <div className="flex items-center gap-1.5 px-2 pt-0.5">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 shadow-sm ${getEmotionBgColor(
                message.emotion
              )}`}
              title="Estimated emotional tone of this message (estimate, not clinical diagnosis)"
            >
              <span className="text-xs">{getEmotionEmoji(message.emotion)}</span>
              <span className="text-slate-300">Tone estimate:</span>
              <strong className={`capitalize ${getEmotionColor(message.emotion)}`}>
                {message.confidence && message.confidence < 0.50 ? "Uncertain" : message.emotion}
              </strong>
              {message.confidence && message.confidence >= 0.60 && (
                <span className="text-[9px] text-slate-400 font-mono">
                  ({Math.round(message.confidence * 100)}%)
                </span>
              )}
            </span>
          </div>
        ) : null)}

        {/* Safety Risk Alert Badge */}
        {message.is_crisis && (
          <div className="flex gap-2 items-center text-rose-300 text-xs font-bold bg-rose-500/15 border border-rose-500/30 px-3.5 py-1.5 rounded-full shadow-md shadow-rose-950/40">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span>Safety Guard Active • Support resources available</span>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-700 border border-purple-400/30 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-900/30 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Lightbox Image Modal */}
      <AnimatePresence>
        {imageModalOpen && message.image_url && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setImageModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={message.image_url} alt="Enlarged snapshot" className="w-full h-auto object-contain max-h-[85vh]" />
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
