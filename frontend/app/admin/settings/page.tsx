"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { Sliders, ShieldCheck, Database, Key } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <div className="space-y-6 max-w-4xl">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sliders className="h-6 w-6 text-indigo-500" />
            System Administration & Policies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global application configuration, encryption enforcement, and feature flags.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              RBAC Governance
            </div>
            <p className="text-xs text-slate-500">
              Role-Based Access Control is enforced at the backend dependency boundary. Deny-by-default is strictly enforced.
            </p>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-xs font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <Key className="h-5 w-5 text-indigo-500" />
              Session Rotation & Lockout
            </div>
            <p className="text-xs text-slate-500">
              Accounts are locked for 15 minutes after 5 consecutive failed logins. Refresh tokens rotate on every request.
            </p>
            <span className="inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 rounded text-xs font-bold">
              ENFORCED
            </span>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
