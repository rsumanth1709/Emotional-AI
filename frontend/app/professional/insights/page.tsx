"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfessionalGuard from "@/components/auth/ProfessionalGuard";
import { professionalAPI } from "@/lib/axios";
import type { ClientSharedSummary } from "@/types";
import { Sparkles, AlertTriangle, ArrowLeft, Heart, TrendingUp, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

function ProfessionalInsightsContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [summary, setSummary] = useState<ClientSharedSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      if (!clientId) {
        setLoading(false);
        return;
      }
      try {
        const res = await professionalAPI.getSharedSummary(clientId);
        setSummary(res.data);
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Failed to load client shared summary.");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [clientId]);

  if (loading) {
    return <MindCareLoading message="Decrypting Consented Clinical Summary..." />;
  }

  if (!clientId || !summary) {
    return (
      <ProfessionalGuard>
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Select a Client to View Consented Insights</h2>
          <p className="text-sm text-slate-400 mt-1">Please select an assigned client from your client directory.</p>
          <a
            href="/professional/clients"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Clients
          </a>
        </div>
      </ProfessionalGuard>
    );
  }

  return (
    <ProfessionalGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/professional/clients"
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-500" />
                Shared Clinical Summary: {summary.client_name || "Client"}
              </h1>
              <p className="text-xs text-slate-500 font-mono">ID: {summary.client_id}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Consented Data Access
          </span>
        </div>

        {/* Clinical Disclaimer Alert */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">{summary.disclaimer}</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Raw chat conversations and personal journals are excluded under minimum-necessary healthcare privacy bounds.
            </p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Trend */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Consented Mood Overview
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {summary.mood_summary.average_score}
              </span>
              <span className="text-slate-400 text-sm">/ 10 (14-day average)</span>
            </div>
            <p className="text-xs text-slate-500">Based on {summary.mood_summary.total_entries} daily check-ins</p>
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Recent Mood Check-in Scores</span>
              <div className="flex items-center gap-2">
                {summary.mood_summary.recent_scores.map((score, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center py-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400"
                  >
                    {score}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotion Trends */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Expressed Emotion Frequencies
            </h2>
            <div className="space-y-2">
              {summary.recent_emotion_trends.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.emotion}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-mono text-xs font-bold">
                    {item.frequency} times
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Clinical Insights */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Shared AI Context & Highlights
          </h2>
          <ul className="space-y-2">
            {summary.ai_insights.map((insight, idx) => (
              <li
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProfessionalGuard>
  );
}

export default function ProfessionalInsightsPage() {
  return (
    <Suspense fallback={<MindCareLoading message="Decrypting Consented Clinical Summary..." />}>
      <ProfessionalInsightsContent />
    </Suspense>
  );
}
