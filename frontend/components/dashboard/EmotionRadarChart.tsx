"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { EmotionDistribution } from "@/types";

export default function EmotionRadarChart({ data }: { data: EmotionDistribution[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No emotion distribution data available for radar analysis.
      </div>
    );
  }

  // Format data to fit Radar chart expectations
  // We want to show the percentage or count of each emotion
  const chartData = data.map((d) => ({
    subject: d.emotion,
    value: d.percentage,
    fullMark: 100,
  }));

  return (
    <div className="glass p-6 h-[320px] flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-300">Emotion Radar Intensity</h3>
        <p className="text-xs text-slate-500">Distribution frequency % of emotions</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} tick={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelClassName="text-white font-semibold text-xs"
            />
            <Radar
              name="Emotion %"
              dataKey="value"
              stroke="#A78BFA"
              fill="#7C3AED"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
