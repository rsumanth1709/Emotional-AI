"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { HourlyMood } from "@/types";

export default function HourlyTimelineChart({ data }: { data: HourlyMood[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass p-6 h-[320px] flex items-center justify-center text-slate-500 text-sm">
        No mood records logged today yet. Start a chat to log your first mood!
      </div>
    );
  }

  return (
    <div className="glass p-6 h-[320px] flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-300">Daily Mood Timeline</h3>
        <p className="text-xs text-slate-500">Hourly mood fluctuations tracked today</p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="moodColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="hour" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              domain={[0, 10]} 
              tickCount={6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
              labelClassName="text-white font-semibold text-xs"
              formatter={(value: any, name: any, props: any) => {
                const dominant = props.payload.dominant_emotion;
                return [`Score: ${value} (${dominant})`, "Mood"];
              }}
            />
            <Area 
              type="monotone" 
              dataKey="mood_score" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#moodColor)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
