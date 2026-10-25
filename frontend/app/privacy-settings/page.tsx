"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { userAPI } from "@/lib/axios";
import type { ConsentRecord } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ShieldCheck, AlertCircle, Trash2, Download, Plus, CheckCircle, Clock, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function PrivacySettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // New Consent Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [recipient, setRecipient] = useState("all_assigned");
  const [dataCategory, setDataCategory] = useState("wellness_summary");
  const [purpose, setPurpose] = useState("Care consultation & emotional well-being review");
  const [expiresDays, setExpiresDays] = useState<number>(90);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getConsents();
      setConsents(res.data);
    } catch {
      toast.error("Failed to load consents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      loadConsents();
    }
  }, [user, authLoading, router]);

  const handleCreateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userAPI.createConsent({
        authorized_recipient: recipient,
        data_category: dataCategory,
        purpose,
        expires_days: expiresDays,
      });
      toast.success("Data sharing permission granted.");
      setShowAddModal(false);
      loadConsents();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to grant consent.");
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm("Are you sure you want to revoke this sharing authorization? The professional will immediately lose access to your data.")) {
      return;
    }
    try {
      await userAPI.revokeConsent(consentId);
      toast.success("Consent revoked. Sharing terminated.");
      loadConsents();
    } catch {
      toast.error("Failed to revoke consent.");
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await userAPI.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindcare_health_export_${user?.username || "user"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Complete health data exported successfully.");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return <MindCareLoading message="Loading Privacy & Consent Governance..." />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
                Consent & Data Sharing Governance
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                You have complete sovereignty over your mental health records. Control who can view your summaries and revoke access at any time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 font-medium transition"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export My Data (GDPR/HIPAA)"}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                Grant Sharing Permission
              </button>
            </div>
          </div>

          {/* Active Consents List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              Authorized Healthcare Professional Relationships
            </h2>

            {consents.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold">No Active Sharing Authorizations</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  Your conversations, journals, and mood logs are strictly private. No therapist or counselor has access to your data until you grant explicit consent.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consents.map((c) => {
                  const isRevoked = !!c.revoked_at || !c.granted;
                  return (
                    <div
                      key={c.id}
                      className={`p-5 rounded-2xl border transition ${
                        isRevoked
                          ? "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                          : "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isRevoked
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {isRevoked ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            {isRevoked ? "Revoked / Expired" : "Active Authorization"}
                          </span>
                          <h3 className="text-lg font-semibold mt-2">
                            {c.data_category === "wellness_summary"
                              ? "Wellness Summary & Mood Trends"
                              : c.data_category || "General Wellness"}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Recipient: <span className="font-mono text-indigo-600 dark:text-indigo-400">{c.authorized_recipient}</span>
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                            Purpose: {c.purpose}
                          </p>
                        </div>
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokeConsent(c.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Revoke Permission"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Granted: {new Date(c.granted_at || "").toLocaleDateString()}</span>
                        {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString()}</span>}
                        {c.revoked_at && <span>Revoked: {new Date(c.revoked_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Grant Consent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              Authorize Professional Data Sharing
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Only verified healthcare professionals can view authorized summaries. Under the principle of minimum necessity, your raw chat conversations are not disclosed.
            </p>

            <form onSubmit={handleCreateConsent} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Recipient Professional
                </label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="all_assigned">All Assigned & Verified Counselors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Data Scope (Minimum Necessary)
                </label>
                <select
                  value={dataCategory}
                  onChange={(e) => setDataCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="wellness_summary">Wellness Summary & Mood Trends</option>
                  <option value="ai_insights">AI Emotional Insights & Highlights</option>
                  <option value="notes">Counselor Session Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Purpose of Sharing
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Authorization Validity Period (Days)
                </label>
                <select
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Quarterly Care)</option>
                  <option value={180}>180 Days (Half Year)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Authorize Sharing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
