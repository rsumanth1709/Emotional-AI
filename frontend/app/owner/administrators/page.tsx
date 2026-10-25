"use client";

import { useEffect, useState } from "react";
import { ownerAPI } from "@/lib/axios";
import type { User } from "@/types";
import { Users, UserPlus, Crown, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function OwnerAdministratorsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New admin form modal
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await ownerAPI.getAdministrators();
      setAdmins(res.data);
    } catch {
      toast.error("Failed to load administrators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await ownerAPI.createAdministrator({
        email,
        username,
        password,
        full_name: fullName,
      });
      toast.success("Administrator provisioned successfully.");
      setShowModal(false);
      setEmail("");
      setUsername("");
      setPassword("");
      setFullName("");
      loadAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Creation failed.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <MindCareLoading message="Authenticating Privileged Administrator Scope..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Manage Administrators ({admins.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Privileged delegation. Only the System Owner can provision or promote administrator accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Provision Administrator
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Administrator</th>
              <th className="px-6 py-4">Roles</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4">MFA State</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {admin.roles?.includes("owner") && <Crown className="h-4 w-4 text-amber-500" />}
                    {admin.full_name || admin.username}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{admin.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {admin.roles?.map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-xs font-bold">
                    {admin.account_status || "ACTIVE"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono">
                  {admin.mfa_enabled ? "MFA Active" : "Not Enrolled"}
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              Provision Administrator Account
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Password (min 10 chars)</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
                >
                  {creating ? "Creating..." : "Provision Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
