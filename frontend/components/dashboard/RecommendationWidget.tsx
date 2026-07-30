"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { recommendationAPI } from "@/lib/axios";
import type { RecommendationItem } from "@/types";
import { getEmotionEmoji } from "@/lib/utils";
import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";

export default function RecommendationWidget() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [emotionContext, setEmotionContext] = useState<string>("Neutral");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const res = await recommendationAPI.getRecommendations({ limit: 3 });
        setItems(res.data.recommendations);
        setEmotionContext(res.data.emotion_context);
      } catch {
        // Safe catch
      } finally {
        setLoading(false);
      }
    };
    fetchWidgetData();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 animate-pulse space-y-3">
        <div className="h-5 bg-white/10 rounded w-1/4"></div>
        <div className="h-20 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Recommended for You Today
          </span>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
            Personalized Mood Guidance
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-semibold flex items-center gap-1">
              <span>{getEmotionEmoji(emotionContext)}</span>
              <span className="capitalize">{emotionContext}</span>
            </span>
          </h3>
        </div>

        <Link
          href="/recommendations"
          className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3 hover:border-violet-500/20 transition-all group"
          >
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {item.duration}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {item.mood_effect}
              </span>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-violet-300 hover:text-white flex items-center gap-1"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
