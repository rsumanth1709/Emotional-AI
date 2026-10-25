"use client";

import { useEffect, useState } from "react";
import ProfessionalGuard from "@/components/auth/ProfessionalGuard";
import { professionalAPI } from "@/lib/axios";
import type { ProfessionalAssignment } from "@/types";
import { ShieldAlert, UserX, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfessionalCasesPage() {
  const [assignments, setAssignments] = useState<ProfessionalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await professionalAPI.getAssignments();
      setAssignments(res.data);
    } catch {
      toast.error("Failed to load case files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleTerminate = async (clientId: string) => {
    if (!confirm("Are you sure you want to conclude this professional relationship? Data sharing will end immediately.")) {
      return;
    }
    try {
      await professionalAPI.terminateAssignment(clientId);
      toast.success("Care relationship concluded.");
      loadAssignments();
    } catch {
      toast.error("Failed to terminate relationship.");
    }
  };

  return (
    <ProfessionalGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-indigo-500" />
            Active Case Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your active casework and terminate professional care relationships when care goals are reached.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{a.client_name || "Client"}</h3>
                  <p className="text-xs text-slate-400">{a.client_email}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-xs font-bold">
                  {a.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Assigned Date: {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleTerminate(a.user_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold transition"
                >
                  <UserX className="h-4 w-4" />
                  Conclude Relationship
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfessionalGuard>
  );
}
