"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hitlAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  UserCheck, ShieldAlert, CheckCircle2, XCircle, AlertOctagon, MessageSquare,
  FileText, Clock, RefreshCw, ChevronRight, Lock, Eye, ArrowUpRight, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminHITLReviewDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDetail, setCaseDetail] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionReason, setActionReason] = useState<string>("");
  const [annotationText, setAnnotationText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const res = await hitlAPI.getQueue();
      setQueue(res.data.queue || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Access denied: Authorized reviewer permissions required.");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load HITL review queue.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchQueueData();
  }, [user, authLoading, router]);

  const handleSelectCase = async (item: any) => {
    setSelectedCase(item);
    try {
      const [dt, ad] = await Promise.all([
        hitlAPI.getDetail(item.id),
        hitlAPI.getAudit(item.id),
      ]);
      setCaseDetail(dt.data);
      setAuditLogs(ad.data.audit_trail || []);
    } catch {
      toast.error("Failed to fetch review case details.");
    }
  };

  const handleApprove = async () => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await hitlAPI.approve(selectedCase.id, caseDetail?.ai_risk_level || "HIGH_RISK", actionReason);
      toast.success("AI assessment approved successfully.");
      fetchQueueData();
      handleSelectCase(selectedCase);
    } catch {
      toast.error("Failed to approve review.");
    } fontally: { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await hitlAPI.reject(selectedCase.id, "CONCERNING", actionReason || "Over-sensitive AI classification.");
      toast.error("AI assessment rejected.");
      fetchQueueData();
      handleSelectCase(selectedCase);
    } catch {
      toast.error("Failed to reject review.");
    } finally { setSubmitting(false); }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !annotationText.trim()) return;
    try {
      await hitlAPI.annotate(selectedCase.id, annotationText, "risk_context");
      toast.success("Annotation added.");
      setAnnotationText("");
      handleSelectCase(selectedCase);
    } catch {
      toast.error("Failed to add annotation.");
    }
  };

  const handleEscalate = async () => {
    if (!selectedCase) return;
    try {
      await hitlAPI.escalate(selectedCase.id, "SENIOR_REVIEWER", actionReason || "Reviewer disagreement requiring senior oversight.");
      toast.success("Case escalated to Senior Reviewer.");
      fetchQueueData();
      handleSelectCase(selectedCase);
    } catch {
      toast.error("Failed to escalate case.");
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const pendingCount = queue.filter(q => q.status === "PENDING").length;
  const criticalCount = queue.filter(q => q.priority === "CRITICAL" || q.priority === "HIGH").length;
  const completedCount = queue.filter(q => q.status === "COMPLETED").length;
  const escalatedCount = queue.filter(q => q.status === "ESCALATED").length;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Human-in-the-Loop Oversight" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Human-in-the-Loop Oversight
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Consent-Aware &amp; Auditable
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Authorized reviewer dashboard for human oversight of AI-flagged conversations. Enforces minimum necessary access, explicit user consent verification, server-side RBAC, and immutable audit logging.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Pending Cases</span>
              <p className="text-2xl font-extrabold text-amber-400">{pendingCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Critical &amp; High Priority</span>
              <p className="text-2xl font-extrabold text-rose-400">{criticalCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Escalated Cases</span>
              <p className="text-2xl font-extrabold text-purple-400">{escalatedCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Completed Reviews</span>
              <p className="text-2xl font-extrabold text-emerald-400">{completedCount}</p>
            </div>
          </div>

          {/* Queue & Case Inspection Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                Review Cases Queue ({queue.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCase(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 text-xs ${
                      selectedCase?.id === item.id
                        ? "bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          item.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                          item.priority === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                        }`}>
                          {item.priority}
                        </span>
                        <span className="font-mono text-slate-400 font-bold text-[10px]">{item.id.slice(0, 8)}…</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">{item.created_at.slice(11, 16)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold text-white">AI Risk: {item.ai_risk_level}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        item.consent_status === "GRANTED" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        Consent: {item.consent_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Case Inspection Drawer */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              {caseDetail ? (
                <div className="space-y-5 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Case Inspection: {caseDetail.id}</h3>
                      <p className="text-slate-400 text-[11px]">Trigger: {caseDetail.trigger} • Priority: {caseDetail.priority}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase text-[10px]">
                      {caseDetail.status}
                    </span>
                  </div>

                  {/* AI Prediction vs Consent Banner */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-slate-500 font-semibold">AI Risk Level</span>
                      <p className="text-lg font-extrabold text-rose-400">{caseDetail.ai_risk_level}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                      <span className="text-slate-500 font-semibold">User Consent Status</span>
                      <p className="text-lg font-extrabold text-emerald-400">{caseDetail.consent_status}</p>
                    </div>
                  </div>

                  {/* Context Text Box */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      Minimal Necessary Conversation Context
                    </span>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 whitespace-pre-line text-xs max-h-48 overflow-y-auto">
                      {caseDetail.context_text}
                    </div>
                  </div>

                  {/* Review Action Form */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Submit Review Decision</h4>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Reason or reviewer context (optional)"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="btn-primary py-2 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 border-none font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve AI Insight
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={submitting}
                        className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-500 border-none font-bold flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject AI Insight
                      </button>
                      <button
                        onClick={handleEscalate}
                        disabled={submitting}
                        className="btn-primary py-2 px-4 text-xs bg-purple-600 hover:bg-purple-500 border-none font-bold flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Escalate Case
                      </button>
                    </div>
                  </div>

                  {/* Add Annotation Form */}
                  <form onSubmit={handleAddAnnotation} className="space-y-2">
                    <input
                      type="text"
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Add structured reviewer annotation note…"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />
                    <button type="submit" className="btn-secondary py-1.5 px-3 text-xs font-bold">
                      Add Annotation
                    </button>
                  </form>

                  {/* Audit Log Timeline */}
                  {auditLogs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-400 font-bold text-[11px]">Immutable Audit Trail</span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between items-center text-[10px]">
                            <span className="font-mono font-bold text-cyan-400">{log.action}</span>
                            <span className="text-slate-400">Actor: {log.actor_role}</span>
                            <span className="text-slate-500">{log.timestamp.slice(11, 19)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center text-slate-500 text-xs">
                  Select a review case from the queue to inspect context and submit decisions.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
