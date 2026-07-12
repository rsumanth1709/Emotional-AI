"use client";

import { motion } from "framer-motion";
import type { CrisisResource } from "@/types";
import { AlertOctagon, Phone, ShieldAlert, X } from "lucide-react";

export default function CrisisModal({ 
  isOpen, 
  resources, 
  onClose 
}: { 
  isOpen: boolean; 
  resources: CrisisResource[]; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

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
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">We Care About You</h2>
            <p className="text-slate-400 text-sm mt-1">
              It looks like you might be going through a critical moment. You don&apos;t have to carry this alone. Please reach out to one of the resources below immediately.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {resources.map((res, i) => (
            <div 
              key={i} 
              className="p-4 bg-white/5 border border-white/10 hover:border-violet-500/30 rounded-2xl flex items-center justify-between gap-4 transition-all"
            >
              <div>
                <h3 className="font-bold text-sm text-white">{res.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>
              </div>
              <a 
                href={`tel:${res.number}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call / Text</span>
              </a>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-red-500" />
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
