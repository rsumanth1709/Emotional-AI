"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-3 w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Bot Avatar with Glow */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/25 mt-0.5 animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-ping" />
      </div>

      {/* Typing Pill */}
      <div className="flex flex-col gap-1 items-start">
        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
          <span>MindCare AI</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-normal">reflecting & synthesizing</span>
        </span>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-md backdrop-blur-xl">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 shadow-sm shadow-purple-500/50"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="text-xs text-slate-400 font-medium ml-2">Listening with empathy...</span>
        </div>
      </div>
    </motion.div>
  );
}
