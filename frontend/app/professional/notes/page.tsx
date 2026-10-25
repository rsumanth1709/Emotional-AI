"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfessionalGuard from "@/components/auth/ProfessionalGuard";
import { professionalAPI } from "@/lib/axios";
import type { ProfessionalAssignment, ProfessionalNote } from "@/types";
import { FileText, Plus, Clock, User, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

function ProfessionalNotesContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";

  const [assignments, setAssignments] = useState<ProfessionalAssignment[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [notes, setNotes] = useState<ProfessionalNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("Consultation Note");
  const [notesText, setNotesText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const assignRes = await professionalAPI.getAssignments();
        setAssignments(assignRes.data);
        if (!selectedClientId && assignRes.data.length > 0) {
          setSelectedClientId(assignRes.data[0].user_id);
        }
      } catch {
        toast.error("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadNotes() {
      if (!selectedClientId) return;
      try {
        const res = await professionalAPI.getNotes(selectedClientId);
        setNotes(res.data);
      } catch {
        toast.error("Failed to load clinical notes.");
      }
    }
    loadNotes();
  }, [selectedClientId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !notesText.trim()) return;
    try {
      setSubmitting(true);
      const res = await professionalAPI.createNote(selectedClientId, {
        title,
        notes_text: notesText,
      });
      toast.success("Consultation note saved securely.");
      setNotesText("");
      setNotes([res.data, ...notes]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfessionalGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            Clinical Consultation Notes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and review clinical impressions and session notes for consented clients.
          </p>
        </div>

        {/* Client Selector */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <User className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-semibold">Active Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
          >
            {assignments.map((a) => (
              <option key={a.user_id} value={a.user_id}>
                {a.client_name || "Client"} ({a.client_email})
              </option>
            ))}
          </select>
        </div>

        {/* Record New Note Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            Record Consultation Note
          </h2>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Note Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Clinical Observations & Strategy
              </label>
              <textarea
                required
                rows={4}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Record clinical impressions, behavioral interventions, or progress notes..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !selectedClientId}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Session Note"}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Notes List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Past Session Notes ({notes.length})</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No notes recorded yet for this client.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">{n.title}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {n.notes_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfessionalGuard>
  );
}

export default function ProfessionalNotesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading clinical notes...</div>}>
      <ProfessionalNotesContent />
    </Suspense>
  );
}
