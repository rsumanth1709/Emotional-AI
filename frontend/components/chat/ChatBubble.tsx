"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";
import { getEmotionEmoji, formatTime } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function ChatBubble({ message }: { message: Message }) {
  const isBot = message.role === "assistant";

  return (
    <motion.div
      className={`flex flex-col gap-1 w-full ${isBot ? "items-start" : "items-end"}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-medium">
          {isBot ? "MindCare AI" : "You"} • {formatTime(message.created_at)}
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

      {isBot && message.emotion && (
        <div className="flex gap-2 items-center mt-1">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium flex items-center gap-1.5 shadow-sm">
            <span>{getEmotionEmoji(message.emotion)}</span>
            <span>Detected: {message.emotion}</span>
          </span>
          {message.stress_score !== undefined && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/25 text-slate-400 font-medium">
              Stress Score: {message.stress_score.toFixed(1)}/10
            </span>
          )}
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
