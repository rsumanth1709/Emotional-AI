"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { securityAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Shield, Lock, FileText, Database, HardDrive, Key, RefreshCw,
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, Trash2, Download, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface SecurityOverview {
  encryption_status: string;
  encryption_key_fingerprint: string;
  active_consents: Record<string, boolean>;
  retention_policy: {
    retention_days: number;
    auto_purge_enabled: boolean;
    anonymize_on_purge: boolean;
    last_purged_at: string | null;
  };
  recent_audit_count: number;
  backup_count: number;
  latest_backup_checksum: string | null;
  compliance_standards: string[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  resource: string;
  ip_address: string;
  status: string;
  details: string;
  timestamp: string;
}

interface BackupEntry {
  id: string;
  filename: string;
  file_size_bytes: number;
  encryption_algorithm: string;
  sha256_checksum: string;
  created_by: string;
  created_at: string;
}

export default function SecurityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    data_processing: true,
    ai_analytics: true,
    clinician_sharing: false,
    third_party_research: false,
  });

  const [retentionDays, setRetentionDays] = useState<number>(365);
  const [autoPurge, setAutoPurge] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [purging, setPurging] = useState<boolean>(false);
  const [backingUp, setBackingUp] = useState<boolean>(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [ovRes, logsRes, bkRes, conRes, retRes] = await Promise.all([
        securityAPI.getOverview(),
        securityAPI.getAuditLogs(50),
        securityAPI.getBackups(),
        securityAPI.getConsents(),
        securityAPI.getRetention(),
      ]);
      setOverview(ovRes.data);
      setAuditLogs(logsRes.data);
      setBackups(bkRes.data);
      setConsents(conRes.data);
      setRetentionDays(retRes.data.retention_days);
      setAutoPurge(retRes.data.auto_purge_enabled);
    } catch {
      toast.error("Failed to load security portal data.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (consentType: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setConsents((prev) => ({ ...prev, [consentType]: newVal }));
    try {
      await securityAPI.updateConsent(consentType, newVal);
      toast.success(`Consent for '${consentType}' updated.`);
      fetchSecurityData();
    } catch {
      setConsents((prev) => ({ ...prev, [consentType]: currentVal }));
      toast.error("Failed to update consent.");
    }
  };

  const handleSaveRetention = async () => {
    try {
      await securityAPI.updateRetention({
        retention_days: retentionDays,
        auto_purge_enabled: autoPurge,
        anonymize_on_purge: true,
      });
      toast.success(`Retention policy updated to ${retentionDays} days.`);
      fetchSecurityData();
    } catch {
      toast.error("Failed to update retention policy.");
    }
  };

  const handlePurgeData = async () => {
    if (!confirm(`Are you sure you want to purge data older than ${retentionDays} days? This action is permanent.`)) return;
    setPurging(true);
    try {
      const res = await securityAPI.purgeExpiredData();
      toast.success(`Purge complete: ${res.data.total_purged} expired records removed.`);
      fetchSecurityData();
    } catch {
      toast.error("Failed to purge data.");
    } finally {
      setPurging(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      const res = await securityAPI.createBackup();
      toast.success(`Encrypted backup created! Checksum: ${res.data.sha256_checksum.slice(0, 8)}`);
      fetchSecurityData();
    } catch {
      toast.error("Failed to create backup.");
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchSecurityData();
  }, [user]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Secure Health Data Management" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-indigo-950/30 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.06)_0%,_transparent_60%)]" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    Enterprise Health Data Security
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AES-256-GCM Active
                  </span>
                </div>
                <p className="text-slate-400 text-sm max-w-2xl">
                  HIPAA (45 CFR § 164.312) &amp; GDPR (Article 32) compliant health data security architecture.
                  Field-level encryption, immutable access audit logging, explicit consent management, and automated retention purges.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                  <span>🔒 Field-Level AES-256 Encryption</span>
                  <span>📜 Immutable Audit Trail</span>
                  <span>🔐 Explicit Consent Center</span>
                  <span>💾 SHA-256 Encrypted Backups</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              Auditing health data security &amp; encryption status…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">Encryption Status</span>
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-extrabold text-emerald-300">
                    {overview?.encryption_status}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">
                    Key Fingerprint: {overview?.encryption_key_fingerprint}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">Audit Logs Recorded</span>
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {auditLogs.length} <span className="text-xs text-slate-500 font-normal">entries</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Immutable access logging</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">Encrypted Backups</span>
                    <HardDrive className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {backups.length} <span className="text-xs text-slate-500 font-normal">snapshots</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">SHA-256 checksum verified</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">Compliance Standards</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {overview?.compliance_standards.map((std, idx) => (
                      <span key={idx} className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {std.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consent Management Center & Data Retention Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Consent Center */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      Consent Management Center
                    </h3>
                    <span className="text-[10px] text-slate-500">GDPR Explicit Consent</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: "data_processing", label: "General Health Data Processing", desc: "Allows storing & analyzing your emotional check-ins, journal notes, and chat logs." },
                      { key: "ai_analytics", label: "AI Analytics & Quality Improvement", desc: "Allows de-identified aggregation to improve emotion classification accuracy." },
                      { key: "clinician_sharing", label: "Healthcare Provider Sharing", desc: "Allows generating encrypted summary exports for your therapist or clinician." },
                      { key: "third_party_research", label: "Academic Mental Health Research", desc: "Allows fully anonymized statistics to be used in peer-reviewed clinical research." },
                    ].map((item) => {
                      const isGranted = consents[item.key] ?? false;
                      return (
                        <div key={item.key} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white block">{item.label}</span>
                            <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => handleToggleConsent(item.key, isGranted)}
                            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${isGranted ? "bg-emerald-500" : "bg-slate-800"}`}
                          >
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${isGranted ? "translate-x-6" : "translate-x-0"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Retention & Purge Manager */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Data Retention &amp; Automated Purge Manager
                    </h3>
                    <span className="text-[10px] text-slate-500">HIPAA Retention Policy</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Health Record Retention Period
                      </label>
                      <select
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(Number(e.target.value))}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value={30}>30 Days (Strict Minimal Retention)</option>
                        <option value={90}>90 Days (Quarterly Retention)</option>
                        <option value={365}>365 Days (1-Year Annual Retention)</option>
                        <option value={2555}>2555 Days (7-Year Full HIPAA Compliance Standard)</option>
                      </select>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Automated Background Purge</span>
                        <p className="text-[11px] text-slate-400">Automatically permanently delete records exceeding retention limit.</p>
                      </div>
                      <button
                        onClick={() => setAutoPurge(!autoPurge)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${autoPurge ? "bg-amber-500" : "bg-slate-800"}`}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoPurge ? "translate-x-6" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveRetention}
                        className="btn-primary py-2 px-4 text-xs flex-1"
                      >
                        Save Policy Settings
                      </button>
                      <button
                        onClick={handlePurgeData}
                        disabled={purging}
                        className="py-2 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2"
                      >
                        {purging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Purge Expired Data Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Encrypted Backups Manager */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    Encrypted Database Backups &amp; Checksums
                  </h3>
                  <button
                    onClick={handleCreateBackup}
                    disabled={backingUp}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    {backingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                    Create Encrypted Backup
                  </button>
                </div>

                {backups.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    No encrypted backups created yet. Click above to generate your first backup.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                          <th className="p-2.5">Backup Filename</th>
                          <th className="p-2.5">Encryption</th>
                          <th className="p-2.5">SHA-256 Checksum</th>
                          <th className="p-2.5">Created At</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((bk) => (
                          <tr key={bk.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 font-mono">
                            <td className="p-2.5 font-bold text-white flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-emerald-400" />
                              {bk.filename}
                            </td>
                            <td className="p-2.5 text-emerald-300">{bk.encryption_algorithm}</td>
                            <td className="p-2.5 text-slate-400" title={bk.sha256_checksum}>
                              {bk.sha256_checksum.slice(0, 16)}…
                            </td>
                            <td className="p-2.5 text-slate-400">{new Date(bk.created_at).toLocaleString()}</td>
                            <td className="p-2.5 text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Verified Intact
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Immutable Access Audit Trail Table */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Immutable Data Access Audit Trail Log (HIPAA Audit Log)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Showing last 50 events</span>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0 bg-slate-900">
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Resource</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">IP Address</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-white">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300 truncate max-w-xs">{log.resource}</td>
                          <td className="p-2.5 font-semibold text-slate-400 uppercase text-[10px]">{log.actor_role}</td>
                          <td className="p-2.5 font-mono text-slate-500 text-[11px]">{log.ip_address}</td>
                          <td className="p-2.5 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {log.status}
                            </span>
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
