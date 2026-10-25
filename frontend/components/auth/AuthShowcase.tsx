"use client";

import { motion } from "framer-motion";
import { Heart, Brain, Shield, Lock, Activity, CheckCircle2 } from "lucide-react";

export default function AuthShowcase() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Brand Identity */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="MindCare AI"
            className="w-12 h-12 rounded-full object-cover shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300 bg-clip-text text-transparent">
                MindCare AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                V1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Empathetic Mental Wellness & Emotion AI
            </p>
          </div>
        </div>
      </div>

      {/* Center Stage: Heart & Brain Merging Animation + Value Proposition */}
      <div className="relative z-10 my-auto py-8 space-y-8">
        {/* Heart & Brain Merging Aura */}
        <div className="relative w-52 h-48 mx-auto flex items-center justify-center">
          {/* Outer Pulsing Concentric Energy Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-purple-500/25"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border border-dashed border-rose-500/25"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* ── UNIFIED FUSED EMBLEM (Visible when Merged in Center) ── */}
          <motion.div
            className="absolute z-20 w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600/35 via-purple-600/40 to-indigo-600/35 border border-purple-400/50 shadow-[0_0_35px_rgba(168,85,247,0.45)] backdrop-blur-md flex items-center justify-center overflow-hidden"
            animate={{
              opacity: [0, 0, 1, 1, 1, 0, 0],
              scale: [0.6, 0.6, 1.1, 1.0, 1.08, 0.7, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.25, 0.45, 0.6, 0.75, 0.88, 1],
              ease: "easeInOut",
            }}
          >
            {/* Fusion Core Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/25 via-purple-500/30 to-cyan-500/25 blur-sm pointer-events-none" />

            {/* Left Half: Heart (Clipped to left 50%) */}
            <div
              style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-10 h-10 text-rose-400 fill-rose-500/40 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
            </div>

            {/* Right Half: Brain (Clipped to right 50%) */}
            <div
              style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Brain className="w-10 h-10 text-purple-300 fill-purple-500/40 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
            </div>
          </motion.div>

          {/* ── LEFT HEART ICON (Empathy & Emotion) ── */}
          <motion.div
            className="absolute z-10 p-3.5 rounded-2xl bg-gradient-to-tr from-rose-600/35 to-pink-500/20 border border-rose-500/40 text-rose-400 shadow-xl shadow-rose-500/25 backdrop-blur-md"
            animate={{
              x: [-55, -50, 0, 0, 0, -30, -55],
              scale: [1, 1.02, 0.9, 0.8, 0.8, 0.95, 1],
              rotate: [-8, -5, 0, 0, 0, -5, -8],
              opacity: [1, 1, 0, 0, 0, 0.7, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.25, 0.45, 0.6, 0.75, 0.88, 1],
              ease: "easeInOut",
            }}
          >
            <Heart className="w-8 h-8 text-rose-400 fill-rose-500/30" />
          </motion.div>

          {/* ── RIGHT BRAIN ICON (Intelligence & AI) ── */}
          <motion.div
            className="absolute z-10 p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600/35 to-indigo-500/20 border border-purple-500/40 text-purple-300 shadow-xl shadow-purple-500/25 backdrop-blur-md"
            animate={{
              x: [55, 50, 0, 0, 0, 30, 55],
              scale: [1, 1.02, 0.9, 0.8, 0.8, 0.95, 1],
              rotate: [8, 5, 0, 0, 0, 5, 8],
              opacity: [1, 1, 0, 0, 0, 0.7, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.25, 0.45, 0.6, 0.75, 0.88, 1],
              ease: "easeInOut",
            }}
          >
            <Brain className="w-8 h-8 text-purple-300 fill-purple-500/30" />
          </motion.div>
        </div>

        {/* Headline & Mission */}
        <div className="space-y-3 text-center">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            Where Emotional Empathy <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Meets Artificial Intelligence
            </span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Your private, confidential companion for mental wellness. Track your emotional patterns, build healthy habits, and receive compassionate AI support around the clock.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-1 text-left hover:border-purple-500/40 transition-all">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Multimodal Emotion AI</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Speech, facial, and text emotion tracking with precision.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md space-y-1 text-left hover:border-cyan-500/40 transition-all">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Zero Data Selling</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              256-bit field-level encryption for complete peace of mind.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-md space-y-1 text-left hover:border-rose-500/40 transition-all">
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Crisis Safety Guard</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Real-time de-escalation & instant emergency hotlines.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Affirmation & Trust Badges */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Non-diagnostic, privacy-first wellness guidance</span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-slate-300">
          <span>99.4% Empathy Match</span>
          <span>•</span>
          <span>256-Bit SSL</span>
        </div>
      </div>
    </div>
  );
}
