"use client";

import { motion } from "framer-motion";
import { Heart, Brain, Sparkles } from "lucide-react";

interface MindCareLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function MindCareLoading({
  message = "Merging Emotional Empathy & AI Intelligence...",
  fullScreen = true,
}: MindCareLoadingProps) {
  return (
    <div
      className={`bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden ${
        fullScreen ? "fixed inset-0 z-50 min-h-screen w-screen" : "w-full py-20"
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-750" />

      {/* Main Merging Animation Stage */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer Rotating Concentric Energy Rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-purple-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border border-dashed border-rose-500/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />

        {/* Central Merging Sparkle Flash */}
        <motion.div
          className="absolute z-20 text-cyan-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]"
          animate={{
            scale: [0.4, 1.4, 0.4],
            opacity: [0.2, 1, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-8 h-8 text-cyan-300" />
        </motion.div>

        {/* Left Heart Icon (Empathy & Emotion) */}
        <motion.div
          className="absolute z-10 p-3 rounded-2xl bg-gradient-to-tr from-rose-600/30 to-pink-500/20 border border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/30 backdrop-blur-md"
          animate={{
            x: [-45, 0, -45],
            scale: [0.9, 1.15, 0.9],
            rotate: [-12, 0, -12],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Heart className="w-8 h-8 text-rose-400 fill-rose-500/30" />
        </motion.div>

        {/* Right Brain Icon (AI & Intelligence) */}
        <motion.div
          className="absolute z-10 p-3 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-500/20 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/30 backdrop-blur-md"
          animate={{
            x: [45, 0, 45],
            scale: [0.9, 1.15, 0.9],
            rotate: [12, 0, 12],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Brain className="w-8 h-8 text-purple-300 fill-purple-500/30" />
        </motion.div>
      </div>

      {/* Sleek Typography & Status Message */}
      <div className="mt-6 text-center space-y-1.5 z-10 max-w-sm px-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-black tracking-wider bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300 bg-clip-text text-transparent uppercase">
            MindCare AI
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <p className="text-xs font-semibold text-slate-400 animate-pulse tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}
