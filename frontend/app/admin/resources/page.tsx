"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/auth/AdminGuard";
import { adminRBACAPI } from "@/lib/axios";
import { BookOpen, Plus, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Mindfulness");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const loadResources = async () => {
    try {
      const res = await adminRBACAPI.getResources();
      setResources(res.data);
    } catch {
      toast.error("Failed to load wellness resources.");
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminRBACAPI.createResource({ title, category, url, description });
      toast.success("Wellness resource added.");
      setShowModal(false);
      setTitle("");
      setUrl("");
      setDescription("");
      loadResources();
    } catch {
      toast.error("Failed to create resource.");
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-500" />
              Curated Wellness Resources
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage evidence-based clinical articles, grounding exercises, and somatic guides provided to users.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
          >
            <Plus className="h-4 w-4" /> Add Resource
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                  {r.category}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-500 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <h3 className="font-bold text-base">{r.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold">Add Curated Wellness Resource</h2>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Resource URL</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
                  >
                    Save Resource
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
