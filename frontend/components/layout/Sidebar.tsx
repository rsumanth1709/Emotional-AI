"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart, LayoutDashboard, MessageSquare, BookOpen,
  Shield, LogOut, Activity, Eye, Compass, Mic,
  Sparkles, FlaskConical, ChevronRight, Zap, Watch, Network, Cpu,
  Target, Bell, Flame, Award, UserCheck,
  ShoppingBag, Tag, ShieldCheck, FileSearch, Database, Sliders, Globe, Lock, EyeOff, ShieldAlert, AlertTriangle,
  Crown, Stethoscope, FileText, Users, Gamepad2
} from "lucide-react";

type PortalMode = "user" | "admin" | "owner" | "professional";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isOwner, isAdmin, isProfessional } = useAuth();

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/research") ||
    [
      "/analytics",
      "/mlops",
      "/monitoring",
      "/benchmarking",
      "/annotation",
      "/experiments",
      "/self-eval",
      "/evaluation",
      "/hallucinations",
      "/marketplace",
      "/explain",
      "/rag",
      "/hybrid-ai",
      "/on-device-ai",
      "/knowledge-graph",
    ].includes(pathname);

  // Active portal mode based on role and path
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    if (pathname.startsWith("/owner") && isOwner) return "owner";
    if (isAdminPath && isAdmin) return "admin";
    if (pathname.startsWith("/professional") && isProfessional) return "professional";
    return "user";
  });

  useEffect(() => {
    if (pathname.startsWith("/owner") && isOwner) {
      setPortalMode("owner");
    } else if (isAdminPath && isAdmin) {
      setPortalMode("admin");
    } else if (pathname.startsWith("/professional") && isProfessional) {
      setPortalMode("professional");
    }
  }, [pathname, isOwner, isAdmin, isProfessional, isAdminPath]);

  // ── 1. Standard User Navigation (Accessible to ALL Users) ───────────────────
  const userNavigationGroups = [
    {
      title: "Wellness & Daily Life",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Empathetic Chat", href: "/chat", icon: MessageSquare },
        { name: "AI Goal Planner", href: "/goals", icon: Target },
        { name: "AI Habit Tracker", href: "/habits", icon: Flame },
        { name: "Smart Reminders", href: "/reminders", icon: Bell },
        { name: "Therapeutic Journal", href: "/journal", icon: BookOpen },
        { name: "Wearable Health", href: "/wearable", icon: Watch },
      ],
    },
    {
      title: "Emotion AI & Insights",
      items: [
        { name: "Emotion Games", href: "/games", icon: Gamepad2 },
        { name: "Emotional Stories", href: "/stories", icon: BookOpen },
        { name: "Recommendations", href: "/recommendations", icon: Compass },
      ],
    },
    {
      title: "Account & Privacy",
      items: [
        { name: "Personalization", href: "/settings/personalization", icon: Sliders },
        { name: "Privacy & Consents", href: "/privacy-settings", icon: Lock },
      ],
    },
  ];

  // ── 2. Healthcare Professional Care Portal ──────────────────────────────────
  const professionalNavigationGroups = [
    {
      title: "Clinical Care Portal",
      items: [
        { name: "Clinical Dashboard", href: "/professional/dashboard", icon: Stethoscope },
        { name: "Assigned Clients", href: "/professional/clients", icon: Users },
        { name: "Case Management", href: "/professional/cases", icon: ShieldAlert },
        { name: "Shared AI Insights", href: "/professional/insights", icon: Sparkles },
        { name: "Session Notes", href: "/professional/notes", icon: FileText },
        { name: "Clinical Profile", href: "/professional/profile", icon: UserCheck },
      ],
    },
  ];

  // ── 3. Administrator & Engineering Governance ──────────────────────────────
  const adminNavigationGroups = [
    {
      title: "Administrative Governance",
      items: [
        { name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield },
        { name: "User Accounts", href: "/admin/users", icon: Users },
        { name: "Professional Verification", href: "/admin/professionals", icon: UserCheck },
        { name: "Curated Resources", href: "/admin/resources", icon: BookOpen },
        { name: "Security Audit Logs", href: "/admin/audit-logs", icon: FileSearch },
        { name: "Platform Settings", href: "/admin/settings", icon: Sliders },
        { name: "Privacy Analytics", href: "/admin/analytics", icon: EyeOff },
        { name: "Population Analytics", href: "/analytics", icon: Activity },
      ],
    },
    {
      title: "Safety & Quality Oversight",
      items: [
        { name: "Safety Risk Engine", href: "/admin/safety", icon: ShieldAlert },
        { name: "HITL Review Oversight", href: "/admin/review", icon: UserCheck },
        { name: "LLM Security Layer", href: "/admin/security", icon: ShieldAlert },
        { name: "AI Red-Team Suite", href: "/admin/redteam", icon: Flame },
        { name: "Multilingual System", href: "/admin/multilingual", icon: Globe },
      ],
    },
    {
      title: "Research & Engineering Lab",
      items: [
        { name: "Research Lab Models", href: "/research/emotion-models", icon: FlaskConical },
        { name: "Error Analysis", href: "/research/error-analysis", icon: AlertTriangle },
        { name: "Explainable AI (XAI)", href: "/explain", icon: Eye },
        { name: "Emotion-Aware RAG", href: "/rag", icon: Database },
        { name: "Research Hub", href: "/research", icon: Compass },
        { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network },
        { name: "Hybrid AI Router", href: "/hybrid-ai", icon: Cpu },
        { name: "AI Self-Evaluation", href: "/self-eval", icon: Award },
        { name: "MLOps Retraining", href: "/mlops", icon: Network },
        { name: "AI Observability", href: "/monitoring", icon: Activity },
        { name: "AI Experimentation", href: "/experiments", icon: Sparkles },
        { name: "API Marketplace", href: "/marketplace", icon: ShoppingBag },
        { name: "Model Benchmarking", href: "/benchmarking", icon: Award },
        { name: "Dataset Annotation", href: "/annotation", icon: Tag },
        { name: "On-Device Inference", href: "/on-device-ai", icon: Cpu },
        { name: "Quality Evaluation", href: "/evaluation", icon: ShieldCheck },
        { name: "Hallucination Monitor", href: "/hallucinations", icon: FileSearch },
      ],
    },
  ];

  // ── 4. System Owner / Super Administrator Console ───────────────────────────
  const ownerNavigationGroups = [
    {
      title: "Super-Admin Governance",
      items: [
        { name: "Administrators", href: "/owner/administrators", icon: Users },
        { name: "Security & Lockouts", href: "/owner/security", icon: ShieldAlert },
        { name: "System Settings", href: "/owner/system-settings", icon: Sliders },
      ],
    },
    {
      title: "Auditing & Health",
      items: [
        { name: "Platform Audit Logs", href: "/admin/audit-logs", icon: FileSearch },
        { name: "User Management", href: "/admin/users", icon: Users },
        { name: "Professional Approvals", href: "/admin/professionals", icon: UserCheck },
        { name: "AI Observability", href: "/monitoring", icon: Activity },
      ],
    },
  ];

  // Determine active groups and color styling
  let activeNavigationGroups = userNavigationGroups;
  let activeTheme = {
    badge: "bg-purple-600/25 border-purple-500/30 text-purple-300",
    activeItem: "bg-gradient-to-r from-purple-600/25 via-indigo-600/15 to-transparent text-white border-purple-500/30 shadow-purple-500/5",
    activeText: "text-purple-400",
    accentBar: "bg-gradient-to-b from-purple-400 to-indigo-500 shadow-purple-500/80",
    subtitle: "Mental Wellness AI",
  };

  if (portalMode === "owner" && isOwner) {
    activeNavigationGroups = ownerNavigationGroups;
    activeTheme = {
      badge: "bg-amber-500/20 border-amber-500/30 text-amber-300",
      activeItem: "bg-gradient-to-r from-amber-600/25 via-yellow-600/15 to-transparent text-white border-amber-500/30 shadow-amber-500/5",
      activeText: "text-amber-400",
      accentBar: "bg-gradient-to-b from-amber-400 to-yellow-500 shadow-amber-500/80",
      subtitle: "System Owner Super-Admin",
    };
  } else if (portalMode === "admin" && isAdmin) {
    activeNavigationGroups = adminNavigationGroups;
    activeTheme = {
      badge: "bg-rose-500/20 border-rose-500/30 text-rose-300",
      activeItem: "bg-gradient-to-r from-rose-600/25 via-pink-600/15 to-transparent text-white border-rose-500/30 shadow-rose-500/5",
      activeText: "text-rose-400",
      accentBar: "bg-gradient-to-b from-rose-400 to-pink-500 shadow-rose-500/80",
      subtitle: "Admin & AI Governance",
    };
  } else if (portalMode === "professional" && isProfessional) {
    activeNavigationGroups = professionalNavigationGroups;
    activeTheme = {
      badge: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
      activeItem: "bg-gradient-to-r from-indigo-600/25 via-blue-600/15 to-transparent text-white border-indigo-500/30 shadow-indigo-500/5",
      activeText: "text-indigo-400",
      accentBar: "bg-gradient-to-b from-indigo-400 to-blue-500 shadow-indigo-500/80",
      subtitle: "Clinical Care Portal",
    };
  }

  // Has privileged multi-role access
  const hasMultipleRoles = isOwner || isAdmin || isProfessional;

  return (
    <aside className="w-64 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col justify-between p-4 h-screen sticky top-0 z-40 select-none shadow-2xl">
      <div className="space-y-3.5 min-h-0 flex-1 flex flex-col">
        {/* Sleek Brand & Circular Web Logo Header */}
        <div className="pb-3 border-b border-slate-800/80 px-2">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="MindCare AI Logo"
              className="w-11 h-11 rounded-full object-cover group-hover:scale-105 transition-transform duration-300 shadow-md shadow-purple-500/20"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                  MindCare AI
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Active" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {activeTheme.subtitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Dynamic Multi-Role Access Split Switcher (Exclusively visible to users with assigned elevated roles) */}
        {hasMultipleRoles && (
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1 text-[11px] font-bold">
            {isOwner && (
              <button
                type="button"
                onClick={() => setPortalMode("owner")}
                className={`flex-1 py-1 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
                  portalMode === "owner"
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title="System Owner Console"
              >
                <Crown className="w-3 h-3" />
                <span className="truncate">Owner</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setPortalMode("admin")}
                className={`flex-1 py-1 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
                  portalMode === "admin"
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Administrator Console"
              >
                <Shield className="w-3 h-3" />
                <span className="truncate">Admin</span>
              </button>
            )}

            {isProfessional && (
              <button
                type="button"
                onClick={() => setPortalMode("professional")}
                className={`flex-1 py-1 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
                  portalMode === "professional"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Clinical Care Portal"
              >
                <Stethoscope className="w-3 h-3" />
                <span className="truncate">Clinical</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPortalMode("user")}
              className={`flex-1 py-1 px-1.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
                portalMode === "user"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Personal User Space"
            >
              <Heart className="w-3 h-3" />
              <span className="truncate">User</span>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {activeNavigationGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
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
                      prefetch={true}
                      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? `${activeTheme.activeItem} border shadow-md`
                          : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
                      }`}
                    >
                      {active && (
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full shadow-lg ${activeTheme.accentBar}`}
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          active
                            ? activeTheme.activeText
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span className="truncate flex-1">{item.name}</span>
                      {active && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 opacity-70 ${activeTheme.activeText}`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile & Role Identity Footer */}
      <div className="pt-3 mt-2 border-t border-slate-800/80 space-y-2.5">
        {user && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ${
                    isOwner
                      ? "bg-gradient-to-tr from-amber-500 to-rose-600 shadow-amber-500/20"
                      : isAdmin
                      ? "bg-gradient-to-tr from-rose-600 to-purple-600 shadow-rose-500/20"
                      : isProfessional
                      ? "bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20"
                      : "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20"
                  }`}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 shadow-sm shadow-emerald-500/50" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate text-white leading-tight">
                    {user.full_name || user.username}
                  </p>
                  {isOwner ? (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-[9px] font-extrabold text-amber-300">
                      OWNER
                    </span>
                  ) : isAdmin ? (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/30 text-[9px] font-extrabold text-rose-300">
                      ADMIN
                    </span>
                  ) : isProfessional ? (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-extrabold text-indigo-300">
                      CLINICAL
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                  LVL {user.level || 1}
                </span>
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {user.xp || 0} XP
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, ((user.xp || 0) % 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 w-full"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
            <span>Sign Out</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">Shift+L</span>
        </button>
      </div>
    </aside>
  );
}
