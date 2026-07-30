"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";
import { getEmotionEmoji, formatTime } from "@/lib/utils";
import { AlertTriangle, ThumbsUp, ThumbsDown, Volume2, VolumeX } from "lucide-react";
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
        toast.success("Feedback recorded! MindCare AI will reinforce this response style.", { icon: "👍" });
      } else if (target < 0) {
        toast.success("Feedback recorded! MindCare AI will adjust future prompt style.", { icon: "👎" });
      }
    } catch {
      toast.error("Failed to save feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-full border border-white/10 ml-auto">
      <button
        onClick={() => handleRate(1)}
        disabled={loading}
        title="Rate response as helpful (RLHF Fine-Tuning)"
        className={`p-1 rounded-full transition-all ${
          rating === 1
            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
            : "text-slate-400 hover:text-emerald-400 hover:bg-white/5"
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
      </button>

      <button
        onClick={() => handleRate(-1)}
        disabled={loading}
        title="Rate response as unhelpful (RLHF Fine-Tuning)"
        className={`p-1 rounded-full transition-all ${
          rating === -1
            ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
            : "text-slate-400 hover:text-rose-400 hover:bg-white/5"
        }`}
      >
        <ThumbsDown className="w-3 h-3" />
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

  return (
    <motion.div
      className={`flex flex-col gap-1 w-full ${isBot ? "items-start" : "items-end"}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-medium">
          {isBot ? `MindCare AI${message.persona ? ` (${formatPersonaName(message.persona)})` : ""}` : "You"} • {formatTime(message.created_at)}
        </span>
      </div>

      <div className={isBot ? "bubble-bot" : "bubble-user"}>
        {isBot ? (
          <ReactMarkdown
            components={{
              // Render all links as clickable anchor tags opening in a new tab
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 underline hover:text-violet-300 transition-colors font-medium"
                >
                  {children}
                </a>
              ),
              // Bold text
              strong: ({ children }) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              // Paragraphs — avoid extra margins inside bubble
              p: ({ children }) => (
                <p className="mb-1 last:mb-0">{children}</p>
              ),
              // Unordered lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>
              ),
              // List items
              li: ({ children }) => (
                <li className="text-sm">{children}</li>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>

      {isBot && (
        <div className="flex flex-wrap gap-2 items-center mt-1">
          <button
            onClick={handleSpeak}
            className={`p-1 px-2 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-all ${
              speaking
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse"
                : "bg-slate-900/80 text-slate-400 border-white/10 hover:text-violet-300"
            }`}
            title={speaking ? "Stop Voice Reading" : "Read Response Aloud"}
          >
            {speaking ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-violet-400" />}
            <span>{speaking ? "Stop" : "Listen"}</span>
          </button>

          {message.emotion && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium flex items-center gap-1.5 shadow-sm">
              <span>{getEmotionEmoji(message.emotion)}</span>
              <span>Detected: {message.emotion}</span>
            </span>
          )}
          {typeof message.stress_score === "number" && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/25 text-slate-400 font-medium">
              Stress Score: {message.stress_score.toFixed(1)}/10
            </span>
          )}
          {/* RLHF Thumbs Up / Down Feedback Rating Controls */}
          <MessageRatingControl messageId={message.id} persona={message.persona} />
        </div>
      )}

      {message.is_crisis && (
        <div className="flex gap-1.5 items-center mt-1 text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Safety Interceptor Overridden</span>
        </div>
      )}
    </motion.div>
  );
}
