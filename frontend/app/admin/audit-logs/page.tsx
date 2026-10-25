"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/auth/AdminGuard";
import { adminRBACAPI } from "@/lib/axios";
import type { AuditLogItem } from "@/types";
import { Shield, Clock, Search, RefreshCw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await adminRBACAPI.getAuditLogs({
        limit: 100,
        action: actionFilter || undefined,
      });
      setLogs(res.data);
    } catch {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-500" />
              Security & Access Audit Trail ({logs.length})
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Immutable logs for security events, permission checks, consent creation/revocation, and administrative decisions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Refresh Logs"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <MindCareLoading message="Retrieving Tamper-Evident Audit Records..." />
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Resource</th>
                    <th className="px-6 py-4">Outcome</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {l.actor_user_id || "ANONYMOUS"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {l.action}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {l.resource_type || "SYSTEM"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          l.outcome === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}>
                          {l.outcome}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {l.details || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
