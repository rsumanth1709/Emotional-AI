"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { professionalAPI } from "@/lib/axios";
import type { ProfessionalProfile } from "@/types";
import { UserCheck, ShieldCheck, Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

export default function ProfessionalProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await professionalAPI.getProfile();
        setProfile(res.data);
      } catch {
        // No profile found
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return <MindCareLoading message="Retrieving Professional Verification Profile..." />;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto space-y-4">
        <UserCheck className="h-12 w-12 text-indigo-500 mx-auto" />
        <h2 className="text-xl font-bold">No Healthcare Professional Profile Found</h2>
        <p className="text-sm text-slate-500">
          Apply to become a verified counselor or clinical psychologist on MindCare AI.
        </p>
        <a
          href="/professional/apply"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Submit Application <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const status = profile.verification_status;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-500" />
            Clinical Verification Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official healthcare professional credentials and verification state.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            status === "VERIFIED"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : status === "PENDING"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {status === "VERIFIED" && <ShieldCheck className="h-4 w-4" />}
          {status === "PENDING" && <Clock className="h-4 w-4" />}
          {status === "REJECTED" && <XCircle className="h-4 w-4" />}
          {status}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Specialty</span>
            <p className="text-base font-medium mt-1">{profile.specialty || "General Counselor"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">License Number</span>
            <p className="text-base font-mono font-medium mt-1">{profile.license_number || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Licensing Authority</span>
            <p className="text-base font-medium mt-1">{profile.license_issuer || "State Medical Board"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Credentials Reference</span>
            <p className="text-base font-mono font-medium mt-1">{profile.credentials_reference || "N/A"}</p>
          </div>
        </div>

        {profile.bio && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase text-slate-400">Clinical Bio</span>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.rejection_reason && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-900 dark:text-rose-200 text-sm">
            <p className="font-bold">Rejection Reason:</p>
            <p className="text-xs mt-1">{profile.rejection_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
