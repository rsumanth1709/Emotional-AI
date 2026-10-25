"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import KnowledgeGraphVisualizer from "@/components/research/KnowledgeGraphVisualizer";
import { RefreshCw, GitFork } from "lucide-react";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function KnowledgeGraphPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Therapeutic Knowledge Graph" />
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900 to-violet-950/30 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,158,11,0.06)_0%,_transparent_60%)]" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <GitFork className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  Therapeutic Knowledge Graph
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl">
                  An AI-driven directed graph encoding relationships between emotional states, psychological triggers,
                  evidence-based coping strategies, therapeutic outcomes, and personal progress milestones.
                  Explore how emotions connect, find paths to wellbeing, and discover personalized strategy recommendations.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                  <span>📊 30+ therapeutic nodes</span>
                  <span>🔗 60+ directed edges</span>
                  <span>🧠 CBT · ACT · MSC · DBT</span>
                  <span>👤 Personalized subgraphs</span>
                  <span>🔍 BFS path traversal</span>
                </div>
              </div>
            </div>
          </div>

          <KnowledgeGraphVisualizer />
        </main>
      </div>
    </div>
  );
}
