"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle2, AlertTriangle, Sparkles, Volume2, ShieldCheck, X, Settings } from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  sendDesktopNotification,
  playNotificationChime,
} from "@/lib/notifications";
import { toast } from "react-hot-toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "alert" | "reminder" | "tip";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Predictive Mood Forecast Ready",
    message: "PyTorch LSTM model predicts tomorrow's mood score is 7.6/10 (Low Stress Risk).",
    time: "10 mins ago",
    type: "tip",
    read: false,
  },
  {
    id: "notif-2",
    title: "Daily Journal Streak Active",
    message: "You've logged journals 5 days in a row! Log today to keep your streak alive.",
    time: "1 hour ago",
    type: "reminder",
    read: false,
  },
  {
    id: "notif-3",
    title: "Smartwatch Biometric Equilibrium",
    message: "PPG heart rate is 72 BPM and HRV is 45 ms. Autonomic equilibrium restored.",
    time: "3 hours ago",
    type: "alert",
    read: true,
  },
];

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Preference Toggles
  const [stressAlerts, setStressAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [aiTips, setAiTips] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleEnablePush = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === "granted") {
      toast.success("Desktop Push Notifications Enabled!");
      sendDesktopNotification(
        "MindCare AI Push Enabled",
        "You will now receive desktop notifications for stress alerts and wellness reminders."
      );
      playNotificationChime();
    } else {
      toast.error("Notification permission denied in browser settings.");
    }
  };

  const handleSendTestNotification = () => {
    playNotificationChime();
    sendDesktopNotification(
      "MindCare AI Test Alert",
      "This is a test notification from your MindCare AI Clinical Assistant."
    );

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: "Test Notification Fired",
      message: "Desktop push and Web Audio chime test executed successfully.",
      time: "Just now",
      type: "tip",
      read: false,
    };
    setNotifications([newNotif, ...notifications]);
    toast.success("Test notification & audio chime fired!");
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Navbar Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-violet-500 rounded-full animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-violet-500 rounded-full" />
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-4 text-xs animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-sm">Notifications & Reminders</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Push Enable Banner */}
          {permission !== "granted" ? (
            <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-2">
              <div className="flex items-center gap-2 text-violet-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Enable Desktop Push Notifications</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Receive instant desktop alerts for stress spikes, predictive AI forecasts, and daily journaling reminders.
              </p>
              <button
                onClick={handleEnablePush}
                className="btn-primary w-full py-2 text-xs font-semibold"
              >
                Grant Push Notification Permission
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Desktop Push Active</span>
              </span>
              <button
                onClick={handleSendTestNotification}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Test Alert</span>
              </button>
            </div>
          )}

          {/* Preferences Toggles */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Notification Preferences
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-slate-300">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer">
                <span>Stress & Panic Alerts</span>
                <input
                  type="checkbox"
                  checked={stressAlerts}
                  onChange={(e) => setStressAlerts(e.target.checked)}
                  className="rounded accent-violet-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer">
                <span>Daily Journaling Reminders</span>
                <input
                  type="checkbox"
                  checked={dailyReminders}
                  onChange={(e) => setDailyReminders(e.target.checked)}
                  className="rounded accent-violet-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer">
                <span>AI Wellness & Coping Tips</span>
                <input
                  type="checkbox"
                  checked={aiTips}
                  onChange={(e) => setAiTips(e.target.checked)}
                  className="rounded accent-violet-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Live Notification Feed */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Recent Feed
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border space-y-1 transition-all ${
                    !n.read
                      ? "bg-slate-900 border-violet-500/30"
                      : "bg-slate-900/50 border-slate-800/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white text-xs flex items-center gap-1.5">
                      {n.type === "alert" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {n.type === "tip" && <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                      {n.type === "reminder" && <Bell className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{n.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
