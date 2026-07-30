"use client";

import { useState } from "react";
import type { HeatmapDay } from "@/types";

export default function CalendarHeatmap({ data }: { data: HeatmapDay[] }) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No calendar activity recorded yet.
      </div>
    );
  }

  // Get color and border class based on mood score and count
  const getCellClasses = (day: HeatmapDay) => {
    if (day.count === 0) {
      return "bg-slate-900 border border-slate-800/40 hover:bg-slate-800/60";
    }
    const score = day.mood_score;
    if (score < 4.0) {
      return "bg-rose-500/30 border border-rose-500/50 hover:bg-rose-500/50 text-rose-200 cursor-pointer";
    }
    if (score < 6.5) {
      return "bg-yellow-500/30 border border-yellow-500/50 hover:bg-yellow-500/50 text-yellow-200 cursor-pointer";
    }
    if (score < 8.5) {
      return "bg-emerald-500/30 border border-emerald-500/50 hover:bg-emerald-500/50 text-emerald-200 cursor-pointer";
    }
    return "bg-violet-500/40 border border-violet-500/60 hover:bg-violet-500/60 text-violet-200 cursor-pointer";
  };

  // Format a date beautifully for displaying
  const formatDateLabel = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group days into weeks of 7 days
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="glass p-6 min-h-[320px] flex flex-col justify-between relative">
      <div>
        <h3 className="text-sm font-bold text-slate-300">Mood Heatmap</h3>
        <p className="text-xs text-slate-500">Log activity and mood levels over the past 90 days</p>
      </div>

      <div className="my-6 overflow-x-auto custom-scrollbar flex flex-col items-center">
        <div className="flex gap-1.5 p-2 rounded-xl bg-slate-950/40 border border-white/5 w-fit">
          {weeks.map((week, wIdx) => (
            <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => (
                <div
                  key={`day-${wIdx}-${dIdx}`}
                  className={`w-5 h-5 rounded-md transition-all duration-200 ${getCellClasses(day)}`}
                  onMouseEnter={() => day.count > 0 && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Heatmap Legend */}
        <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-500">
          <span>Less Active</span>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" title="No Logs" />
            <div className="w-3.5 h-3.5 rounded bg-rose-500/30 border border-rose-500/40" title="Low Mood (< 4.0)" />
            <div className="w-3.5 h-3.5 rounded bg-yellow-500/30 border border-yellow-500/40" title="Neutral Mood (4.0 - 6.5)" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500/30 border border-emerald-500/40" title="Elevated Mood (6.5 - 8.5)" />
            <div className="w-3.5 h-3.5 rounded bg-violet-500/40 border border-violet-500/50" title="Excellent Mood (>= 8.5)" />
          </div>
          <span>More Active</span>
        </div>
      </div>

      {/* Floating Tooltip info */}
      <div className="h-8 flex justify-center items-center">
        {hoveredDay ? (
          <div className="text-xs py-1 px-3 bg-slate-900 border border-white/10 rounded-full text-slate-300 animate-fadeIn">
            <span className="font-semibold text-white">{formatDateLabel(hoveredDay.date)}</span>
            <span className="mx-2 text-slate-600">|</span>
            <span>Mood Score: <strong className="text-violet-400">{hoveredDay.mood_score.toFixed(1)}/10</strong></span>
            <span className="mx-2 text-slate-600">|</span>
            <span>{hoveredDay.count} chats</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Hover over colored blocks to view mood insights</p>
        )}
      </div>
    </div>
  );
}
