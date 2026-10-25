"use client";

import { useEffect, useState } from "react";
import ProfessionalGuard from "@/components/auth/ProfessionalGuard";
import { professionalAPI } from "@/lib/axios";
import type { ProfessionalAssignment } from "@/types";
import { Users, FileText, Sparkles, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfessionalClientsPage() {
  const [assignments, setAssignments] = useState<ProfessionalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await professionalAPI.getAssignments();
        setAssignments(res.data);
      } catch {
        toast.error("Failed to load assigned clients.");
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  return (
    <ProfessionalGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Consented Client Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Clients who have authorized access to their wellness summaries and mood trends.
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No Consented Clients Found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Under strict RBAC controls, clients only appear here after they establish a relationship and grant consent in their privacy dashboard.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assigned Since</th>
                    <th className="px-6 py-4">Authorized Data</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {a.client_name || "Client"}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{a.client_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Consented
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        Wellness & Mood Analytics
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <a
                          href={`/professional/insights?clientId=${a.user_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Insights
                        </a>
                        <a
                          href={`/professional/notes?clientId=${a.user_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Notes
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProfessionalGuard>
  );
}
