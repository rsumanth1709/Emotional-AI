"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { privacyAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Shield, CheckCircle2, AlertTriangle, RefreshCw, Info, Download,
  Lock, Key, Database, RotateCcw, Trash2, Eye, ShieldCheck, Sparkles, Layers, FileText
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function PrivacyDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [privacyStatus, setPrivacyStatus] = useState<any>(null);
  const [dataInventory, setDataInventory] = useState<any[]>([]);

  // Retention & Consent State
  const [retentionPolicy, setRetentionPolicy] = useState<string>("30_days");
  const [memoryConsent, setMemoryConsent] = useState<boolean>(true);
  const [personalizationConsent, setPersonalizationConsent] = useState<boolean>(true);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(false);

  // Modals & Export State
  const [exportJob, setExportJob] = useState<any>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["conversations", "memories", "emotions", "preferences"]);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchPrivacyData = async () => {
    try {
      setLoading(true);
      const statusRes = await privacyAPI.getStatus();
      setPrivacyStatus(statusRes.data);
      setRetentionPolicy(statusRes.data.retention_policy || "30_days");
      setMemoryConsent(statusRes.data.memory_enabled ?? true);
      setPersonalizationConsent(statusRes.data.personalization_enabled ?? true);
      setAnalyticsConsent(statusRes.data.analytics_enabled ?? false);

      const invRes = await privacyAPI.getDataInventory();
      setDataInventory(invRes.data.categories || []);
    } catch {
      toast.error("Failed to load privacy settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchPrivacyData();
  }, [user, authLoading, router]);

  const handleRetentionChange = async (newPolicy: string) => {
    setRetentionPolicy(newPolicy);
    try {
      await privacyAPI.updateRetention(newPolicy);
      toast.success("Retention policy updated!");
    } catch {
      toast.error("Failed to update retention policy.");
    }
  };

  const handleConsentToggle = async (type: string, currentVal: boolean, setFn: (v: boolean) => void) => {
    const newVal = !currentVal;
    setFn(newVal);
    try {
      await privacyAPI.updateConsent(type, newVal ? "granted" : "withdrawn");
      toast.success(`${type.replace("_", " ")} consent ${newVal ? "granted" : "withdrawn"}`);
    } catch {
      toast.error("Failed to update consent.");
    }
  };

  const handleRequestExport = async () => {
    setExporting(true);
    try {
      const res = await privacyAPI.requestExport();
      setExportJob(res.data);
      toast.success("Data export package generated!");
    } catch {
      toast.error("Failed to generate data export.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteMyData = async () => {
    setDeleting(true);
    try {
      const res = await privacyAPI.deleteMyData(selectedScopes);
      toast.success("Selected data scopes permanently deleted!");
      setShowDeleteDataModal(false);
      fetchPrivacyData();
    } catch {
      toast.error("Failed to delete user data.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await privacyAPI.deleteAccount();
      toast.success("Account and associated data deleted!");
      setShowDeleteAccountModal(false);
      router.push("/login");
    } catch {
      toast.error("Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Privacy &amp; Data Governance" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Pseudonymous Identity */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Privacy &amp; Security Architecture
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Privacy by Design
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Collect only what is necessary, retain it only as long as necessary, protect it throughout its lifecycle, and give you complete control.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-right space-y-0.5">
                <span className="text-slate-500 font-semibold text-[10px] uppercase">Pseudonymous User ID</span>
                <p className="font-mono text-emerald-400 font-bold">{privacyStatus?.pseudonymous_id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Security Guarantee:</strong> Authentication information is completely separated from conversation records. All sensitive data is encrypted at rest using AES-256 and transmitted over TLS.
              </p>
            </div>
          </div>

          {/* Retention & Consent Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Retention */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Automated Conversation Retention
              </h3>

              <div className="space-y-3 text-xs">
                <label className="text-slate-400 font-bold">Automatically Purge Conversations Older Than:</label>
                <select
                  value={retentionPolicy}
                  onChange={(e) => handleRetentionChange(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="7_days">7 Days</option>
                  <option value="30_days">30 Days (Default)</option>
                  <option value="90_days">90 Days</option>
                  <option value="1_year">1 Year</option>
                  <option value="forever">Until Manually Deleted</option>
                  <option value="do_not_retain">Do Not Retain (Immediate Purge)</option>
                </select>
                <p className="text-slate-500 text-[11px]">
                  Expired conversations and associated emotional analysis records are automatically purged by background retention workers.
                </p>
              </div>
            </div>

            {/* Granular Consent Toggles */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Granular Feature Consent Management
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-white">Conversation Memory</p>
                    <p className="text-slate-500 text-[10px]">Store key facts to maintain continuity between chat turns</p>
                  </div>
                  <button
                    onClick={() => handleConsentToggle("memory", memoryConsent, setMemoryConsent)}
                    className={`px-3 py-1 rounded-full font-bold ${memoryConsent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`}
                  >
                    {memoryConsent ? "Granted" : "Withdrawn"}
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-white">Response Personalization</p>
                    <p className="text-slate-500 text-[10px]">Adapt communication tone, length, and style preferences</p>
                  </div>
                  <button
                    onClick={() => handleConsentToggle("personalization", personalizationConsent, setPersonalizationConsent)}
                    className={`px-3 py-1 rounded-full font-bold ${personalizationConsent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`}
                  >
                    {personalizationConsent ? "Granted" : "Withdrawn"}
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-white">Anonymous Usage Analytics</p>
                    <p className="text-slate-500 text-[10px]">Collect pseudonymous performance metrics to improve response quality</p>
                  </div>
                  <button
                    onClick={() => handleConsentToggle("analytics", analyticsConsent, setAnalyticsConsent)}
                    className={`px-3 py-1 rounded-full font-bold ${analyticsConsent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`}
                  >
                    {analyticsConsent ? "Granted" : "Withdrawn"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* What We Store and Why Inventory Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              Transparent Data Inventory (What We Store and Why)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Data Category</th>
                    <th className="p-3">Processing Purpose</th>
                    <th className="p-3">Retention Period</th>
                    <th className="p-3">User Deletable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dataInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-white">{item.name}</td>
                      <td className="p-3 text-slate-400">{item.purpose}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{item.retention}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                          {item.deletable ? "Yes" : "Protected"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Export & Deletion Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Data Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Download className="w-4 h-4 text-emerald-400" />
                Export My Data (Portability)
              </h3>
              <p className="text-xs text-slate-400">
                Download a complete encrypted ZIP archive containing your conversation history, memories, emotion observations, preferences, and consent records.
              </p>

              <button
                type="button"
                onClick={handleRequestExport}
                disabled={exporting}
                className="btn-primary w-full py-2.5 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Generate Encrypted Data Export ZIP
              </button>

              {exportJob && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1">
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Export Ready!
                  </p>
                  <p className="text-slate-400 text-[11px]">Download link expires in 24 hours.</p>
                  <a
                    href={exportJob.download_url}
                    className="inline-block mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
                  >
                    Download ZIP Archive
                  </a>
                </div>
              )}
            </div>

            {/* Delete My Data Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-4">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Trash2 className="w-4 h-4" />
                Delete My Data &amp; Account Purge
              </h3>
              <p className="text-xs text-slate-400">
                Permanently purge your stored conversation history, memory records, emotional baseline analytics, or complete account.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDeleteDataModal(true)}
                  className="btn-secondary flex-1 py-2.5 text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-bold"
                >
                  Delete Selected Data Scopes
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Delete Data Modal */}
          {showDeleteDataModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Delete Selected Data Scopes</h3>
                <p className="text-xs text-slate-300">
                  Select data categories to permanently delete across database tables and vector stores:
                </p>

                <div className="space-y-2 text-xs">
                  {["conversations", "memories", "emotions", "preferences"].map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-slate-300 capitalize cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedScopes([...selectedScopes, scope]);
                          else setSelectedScopes(selectedScopes.filter((s) => s !== scope));
                        }}
                        className="accent-rose-500"
                      />
                      <span>{scope}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button type="button" onClick={() => setShowDeleteDataModal(false)} className="btn-secondary py-2 px-3">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteMyData} disabled={deleting} className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">
                    {deleting ? "Deleting…" : "Permanently Delete Data"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Modal */}
          {showDeleteAccountModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-sm font-bold text-rose-400">Permanently Delete Account &amp; All Data?</h3>
                <p className="text-xs text-slate-300">
                  This will permanently purge your authentication account, conversations, memories, emotional baseline, and personalization settings. This action cannot be undone.
                </p>

                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button type="button" onClick={() => setShowDeleteAccountModal(false)} className="btn-secondary py-2 px-3">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteAccount} disabled={deleting} className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">
                    {deleting ? "Deleting Account…" : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
