/**
 * MindCare AI — Mindful Sleep Sanctuary Dataset & CBT-I Chronobiology Guide
 * 
 * Clinical sleep hygiene, stimulus control, and cognitive deceleration
 * designed to downregulate pre-sleep autonomic hyper-arousal.
 */

export interface WorryItem {
  id: string;
  category: "work" | "social" | "health" | "general";
  worryThought: string;
  parkingReframe: string;
  actionNote: string;
}

export interface SanctuarySwitch {
  id: string;
  name: string;
  currentDisruptor: string;
  optimizedState: string;
  clinicalRationale: string;
  iconName: string;
}

export interface BodyScanNode {
  id: string;
  region: string;
  tensionCue: string;
  releaseInstruction: string;
}

export const COMMON_WORRIES: WorryItem[] = [
  {
    id: "wry-01",
    category: "work",
    worryThought: "I didn't finish the quarterly report draft and tomorrow morning will be chaotic.",
    parkingReframe: "Worrying at midnight cannot write paragraphs. The draft is safe in draft status, and my brain will solve it with 3x more speed after 7 hours of restorative sleep.",
    actionNote: "Schedule a 45-minute focused block tomorrow at 9:15 AM.",
  },
  {
    id: "wry-02",
    category: "social",
    worryThought: "Did my text message sound cold or passive-aggressive to my friend?",
    parkingReframe: "Late-night fatigue amplifies social paranoia. My friend knows my heart. If clarification is ever needed, daylight is the place for connection, not 1 AM rumination.",
    actionNote: "Send a warm emoji check-in tomorrow at lunchtime.",
  },
  {
    id: "wry-03",
    category: "health",
    worryThought: "If I don't fall asleep right now, my immune system will fail and tomorrow will be ruined.",
    parkingReframe: "Sleep cannot be forced by anxious willpower. Simply lying comfortably in the dark with slow breaths still restores 80% of physiological reserves. I am resting.",
    actionNote: "Release sleep pressure: rest is already happening.",
  },
  {
    id: "wry-04",
    category: "work",
    worryThought: "I have 14 unanswered emails in my inbox that need immediate attention.",
    parkingReframe: "Nighttime boundaries are essential for professional longevity. Nobody expects email replies at 11:30 PM. The inbox will wait peacefully for the sunrise.",
    actionNote: "Set inbox triage for tomorrow morning.",
  },
  {
    id: "wry-05",
    category: "general",
    worryThought: "Replaying a clumsy stumble over my words during today's team lunch.",
    parkingReframe: "The spotlight effect trick: others were focused on their own lunch and thoughts. Human conversation is naturally imperfect. I forgive my human awkwardness.",
    actionNote: "Deposit memory into the vault; close the drawer.",
  },
];

export const SANCTUARY_SWITCHES: SanctuarySwitch[] = [
  {
    id: "sw-light",
    name: "Circadian Lighting",
    currentDisruptor: "450nm Cool Blue Screen Glare (Suppresses Pineal Melatonin)",
    optimizedState: "Warm Amber Sunset Glow (<2000K, Dim Candlelight)",
    clinicalRationale: "Melanopsin retinal cells trigger pineal gland melatonin production only when cool blue frequencies diminish.",
    iconName: "Sun",
  },
  {
    id: "sw-temp",
    name: "Thermal Environment",
    currentDisruptor: "Stuffy, Overheated Air (74°F / 23.3°C)",
    optimizedState: "Crisp Restorative Air (66°F / 18.8°C)",
    clinicalRationale: "Human core body temperature must drop by 1°C to initiate slow-wave sleep (NREM 3) and deep cellular repair.",
    iconName: "Thermometer",
  },
  {
    id: "sw-stimulus",
    name: "Stimulus Control",
    currentDisruptor: "Laptops & Unfinished Work Spread Across the Bed",
    optimizedState: "Bed Clean & Reserved Solely for Sleep & Intimacy",
    clinicalRationale: "Classic CBT-I Stimulus Control re-wires the conditioned cognitive association between bed and autonomic wakefulness.",
    iconName: "Bed",
  },
  {
    id: "sw-sound",
    name: "Acoustic Horizon",
    currentDisruptor: "Intermittent Traffic Sirens & Sudden Distant Noises",
    optimizedState: "Gentle Continuous Pink Noise & Soft Rainfall",
    clinicalRationale: "Continuous pink noise smooths auditory delta-wave synchrony and masks sudden jarring decibel spikes.",
    iconName: "Waves",
  },
];

export const BODY_SCAN_NODES: BodyScanNode[] = [
  {
    id: "bs-head",
    region: "Forehead, Eyes & Jaw",
    tensionCue: "Furrowed brow, squinting eyelids, clamped back molars.",
    releaseInstruction: "Soften the brow smooth like still water. Unclench the jaw, letting the tongue rest gently against the floor of the mouth.",
  },
  {
    id: "bs-shoulders",
    region: "Neck, Trapezius & Shoulders",
    tensionCue: "Shoulders drawn tight up toward the ears, knotted trapezius.",
    releaseInstruction: "Take a deep sigh and let your shoulders drop down two inches into the mattress. Feel the heavy gravity cradling you.",
  },
  {
    id: "bs-torso",
    region: "Chest, Diaphragm & Belly",
    tensionCue: "Shallow chest breathing, tensed abdominal wall.",
    releaseInstruction: "Release all abdominal tension. Allow your belly to rise softly like a gentle wave with every inhale and fall with every exhale.",
  },
  {
    id: "bs-legs",
    region: "Hips, Legs & Feet",
    tensionCue: "Restless legs, flexed ankles, contracted calves.",
    releaseInstruction: "Feel both legs become warm, heavy, and sinking. Let your feet roll gently outward in complete surrender to the mattress.",
  },
];
