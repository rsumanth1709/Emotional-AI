"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/auth/AdminGuard";
import { adminRBACAPI } from "@/lib/axios";
import { Users, UserX, UserCheck, Shield, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminRBACAPI.getUsers({ status_filter: statusFilter || undefined });
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    try {
      await adminRBACAPI.updateUserStatus(userId, { account_status: newStatus });
      toast.success(`User marked as ${newStatus}.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Status update failed.");
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Registered User Governance ({total})
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administrative directory for account suspension, reactivation, and role oversight.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-300">
          <strong>Privacy Boundary:</strong> Administrators can view account statuses and roles, but have zero access to user chat conversations or personal journals.
        </div>

        {loading ? (
          <MindCareLoading message="Loading Registered Users..." />
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Roles</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">MFA</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{u.full_name || u.username}</div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r: string) => (
                            <span key={r} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-semibold uppercase">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.account_status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {u.mfa_enabled ? "Enabled" : "Disabled"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStatusChange(u.id, u.account_status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            u.account_status === "ACTIVE"
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40"
                          }`}
                        >
                          {u.account_status === "ACTIVE" ? "Suspend Account" : "Reactivate"}
                        </button>
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
