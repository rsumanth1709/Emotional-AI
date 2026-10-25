"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { triggersAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Zap, Check, X, Edit3, Trash2, Plus, RefreshCw, Info, Filter,
  BarChart2, Grid, AlertCircle, Sparkles, Layers, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

interface TriggerItem {
  id: string;
  category: string;
  description: string;
  emotion: string;
  intensity: number;
  confidence: number;
  source: string;
  status: string;
  evidence?: any;
  reason?: string;
  created_at?: string;
}

import MindCareLoading from "@/components/ui/MindCareLoading";

export default function EmotionalTriggersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [triggers, setTriggers] = useState<TriggerItem[]>([]);
  const [frequency, setFrequency] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // New Trigger State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newDesc, setNewDesc] = useState<string>("");
  const [newCat, setNewCat] = useState<string>("academics");
  const [newEmo, setNewEmo] = useState<string>("stress");

  const fetchTriggerData = async () => {
    setLoading(true);
    try {
      const res = await triggersAPI.getAnalytics();
      setTriggers(res.data.triggers || []);
      setFrequency(res.data.frequency || []);
      setMatrix(res.data.emotion_relationships || []);
      setPatterns(res.data.patterns || []);
    } catch {
      toast.error("Failed to load trigger analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchTriggerData();
  }, [user, authLoading, router]);

  const handleConfirm = async (id: string) => {
    try {
      await triggersAPI.confirmTrigger(id);
      toast.success("Trigger confirmed!");
      fetchTriggerData();
    } catch {
      toast.error("Failed to confirm trigger.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await triggersAPI.rejectTrigger(id);
      toast.success("Trigger rejected.");
      fetchTriggerData();
    } catch {
      toast.error("Failed to reject trigger.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await triggersAPI.deleteTrigger(id);
      toast.success("Trigger deleted.");
      fetchTriggerData();
    } catch {
      toast.error("Failed to delete trigger.");
    }
  };

  const handleCreateTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    try {
      await triggersAPI.createTrigger({ description: newDesc, category: newCat, emotion: newEmo });
      toast.success("New trigger added!");
      setNewDesc("");
      setShowAddModal(false);
      fetchTriggerData();
    } catch {
      toast.error("Failed to create trigger.");
    }
  };

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  const filteredTriggers = triggers.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Emotional Trigger Detection Module" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Non-Clinical Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Emotional Trigger Detection
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Uncertainty-Aware
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Identify possible emotional triggers from conversation topics, track recurring patterns, and review, confirm, edit, or delete AI-inferred hypotheses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" /> Add Custom Trigger
                </button>
              </div>
            </div>

            {/* Non-Clinical Disclaimer Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Mandatory Transparency Guarantee:</strong> Triggers identified from conversation are AI-inferred possibilities, <strong>NOT</strong> established facts about your internal life or clinical diagnoses. Review and confirm or reject any inference below.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-300">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Categories</option>
                  <option value="academics">Academics</option>
                  <option value="work">Work</option>
                  <option value="relationships">Relationships</option>
                  <option value="family">Family</option>
                  <option value="financial_concerns">Financial Concerns</option>
                  <option value="social_situations">Social Situations</option>
                  <option value="sleep">Sleep</option>
                  <option value="health_concerns">Health Concerns</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="unconfirmed">Unconfirmed (AI-Inferred)</option>
                  <option value="confirmed_by_user">Confirmed by You</option>
                  <option value="user_created">User Created</option>
                  <option value="user_edited">User Edited</option>
                </select>
              </div>
            </div>

            <span className="text-slate-400 font-mono">
              Total Active Triggers: <strong>{filteredTriggers.length}</strong>
            </span>
          </div>

          {/* Active Triggers Grid Cards */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Emotional Triggers List
            </h3>

            {filteredTriggers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2 text-slate-400 text-xs">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                <p>No emotional triggers detected matching your filters.</p>
                <p className="text-slate-500">Triggers can be AI-inferred from chat or manually added by you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTriggers.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.category.replace("_", " ")}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          t.status === "unconfirmed" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm capitalize">&ldquo;{t.description}&rdquo;</h4>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Associated Emotion:</span>
                          <span className="font-bold text-rose-400 capitalize">{t.emotion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confidence Score:</span>
                          <span className="font-bold text-cyan-400">{(t.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {t.evidence?.text && (
                          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                            Evidence: &ldquo;{t.evidence.text}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      {t.status === "unconfirmed" && (
                        <>
                          <button
                            onClick={() => handleConfirm(t.id)}
                            className="flex-1 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Not Relevant
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl"
                        title="Delete trigger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trigger Frequency & Trigger-Emotion Matrix Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Category Frequency Distribution
              </h3>

              <div className="space-y-3">
                {frequency.map((f: any) => (
                  <div key={f.category} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span className="capitalize">{f.category.replace("_", " ")}</span>
                      <span className="text-amber-400">{f.frequency} mentions</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, f.frequency * 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Patterns Inspector */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Recurring Trigger-Emotion Patterns
              </h3>

              <div className="space-y-3 text-xs">
                {patterns.map((p: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white capitalize">&ldquo;{p.trigger}&rdquo;</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {p.occurrences} occurrences
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{p.notice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Custom Trigger Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">Add Custom Emotional Trigger</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTrigger} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Trigger Description</label>
                    <input
                      type="text"
                      required
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="e.g. Placement interviews"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Category</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="academics">Academics</option>
                      <option value="work">Work</option>
                      <option value="relationships">Relationships</option>
                      <option value="family">Family</option>
                      <option value="financial_concerns">Financial Concerns</option>
                      <option value="social_situations">Social Situations</option>
                      <option value="sleep">Sleep</option>
                      <option value="health_concerns">Health Concerns</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Associated Emotion</label>
                    <select
                      value={newEmo}
                      onChange={(e) => setNewEmo(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="stress">Stress</option>
                      <option value="anxiety">Anxiety</option>
                      <option value="sadness">Sadness</option>
                      <option value="anger">Anger</option>
                      <option value="frustration">Frustration</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" /> Save Custom Trigger
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
