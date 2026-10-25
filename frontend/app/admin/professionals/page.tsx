"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/auth/AdminGuard";
import { adminRBACAPI } from "@/lib/axios";
import type { ProfessionalProfile } from "@/types";
import { Stethoscope, CheckCircle, XCircle, AlertCircle, ExternalLink, Clock } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function AdminProfessionalsPage() {
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await adminRBACAPI.getProfessionals(filter || undefined);
      setProfiles(res.data);
    } catch {
      toast.error("Failed to load professional applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [filter]);

  const handleDecision = async (userId: string, decision: "VERIFIED" | "REJECTED") => {
    let reason: string | undefined = undefined;
    if (decision === "REJECTED") {
      const input = prompt("Please provide a reason for rejecting this application:");
      if (!input) return;
      reason = input;
    }

    try {
      await adminRBACAPI.verifyProfessional(userId, {
        status: decision,
        rejection_reason: reason,
      });
      toast.success(`Professional application ${decision.toLowerCase()}.`);
      loadProfiles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed.");
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-indigo-500" />
              Healthcare Professional Verifications
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Verify credentials, state licensure, and board certifications for counselors and therapists.
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
          >
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified Professionals</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All Applications</option>
          </select>
        </div>

        {loading ? (
          <MindCareLoading message="Loading Applications..." />
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Clock className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-base">No Applications in this Queue</h3>
            <p className="text-sm text-slate-400 mt-1">Check back later or adjust your status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{p.specialty || "Clinical Counselor"}</h3>
                    <p className="text-xs text-slate-400 font-mono">User ID: {p.user_id}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    p.verification_status === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : p.verification_status === "PENDING"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}>
                    {p.verification_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-semibold">License Number</span>
                    <span className="font-mono font-medium">{p.license_number || "Not provided"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-semibold">Licensing Board</span>
                    <span className="font-medium">{p.license_issuer || "Not provided"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-semibold">Verification Registry</span>
                    <a
                      href={p.credentials_reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Verify License <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {p.bio && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl">
                    {p.bio}
                  </p>
                )}

                {p.verification_status === "PENDING" && (
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleDecision(p.user_id, "REJECTED")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 rounded-xl text-xs font-semibold transition"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleDecision(p.user_id, "VERIFIED")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve & Verify
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
