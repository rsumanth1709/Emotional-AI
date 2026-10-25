"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { researchAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import EmotionProfileCard from "@/components/research/EmotionProfileCard";
import { Brain, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function EmotionProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Personalized Emotion Profile" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-violet-500/20 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Long-Term Emotional Pattern Intelligence
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Personalized Emotion Profile</h2>
              <p className="text-slate-400 text-xs mt-1">
                Continuous privacy-preserving learning engine analyzing historical conversations, identifying recurring triggers, computing stability metrics, and adapting chatbot communication style.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>100% Privacy-Preserving On-Device Learning</span>
            </div>
          </div>

          {/* Main Emotion Profile Card */}
          <EmotionProfileCard />
        </main>
      </div>
    </div>
  );
}
