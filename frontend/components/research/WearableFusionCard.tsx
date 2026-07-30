"use client";

import React, { useEffect, useState } from "react";
import { Activity, Heart, Moon, Zap, ShieldAlert, CheckCircle2, RefreshCw, Bluetooth, Radio } from "lucide-react";
import { researchAPI } from "@/lib/axios";
import type { WearableFusionData } from "@/types";
import { toast } from "react-hot-toast";

export default function WearableFusionCard() {
  const [bpm, setBpm] = useState(88);
  const [hrv, setHrv] = useState(32);
  const [sleep, setSleep] = useState(6.2);
  const [rem, setRem] = useState(18);
  const [textStress, setTextStress] = useState(6.5);

  const [connectedDevice, setConnectedDevice] = useState<string | null>("Apple Watch / Galaxy Watch (Simulated BLE)");
  const [loading, setLoading] = useState(false);
  const [fusionData, setFusionData] = useState<WearableFusionData | null>(null);

  const handleConnectBluetooth = async () => {
    toast.loading("Scanning for Bluetooth Smartwatch Heart Rate Service (GATT 0x180D)...", { duration: 1500 });
    setTimeout(() => {
      setConnectedDevice("Smartwatch BLE Pulse Oximeter (GATT Active)");
      toast.success("Smartwatch Bluetooth PPG Heart Rate Sensor Paired!");
    }, 1600);
  };

  const handleComputeFusion = async () => {
    setLoading(true);
    try {
      // Log telemetry first
      await researchAPI.logWearable({
        heart_rate_bpm: bpm,
        hrv_ms: hrv,
        sleep_hours: sleep,
        rem_sleep_percentage: rem,
        step_count: 6500,
      });

      const res = await researchAPI.getWearableFusion(textStress);
      setFusionData(res.data);
      toast.success("Bio-Emotional Stress Fusion computed!");
    } catch {
      toast.error("Failed to compute wearable fusion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleComputeFusion();
  }, []);

  return (
    <div className="glass p-6 space-y-6 border border-violet-500/20 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Smartwatch Wearable Biometric Fusion</h3>
            <p className="text-xs text-slate-400">Multimodal Bio-Emotional Stress Index (PPG Heart Rate + HRV + Sleep)</p>
          </div>
        </div>

        <button
          onClick={handleConnectBluetooth}
          className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2"
        >
          <Bluetooth className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{connectedDevice ? "BLE Device Connected" : "Pair Smartwatch Bluetooth"}</span>
        </button>
      </div>

      {/* Device Status & Live PPG Waveform */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
          <span>Active Telemetry Source: <strong className="text-white">{connectedDevice}</strong></span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
            <span>PPG Pulse: <strong className="text-white font-extrabold">{bpm} BPM</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>HRV: <strong className="text-white font-extrabold">{hrv} ms</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Sleep: <strong className="text-white font-extrabold">{sleep} hrs</strong></span>
          </div>
        </div>
      </div>

      {/* Input Biometric Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="space-y-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            <span>Heart Rate ({bpm} BPM)</span>
          </label>
          <input
            type="range"
            min={50}
            max={130}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>HRV ({hrv} ms)</span>
          </label>
          <input
            type="range"
            min={15}
            max={100}
            value={hrv}
            onChange={(e) => setHrv(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sleep ({sleep}h)</span>
          </label>
          <input
            type="range"
            min={3}
            max={11}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Text Stress ({textStress}/10)</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={textStress}
            onChange={(e) => setTextStress(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleComputeFusion}
            disabled={loading}
            className="btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Fusion Results Display */}
      {fusionData && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Physiological Stress</span>
              <span className="text-2xl font-extrabold text-orange-400">{fusionData.physiological_stress_score} / 10</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 block">Text Emotion Stress</span>
              <span className="text-2xl font-extrabold text-violet-400">{fusionData.text_emotion_stress_score} / 10</span>
            </div>

            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-1">
              <span className="text-xs text-violet-300 font-bold block">Fused Bio-Emotional Index</span>
              <span className="text-3xl font-black text-white">{fusionData.fused_bio_emotional_stress_score} / 10</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Autonomic Nervous System State:</span>
              <span className="font-bold text-white">{fusionData.autonomic_nervous_system_state}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Physiological Recovery Status:</span>
              <span className="font-bold text-emerald-400">{fusionData.recovery_status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
