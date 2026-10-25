"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

import MultilingualEmotionCard from "@/components/research/MultilingualEmotionCard";
import RAGContextCard from "@/components/research/RAGContextCard";
import FederatedSimulator from "@/components/research/FederatedSimulator";
import WearableFusionCard from "@/components/research/WearableFusionCard";
import KnowledgeGraphVisualizer from "@/components/research/KnowledgeGraphVisualizer";
import ONNXLocalInference from "@/components/research/ONNXLocalInference";
import FeedbackTuningCard from "@/components/research/FeedbackTuningCard";
import EmotionProfileCard from "@/components/research/EmotionProfileCard";

import {
  Globe, Database, Lock, Activity, GitFork, Cpu, Sliders, RefreshCw, Brain
} from "lucide-react";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function ResearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"multilingual" | "rag" | "federated" | "wearable" | "graph" | "onnx" | "feedback" | "profile">("multilingual");

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
        <Navbar title="Research-Level AI Innovations Hub" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white">Research AI Engine</h1>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Explore Multilingual Emotion Detection (English, Hindi, Telugu, Tamil, Hinglish, Tenglish), Emotion-Aware RAG, Federated Learning, Wearable Fusion, Knowledge Graphs, ONNX On-Device Inference, and RLHF Preference Learning.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab("multilingual")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "multilingual"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>1. Multilingual Emotion Spectrum</span>
            </button>

            <button
              onClick={() => setActiveTab("rag")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "rag"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Database className="w-4 h-4 text-violet-400" />
              <span>2. Emotion-Aware RAG</span>
            </button>

            <button
              onClick={() => setActiveTab("federated")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "federated"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>3. Federated Learning & DP</span>
            </button>

            <button
              onClick={() => setActiveTab("wearable")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "wearable"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 text-pink-400" />
              <span>4. Wearable Biometric Fusion</span>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "graph"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <GitFork className="w-4 h-4 text-amber-400" />
              <span>5. Therapeutic Knowledge Graph</span>
            </button>

            <button
              onClick={() => setActiveTab("onnx")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "onnx"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>6. On-Device AI (ONNX)</span>
            </button>

            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "feedback"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4 text-pink-400" />
              <span>7. RLHF Feedback Loop</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "profile"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Brain className="w-4 h-4 text-violet-400" />
              <span>8. Emotion Profile</span>
            </button>
          </div>

          {/* Tab Content Display */}
          {activeTab === "multilingual" && <MultilingualEmotionCard />}
          {activeTab === "rag" && <RAGContextCard />}
          {activeTab === "federated" && <FederatedSimulator />}
          {activeTab === "wearable" && <WearableFusionCard />}
          {activeTab === "graph" && <KnowledgeGraphVisualizer />}
          {activeTab === "onnx" && <ONNXLocalInference />}
          {activeTab === "feedback" && <FeedbackTuningCard />}
          {activeTab === "profile" && <EmotionProfileCard />}
        </main>
      </div>
    </div>
  );
}
