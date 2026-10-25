"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import PredictiveForecastCard from "@/components/dashboard/PredictiveForecastCard";
import { Cpu, Sparkles, Activity, ShieldCheck, RefreshCw } from "lucide-react";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function PredictivePage() {
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
        <Navbar title="Predictive AI Mood & Stress Forecasting" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white">Predictive AI Engine</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>PyTorch 2-Layer LSTM</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Forecast tomorrow's mood score, stress risk probabilities, and weekly 95% confidence intervals.
              </p>
            </div>
          </div>

          {/* Predictive Forecast Card Component */}
          <PredictiveForecastCard />

          {/* Model Architecture & Methodology Card */}
          <div className="glass p-6 space-y-4 border border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              <span>Model Architecture & Predictive Methodology</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-violet-300">1. PyTorch MoodLSTM Network</h4>
                <p className="text-slate-400 leading-relaxed">
                  2-layer LSTM sequence model processing a 13-dimensional input feature space (mood, stress, sentiment, and 10-class emotion probabilities).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-cyan-300">2. 95% Confidence Intervals</h4>
                <p className="text-slate-400 leading-relaxed">
                  Calculates lower and upper standard error bounds using Monte Carlo dropout forward passes and empirical sequence volatility.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-orange-300">3. Stress Interceptor</h4>
                <p className="text-slate-400 leading-relaxed">
                  Predicts upcoming stress probability percentages to trigger early preventive wellness interventions before burnout occurs.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
