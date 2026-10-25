"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { analyticsAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  BarChart3, ShieldCheck, Users, Globe, Filter, Download, RefreshCw,
  TrendingUp, AlertTriangle, Activity, PieChart, Layers, CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import toast from "react-hot-toast";
import MindCareLoading from "@/components/ui/MindCareLoading";

interface PopulationAnalyticsData {
  privacy_compliance: {
    anonymization_standard: string;
    pii_stripped: boolean;
    zero_identity_leakage: boolean;
    compliance_frameworks: string[];
  };
  summary_metrics: {
    active_cohort_size: number;
    total_anonymized_data_points: number;
    population_avg_stress: number;
    high_stress_prevalence_pct: number;
    peak_population_emotion: string;
  };
  time_period: string;
  emotion_distribution: { emotion: string; count: number; percentage: number }[];
  population_timeline: { date: string; avg_mood_score: number; avg_stress_score: number; anonymized_participants: number }[];
  demographic_breakdown: { age_group: string; cohort_size: number; avg_mood: number; top_emotion: string }[];
  regional_breakdown: { region: string; active_users: number; avg_stress: number; dominant_trigger: string }[];
  population_triggers: { category: string; frequency: number; percentage: number }[];
  executive_insights: { title: string; summary: string; recommendation: string }[];
}

export default function PopulationAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [timePeriod, setTimePeriod] = useState<string>("30d");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [ageFilter, setAgeFilter] = useState<string>("All");

  const [data, setData] = useState<PopulationAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getPopulationAnalytics({
        time_period: timePeriod,
        region: regionFilter !== "All" ? regionFilter : undefined,
        age_group: ageFilter !== "All" ? ageFilter : undefined,
      });
      setData(res.data);
    } catch {
      toast.error("Failed to load population analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await analyticsAPI.exportReport(timePeriod, "csv");
      await analyticsAPI.exportReport(timePeriod);
      toast.success("Anonymized Population Report downloaded!");
    } catch {
      toast.error("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, timePeriod, regionFilter, ageFilter]);

  if (authLoading || !user) {
    return <MindCareLoading message="Merging Emotional Empathy & AI Intelligence..." />;
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title="Population-Level Analytics (Anonymized)" />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Hero Banner & Filter Toolbar */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-indigo-950/30 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      Population-Level Analytics
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Zero PII • k-Anonymity Verified
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                    Anonymized administrative intelligence aggregating mental wellness trends, demographic cohorts,
                    regional stress density, and population-level emotional triggers.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 self-start md:self-auto whitespace-nowrap"
              >
                {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export Anonymized Report (CSV)
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filters:</span>
              </div>

              {/* Time Period */}
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last 1 Year</option>
              </select>

              {/* Region Filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Regions</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia-Pacific">Asia-Pacific</option>
                <option value="Latin America">Latin America</option>
                <option value="Middle East & Africa">Middle East &amp; Africa</option>
              </select>

              {/* Age Group Filter */}
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Age Groups</option>
                <option value="18-24">Age 18-24</option>
                <option value="25-34">Age 25-34</option>
                <option value="35-44">Age 35-44</option>
                <option value="45-54">Age 45-54</option>
                <option value="55+">Age 55+</option>
              </select>
            </div>
          </div>

          {loading || !data ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              Aggregating anonymized population analytics…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Active Cohort Size</span>
                  <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    {data.summary_metrics.active_cohort_size}
                  </div>
                  <span className="text-[10px] text-slate-500 block">k-Anonymity Verified</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Anonymized Data Points</span>
                  <div className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-400" />
                    {data.summary_metrics.total_anonymized_data_points}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Zero PII records</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Population Stress Index</span>
                  <div className="text-2xl font-extrabold text-amber-400 flex items-baseline gap-1">
                    {data.summary_metrics.population_avg_stress} <span className="text-xs text-slate-500">/ 10</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Aggregated average</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">High Distress Rate</span>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {data.summary_metrics.high_stress_prevalence_pct}%
                  </div>
                  <span className="text-[10px] text-slate-500 block">Stress score ≥ 7.0</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Peak Population Affect</span>
                  <div className="text-xl font-extrabold text-emerald-400 capitalize">
                    {data.summary_metrics.peak_population_emotion}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Dominant emotion tag</span>
                </div>
              </div>

              {/* Population Mood & Stress Trajectory Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Population Mood &amp; Stress Trajectory ({data.time_period})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aggregated daily population averages scrubbed of individual identifiers.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.population_timeline}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={11} domain={[0, 10]} label={{ value: "Mood (1-10)", angle: -90, position: "insideLeft", style: { fill: "#64748b", fontSize: "10px" } }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={11} domain={[0, 10]} label={{ value: "Stress (1-10)", angle: 90, position: "insideRight", style: { fill: "#ef4444", fontSize: "10px" } }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line yAxisId="left" type="monotone" dataKey="avg_mood_score" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} name="Avg Population Mood" />
                      <Bar yAxisId="right" dataKey="avg_stress_score" fill="#ef4444" opacity={0.35} radius={[4, 4, 0, 0]} name="Avg Population Stress" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Emotion Distribution & Top Triggers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emotion Distribution */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-violet-400" />
                    Population Emotion Distribution
                  </h3>
                  <div className="space-y-3">
                    {data.emotion_distribution.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white capitalize">{item.emotion}</span>
                          <span className="text-slate-400">{item.percentage}% ({item.count} records)</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Population Triggers */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Primary Population Stressors &amp; Triggers
                  </h3>
                  <div className="space-y-3">
                    {data.population_triggers.map((trig, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{trig.category}</span>
                          <span className="text-[10px] text-slate-500">{trig.frequency} anonymized reports</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {trig.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demographic Cohorts & Regional Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demographic Breakdown */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Demographic Cohort Breakdown (Age Groups)
                  </h3>
                  <div className="space-y-2.5">
                    {data.demographic_breakdown.map((demo, dIdx) => (
                      <div key={dIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">Age {demo.age_group}</span>
                          <span className="text-[10px] text-slate-400 block">Cohort Size: {demo.cohort_size} users</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">{demo.avg_mood} / 10 Mood</span>
                          <span className="text-[10px] text-slate-400 block">Top: {demo.top_emotion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regional Breakdown */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Regional Stress Density Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {data.regional_breakdown.map((reg, rIdx) => (
                      <div key={rIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{reg.region}</span>
                          <span className="text-[10px] text-slate-400 block">Dominant: {reg.dominant_trigger}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-rose-400">{reg.avg_stress} / 10 Stress</span>
                          <span className="text-[10px] text-slate-400 block">{reg.active_users} active users</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Executive Administrative Recommendations Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Executive Administrative Insights &amp; Wellness Guidance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.executive_insights.map((ins, iIdx) => (
                    <div key={iIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        {ins.title}
                      </h4>
                      <p className="text-slate-400 leading-relaxed">{ins.summary}</p>
                      <div className="pt-2 border-t border-slate-800/80 text-emerald-300 font-medium">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Action Plan:</span>
                        {ins.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
