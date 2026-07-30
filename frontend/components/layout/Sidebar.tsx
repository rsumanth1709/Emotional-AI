"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart, LayoutDashboard, MessageSquare, BookOpen,
  BarChart2, Shield, LogOut, Activity, Eye, Compass, Mic,
  Sparkles, FlaskConical, ChevronRight, Zap, Watch, Network, Cpu, Brain, Target, Bell
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigationGroups = [
    {
      title: "Core Platform",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Empathetic Chat", href: "/chat", icon: MessageSquare },
        { name: "Voice Assistant", href: "/voice", icon: Mic },
        { name: "AI Goal Planner", href: "/goals", icon: Target },
        { name: "Smart Reminders", href: "/reminders", icon: Bell },
        { name: "AI Journal", href: "/journal", icon: BookOpen },
        { name: "Wearable Integration", href: "/wearable", icon: Watch },
      ],
    },
    {
      title: "AI Intelligence",
      items: [
        { name: "AI Recommendations", href: "/recommendations", icon: Compass },
        { name: "Wellness Coach", href: "/coach", icon: Activity },
        { name: "Predictive AI", href: "/predictive", icon: Sparkles },
        { name: "Emotion Profile", href: "/emotion-profile", icon: Brain },
        { name: "Research Hub", href: "/research", icon: FlaskConical },
        { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network },
        { name: "On-Device AI", href: "/on-device-ai", icon: Cpu },
        { name: "AI Explainability", href: "/explain", icon: Eye },
      ],
    },
    {
      title: "Insights & Reflection",
      items: [
        { name: "Journal", href: "/journal", icon: BookOpen },
        { name: "Analytics", href: "/analytics", icon: BarChart2 },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between p-5 h-screen sticky top-0 z-40 select-none">
      <div className="space-y-6 min-h-0 flex-1 flex flex-col">
        {/* Brand & Logo Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 px-2">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-pink-500/20 border border-violet-500/30 group-hover:border-violet-500/60 transition-all duration-300 shadow-lg shadow-violet-500/10">
              <img
                src="/logo.png"
                alt="MindCare AI Logo"
                className="w-9 h-9 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent block">
                MindCare AI
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Clinical Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section List */}
        <div className="space-y-5 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-transparent text-white border border-violet-500/30 shadow-md shadow-violet-500/5"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-r-full shadow-lg shadow-violet-500/80" />
                      )}
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          active ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate flex-1">{item.name}</span>
                      {active && (
                        <ChevronRight className="w-3.5 h-3.5 text-violet-400 opacity-70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin Link if Admin */}
          {user?.is_admin && (
            <div className="space-y-1.5 pt-2">
              <h4 className="px-3 text-[10px] font-extrabold text-rose-400/80 uppercase tracking-wider">
                Administration
              </h4>
              <Link
                href="/admin"
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  pathname === "/admin"
                    ? "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                    : "text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent"
                }`}
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span className="truncate">Admin Panel</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Gamification Footer */}
      <div className="pt-4 mt-2 border-t border-slate-800/80 space-y-3">
        {user && (
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-violet-500/20">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 shadow-sm shadow-emerald-500/50" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-white leading-tight">
                  {user.full_name || user.username}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-extrabold border border-violet-500/30">
                  LVL {user.level || 1}
                </span>
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {user.xp || 0} XP
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, ((user.xp || 0) % 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 w-full"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            <span>Sign Out</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">Shift+L</span>
        </button>
      </div>
    </aside>
  );
}
