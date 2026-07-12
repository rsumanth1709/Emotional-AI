"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { EmotionDistribution } from "@/types";
import { getEmotionHexColor } from "@/lib/utils";

export default function EmotionPieChart({ data }: { data: EmotionDistribution[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No emotion distribution data recorded yet.
      </div>
    );
  }

  return (
    <div className="glass p-6 h-[320px] flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-300">Emotion Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              nameKey="emotion"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getEmotionHexColor(entry.emotion)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelClassName="text-white"
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
