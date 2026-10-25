"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gamesAPI } from "@/lib/axios";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  PLANT_VARIETIES,
  GARDEN_DECORATIONS,
  VALID_MOODS,
  PlantVariety,
  PlantStage,
  GardenDecoration,
  GardenPlotState,
} from "@/lib/games/moodGardenData";
import {
  Sprout,
  Droplets,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  Heart,
  BookOpen,
  Plus,
  History,
  Trash2,
  X,
  Sun,
  Smile,
  Info,
  Wind,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type ModalType = "none" | "plant_seed" | "activities" | "decorations" | "history" | "reset_confirm";
type ActivityType = "mood" | "journal" | "breath" | "gratitude" | "compassion";

export default function MoodGardenPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Garden State
  const [plots, setPlots] = useState<GardenPlotState[]>([]);
  const [inventory, setInventory] = useState<{
    droplets: number;
    seeds: Record<string, number>;
    decorations: string[];
    tokens: number;
  }>({
    droplets: 6,
    seeds: { lavender: 2, sunflower: 1, fern: 2, rose: 1, lotus: 1, marigold: 2 },
    decorations: ["lantern"],
    tokens: 2,
  });
  const [activityHistory, setActivityHistory] = useState<
    Array<{ id: string; activity: string; details: string; timestamp: string }>
  >([]);
  const [totalNurtures, setTotalNurtures] = useState<number>(0);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [selectedPlotIndex, setSelectedPlotIndex] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>("mood");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Activity inputs
  const [selectedMood, setSelectedMood] = useState<string>("calm");
  const [moodSharingOptIn, setMoodSharingOptIn] = useState<boolean>(false);
  const [journalText, setJournalText] = useState<string>("");
  const [gratitudeText, setGratitudeText] = useState<string>("");
  const [compassionQuote, setCompassionQuote] = useState<string>(
    "I am doing my best today with the energy I have, and that is worthy of kindness."
  );

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Setup
  const initAudio = useCallback(() => {
    if (typeof window === "undefined" || !soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  // Water drop harmonic chime
  const playWaterChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Bloom celebration chord
  const playBloomChord = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const notes = [440.0, 554.37, 659.25, 880.0]; // A major arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.85);
      });
    } catch {
      // Fallback
    }
  }, [soundEnabled, initAudio]);

  // Load Garden from backend or local storage
  useEffect(() => {
    async function loadGarden() {
      setLoading(true);
      try {
        if (user) {
          const res = await gamesAPI.getMoodGarden();
          if (res.data && res.data.plots && res.data.plots.length > 0) {
            setPlots(res.data.plots);
            setInventory({
              droplets: res.data.inventory?.droplets ?? 6,
              seeds: res.data.inventory?.seeds ?? { lavender: 2, sunflower: 1, fern: 2, rose: 1, lotus: 1, marigold: 2 },
              decorations: res.data.inventory?.decorations ?? ["lantern"],
              tokens: res.data.inventory?.tokens ?? 2,
            });
            setActivityHistory(res.data.activity_history ?? []);
            setTotalNurtures(res.data.total_nurtures ?? 0);
            return;
          }
        }

        // Local storage fallback for guests
        const local = localStorage.getItem("mindcare_mood_garden");
        if (local) {
          const parsed = JSON.parse(local);
          setPlots(parsed.plots);
          setInventory(parsed.inventory);
          setActivityHistory(parsed.activity_history || []);
          setTotalNurtures(parsed.total_nurtures || 0);
        } else {
          // Initialize default 9 plots
          const nowIso = new Date().toISOString();
          const defaultPlots: GardenPlotState[] = [
            { plot_index: 0, plant_id: "lavender", stage: "sprout", planted_at: nowIso },
            { plot_index: 1, plant_id: null, stage: "empty", planted_at: null },
            { plot_index: 2, plant_id: "sunflower", stage: "bloom", planted_at: nowIso },
            { plot_index: 3, plant_id: null, stage: "empty", planted_at: null },
            { plot_index: 4, plant_id: "fern", stage: "bud", planted_at: nowIso },
            { plot_index: 5, plant_id: null, stage: "empty", planted_at: null },
            { plot_index: 6, plant_id: "rose", stage: "seed", planted_at: nowIso },
            { plot_index: 7, plant_id: null, stage: "empty", planted_at: null },
            { plot_index: 8, plant_id: "lotus", stage: "bloom", planted_at: nowIso },
          ];
          setPlots(defaultPlots);
        }
      } catch (err) {
        // Fallback to initial local state
      } finally {
        setLoading(false);
      }
    }

    loadGarden();
  }, [user]);

  // Persist garden state
  const syncGarden = async (
    newPlots: GardenPlotState[],
    newInventory: typeof inventory,
    newHistory: typeof activityHistory,
    newNurtures: number
  ) => {
    // Save to local storage
    try {
      localStorage.setItem(
        "mindcare_mood_garden",
        JSON.stringify({
          plots: newPlots,
          inventory: newInventory,
          activity_history: newHistory,
          total_nurtures: newNurtures,
        })
      );
    } catch {
      // Ignored
    }

    // Save to backend for authenticated users
    if (user) {
      setSaving(true);
      try {
        await gamesAPI.saveMoodGarden({
          plots: newPlots,
          inventory: newInventory,
          activity_history: newHistory,
          total_nurtures: newNurtures,
        });
      } catch {
        // Silently preserve local copy
      } finally {
        setSaving(false);
      }
    }
  };

  // Water / Nurture Plant
  const handleWaterPlant = (plotIndex: number) => {
    if (inventory.droplets <= 0) {
      toast.error("You need water droplets! Complete an optional wellness activity to gather water 💧");
      setActiveModal("activities");
      return;
    }

    const currentPlot = plots[plotIndex];
    if (!currentPlot || !currentPlot.plant_id || currentPlot.stage === "empty") return;

    let nextStage: PlantStage = currentPlot.stage;
    let didBloom = false;

    if (currentPlot.stage === "seed") nextStage = "sprout";
    else if (currentPlot.stage === "sprout") nextStage = "bud";
    else if (currentPlot.stage === "bud") {
      nextStage = "bloom";
      didBloom = true;
    } else if (currentPlot.stage === "bloom") {
      toast.success("This plant is already in full radiant bloom! You refreshed its petals 🌸");
      playWaterChime();
      return;
    }

    const updatedPlots = plots.map((p, i) =>
      i === plotIndex ? { ...p, stage: nextStage } : p
    );

    const updatedInventory = {
      ...inventory,
      droplets: inventory.droplets - 1,
    };

    const plant = PLANT_VARIETIES[currentPlot.plant_id];
    const newHistory = [
      {
        id: `act-${Date.now()}`,
        activity: "Watered Plant",
        details: `Nurtured ${plant?.name || "flower"} to ${nextStage} stage.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...activityHistory.slice(0, 24),
    ];

    const newNurtures = totalNurtures + 1;
    setPlots(updatedPlots);
    setInventory(updatedInventory);
    setActivityHistory(newHistory);
    setTotalNurtures(newNurtures);

    if (didBloom) {
      playBloomChord();
      toast.success(`🎉 Glorious blossom! Your ${plant?.name} reached full bloom!`);
      // Award session score for blooming
      if (user) {
        gamesAPI.recordSession({
          game_slug: "mood-garden",
          score: 10,
          total_questions: 1,
          correct_count: 1,
          difficulty: "bloom",
          duration_seconds: 60,
        }).catch(() => {});
      }
    } else {
      playWaterChime();
      toast.success(`Nurtured ${plant?.name}! Reached ${nextStage} stage.`);
    }

    syncGarden(updatedPlots, updatedInventory, newHistory, newNurtures);
  };

  // Open planting modal for empty plot
  const handleOpenPlantModal = (plotIndex: number) => {
    setSelectedPlotIndex(plotIndex);
    setActiveModal("plant_seed");
  };

  // Plant a selected seed into chosen plot
  const handlePlantSeed = (plantId: string) => {
    if (selectedPlotIndex === null) return;
    const available = inventory.seeds[plantId] || 0;
    if (available <= 0) {
      toast.error("You don't have any seeds for this plant! Gather seeds from wellness activities.");
      return;
    }

    const updatedPlots = plots.map((p, i) =>
      i === selectedPlotIndex
        ? {
            ...p,
            plant_id: plantId,
            stage: "seed" as PlantStage,
            planted_at: new Date().toISOString(),
          }
        : p
    );

    const updatedInventory = {
      ...inventory,
      seeds: {
        ...inventory.seeds,
        [plantId]: available - 1,
      },
    };

    const plant = PLANT_VARIETIES[plantId];
    const newHistory = [
      {
        id: `act-${Date.now()}`,
        activity: "Planted Seed",
        details: `Sowed ${plant.name} seed into Plot ${selectedPlotIndex + 1}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...activityHistory.slice(0, 24),
    ];

    setPlots(updatedPlots);
    setInventory(updatedInventory);
    setActivityHistory(newHistory);
    setActiveModal("none");
    setSelectedPlotIndex(null);
    playWaterChime();
    toast.success(`Planted ${plant.name}! Water it to watch it sprout 🌱`);

    syncGarden(updatedPlots, updatedInventory, newHistory, totalNurtures);
  };

  // Complete a wellness activity
  const handleCompleteActivity = (type: ActivityType) => {
    let earnedDroplets = 2;
    let earnedTokens = 0;
    let mysterySeedKey = "lavender";
    const seedKeys = Object.keys(PLANT_VARIETIES);
    mysterySeedKey = seedKeys[Math.floor(Math.random() * seedKeys.length)];

    let logTitle = "";
    let logDesc = "";

    if (type === "mood") {
      const moodObj = VALID_MOODS.find((m) => m.id === selectedMood);
      logTitle = "Honest Mood Check-in";
      logDesc = `Checked in with feeling: ${moodObj?.label}. "${moodObj?.note}"`;
      earnedDroplets = 2;
      toast.success(`Thank you for honoring your honest feeling (${moodObj?.label}). +2 Droplets & 1 ${PLANT_VARIETIES[mysterySeedKey].name} Seed gained! 💧`);
    } else if (type === "journal") {
      if (!journalText.trim()) {
        toast.error("Please write a few words for your reflection.");
        return;
      }
      logTitle = "Mindful Journal Entry";
      logDesc = `Reflected on personal state: "${journalText.slice(0, 60)}..."`;
      earnedDroplets = 2;
      setJournalText("");
      toast.success("Reflection recorded! +2 Water Droplets gained! 💧");
    } else if (type === "breath") {
      logTitle = "Gentle Garden Breath";
      logDesc = "Took a quiet 30-second breathing pause in the garden.";
      earnedDroplets = 2;
      toast.success("Breath pause complete! Your nervous system thanks you. +2 Droplets gained! 💧");
    } else if (type === "gratitude") {
      if (!gratitudeText.trim()) {
        toast.error("Please enter a simple thing you appreciate today.");
        return;
      }
      logTitle = "Gratitude Anchor";
      logDesc = `Anchored gratitude: "${gratitudeText.slice(0, 60)}"`;
      earnedDroplets = 1;
      earnedTokens = 1;
      setGratitudeText("");
      toast.success("Gratitude anchored! +1 Droplet & +1 Decoration Token gained! ✨");
    } else if (type === "compassion") {
      logTitle = "Compassion Whisper";
      logDesc = "Offered self-kindness: 'I am worthy of gentle care.'";
      earnedDroplets = 1;
      earnedTokens = 1;
      toast.success("Compassion offered to yourself! +1 Droplet & +1 Seed gained! 🌹");
    }

    const updatedInventory = {
      ...inventory,
      droplets: inventory.droplets + earnedDroplets,
      tokens: inventory.tokens + earnedTokens,
      seeds: {
        ...inventory.seeds,
        [mysterySeedKey]: (inventory.seeds[mysterySeedKey] || 0) + 1,
      },
    };

    const newHistory = [
      {
        id: `act-${Date.now()}`,
        activity: logTitle,
        details: logDesc,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...activityHistory.slice(0, 24),
    ];

    setInventory(updatedInventory);
    setActivityHistory(newHistory);
    setActiveModal("none");
    playWaterChime();

    syncGarden(plots, updatedInventory, newHistory, totalNurtures);
  };

  // Buy Decoration
  const handleBuyDecoration = (dec: GardenDecoration) => {
    if (inventory.decorations.includes(dec.id)) {
      toast.success(`${dec.name} is already adorning your sanctuary!`);
      return;
    }
    if (inventory.tokens < dec.tokenCost) {
      toast.error(`You need ${dec.tokenCost} Decoration Tokens! Complete gratitude reflections to earn tokens ✨`);
      return;
    }

    const updatedInventory = {
      ...inventory,
      tokens: inventory.tokens - dec.tokenCost,
      decorations: [...inventory.decorations, dec.id],
    };

    const newHistory = [
      {
        id: `act-${Date.now()}`,
        activity: "Unlocked Decoration",
        details: `Placed ${dec.name} in the garden.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...activityHistory.slice(0, 24),
    ];

    setInventory(updatedInventory);
    setActivityHistory(newHistory);
    playBloomChord();
    toast.success(`Adorned garden with ${dec.name}! ${dec.emoji}`);

    syncGarden(plots, updatedInventory, newHistory, totalNurtures);
  };

  // Reset Garden to fresh plots
  const handleResetGarden = async () => {
    const nowIso = new Date().toISOString();
    const freshPlots: GardenPlotState[] = Array.from({ length: 9 }).map((_, idx) => ({
      plot_index: idx,
      plant_id: null,
      stage: "empty" as PlantStage,
      planted_at: null,
    }));

    const freshInventory = {
      droplets: 6,
      seeds: { lavender: 3, sunflower: 2, fern: 2, rose: 2, lotus: 1, marigold: 2 },
      decorations: ["lantern"],
      tokens: 2,
    };

    setPlots(freshPlots);
    setInventory(freshInventory);
    setActivityHistory([]);
    setTotalNurtures(0);
    setActiveModal("none");

    if (user) {
      try {
        await gamesAPI.resetMoodGarden();
      } catch {
        // Ignored
      }
    }
    toast.success("Garden cleared and refreshed with starter seeds! 🌿");
    syncGarden(freshPlots, freshInventory, [], 0);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Mood Garden" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Garden Header & Resource Bar */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                    <Sprout className="w-3.5 h-3.5 text-emerald-300" />
                    Emotional Ecosystem
                  </span>
                  {saving && (
                    <span className="text-[11px] text-emerald-400 font-mono animate-pulse">
                      Saving...
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                  Virtual Mood Garden 🌿🌸
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Every human emotion waters the soil. Tears nourish roots just as much as sunshine.
                  Nurture your garden with gentle moments of honest self-care, with zero guilt or streaks.
                </p>
              </div>

              {/* Resource Badges */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <Droplets className="w-5 h-5 text-sky-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Water</span>
                    <span className="text-base font-black text-white">{inventory.droplets} Drops</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Tokens</span>
                    <span className="text-base font-black text-white">{inventory.tokens} Tokens</span>
                  </div>
                </div>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
                  title={soundEnabled ? "Mute garden sounds" : "Enable garden sounds"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Active Garden Decorations Bar */}
            {inventory.decorations.length > 0 && (
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs text-slate-300">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">
                  Adornments:
                </span>
                {inventory.decorations.map((decId) => {
                  const dec = GARDEN_DECORATIONS.find((d) => d.id === decId);
                  return (
                    <span
                      key={decId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 font-medium shrink-0"
                    >
                      <span>{dec?.emoji}</span>
                      <span>{dec?.name}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal("activities")}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transform active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nurture Activity (+Water)</span>
              </button>

              <button
                onClick={() => setActiveModal("decorations")}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:border-slate-700 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Sanctuary Shop</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal("history")}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition"
                title="Activity Journal"
              >
                <History className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveModal("reset_confirm")}
                className="p-2.5 rounded-xl text-rose-400 hover:text-rose-300 transition"
                title="Reset Garden"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3x3 Interactive Garden Plots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plots.map((plot, idx) => {
              const plant = plot.plant_id ? PLANT_VARIETIES[plot.plant_id] : null;
              const isEmpty = plot.stage === "empty" || !plant;
              const stageInfo = !isEmpty && plot.stage !== "empty" ? plant.stages[plot.stage] : null;

              return (
                <div
                  key={idx}
                  className={`relative p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between min-h-[200px] ${
                    isEmpty
                      ? "bg-amber-950/20 border-dashed border-amber-500/30 hover:border-amber-500/60"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Plot Header */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Plot {idx + 1}
                    </span>

                    {!isEmpty && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {stageInfo?.label || plot.stage}
                      </span>
                    )}
                  </div>

                  {/* Plant Visual Center */}
                  <div className="my-auto py-3 text-center space-y-1.5 select-none">
                    {isEmpty ? (
                      <div className="space-y-1">
                        <span className="text-3xl block opacity-60">🕳️</span>
                        <p className="text-xs font-bold text-slate-400">Rich Empty Soil</p>
                        <p className="text-[11px] text-slate-500">Ready for a seedling</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-4xl sm:text-5xl block animate-bounce-slow">
                          {plot.stage === "bloom" ? plant.emoji : stageInfo?.icon || "🌱"}
                        </span>
                        <h3 className="font-extrabold text-sm text-white">
                          {plant.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 leading-tight italic">
                          "{plant.meaning}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Plot Action Buttons */}
                  <div className="pt-2">
                    {isEmpty ? (
                      <button
                        onClick={() => handleOpenPlantModal(idx)}
                        className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sow Seed</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleWaterPlant(idx)}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                          plot.stage === "bloom"
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20"
                        }`}
                      >
                        <Droplets className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          {plot.stage === "bloom" ? "Refresh Petals" : "Water (1 Drop)"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Philosophy Safeguard Banner */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-bold">
                Ethical Mood Garden Safeguard:
              </strong>
              <p className="leading-relaxed text-slate-400">
                MindCare AI never penalizes missed days or creates guilt-inducing streaks. Reporting sadness,
                grief, or anxiety provides the exact same soil enrichment and watering droplets as reporting joy.
                Your garden is an accepting sanctuary for your whole human experience.
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MODAL 1: SOW SEED MODAL                                      */}
          {/* ============================================================ */}
          <AnimatePresence>
            {activeModal === "plant_seed" && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-400" />
                      Sow Seed into Plot {selectedPlotIndex !== null ? selectedPlotIndex + 1 : ""}
                    </h3>
                    <button
                      onClick={() => setActiveModal("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Select a seed variety from your inventory to plant:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(PLANT_VARIETIES).map((p) => {
                      const count = inventory.seeds[p.id] || 0;
                      return (
                        <button
                          key={p.id}
                          disabled={count <= 0}
                          onClick={() => handlePlantSeed(p.id)}
                          className={`p-3.5 rounded-2xl border text-left transition space-y-1.5 ${
                            count > 0
                              ? "bg-slate-800/60 border-slate-700 hover:border-emerald-500"
                              : "opacity-40 border-slate-800 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{p.emoji}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {count} Seeds
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-white">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {p.meaning}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* MODAL 2: WELLNESS ACTIVITIES (EARN WATER & SEEDS)           */}
          {/* ============================================================ */}
          <AnimatePresence>
            {activeModal === "activities" && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-lg text-white flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-sky-400" />
                        Nurture Activity Sanctuary
                      </h3>
                      <p className="text-xs text-slate-400">
                        Gather water droplets and seeds through gentle, optional reflections.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModal("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Activity Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      { id: "mood", label: "Mood Check-in" },
                      { id: "journal", label: "Micro-Journal" },
                      { id: "breath", label: "Quiet Breath" },
                      { id: "gratitude", label: "Gratitude" },
                      { id: "compassion", label: "Kindness" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedActivity(tab.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                          selectedActivity === tab.id
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Activity Form 1: Mood Check-in */}
                  {selectedActivity === "mood" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        How is your weather today? All feelings are welcome here:
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {VALID_MOODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMood(m.id)}
                            className={`p-3 rounded-2xl border text-left transition ${
                              selectedMood === m.id
                                ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20"
                                : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                            }`}
                          >
                            <span className="text-xl block">{m.emoji}</span>
                            <span className="font-bold text-xs text-slate-200 block mt-1">
                              {m.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/80 text-[11px] text-slate-400 italic border border-slate-700/50">
                        "{VALID_MOODS.find((m) => m.id === selectedMood)?.note}"
                      </div>

                      <button
                        onClick={() => handleCompleteActivity("mood")}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Water Garden with Honest Check-in (+2 Drops, +1 Seed)
                      </button>
                    </div>
                  )}

                  {/* Activity Form 2: Micro-Journal */}
                  {selectedActivity === "journal" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Write a sentence about what is present for you right now:
                      </p>

                      <textarea
                        rows={3}
                        value={journalText}
                        onChange={(e) => setJournalText(e.target.value)}
                        placeholder="Right now, my thoughts feel like..."
                        className="w-full p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />

                      <button
                        onClick={() => handleCompleteActivity("journal")}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Save Reflection (+2 Drops)
                      </button>
                    </div>
                  )}

                  {/* Activity Form 3: Breath */}
                  {selectedActivity === "breath" && (
                    <div className="space-y-4 text-center py-2">
                      <p className="text-xs text-slate-400">
                        Take three slow breaths right here in the garden air:
                      </p>

                      <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                        <Wind className="w-8 h-8" />
                      </div>

                      <button
                        onClick={() => handleCompleteActivity("breath")}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Complete Breath Pause (+2 Drops)
                      </button>
                    </div>
                  )}

                  {/* Activity Form 4: Gratitude */}
                  {selectedActivity === "gratitude" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Name one ordinary, simple thing you appreciate today:
                      </p>

                      <input
                        type="text"
                        value={gratitudeText}
                        onChange={(e) => setGratitudeText(e.target.value)}
                        placeholder="e.g., hot green tea, quiet morning light..."
                        className="w-full p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />

                      <button
                        onClick={() => handleCompleteActivity("gratitude")}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Anchor Gratitude (+1 Drop, +1 Token)
                      </button>
                    </div>
                  )}

                  {/* Activity Form 5: Compassion */}
                  {selectedActivity === "compassion" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Offer yourself this gentle affirmation today:
                      </p>

                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-xs sm:text-sm font-semibold italic text-rose-300">
                          "{compassionQuote}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleCompleteActivity("compassion")}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Receive Kindness (+1 Drop, +1 Token)
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* MODAL 3: DECORATION SHOP                                     */}
          {/* ============================================================ */}
          <AnimatePresence>
            {activeModal === "decorations" && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-lg text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Garden Adornment Shop
                      </h3>
                      <p className="text-xs text-slate-400">
                        You have {inventory.tokens} Decoration Tokens
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModal("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {GARDEN_DECORATIONS.map((dec) => {
                      const isOwned = inventory.decorations.includes(dec.id);
                      return (
                        <div
                          key={dec.id}
                          className="p-3.5 rounded-2xl border border-slate-800 bg-slate-800/60 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{dec.emoji}</span>
                            <div>
                              <h4 className="font-extrabold text-xs text-white">
                                {dec.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 leading-tight">
                                {dec.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isOwned ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold text-[11px]">
                                Placed ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleBuyDecoration(dec)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs shadow-sm transition"
                              >
                                {dec.tokenCost} Tokens
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* MODAL 4: ACTIVITY LOG HISTORY                                */}
          {/* ============================================================ */}
          <AnimatePresence>
            {activeModal === "history" && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-400" />
                      Garden Nurture Chronicle
                    </h3>
                    <button
                      onClick={() => setActiveModal("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {activityHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No activities logged yet. Water a plant or complete a check-in!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activityHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">
                              {item.activity}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{item.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* MODAL 5: RESET GARDEN CONFIRMATION                           */}
          {/* ============================================================ */}
          <AnimatePresence>
            {activeModal === "reset_confirm" && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>

                  <h3 className="font-black text-base text-white">
                    Refresh Your Garden Soil?
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    This will clear all 9 plots back to fertile soil and restock your inventory with starter seeds.
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveModal("none")}
                      className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                    >
                      Keep Garden
                    </button>
                    <button
                      onClick={handleResetGarden}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-sm transition"
                    >
                      Refresh Soil
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
