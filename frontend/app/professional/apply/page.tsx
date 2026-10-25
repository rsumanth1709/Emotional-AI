"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { professionalAPI } from "@/lib/axios";
import { Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfessionalApplyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [credentialsRef, setCredentialsRef] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseIssuer, setLicenseIssuer] = useState("");
  const [specialty, setSpecialty] = useState("Licensed Professional Counselor (LPC)");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await professionalAPI.apply({
        credentials_reference: credentialsRef,
        license_number: licenseNumber,
        license_issuer: licenseIssuer,
        specialty,
        bio,
      });
      toast.success("Application submitted! Our clinical board will review your credentials.");
      router.push("/professional/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Stethoscope className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Apply for Professional Healthcare Verification</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Join MindCare AI's clinical network. Verification ensures all healthcare counselors meet strict state licensing and ethical requirements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Clinical Specialty
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          >
            <option value="Licensed Professional Counselor (LPC)">Licensed Professional Counselor (LPC)</option>
            <option value="Licensed Clinical Social Worker (LCSW)">Licensed Clinical Social Worker (LCSW)</option>
            <option value="Licensed Marriage & Family Therapist (LMFT)">Licensed Marriage & Family Therapist (LMFT)</option>
            <option value="Clinical Psychologist (Psy.D / Ph.D)">Clinical Psychologist (Psy.D / Ph.D)</option>
            <option value="Psychiatrist (MD / DO)">Psychiatrist (MD / DO)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            State License Number
          </label>
          <input
            type="text"
            required
            placeholder="e.g. LPC-894721"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Licensing Board / Authority
          </label>
          <input
            type="text"
            required
            placeholder="e.g. California Board of Behavioral Sciences"
            value={licenseIssuer}
            onChange={(e) => setLicenseIssuer(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Online Registry / Verification URL
          </label>
          <input
            type="text"
            required
            placeholder="https://search.dca.ca.gov/license/..."
            value={credentialsRef}
            onChange={(e) => setCredentialsRef(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Professional Bio & Experience
          </label>
          <textarea
            rows={3}
            placeholder="Brief overview of clinical focus, therapeutic modalities, and years in practice..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          {submitting ? "Submitting Application..." : "Submit for Verification"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
