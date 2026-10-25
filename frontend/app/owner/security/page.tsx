"use client";

import { useEffect, useState } from "react";
import { ownerAPI } from "@/lib/axios";
import { ShieldAlert, KeyRound, Lock, Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function OwnerSecurityPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockoutMin, setLockoutMin] = useState(15);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await ownerAPI.getSecuritySettings();
      setSettings(res.data);
      setMaxAttempts(res.data.max_login_attempts ?? 5);
      setLockoutMin(res.data.lockout_duration_minutes ?? 15);
      setMfaRequired(res.data.mfa_required_for_admin ?? true);
      setSessionTimeout(res.data.session_timeout_minutes ?? 60);
    } catch {
      toast.error("Failed to load global security settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ownerAPI.updateSecuritySettings({
        max_login_attempts: maxAttempts,
        lockout_duration_minutes: lockoutMin,
        mfa_required_for_admin: mfaRequired,
        session_timeout_minutes: sessionTimeout,
      });
      toast.success("Platform security policies updated.");
      loadSettings();
    } catch {
      toast.error("Failed to update security policies.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <MindCareLoading message="Loading Security Policy Engine..." />;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          Global Security Policies & Lockouts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure brute-force lockout thresholds, MFA requirements for privileged accounts, and session lifespans.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Max Failed Login Attempts Before Lockout
            </label>
            <input
              type="number"
              min={3}
              max={10}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            />
            <span className="text-xs text-slate-400 mt-1 block">Recommended: 5 attempts</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Account Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={lockoutMin}
              onChange={(e) => setLockoutMin(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            />
            <span className="text-xs text-slate-400 mt-1 block">Progressive lockout duration</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Session Inactivity Timeout (Minutes)
            </label>
            <input
              type="number"
              min={15}
              max={1440}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            />
            <span className="text-xs text-slate-400 mt-1 block">JWT access token lifetime</span>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaRequired}
                onChange={(e) => setMfaRequired(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm font-semibold">Mandate MFA for Privileged Accounts (Admin/Owner)</span>
            </label>
            <span className="text-xs text-slate-400 mt-1 pl-8">Requires RFC 6238 TOTP verification code upon login.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? "Applying Policies..." : "Save Security Policies"}
          </button>
        </div>
      </form>
    </div>
  );
}
