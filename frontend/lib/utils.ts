// MindCare AI — Utility Functions
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function getEmotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    Happy: "😊", Excited: "🤩", Hopeful: "🌈",
    Sad: "😢", Lonely: "💙", Angry: "😠",
    Fear: "😨", Anxiety: "😟", Stress: "😔", Neutral: "😐",
  };
  return map[emotion] ?? "💭";
}

export function getEmotionColor(emotion: string): string {
  const map: Record<string, string> = {
    Happy:   "text-yellow-400",
    Excited: "text-orange-400",
    Hopeful: "text-emerald-400",
    Sad:     "text-blue-400",
    Lonely:  "text-sky-400",
    Angry:   "text-red-400",
    Fear:    "text-amber-400",
    Anxiety: "text-purple-400",
    Stress:  "text-pink-400",
    Neutral: "text-slate-400",
  };
  return map[emotion] ?? "text-slate-400";
}

export function getEmotionBgColor(emotion: string): string {
  const map: Record<string, string> = {
    Happy:   "bg-yellow-500/20 border-yellow-500/30",
    Excited: "bg-orange-500/20 border-orange-500/30",
    Hopeful: "bg-emerald-500/20 border-emerald-500/30",
    Sad:     "bg-blue-500/20 border-blue-500/30",
    Lonely:  "bg-sky-500/20 border-sky-500/30",
    Angry:   "bg-red-500/20 border-red-500/30",
    Fear:    "bg-amber-500/20 border-amber-500/30",
    Anxiety: "bg-purple-500/20 border-purple-500/30",
    Stress:  "bg-pink-500/20 border-pink-500/30",
    Neutral: "bg-slate-500/20 border-slate-500/30",
  };
  return map[emotion] ?? "bg-slate-500/20 border-slate-500/30";
}

export function getEmotionHexColor(emotion: string): string {
  const map: Record<string, string> = {
    Happy: "#FACC15", Excited: "#F97316", Hopeful: "#10B981",
    Sad: "#60A5FA", Lonely: "#38BDF8", Angry: "#F87171",
    Fear: "#FBBF24", Anxiety: "#A78BFA", Stress: "#F472B6", Neutral: "#94A3B8",
  };
  return map[emotion] ?? "#94A3B8";
}

export function getStressLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 6) return "Moderate";
  if (score <= 8) return "High";
  return "Critical";
}

export function getStressColor(score: number): string {
  if (score <= 3) return "text-emerald-400";
  if (score <= 6) return "text-yellow-400";
  if (score <= 8) return "text-orange-400";
  return "text-red-400";
}

export function getWellnessLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
