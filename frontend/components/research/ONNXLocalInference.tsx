"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Cpu, ShieldCheck, Zap, RefreshCw, WifiOff, ExternalLink, Lock, Brain } from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type { ONNXMetaResponse } from "@/types";
import { runInference, EMOTION_META, type InferenceResult } from "@/lib/onDeviceEngine";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function ONNXLocalInference() {
  const [meta, setMeta] = useState<ONNXMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("I am feeling overwhelmed with deadlines today but trying my best to stay calm.");
  const [inferring, setInferring] = useState(false);
  const [localResult, setLocalResult] = useState<InferenceResult | null>(null);

  const fetchONNXInfo = async () => {
    setLoading(true);
    try {
      const res = await researchAPI.getONNXInfo();
      setMeta(res.data);
    } catch {
      // Use fallback metadata if backend unavailable
      setMeta({
        model_file: "mood_emotion_model.onnx",
        file_size_kb: 5.2,
        input_tensor: "input_features [1, 19]",
        output_tensor: "emotion_logits [1, 10]",
        opset_version: 14,
        supported_runtimes: ["MindCare JS Engine", "ONNX Runtime Web (WASM)", "TensorFlow Lite"],
        privacy: "100% On-Device Client Inference (No Cloud Data Transfer)",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchONNXInfo(); }, []);

  const handleRunLocalInference = useCallback(() => {
    if (!inputText.trim()) return;
    setInferring(true);
    requestAnimationFrame(() => {
      try {
        const result = runInference(inputText);
        setLocalResult(result);
        toast.success(`⚡ ${result.inferenceTimeMs}ms · ${result.topEmotion} · 0 network requests`);
      } catch {
        toast.error("Inference failed");
      } finally {
        setInferring(false);
      }
    });
  }, [inputText]);

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm">Initialising On-Device AI Engine…</p>
      </div>
    );
  }

  if (!meta) return null;

  const topEmoMeta = localResult ? EMOTION_META[localResult.topEmotion] : null;
  const sortedEmotions = localResult
    ? Object.entries(localResult.allScores).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <div className="glass p-6 space-y-6 border border-emerald-500/20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">On-Device AI (ONNX / TFLite)</h3>
            <p className="text-xs text-slate-400">Zero-latency privacy-preserving in-browser inference</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Opset v{meta.opset_version}
          </span>
          <Link
            href="/on-device-ai"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold hover:bg-violet-600/30 transition-all"
          >
            <ExternalLink className="w-3 h-3" /> Full Dashboard
          </Link>
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Model Artifact", value: meta.model_file, color: "text-white" },
          { label: "File Size",      value: `${meta.file_size_kb} KB`,   color: "text-cyan-400" },
          { label: "Input Tensor",   value: meta.input_tensor,            color: "text-violet-300 font-mono text-[10px]" },
          { label: "Output Tensor",  value: meta.output_tensor,           color: "text-emerald-300 font-mono text-[10px]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block">{label}</span>
            <span className={`text-xs font-bold ${color} block truncate`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Privacy badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/20 border border-emerald-500/15 text-xs">
        <WifiOff className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-slate-400">
          Open <strong className="text-white">DevTools → Network</strong> then run inference →
          <strong className="text-emerald-300"> 0 network requests</strong> recorded.
        </span>
      </div>

      {/* Test Bench */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-violet-400" /> In-Browser Inference Test Bench
        </h4>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
        />
        <button
          onClick={handleRunLocalInference}
          disabled={inferring}
          className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
        >
          <Zap className={`w-3.5 h-3.5 ${inferring ? "animate-spin" : ""}`} />
          {inferring ? "Running On-Device Inference…" : "Run 100% On-Device Inference"}
        </button>

        {localResult && (
          <div className="space-y-3 animate-fade-in">
            {/* Top result */}
            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-4">
              <div className="text-3xl">{topEmoMeta?.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-white capitalize">{localResult.topEmotion}</div>
                <div className="flex gap-3 text-[10px] text-slate-400 mt-0.5">
                  <span className="text-emerald-300 font-bold">{localResult.topConfidence}% confidence</span>
                  <span>·</span>
                  <span className="text-cyan-300 font-bold">⚡ {localResult.inferenceTimeMs}ms</span>
                  <span>·</span>
                  <span className="text-violet-300">{localResult.sentiment}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 0 API calls
                </div>
              </div>
            </div>

            {/* Mini bar chart for top 5 */}
            <div className="space-y-1.5">
              {sortedEmotions.slice(0, 5).map(([emo, score]) => {
                const meta = EMOTION_META[emo as keyof typeof EMOTION_META];
                return (
                  <div key={emo} className="flex items-center gap-2 text-[10px]">
                    <span>{meta?.emoji}</span>
                    <div className="w-16 text-slate-400 capitalize truncate">{emo}</div>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, backgroundColor: meta?.color }}
                      />
                    </div>
                    <span className="font-bold text-slate-300 w-10 text-right">{score}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-center">{localResult.privacyGuarantee}</p>
          </div>
        )}
      </div>

      {/* Runtimes */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supported Runtimes
        </h4>
        <div className="flex flex-wrap gap-2">
          {meta.supported_runtimes.map(r => (
            <span key={r} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-900 border border-emerald-500/20 text-emerald-300">
              ✅ {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
