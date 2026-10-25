"use client";

import Navbar from "@/components/layout/Navbar";
import { ShieldCheck, Heart, Sparkles, Lock, Users, Stethoscope } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            MindCare AI
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An empathetic emotional companion and wellness tracker designed to provide mindful reflection, somatic regulation, and privacy-first healthcare insights.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <h2 className="text-lg font-bold">Privacy Sovereignty</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your conversations and journals belong to you alone. Data is never shared with professionals or third parties without explicit, revocable consent.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <Stethoscope className="h-6 w-6 text-indigo-500" />
            <h2 className="text-lg font-bold">Clinical Care Alliance</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verified clinical professionals can view authorized wellness summaries under strict HIPAA/GDPR minimum-necessary disclosure principles.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-bold">Transparent AI</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Emotion predictions are probabilistic estimates, not clinical diagnoses. MindCare AI does not substitute for licensed psychiatric care.
            </p>
          </div>
        </div>

        {/* Public Disclaimer */}
        <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-amber-900 dark:text-amber-200 text-sm space-y-2">
          <h3 className="font-bold text-base">Important Healthcare Safety Notice</h3>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            MindCare AI is an emotional wellness chatbot designed to assist with self-reflection, emotional tracking, and stress management techniques. If you are in crisis, contemplating self-harm, or experiencing a psychiatric emergency, please dial 988 (USA/Canada), 112 (EU), or visit your nearest emergency department immediately.
          </p>
        </div>
      </main>
    </div>
  );
}
