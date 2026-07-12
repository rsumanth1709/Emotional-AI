"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { WeeklyMood } from "@/types";

export default function WeeklyChart({ data }: { data: WeeklyMood[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No weekly mood records available.
      </div>
    );
  }

  return (
    <div className="glass p-6 h-[320px] flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-300">Weekly Mood Tracker</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 10]} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelClassName="text-white font-semibold"
            />
            <Bar dataKey="mood_score" fill="#7C3AED" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
