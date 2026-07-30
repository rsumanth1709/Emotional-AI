"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles, TrendingUp, AlertTriangle, ShieldCheck, RefreshCw,
  Activity, Calendar, Cpu, Zap, Lightbulb, ChevronRight, HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { predictiveAPI } from "@/lib/axios";
import type { PredictiveForecastResponse } from "@/types";
import { toast } from "react-hot-toast";

export default function PredictiveForecastCard() {
  const [data, setData] = useState<PredictiveForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await predictiveAPI.getForecast();
      setData(res.data);
    } catch {
      toast.error("Failed to load predictive forecast.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await predictiveAPI.retrainModel();
      toast.success("PyTorch MoodLSTM model retrained successfully!");
      fetchForecast();
    } catch {
      toast.error("Failed to retrain predictive model.");
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center space-y-4 text-slate-400 min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm font-medium">Running PyTorch MoodLSTM sequence forecasting...</p>
      </div>
    );
  }

  if (!data) return null;

  const { tomorrow, weekly_forecast, insights, model_metadata } = data;

  const getRiskColor = (level: string) => {
    if (level.includes("High")) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (level.includes("Moderate")) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tomorrow Forecast Banner Card */}
      <div className="glass p-6 border border-violet-500/30 relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Tomorrow's Mood Forecast</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {model_metadata.model_type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI sequence prediction based on historical multi-day emotional patterns
              </p>
            </div>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-all"
            title="Retrain PyTorch LSTM Model"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? "animate-spin" : ""}`} />
            <span>{retraining ? "Retraining LSTM..." : "Retrain PyTorch Model"}</span>
          </button>
        </div>

        {/* Prediction Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Predicted Mood</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-violet-400">{tomorrow.predicted_mood}</span>
              <span className="text-xs text-slate-500">/ 10</span>
            </div>
            <span className="text-[11px] text-slate-400 block font-medium pt-1">
              Emotion: <strong className="text-white capitalize">{tomorrow.predicted_emotion}</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Stress Probability</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-orange-400">{tomorrow.stress_probability}%</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold border ${getRiskColor(tomorrow.stress_risk_level)}`}>
              {tomorrow.stress_risk_level}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">95% Confidence Interval</span>
            <div className="text-xl font-bold text-cyan-400 pt-1">
              [{tomorrow.confidence_min} – {tomorrow.confidence_max}]
            </div>
            <span className="text-[11px] text-slate-400 block">
              ± {model_metadata.rmse_mood} score margin
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Trajectory Trend</span>
            <div className="text-sm font-bold text-white pt-1">
              {tomorrow.trend_direction}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Sequences Analyzed: {model_metadata.sequence_length} days
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Trajectory Chart */}
      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <span>7-Day Mood & Stress Trajectory Forecast</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Shaded band displays 95% Confidence Interval bounds (lower/upper limits)
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weekly_forecast}>
              <defs>
                <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day_name" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} domain={[0, 10]} label={{ value: 'Mood Score', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '10px' } }} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={11} domain={[0, 100]} unit="%" label={{ value: 'Stress %', angle: 90, position: 'insideRight', style: { fill: '#ef4444', fontSize: '10px' } }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val: any, name: string) => {
                  if (name === "Predicted Mood") return [`${val} / 10`, name];
                  if (name === "Stress Probability") return [`${val}%`, name];
                  if (name === "95% CI Upper") return [`${val} (Upper Bound)`, name];
                  if (name === "95% CI Lower") return [`${val} (Lower Bound)`, name];
                  return [val, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />

              {/* Shaded 95% Confidence Interval Area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="confidence_max"
                stroke="none"
                fill="url(#ciGradient)"
                name="95% CI Upper"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="confidence_min"
                stroke="none"
                fill="none"
                name="95% CI Lower"
              />

              {/* Stress Probability Bars */}
              <Bar
                yAxisId="right"
                dataKey="stress_probability"
                fill="#ef4444"
                opacity={0.35}
                radius={[4, 4, 0, 0]}
                name="Stress Probability"
              />

              {/* Predicted Mood Score Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="predicted_mood"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#8b5cf6" }}
                activeDot={{ r: 7 }}
                name="Predicted Mood"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Preventive AI Recommendations */}
      <div className="glass p-6 space-y-4">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>Preventive AI Recommendations & Risk Interceptors</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-1.5 transition-all ${
                item.type === "warning"
                  ? "bg-red-950/20 border-red-500/30 text-red-200"
                  : item.type === "tip"
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                  : "bg-violet-950/20 border-violet-500/30 text-violet-200"
              }`}
            >
              <h5 className="font-bold text-sm flex items-center gap-2">
                {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                {item.type === "tip" && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                {item.type === "insight" && <Zap className="w-4 h-4 text-violet-400 shrink-0" />}
                <span>{item.title}</span>
              </h5>
              <p className="text-xs leading-relaxed opacity-90">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
