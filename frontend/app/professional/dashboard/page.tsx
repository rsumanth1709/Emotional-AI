"use client";

import { useEffect, useState } from "react";
import ProfessionalGuard from "@/components/auth/ProfessionalGuard";
import { professionalAPI } from "@/lib/axios";
import type { ProfessionalAssignment, ProfessionalProfile } from "@/types";
import {
  Stethoscope, Users, FileText, AlertTriangle, ShieldCheck, ArrowRight, Activity, Calendar
} from "lucide-react";

export default function ProfessionalDashboardPage() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [assignments, setAssignments] = useState<ProfessionalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profRes, assignRes] = await Promise.all([
          professionalAPI.getProfile(),
          professionalAPI.getAssignments(),
        ]);
        setProfile(profRes.data);
        setAssignments(assignRes.data);
      } catch {
        // Fallback or guarded
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <ProfessionalGuard>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="h-4 w-4" />
              Verified Clinical Counselor
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome, Dr. / Counselor {profile?.specialty ? `(${profile.specialty})` : ""}
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              You are accessing MindCare AI's clinical care interface under HIPAA / GDPR minimum-necessary data scopes. You can only view individuals who have granted explicit, unrevoked consent.
            </p>
          </div>
        </div>

        {/* Clinical Safety Alert */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Healthcare Safety & AI Scope Notice</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              MindCare AI is an emotional health companion, not a licensed therapist or diagnostic device. AI emotion detections represent probabilistic linguistic estimates and should never serve as standalone diagnostic criteria.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Consented Clients</span>
              <Users className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold mt-2">{assignments.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active data sharing relationships</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Verification Status</span>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">VERIFIED</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Credential ref: {profile?.license_number || "Active"}</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Privacy Boundary</span>
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold mt-2">Least-Privilege</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zero unconsented private record access</p>
          </div>
        </div>

        {/* Assigned Clients Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Active Consented Clients
            </h2>
            <a href="/professional/clients" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              View All Clients <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No active consented clients currently assigned to your care roster. Clients must authorize access from their privacy settings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{a.client_name || "Client"}</h3>
                      <p className="text-xs text-slate-400">{a.client_email}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assigned: {new Date(a.created_at).toLocaleDateString()}</span>
                    <a
                      href={`/professional/insights?clientId=${a.user_id}`}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      View Summary →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfessionalGuard>
  );
}
