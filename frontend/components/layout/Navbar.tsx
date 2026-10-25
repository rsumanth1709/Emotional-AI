"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import {
  Sun, Moon, User, Brain, Search, Flame, GitCommit, Zap,
  ChevronRight, Sparkles, X, Activity, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationDrawer from "@/components/layout/NotificationDrawer";

export default function Navbar({ title = "MindCare AI" }: { title?: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emotionProfileItems = [
    {
      name: "Emotion Profile",
      href: "/emotion-profile",
      icon: Brain,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      desc: "Comprehensive metrics & archetype analysis",
    },
    {
      name: "Cause Detection",
      href: "/cause-detection",
      icon: Search,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      desc: "Root cause identification & trigger analysis",
    },
    {
      name: "Emotion Intensity",
      href: "/intensity",
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      desc: "Real-time emotional intensity scale & tracking",
    },
    {
      name: "Emotion Transitions",
      href: "/transitions",
      icon: GitCommit,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      desc: "Mood state shift probabilities & timeline",
    },
    {
      name: "Emotional Triggers",
      href: "/triggers",
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      desc: "Personal trigger mapping & coping strategies",
    },
  ];

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="MindCare AI Logo"
          className="w-11 h-11 rounded-full object-cover shadow-sm shadow-purple-500/20"
        />
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3 relative">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
            aria-label="Toggle Theme"
            title="Toggle theme mode"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-slate-300" />}
          </button>
        )}

        {/* Notifications Icon Drawer */}
        <NotificationDrawer />

        {/* Profile Dropdown Menu Button (Next to Notifications) */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
              showProfileMenu
                ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white"
            }`}
            aria-label="User Profile & Emotional Intelligence Options"
            title="Profile & Emotional Intelligence Options"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user ? user.username.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              {user?.is_admin && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 shadow-sm shadow-rose-500/50"
                  title="Administrator Active"
                />
              )}
            </div>
            <span className="text-xs font-semibold hidden md:inline-block max-w-[100px] truncate">
              {user?.full_name || user?.username || "Profile"}
            </span>
          </button>

          {/* Profile & Emotional Intelligence Popover Menu */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl z-50 backdrop-blur-xl space-y-2"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                {/* Header User Card */}
                {user && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/20 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">
                            {user.full_name || user.username}
                          </p>
                          {user.is_admin ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                              ADMIN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                              MEMBER
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                        LVL {user.level || 1}
                      </span>
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {user.xp || 0} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* Administrator Console Link (Admins Only) */}
                {user?.is_admin && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="group flex items-center gap-2.5 p-2 rounded-2xl text-xs bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-200 transition-all text-left"
                    >
                      <div className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 text-rose-400 flex-shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold truncate text-white leading-tight">
                          Admin Control Center
                        </span>
                        <span className="block text-[10px] text-rose-300/80 truncate">
                          Safety, HITL & System Governance
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                  </div>
                )}

                <div className="px-2 pt-1 pb-0.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Emotional Intelligence Profile
                  </span>
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Emotional Profile Navigation Items */}
                <div className="space-y-1">
                  {emotionProfileItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowProfileMenu(false)}
                        className={`group flex items-start gap-2.5 p-2 rounded-2xl text-xs transition-all text-left ${
                          active
                            ? "bg-purple-500/20 border border-purple-500/40 text-white"
                            : "hover:bg-slate-800/80 border border-transparent text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl border flex-shrink-0 mt-0.5 ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold truncate text-white leading-tight">
                            {item.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {item.desc}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors self-center flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
