"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import type { User } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Shield, ShieldAlert, Check, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminDashboardData {
  total_users: number;
  total_chats: number;
  crisis_alerts_today: number;
  users: Array<{
    id: string;
    email: string;
    username: string;
    full_name: string | null;
    is_active: boolean;
    is_admin: boolean;
    chat_count: number;
    created_at: string;
  }>;
  alerts: Array<{
    id: string;
    user_id: string;
    username: string;
    trigger_message: string;
    flagged_keywords: string | null;
    severity: string;
    resolved: boolean;
    created_at: string;
  }>;
}

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("mindcare_token");
      const res = await axios.get("http://localhost:8000/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch {
      toast.error("Failed to load admin controls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.is_admin) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem("mindcare_token");
      await axios.post(`http://localhost:8000/admin/alerts/${alertId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Crisis alert resolved.");
      fetchAdminData();
    } catch {
      toast.error("Failed to resolve alert.");
    }
  };

  if (authLoading || !user || !user.is_admin) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Clinical Admin Portal" />
        
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-rose-500" />
              <span>Admin Console</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">Responsible AI monitoring, crisis reviews, and user logs auditing.</p>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Retrieving system metadata...</div>
          ) : !data ? (
            <div className="text-slate-500 text-sm">Failed to retrieve administration dashboard metrics.</div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 space-y-1 border-rose-500/20 bg-rose-500/5">
                  <span className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Active Crisis Incidents (Today)</span>
                  </span>
                  <p className="text-3xl font-extrabold text-white">{data.crisis_alerts_today}</p>
                </div>
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Registered Accounts</span>
                  <p className="text-3xl font-extrabold text-white">{data.total_users}</p>
                </div>
                <div className="glass p-6 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Processed Chat Logs</span>
                  <p className="text-3xl font-extrabold text-white">{data.total_chats}</p>
                </div>
              </div>

              {/* Crisis Incidents Log */}
              <div className="glass p-6 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <span>Flagged Crisis Interventions</span>
                </h3>
                {data.alerts.length === 0 ? (
                  <p className="text-slate-500 text-xs">No active self-harm triggers logged.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-bold uppercase">
                          <th className="py-3">User</th>
                          <th className="py-3">Trigger Log</th>
                          <th className="py-3">Matches</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {data.alerts.map((alert) => (
                          <tr key={alert.id} className="hover:bg-white/5 transition-all">
                            <td className="py-4 font-semibold text-white">{alert.username}</td>
                            <td className="py-4 max-w-xs truncate italic">{alert.trigger_message}</td>
                            <td className="py-4 text-red-400 font-mono">{alert.flagged_keywords || "None"}</td>
                            <td className="py-4 text-slate-500">{new Date(alert.created_at).toLocaleDateString()}</td>
                            <td className="py-4">
                              {alert.resolved ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Resolved</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">Active</span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              {!alert.resolved && (
                                <button 
                                  onClick={() => handleResolveAlert(alert.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition-all inline-flex items-center gap-1 shadow-md shadow-emerald-500/15"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Mark Resolved</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* User Accounts Log */}
              <div className="glass p-6 space-y-4">
                <h3 className="font-bold text-white">Audited User Profiles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-bold uppercase">
                        <th className="py-3">ID</th>
                        <th className="py-3">Username</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Role</th>
                        <th className="py-3">Logs Count</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {data.users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 font-mono text-[10px] text-slate-500">{u.id}</td>
                          <td className="py-3 font-semibold text-white">{u.username}</td>
                          <td className="py-3 text-slate-400">{u.email}</td>
                          <td className="py-3">{u.is_admin ? "Clinical Admin" : "User"}</td>
                          <td className="py-3">{u.chat_count}</td>
                          <td className="py-3">
                            {u.is_active ? (
                              <span className="text-emerald-400">Active</span>
                            ) : (
                              <span className="text-slate-500">Deactivated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
