"use client";

import { ReactNode } from "react";

export default function MoodCard({
  title,
  value,
  subtitle,
  icon,
  bgColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  bgColor: string;
  trend?: string;
}) {
  return (
    <div className="glass p-6 flex items-center justify-between gap-4 shadow-lg hover:shadow-xl transition-all">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{value}</span>
          {trend && <span className="text-xs text-emerald-400 font-semibold">{trend}</span>}
        </div>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${bgColor}`}>
        {icon}
      </div>
    </div>
  );
}
