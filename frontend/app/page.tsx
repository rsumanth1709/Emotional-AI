"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Activity, ShieldCheck, HelpCircle, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg-hero overflow-x-hidden flex flex-col justify-between">
      {/* ── HEADER ── */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-violet-500 fill-violet-500/20" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            MindCare AI
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="btn-ghost">
            Login
          </Link>
          <Link href="/signup" className="btn-primary py-2 px-5 text-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 z-10">
        <motion.div 
          className="flex-1 space-y-6 text-center lg:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Your Mental Wellness <br />
            <span className="gradient-text">AI Companion</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto lg:mx-0">
            Express yourself without boundaries. MindCare AI analyzes emotions in real-time to provide safe, highly empathetic, and soothing support, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/signup" className="btn-primary text-center">
              Start Free Chat
            </Link>
            <a href="#features" className="btn-secondary text-center">
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Floating Bubble Graphic */}
        <motion.div 
          className="flex-1 relative flex justify-center max-w-md w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-72 h-72 rounded-full bg-violet-600/10 border border-violet-500/20 absolute blur-xl animate-pulse-slow"></div>
          <div className="w-64 h-64 rounded-full bg-indigo-600/15 border border-indigo-500/20 flex flex-col items-center justify-center p-6 text-center shadow-2xl backdrop-blur-md relative z-10 animate-float">
            <Heart className="w-16 h-16 text-rose-400 animate-pulse" />
            <span className="text-2xl font-semibold mt-4 text-white">MindCare AI</span>
            <span className="text-slate-400 text-xs mt-2">Always listening. Fully private.</span>
          </div>
        </motion.div>
      </main>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-16 border-t border-white/5 bg-slate-950/50">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Core Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold">Emotion Tracking</h3>
            <p className="text-slate-400 text-sm">
              We decode Happy, Sad, Anxiety, Angry, and Neutral tones from text to adapt response behavior instantly.
            </p>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold">Empathetic Responses</h3>
            <p className="text-slate-400 text-sm">
              Guided coping suggestions, deep breathing exercises, and emotional support tailored to your exact mood.
            </p>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold">Crisis Safety Guardrails</h3>
            <p className="text-slate-400 text-sm">
              Built-in safety interceptors to override prompt engine outputs and provide emergency helpline resources when needed.
            </p>
          </div>
        </div>
      </section>

      {/* ── ETHICS & DISCLAIMER ── */}
      <footer className="w-full py-8 px-6 bg-slate-950 border-t border-white/5 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p>
            Disclaimer: MindCare AI is a wellness-focused emotional support app and does not replace professional therapy, medical diagnostic tools, or clinical consultations.
          </p>
          <p>© {new Date().getFullYear()} MindCare AI. Fully anonymous data privacy.</p>
        </div>
      </footer>
    </div>
  );
}
