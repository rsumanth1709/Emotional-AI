"use client";

import Link from "next/navigation";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Stethoscope, Users, FileText, Sparkles, UserCheck, ShieldAlert } from "lucide-react";

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/professional/dashboard", label: "Dashboard", icon: Stethoscope },
    { href: "/professional/clients", label: "Assigned Clients", icon: Users },
    { href: "/professional/cases", label: "Case Management", icon: ShieldAlert },
    { href: "/professional/insights", label: "Shared AI Insights", icon: Sparkles },
    { href: "/professional/notes", label: "Session Notes", icon: FileText },
    { href: "/professional/profile", label: "Clinical Profile", icon: UserCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        {/* Professional Navigation Subheader */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mr-4 shrink-0">
            <Stethoscope className="h-5 w-5" />
            <span>Clinical Care Portal</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
