"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { preferencesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Sliders, CheckCircle2, AlertTriangle, RefreshCw, Info, Save,
  ShieldCheck, Sparkles, RotateCcw, Trash2, Heart, MessageSquare, Globe, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

const ALL_ACTIVITIES = [
  { id: "breathing", label: "Breathing Exercises" },
  { id: "journaling", label: "Journaling Prompts" },
  { id: "mindfulness", label: "Mindfulness Exercises" },
  { id: "grounding", label: "Sensory Grounding" },
  { id: "meditation", label: "Meditation" },
  { id: "walking", label: "Mindful Walking" },
  { id: "relaxation", label: "Relaxation Techniques" },
  { id: "gratitude", label: "Gratitude Reflections" },
  { id: "sleep_routines", label: "Sleep Routines" },
];

export default function PersonalizationSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [respLength, setRespLength] = useState<string>("medium");
  const [tone, setTone] = useState<string>("warm");
  const [advicePref, setAdvicePref] = useState<string>("balanced");
  const [activities, setActivities] = useState<string[]>(["breathing", "journaling"]);
  const [language, setLanguage] = useState<string>("en");
  const [persona, setPersona] = useState<string>("supportive_friend");
  const [metadata, setMetadata] = useState<any>({});

  // Modals
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await preferencesAPI.getPreferences();
      const p = res.data.preferences;
      setRespLength(p.response_length || "medium");
      setTone(p.tone || "warm");
      setAdvicePref(p.advice_preference || "balanced");
      setActivities(p.wellness_activities || ["breathing", "journaling"]);
      setLanguage(p.language || "en");
      setPersona(p.persona || "supportive_friend");
      setMetadata(res.data.metadata || {});
    } catch {
      toast.error("Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    else if (user) fetchPreferences();
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await preferencesAPI.updatePreferences({
        response_length: respLength,
        tone: tone,
        advice_preference: advicePref,
        wellness_activities: activities,
        language: language,
        persona: persona,
      });
      toast.success("Personalization settings updated!");
      fetchPreferences();
    } catch {
      toast.error("Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = (actId: string) => {
    if (activities.includes(actId)) {
      setActivities(activities.filter((a) => a !== actId));
    } else {
      setActivities([...activities, actId]);
    }
  };

  const handleReset = async () => {
    try {
      const res = await preferencesAPI.resetPreferences();
      toast.success(res.data.message);
      setShowResetModal(false);
      fetchPreferences();
    } catch {
      toast.error("Failed to reset preferences.");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await preferencesAPI.deletePreferences();
      toast.success(res.data.message);
      setShowDeleteModal(false);
      fetchPreferences();
    } catch {
      toast.error("Failed to delete personalization data.");
    }
  };

  if (authLoading || !user || loading) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Personalization Settings" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner with Privacy Guarantee */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Personalization Controls
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      User-Controlled Engine
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Configure how MindCare AI communicates with you. Your communication preferences are transparent, editable, resettable, and deletable at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                <strong>Privacy Guarantee:</strong> MindCare AI <strong>NEVER</strong> makes psychological, medical, or identity inferences from your behavior. Personalization rules control communication style only.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Response Style */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Response Style &amp; Tone
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold">Preferred Response Length</label>
                  <select
                    value={respLength}
                    onChange={(e) => setRespLength(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="very_short">Very Short (1–3 sentences)</option>
                    <option value="short">Short (3–5 sentences)</option>
                    <option value="medium">Medium (Moderate explanation)</option>
                    <option value="detailed">Detailed (Structured explanation)</option>
                    <option value="very_detailed">Very Detailed (Comprehensive context)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold">Preferred Communication Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="warm">Warm</option>
                    <option value="friendly">Friendly</option>
                    <option value="calm">Calm</option>
                    <option value="professional">Professional</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="empathetic">Empathetic</option>
                    <option value="direct">Direct</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Conversation & Advice Preference */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Advice &amp; Conversation Style
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold">How should MindCare offer suggestions?</label>
                  <select
                    value={advicePref}
                    onChange={(e) => setAdvicePref(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="advice_first">Give Advice First (Action-oriented)</option>
                    <option value="listening_first">Listen First (Prioritize acknowledgment)</option>
                    <option value="ask_before_advice">Ask Before Advice (Check preference first)</option>
                    <option value="balanced">Balanced (Support + Suggestions)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold">Preferred Chatbot Persona</label>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="supportive_friend">Supportive Friend (Warm, empathetic)</option>
                    <option value="coach">Coach (Action-oriented, motivating)</option>
                    <option value="mentor">Mentor (Educational, thoughtful)</option>
                    <option value="professional_guide">Professional Guide (Structured, concise)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Favorite Wellness Activities Multi-Select */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Heart className="w-4 h-4 text-blue-400" />
                Favorite Wellness Activities
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {ALL_ACTIVITIES.map((act) => {
                  const checked = activities.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      onClick={() => toggleActivity(act.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        checked ? "bg-blue-500/10 border-blue-500/40 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="accent-blue-500" />
                      <span className="font-semibold">{act.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Language & Save Actions */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary py-3 px-6 font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Personalization Settings
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Transparency Card: Learned Preferences */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              What MindCare Has Stored (Transparency Audit)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold">Response Length</span>
                <p className="text-white font-extrabold capitalize">{respLength.replace("_", " ")}</p>
                <span className="text-[10px] text-blue-400">Source: {metadata.response_length?.source || "explicit_setting"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold">Tone</span>
                <p className="text-white font-extrabold capitalize">{tone}</p>
                <span className="text-[10px] text-blue-400">Source: {metadata.tone?.source || "explicit_setting"}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold">Persona Style</span>
                <p className="text-white font-extrabold capitalize">{persona.replace("_", " ")}</p>
                <span className="text-[10px] text-blue-400">Source: {metadata.persona?.source || "explicit_setting"}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone: Reset & Delete Controls */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone &amp; Personalization Management
            </h3>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-white">Reset or Delete Personalization Data</h4>
                <p className="text-slate-400">
                  Reset restores system default preferences. Delete permanently purges all preference records and history.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="btn-secondary py-2 px-3 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Data
                </button>
              </div>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Reset Personalization Preferences?</h3>
                <p className="text-xs text-slate-300">
                  This will restore default communication preferences. Your conversation history will not be affected.
                </p>
                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary py-2 px-3">
                    Cancel
                  </button>
                  <button type="button" onClick={handleReset} className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl">
                    Reset Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Delete All Personalization Data?</h3>
                <p className="text-xs text-slate-300">
                  This will permanently delete all stored preference records, audit history, and response feedback. Your conversations will not be deleted.
                </p>
                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary py-2 px-3">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDelete} className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">
                    Delete Personalization Data
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
