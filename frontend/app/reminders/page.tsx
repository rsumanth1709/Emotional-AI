"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { reminderAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { toast } from "react-hot-toast";
import {
  Bell, Clock, CheckCircle2, AlertCircle, Plus, Trash2, Edit3,
  Volume2, VolumeX, Sparkles, RefreshCw, ShieldCheck, Pill,
  Brain, Moon, Droplets, Calendar, History, Check, X, Play,
  Zap, Award, BellOff, ArrowUpRight, BarChart2
} from "lucide-react";

const REMINDER_TYPES = [
  { key: "medication", label: "Medication & Vitamins (Non-Prescriptive)", icon: Pill, color: "from-rose-500 to-pink-500", textCol: "text-rose-400", bgCol: "bg-rose-500/10 border-rose-500/20" },
  { key: "meditation", label: "Mindful Meditation", icon: Brain, color: "from-purple-500 to-violet-500", textCol: "text-purple-400", bgCol: "bg-purple-500/10 border-purple-500/20" },
  { key: "hydration", label: "Hydration Check-in", icon: Droplets, color: "from-cyan-500 to-blue-500", textCol: "text-cyan-400", bgCol: "bg-cyan-500/10 border-cyan-500/20" },
  { key: "sleep", label: "Sleep & Screen Wind-Down", icon: Moon, color: "from-indigo-500 to-blue-600", textCol: "text-indigo-400", bgCol: "bg-indigo-500/10 border-indigo-500/20" },
  { key: "custom", label: "Custom Habit", icon: Sparkles, color: "from-amber-500 to-orange-500", textCol: "text-amber-400", bgCol: "bg-amber-500/10 border-amber-500/20" },
];

const PRESETS = [
  {
    title: "Daily Vitamin & Wellness Supplement",
    reminder_type: "medication",
    scheduled_time: "08:30",
    frequency: "daily",
    note: "Take non-prescriptive daily wellness vitamins/minerals with a full glass of water.",
    icon: Pill,
  },
  {
    title: "Hydration Drink Refresh",
    reminder_type: "hydration",
    scheduled_time: "11:00",
    frequency: "daily",
    note: "Drink 250ml of fresh water to keep your body and brain hydrated.",
    icon: Droplets,
  },
  {
    title: "Midday Mindful Meditation",
    reminder_type: "meditation",
    scheduled_time: "14:30",
    frequency: "daily",
    note: "Take 10 minutes to reset focus and practice 4-7-8 deep breathing.",
    icon: Brain,
  },
  {
    title: "Evening Sleep & Screen Wind-Down",
    reminder_type: "sleep",
    scheduled_time: "22:00",
    frequency: "daily",
    note: "Dim room lighting, turn off screens, and relax for restful sleep.",
    icon: Moon,
  },
];

export default function RemindersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reminders, setReminders] = useState<any[]>([]);
  const [history, setHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [reminderType, setReminderType] = useState("hydration");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState("");
  const [note, setNote] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Browser Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Audio chime synthesizer
  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio fallback silent
    }
  }, []);

  const fetchRemindersAndHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [resR, resH] = await Promise.all([
        reminderAPI.getReminders(),
        reminderAPI.getHistory(30),
      ]);
      setReminders(resR.data);
      setHistory(resH.data);
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRemindersAndHistory();
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotifPermission(Notification.permission);
      }
    }
  }, [user, fetchRemindersAndHistory]);

  // Real-time Notification Checker Polling (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await reminderAPI.checkDue();
        const dueList = res.data;
        dueList.forEach((r: any) => {
          if (r.is_due_now) {
            // Trigger Browser Push Notification if allowed
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`⏰ MindCare Reminder: ${r.title}`, {
                body: r.note || `Time for your ${r.reminder_type} check-in!`,
                icon: "/favicon.ico",
              });
            }
            if (r.sound_enabled) {
              playChime();
            }
            toast(`⏰ Time for ${r.title}!`, { icon: "🔔", duration: 6000 });
          }
        });
      } catch {
        // Silent check error
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, playChime]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        toast.success("Browser & System Push Notifications Enabled!", { icon: "🔔" });
      } else {
        toast.error("Notification permission denied");
      }
    } else {
      toast.error("Browser does not support notifications");
    }
  };

  const handleOpenForm = (existing?: any) => {
    if (existing) {
      setEditingId(existing.id);
      setTitle(existing.title);
      setReminderType(existing.reminder_type);
      setScheduledTime(existing.scheduled_time);
      setFrequency(existing.frequency);
      setCustomDays(existing.custom_days || "");
      setNote(existing.note || "");
      setSoundEnabled(existing.sound_enabled ?? true);
    } else {
      setEditingId(null);
      setTitle("");
      setReminderType("hydration");
      setScheduledTime("09:00");
      setFrequency("daily");
      setCustomDays("");
      setNote("");
      setSoundEnabled(true);
    }
    setShowForm(true);
  };

  const handleAddPreset = async (preset: any) => {
    try {
      await reminderAPI.createReminder({
        title: preset.title,
        reminder_type: preset.reminder_type,
        scheduled_time: preset.scheduled_time,
        frequency: preset.frequency,
        note: preset.note,
        sound_enabled: true,
      });
      toast.success(`Added ${preset.title}!`, { icon: "✨" });
      await fetchRemindersAndHistory();
    } catch {
      toast.error("Failed to add preset reminder");
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await reminderAPI.updateReminder(editingId, {
          title,
          reminder_type: reminderType,
          scheduled_time: scheduledTime,
          frequency,
          custom_days: customDays,
          note,
          sound_enabled: soundEnabled,
        });
        toast.success("Reminder updated!");
      } else {
        await reminderAPI.createReminder({
          title,
          reminder_type: reminderType,
          scheduled_time: scheduledTime,
          frequency,
          custom_days: customDays,
          note,
          sound_enabled: soundEnabled,
        });
        toast.success("New reminder scheduled!", { icon: "⏰" });
      }
      setShowForm(false);
      await fetchRemindersAndHistory();
    } catch {
      toast.error("Failed to save reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (r: any) => {
    try {
      await reminderAPI.updateReminder(r.id, { is_active: !r.is_active });
      toast.success(r.is_active ? "Reminder paused" : "Reminder activated!");
      await fetchRemindersAndHistory();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await reminderAPI.deleteReminder(id);
      toast.success("Reminder deleted");
      await fetchRemindersAndHistory();
    } catch {
      toast.error("Failed to delete reminder");
    }
  };

  const handleRecordAction = async (reminderId: string, action: "completed" | "snoozed" | "missed") => {
    try {
      const res = await reminderAPI.recordAction(reminderId, action);
      if (action === "completed") {
        toast.success(`Completed! Auto-updated wellness logs.`, { icon: "✅" });
        playChime();
      } else if (action === "snoozed") {
        toast.success("Snoozed for 15 minutes", { icon: "💤" });
      } else {
        toast.error("Marked as missed");
      }
      await fetchRemindersAndHistory();
    } catch {
      toast.error("Failed to log action");
    }
  };

  const getTypeMeta = (tKey: string) => {
    return REMINDER_TYPES.find((t) => t.key === tKey) || REMINDER_TYPES[4];
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-violet-400 mr-3" />
        Loading Smart Reminder System…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Smart Reminder System" />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-violet-500/20 p-6 rounded-3xl backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Intelligent Habit & Wellness Scheduling
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Smart Reminder System</h2>
              <p className="text-slate-400 text-xs mt-1">
                Schedule customizable reminders for non-prescriptive vitamins, meditation, sleep wind-down, and hydration check-ins with browser & system notification triggers.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {notifPermission !== "granted" ? (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 hover:bg-amber-500/20 transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Push Notifications</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notifications Enabled</span>
                </div>
              )}

              <button
                onClick={() => handleOpenForm()}
                className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Reminder</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons Row */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" /> 1-Click Preset Schedule Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {PRESETS.map((p, idx) => {
                const Icon = p.icon;
                const meta = getTypeMeta(p.reminder_type);
                return (
                  <div
                    key={idx}
                    onClick={() => handleAddPreset(p)}
                    className="glass p-4 border border-white/5 hover:border-violet-500/40 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex items-start gap-3 group"
                  >
                    <div className={`p-2.5 rounded-xl border ${meta.bgCol} ${meta.textCol}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" /> {p.scheduled_time} • {p.frequency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Analytics Summary Grid */}
          {history && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-2xl space-y-1 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completion Rate</span>
                <div className="text-2xl font-extrabold text-emerald-400">{history.completion_rate_pct}%</div>
                <span className="text-[10px] text-slate-500 block">Past {history.period_days} Days</span>
              </div>

              <div className="glass p-4 rounded-2xl space-y-1 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Tasks</span>
                <div className="text-2xl font-extrabold text-cyan-400">{history.completed_count}</div>
                <span className="text-[10px] text-slate-500 block">Out of {history.total_triggered} triggered</span>
              </div>

              <div className="glass p-4 rounded-2xl space-y-1 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Snoozed Count</span>
                <div className="text-2xl font-extrabold text-amber-400">{history.snoozed_count}</div>
                <span className="text-[10px] text-slate-500 block">Deferred habit items</span>
              </div>

              <div className="glass p-4 rounded-2xl space-y-1 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Reminders</span>
                <div className="text-2xl font-extrabold text-violet-400">{reminders.filter((r) => r.is_active).length}</div>
                <span className="text-[10px] text-slate-500 block">Scheduled habits</span>
              </div>
            </div>
          )}

          {/* Scheduled Active Reminders List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Scheduled Wellness Reminders ({reminders.length})
              </h3>
              <button
                onClick={fetchRemindersAndHistory}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="glass p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <p className="text-xs">Loading scheduled reminders...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="glass p-8 text-center space-y-3">
                <BellOff className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Reminders Scheduled</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click any preset template above or press "New Reminder" to create your first schedule.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reminders.map((r) => {
                  const meta = getTypeMeta(r.reminder_type);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={r.id}
                      className={`glass p-5 rounded-3xl border transition-all space-y-4 relative ${
                        r.is_active
                          ? "border-slate-800 hover:border-violet-500/40"
                          : "border-slate-900 opacity-60 bg-slate-950/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-2xl border ${meta.bgCol} ${meta.textCol}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${meta.bgCol} ${meta.textCol}`}>
                                {r.reminder_type}
                              </span>
                              <span className="text-[10px] text-slate-500 capitalize">{r.frequency}</span>
                            </div>

                            <h4 className="text-sm font-bold text-white">{r.title}</h4>
                            {r.note && <p className="text-xs text-slate-400 leading-snug">{r.note}</p>}
                          </div>
                        </div>

                        {/* Toggle Active Switch */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(r)}
                            className={`w-11 h-6 rounded-full p-1 transition-colors ${
                              r.is_active ? "bg-violet-600" : "bg-slate-800"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                r.is_active ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Scheduled Time & Actions Bar */}
                      <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white font-mono">{r.scheduled_time}</span>
                          {r.sound_enabled ? (
                            <span title="Sound Chime Enabled">
                              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                            </span>
                          ) : (
                            <span title="Muted">
                              <VolumeX className="w-3.5 h-3.5 text-slate-600" />
                            </span>
                          )}
                        </div>

                        {/* Interactive Execution Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRecordAction(r.id, "completed")}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Complete</span>
                          </button>

                          <button
                            onClick={() => handleRecordAction(r.id, "snoozed")}
                            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-medium transition-all"
                            title="Snooze 15 minutes"
                          >
                            Snooze
                          </button>

                          <button
                            onClick={() => handleOpenForm(r)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                            title="Edit Reminder"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Execution History Timeline */}
          {history && history.logs && history.logs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-emerald-400" /> Reminder Execution History Logs
              </h3>

              <div className="glass p-5 rounded-3xl border border-slate-800 space-y-3">
                {history.logs.map((log: any) => {
                  const meta = getTypeMeta(log.reminder_type);
                  const Icon = meta.icon;
                  const isComp = log.action_taken === "completed";
                  const isSnooze = log.action_taken === "snoozed";
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border ${meta.bgCol} ${meta.textCol}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="font-bold text-white truncate">{log.title}</h5>
                          <span className="text-[10px] text-slate-500 block">
                            Triggered: {new Date(log.triggered_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${
                            isComp
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : isSnooze
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {log.action_taken}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Modal for Creating/Editing Reminder */}
          {showForm && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="glass max-w-lg w-full p-6 md:p-8 rounded-3xl border border-violet-500/30 space-y-6 relative animate-fade-in">
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {editingId ? "Edit Reminder Schedule" : "Create Smart Wellness Reminder"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule non-prescriptive vitamins, meditation, sleep, or hydration reminders.
                  </p>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Reminder Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {REMINDER_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSel = reminderType === t.key;
                        return (
                          <button
                            type="button"
                            key={t.key}
                            onClick={() => setReminderType(t.key)}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              isSel
                                ? "bg-violet-600/30 border-violet-500 text-white font-bold"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${t.textCol}`} />
                            <span className="truncate">{t.label.split(" ")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Reminder Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Daily Vitamin D & Water, Evening Wind Down"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Scheduled Time (HH:MM)</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Repeat Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays (Mon-Fri)</option>
                        <option value="weekends">Weekends (Sat-Sun)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Notes / Wellness Tip (Optional)</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Take non-prescriptive daily supplement with water"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded border-slate-800 text-violet-600 focus:ring-violet-500"
                      />
                      <span>Enable Audio Chime Sound</span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingId ? "Save Changes" : "Create Reminder"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
