"use client";

import Link from "next/navigation";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Crown, ShieldAlert, Sliders, Users, KeyRound } from "lucide-react";
import OwnerGuard from "@/components/auth/OwnerGuard";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/owner/administrators", label: "Administrators", icon: Users },
    { href: "/owner/security", label: "Security & Lockouts", icon: ShieldAlert },
    { href: "/owner/system-settings", label: "System Settings", icon: Sliders },
  ];

  return (
    <OwnerGuard>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          {/* Owner Top Banner */}
          <div className="bg-slate-900 border-b border-indigo-900/50 px-6 py-2.5 flex items-center justify-between text-white overflow-x-auto">
            <div className="flex items-center gap-2 font-extrabold text-sm text-amber-400 mr-6 shrink-0">
              <Crown className="h-4 w-4" />
              <span>Platform Owner Super-Admin</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
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
    </OwnerGuard>
  );
}
