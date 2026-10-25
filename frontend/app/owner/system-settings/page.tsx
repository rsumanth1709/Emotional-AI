"use client";

import { useEffect, useState } from "react";
import { ownerAPI } from "@/lib/axios";
import { Sliders, Database, Key, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OwnerSystemSettingsPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await ownerAPI.getSecuritySettings();
        setSettings(res.data);
      } catch {
        toast.error("Failed to load settings.");
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sliders className="h-6 w-6 text-amber-500" />
          Master Platform Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Super-Administrator platform parameters, cryptographic policies, and system metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            RBAC Matrix State
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Centralized permissions catalog synchronized across Guest, User, Healthcare Professional, Administrator, and System Owner roles.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> 26 Canonical Permissions Active
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Key className="h-5 w-5 text-amber-500" />
            Cryptographic Work Factors
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Password hashing powered by bcrypt with 12 rounds of salting and pre-hashing safety bounds. Dual JWT and SHA-256 rotating refresh tokens.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            Algorithm: {settings?.jwt_algorithm || "HS256"} | Salt Rounds: 12
          </div>
        </div>
      </div>
    </div>
  );
}
