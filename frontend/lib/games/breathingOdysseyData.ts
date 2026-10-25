/**
 * MindCare AI — Mindful Breath Odyssey Dataset & Science Configuration
 * 
 * 4 clinically validated breathing patterns designed for somatic regulation,
 * Heart Rate Variability (HRV) coherence, and parasympathetic nervous system activation.
 */

export type BreathingPatternId = "coherence" | "box" | "relax_478" | "balance";

export interface BreathPhase {
  name: "Inhale" | "Hold In" | "Exhale" | "Hold Out";
  durationSeconds: number;
  instruction: string;
  visualScale: number; // 1.0 = neutral/base, 1.45 = expanded
}

export interface BreathingPattern {
  id: BreathingPatternId;
  name: string;
  subtitle: string;
  description: string;
  clinicalPurpose: string;
  vagalMechanism: string;
  accentColor: string;
  badgeClass: string;
  phases: BreathPhase[];
  cycleDurationSeconds: number;
  defaultCycles: number;
}

export const BREATHING_PATTERNS: Record<BreathingPatternId, BreathingPattern> = {
  coherence: {
    id: "coherence",
    name: "Heart Coherence",
    subtitle: "5.5s Inhale • 5.5s Exhale",
    description: "Even-ratio breathing at approximately 5.5 breaths per minute, the biological resonance frequency for human cardiovascular synchronization.",
    clinicalPurpose: "Maximizes Heart Rate Variability (HRV) and synchronizes cardiac and respiratory rhythms.",
    vagalMechanism: "Stimulates baroreceptor reflexes and enhances parasympathetic vagal tone.",
    accentColor: "from-teal-400 to-cyan-500",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    cycleDurationSeconds: 11,
    defaultCycles: 10,
    phases: [
      {
        name: "Inhale",
        durationSeconds: 5.5,
        instruction: "Breathe in deeply through your nose, expanding your diaphragm...",
        visualScale: 1.45,
      },
      {
        name: "Exhale",
        durationSeconds: 5.5,
        instruction: "Release slowly through softly parted lips, feeling tension melt...",
        visualScale: 1.0,
      },
    ],
  },
  box: {
    id: "box",
    name: "Box Breathing",
    subtitle: "4s In • 4s Hold • 4s Out • 4s Hold",
    description: "Four equal sides of respiration used by tactical operators and first responders to regulate acute sympathetic panic.",
    clinicalPurpose: "Resets the autonomic nervous system during acute hyper-arousal, anxiety, or performance pressure.",
    vagalMechanism: "Stabilizes arterial blood pressure and interrupts catastrophic adrenaline spikes.",
    accentColor: "from-blue-500 to-indigo-600",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    cycleDurationSeconds: 16,
    defaultCycles: 8,
    phases: [
      {
        name: "Inhale",
        durationSeconds: 4,
        instruction: "Inhale steadily through your nose...",
        visualScale: 1.45,
      },
      {
        name: "Hold In",
        durationSeconds: 4,
        instruction: "Hold gently with relaxed lungs, keeping shoulders down...",
        visualScale: 1.45,
      },
      {
        name: "Exhale",
        durationSeconds: 4,
        instruction: "Exhale smoothly and completely...",
        visualScale: 1.0,
      },
      {
        name: "Hold Out",
        durationSeconds: 4,
        instruction: "Pause softly in the quiet stillness before the next breath...",
        visualScale: 1.0,
      },
    ],
  },
  relax_478: {
    id: "relax_478",
    name: "4-7-8 Sedative Calm",
    subtitle: "4s In • 7s Hold • 8s Long Exhale",
    description: "Developed by integrative medicine pioneer Dr. Andrew Weil, prolonged exhalation acts as a natural tranquilizer for the nervous system.",
    clinicalPurpose: "Rapidly down-regulates racing thoughts before sleep and counteracts somatic restlessness.",
    vagalMechanism: "Extended exhalation stimulates the vagus nerve to release acetylcholine, naturally slowing heart rate.",
    accentColor: "from-purple-500 to-indigo-700",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    cycleDurationSeconds: 19,
    defaultCycles: 6,
    phases: [
      {
        name: "Inhale",
        durationSeconds: 4,
        instruction: "Inhale quietly through your nose into your belly...",
        visualScale: 1.45,
      },
      {
        name: "Hold In",
        durationSeconds: 7,
        instruction: "Hold your breath comfortably, allowing oxygen to saturate...",
        visualScale: 1.45,
      },
      {
        name: "Exhale",
        durationSeconds: 8,
        instruction: "Make a soft whoosh sound, letting every ounce of air leave...",
        visualScale: 1.0,
      },
    ],
  },
  balance: {
    id: "balance",
    name: "Equal Balance",
    subtitle: "4s Inhale • 4s Exhale",
    description: "A simple, balanced rhythm (Sama Vritti) that balances energetic vitality with calm mental focus.",
    clinicalPurpose: "Midday reset to sharpen cognitive clarity without inducing sleepiness.",
    vagalMechanism: "Balances sympathetic and parasympathetic branches of the autonomic nervous system.",
    accentColor: "from-amber-400 to-orange-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    cycleDurationSeconds: 8,
    defaultCycles: 12,
    phases: [
      {
        name: "Inhale",
        durationSeconds: 4,
        instruction: "Inhale smoothly for a count of four...",
        visualScale: 1.45,
      },
      {
        name: "Exhale",
        durationSeconds: 4,
        instruction: "Exhale evenly for a count of four...",
        visualScale: 1.0,
      },
    ],
  },
};
