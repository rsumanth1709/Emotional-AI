"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MonthlyTrend } from "@/types";

export default function MonthlyTrendChart({ data }: { data: MonthlyTrend[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No monthly trend records available.
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return tickItem;
    }
  };

  return (
    <div className="glass p-6 h-[320px] flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-300">Monthly Mood Trend</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={formatXAxis} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelClassName="text-white font-semibold"
            />
            <Line type="monotone" dataKey="mood_score" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
