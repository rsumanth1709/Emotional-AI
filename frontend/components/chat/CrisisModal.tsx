"use client";

import { motion } from "framer-motion";
import type { CrisisResource } from "@/types";
import { AlertOctagon, Phone, ShieldAlert, X, AlertTriangle } from "lucide-react";

export default function CrisisModal({ 
  isOpen, 
  severity,
  type,
  resources, 
  onClose 
}: { 
  isOpen: boolean; 
  severity: string | null;
  type: string | null;
  resources: CrisisResource[]; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

  const formattedType = type 
    ? type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") 
    : "Distress";

  const getSeverityBadge = () => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-rose-500/25 border-rose-500/40 text-rose-300";
      case "high":
        return "bg-orange-500/25 border-orange-500/40 text-orange-300";
      case "medium":
        return "bg-amber-500/25 border-amber-500/40 text-amber-300";
      case "low":
        return "bg-blue-500/25 border-blue-500/40 text-blue-300";
      default:
        return "bg-slate-800 border-white/10 text-slate-300";
    }
  };

  const isHighOrCritical = severity?.toLowerCase() === "high" || severity?.toLowerCase() === "critical";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <motion.div 
        className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl relative space-y-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">We Care About You</h2>
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getSeverityBadge()}`}>
                {severity || "distress"}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              MindCare AI detected triggers relating to <strong className="text-red-400 font-semibold">{formattedType}</strong>. 
              Please reach out to one of the resources below immediately. Real, human support is available to guide you.
            </p>
          </div>
        </div>

        {/* Emergency Simulated Contacts Notification Banner */}
        {isHighOrCritical && (
          <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-200">Emergency Protocol Triggered</p>
              <p className="text-[10px] text-red-300/80 mt-0.5">
                Simulated alert dispatched to emergency contacts informing them of matched {severity?.toUpperCase()} severity risk.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {resources.map((res, i) => (
            <div 
              key={i} 
              className="p-4 bg-white/5 border border-white/10 hover:border-violet-500/30 rounded-2xl flex items-center justify-between gap-4 transition-all"
            >
              <div>
                <h3 className="font-bold text-sm text-white">{res.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>
                <p className="text-[10px] text-violet-400 font-bold mt-1">{res.number}</p>
              </div>
              {res.number && !res.number.startsWith("http") && (
                <a 
                  href={`tel:${res.number.split(" ")[0]}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20 flex-shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call / Text</span>
                </a>
              )}
              {res.number && res.number.startsWith("http") && (
                <a 
                  href={res.number}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20 flex-shrink-0"
                >
                  <span>Visit Website</span>
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>If you are in immediate danger of self-harm, please dial 911 / 999 or go to the nearest emergency room.</span>
          </div>
          <button 
            onClick={onClose}
            className="btn-secondary w-full py-2.5 text-sm"
          >
            I am safe now, continue chatting
          </button>
        </div>
      </motion.div>
    </div>
  );
}
