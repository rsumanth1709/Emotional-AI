/**
 * MindCare AI — Focus Quest Data & Visual Attention Challenges
 *
 * Safety & Clinical Boundaries:
 * 1. Attentional Grounding: Visual pattern exercises are gentle warm-ups for attentional focus.
 * 2. Non-Diagnostic: Performance is never an indicator or test for ADHD, executive dysfunction,
 *    anxiety, or cognitive impairment.
 * 3. Non-IQ Scoring: Score is purely an educational game metric, not a measure of intelligence.
 * 4. Flexible Pacing: Timers are completely optional to promote stress-free cognitive ease.
 */

export type ChallengeType =
  | "odd-shape"
  | "pattern-complete"
  | "matching-symbols"
  | "sequence-memory"
  | "spot-difference";

export type Difficulty = "easy" | "medium" | "hard";

export interface ChallengeOption {
  id: string;
  label: string;
  symbol: string;
  visualDetail?: string;
  isCorrect: boolean;
}

export interface FocusChallenge {
  id: string;
  type: ChallengeType;
  difficulty: Difficulty;
  title: string;
  instructions: string;
  visualContext: {
    layoutType: "grid" | "row" | "comparison" | "sequence";
    items?: Array<{ id: string; symbol: string; label: string; accent?: string }>;
    leftScene?: { title: string; elements: string[]; details: string };
    rightScene?: { title: string; elements: string[]; details: string };
    sequenceItems?: string[];
  };
  options: ChallengeOption[];
  explanation: string;
  attentionTip: string;
}

export const CHALLENGE_TYPE_INFO: Record<
  ChallengeType,
  { name: string; icon: string; description: string; skill: string }
> = {
  "odd-shape": {
    name: "Odd Shape Out",
    icon: "🔍",
    description: "Scan a collection to detect the single item with a divergent visual attribute.",
    skill: "Feature Discrimination & Visual Search",
  },
  "pattern-complete": {
    name: "Pattern Completion",
    icon: "🧩",
    description: "Analyze the repeating transformation rule and deduce the missing piece.",
    skill: "Inductive Reasoning & Structural Prediction",
  },
  "matching-symbols": {
    name: "Matching Symbols",
    icon: "🎯",
    description: "Locate identical target symbols or discover hidden twin symbols.",
    skill: "Selective Attention & Target Detection",
  },
  "sequence-memory": {
    name: "Sequence Memory",
    icon: "✨",
    description: "Observe a brief sequence and recall the exact order of presentation.",
    skill: "Visual Working Memory & Sequential Recall",
  },
  "spot-difference": {
    name: "Spot the Difference",
    icon: "⚖️",
    description: "Compare two parallel visual scenes and identify the subtle discrepancy.",
    skill: "Detailed Scanning & Perceptual Comparison",
  },
};

export const FOCUS_CHALLENGES: FocusChallenge[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ODD SHAPE OUT (6 Challenges)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "odd-1",
    type: "odd-shape",
    difficulty: "easy",
    title: "The Solitary Geometric Form",
    instructions: "Examine the 4 geometric forms below. Which shape does not belong with the others?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "🔺", label: "Triangle (3 sides)" },
        { id: "i2", symbol: "🔷", label: "Rhombus (4 sides)" },
        { id: "i3", symbol: "🟢", label: "Circle (Curved, no straight edges)" },
        { id: "i4", symbol: "⬛", label: "Square (4 sides)" },
      ],
    },
    options: [
      { id: "a", label: "Triangle (🔺)", symbol: "🔺", isCorrect: false },
      { id: "b", label: "Rhombus (🔷)", symbol: "🔷", isCorrect: false },
      { id: "c", label: "Circle (🟢)", symbol: "🟢", isCorrect: true },
      { id: "d", label: "Square (⬛)", symbol: "⬛", isCorrect: false },
    ],
    explanation: "The circle (🟢) is the only shape formed by a continuous curve with zero vertices or straight edges, whereas all other shapes are straight-sided polygons.",
    attentionTip: "Categorical feature scanning (curved vs. polygonal) helps group visual stimuli rapidly.",
  },
  {
    id: "odd-2",
    type: "odd-shape",
    difficulty: "easy",
    title: "Directional Compass",
    instructions: "Look at the pointing direction of the four arrows. Which arrow points in a unique orientation?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "⬆️", label: "Pointing Up" },
        { id: "i2", symbol: "⬆️", label: "Pointing Up" },
        { id: "i3", symbol: "⬇️", label: "Pointing Down" },
        { id: "i4", symbol: "⬆️", label: "Pointing Up" },
      ],
    },
    options: [
      { id: "a", label: "First Arrow (⬆️)", symbol: "⬆️", isCorrect: false },
      { id: "b", label: "Second Arrow (⬆️)", symbol: "⬆️", isCorrect: false },
      { id: "c", label: "Third Arrow (⬇️)", symbol: "⬇️", isCorrect: true },
      { id: "d", label: "Fourth Arrow (⬆️)", symbol: "⬆️", isCorrect: false },
    ],
    explanation: "Arrow 3 (⬇️) points downwards towards the south, whereas the remaining three arrows all point upwards.",
    attentionTip: "Noticing directional vectors is a primary function of spatial orientation in the parietal cortex.",
  },
  {
    id: "odd-3",
    type: "odd-shape",
    difficulty: "medium",
    title: "Symmetry Inspection",
    instructions: "One of these geometric symbols lacks bilateral vertical symmetry. Which one is asymmetrical?",
    visualContext: {
      layoutType: "grid",
      items: [
        { id: "i1", symbol: "⭐", label: "Star (Bilateral symmetry)" },
        { id: "i2", symbol: "💎", label: "Gem (Bilateral symmetry)" },
        { id: "i3", symbol: "🌙", label: "Crescent (Asymmetric on vertical axis)" },
        { id: "i4", symbol: "☀️", label: "Sun (Radial & bilateral symmetry)" },
      ],
    },
    options: [
      { id: "a", label: "Star (⭐)", symbol: "⭐", isCorrect: false },
      { id: "b", label: "Gem (💎)", symbol: "💎", isCorrect: false },
      { id: "c", label: "Crescent Moon (🌙)", symbol: "🌙", isCorrect: true },
      { id: "d", label: "Sun (☀️)", symbol: "☀️", isCorrect: false },
    ],
    explanation: "The crescent moon (🌙) curves to one side, breaking vertical reflective symmetry, while the star, gem, and sun maintain mirrored balance.",
    attentionTip: "Mentally drawing a vertical line through objects trains bilateral spatial scanning.",
  },
  {
    id: "odd-4",
    type: "odd-shape",
    difficulty: "medium",
    title: "Color Spectrum Deviation",
    instructions: "Three of these gems belong to the cool color spectrum (blues/cyans). Which one is from the warm spectrum?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "🔷", label: "Blue Diamond (Cool)" },
        { id: "i2", symbol: "💠", label: "Cyan Floret (Cool)" },
        { id: "i3", symbol: "🟠", label: "Orange Sphere (Warm)" },
        { id: "i4", symbol: "💙", label: "Blue Heart (Cool)" },
      ],
    },
    options: [
      { id: "a", label: "Blue Diamond (🔷)", symbol: "🔷", isCorrect: false },
      { id: "b", label: "Cyan Floret (💠)", symbol: "💠", isCorrect: false },
      { id: "c", label: "Orange Sphere (🟠)", symbol: "🟠", isCorrect: true },
      { id: "d", label: "Blue Heart (💙)", symbol: "💙", isCorrect: false },
    ],
    explanation: "The orange sphere (🟠) belongs to the long-wavelength warm spectrum, whereas all other symbols sit within the short-wavelength cool spectrum.",
    attentionTip: "Chromatic feature pop-out relies on early visual cortex (V4) color opponency channels.",
  },
  {
    id: "odd-5",
    type: "odd-shape",
    difficulty: "hard",
    title: "Inner Geometry Topology",
    instructions: "Inspect the topological enclosures. Which figure has an open boundary rather than a fully enclosed perimeter?",
    visualContext: {
      layoutType: "grid",
      items: [
        { id: "i1", symbol: "⭕", label: "Closed Hollow Ring" },
        { id: "i2", symbol: "🔲", label: "Closed Hollow Square" },
        { id: "i3", symbol: "🧲", label: "Horseshoe / U-Shape (Open ended)" },
        { id: "i4", symbol: "🛑", label: "Closed Octagon" },
      ],
    },
    options: [
      { id: "a", label: "Hollow Ring (⭕)", symbol: "⭕", isCorrect: false },
      { id: "b", label: "Hollow Square (🔲)", symbol: "🔲", isCorrect: false },
      { id: "c", label: "Horseshoe U-Shape (🧲)", symbol: "🧲", isCorrect: true },
      { id: "d", label: "Octagon (🛑)", symbol: "🛑", isCorrect: false },
    ],
    explanation: "The horseshoe shape (🧲) is open at one end with two separate terminals, whereas the ring, square, and octagon form closed loops with interior containment.",
    attentionTip: "Gestalt grouping by closure helps the mind detect whether a space is protected or open.",
  },
  {
    id: "odd-6",
    type: "odd-shape",
    difficulty: "hard",
    title: "Rotational Angle Anomaly",
    instructions: "Three dials are turned to standard 90° cardinal quadrants. Which clock dial is turned to an acute 45° diagonal angle?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "🕒", label: "3:00 (90° horizontal right)" },
        { id: "i2", symbol: "🕕", label: "6:00 (180° vertical bottom)" },
        { id: "i3", symbol: "🕜", label: "1:30 (45° diagonal tilt)" },
        { id: "i4", symbol: "🕛", label: "12:00 (0° vertical top)" },
      ],
    },
    options: [
      { id: "a", label: "3:00 Dial (🕒)", symbol: "🕒", isCorrect: false },
      { id: "b", label: "6:00 Dial (🕕)", symbol: "🕕", isCorrect: false },
      { id: "c", label: "1:30 Dial (🕜)", symbol: "🕜", isCorrect: true },
      { id: "d", label: "12:00 Dial (🕛)", symbol: "🕛", isCorrect: false },
    ],
    explanation: "1:30 (🕜) positions hands on oblique diagonal angles, while 12:00, 3:00, and 6:00 are aligned strictly with cardinal orthogonal axes.",
    attentionTip: "Mental rotation exercises promote dynamic spatial transformation in working memory.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. PATTERN COMPLETION (6 Challenges)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "pat-1",
    type: "pattern-complete",
    difficulty: "easy",
    title: "Alternating Floral Rhythm",
    instructions: "Identify the missing floral element that completes the repeating sequence: 🌸 🌼 🌸 🌼 🌸 [ ? ]",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["🌸", "🌼", "🌸", "🌼", "🌸", "❓"],
    },
    options: [
      { id: "a", label: "Sunflower / Daisy (🌼)", symbol: "🌼", isCorrect: true },
      { id: "b", label: "Cherry Blossom (🌸)", symbol: "🌸", isCorrect: false },
      { id: "c", label: "Rose (🌹)", symbol: "🌹", isCorrect: false },
      { id: "d", label: "Leaf (🍃)", symbol: "🍃", isCorrect: false },
    ],
    explanation: "The pattern follows a simple alternating A-B-A-B-A-[B] rule. Following the cherry blossom (🌸), the yellow daisy (🌼) comes next.",
    attentionTip: "Alternating rhythms mirror natural biological cadences like inhalation and exhalation.",
  },
  {
    id: "pat-2",
    type: "pattern-complete",
    difficulty: "easy",
    title: "Celestial Cycle",
    instructions: "Complete the repeating day-to-night sequence: ☀️ 🌙 ☀️ 🌙 [ ? ]",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["☀️", "🌙", "☀️", "🌙", "❓"],
    },
    options: [
      { id: "a", label: "Sun (☀️)", symbol: "☀️", isCorrect: true },
      { id: "b", label: "Moon (🌙)", symbol: "🌙", isCorrect: false },
      { id: "c", label: "Star (⭐)", symbol: "⭐", isCorrect: false },
      { id: "d", label: "Cloud (☁️)", symbol: "☁️", isCorrect: false },
    ],
    explanation: "The cycle alternates between Day (☀️) and Night (🌙). After the second moon, the sun returns to begin the cycle anew.",
    attentionTip: "Recognizing diurnal patterns supports circadian pacing and mental predictability.",
  },
  {
    id: "pat-3",
    type: "pattern-complete",
    difficulty: "medium",
    title: "Progressive Vertex Count",
    instructions: "Analyze the increasing sides: Circle (0) ➔ Triangle (3) ➔ Square (4) ➔ [ ? ]",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["🟢 (0)", "🔺 (3)", "🟦 (4)", "❓"],
    },
    options: [
      { id: "a", label: "Pentagon / 5-Point Star (⭐)", symbol: "⭐", isCorrect: true },
      { id: "b", label: "Line Segment (➖)", symbol: "➖", isCorrect: false },
      { id: "c", label: "Diamond (4 sides)", symbol: "🔷", isCorrect: false },
      { id: "d", label: "Circle (0 edges)", symbol: "⚪", isCorrect: false },
    ],
    explanation: "The geometric rule is ascending vertex count: 0 ➔ 3 ➔ 4 ➔ 5. The 5-point star (⭐) correctly provides the 5 vertices.",
    attentionTip: "Numeric property abstraction allows you to look past surface visuals to find underlying math.",
  },
  {
    id: "pat-4",
    type: "pattern-complete",
    difficulty: "medium",
    title: "Color Wheel Trio Progression",
    instructions: "Complete the 3-step color group rotation: 🔴 🟡 🔵 | 🔴 🟡 [ ? ]",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["🔴", "🟡", "🔵", "🔴", "🟡", "❓"],
    },
    options: [
      { id: "a", label: "Blue Sphere (🔵)", symbol: "🔵", isCorrect: true },
      { id: "b", label: "Red Sphere (🔴)", symbol: "🔴", isCorrect: false },
      { id: "c", label: "Green Sphere (🟢)", symbol: "🟢", isCorrect: false },
      { id: "d", label: "Purple Sphere (🟣)", symbol: "🟣", isCorrect: false },
    ],
    explanation: "This sequence loops through the 3 primary colors: Red ➔ Yellow ➔ Blue. Following Yellow in the second loop is Blue (🔵).",
    attentionTip: "Loop-based chunking groups recurring items into single mental units, saving cognitive effort.",
  },
  {
    id: "pat-5",
    type: "pattern-complete",
    difficulty: "hard",
    title: "Double Reflection Inversion",
    instructions: "Find the missing element: ⬆️ ⬇️ ⬆️ | ➡️ ⬅️ ➡️ | ↗️ ↙️ [ ? ]",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["⬆️", "⬇️", "⬆️", "•", "➡️", "⬅️", "➡️", "•", "↗️", "↙️", "❓"],
    },
    options: [
      { id: "a", label: "Northeast Arrow (↗️)", symbol: "↗️", isCorrect: true },
      { id: "b", label: "Southwest Arrow (↙️)", symbol: "↙️", isCorrect: false },
      { id: "c", label: "Northwest Arrow (↖️)", symbol: "↖️", isCorrect: false },
      { id: "d", label: "Southeast Arrow (↘️)", symbol: "↘️", isCorrect: false },
    ],
    explanation: "Each triplet follows the structure: Vector A ➔ 180° Inversion B ➔ Vector A return. For Northeast (↗️) and Southwest (↙️), the return is Northeast (↗️).",
    attentionTip: "Detecting nested rules across grouped sub-series exercises hierarchical pattern recognition.",
  },
  {
    id: "pat-6",
    type: "pattern-complete",
    difficulty: "hard",
    title: "Matrix Element Expansion",
    instructions: "Notice the counting growth: 🌱 (1 sprout) ➔ 🌿 (many leaves) ➔ 🌳 (full tree) ➔ 🌲 (forest pillar). What precedes a seedling?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["❓", "🌱 (Sprout)", "🌿 (Foliage)", "🌳 (Canopy)"],
    },
    options: [
      { id: "a", label: "Seed / Acorn (🌰)", symbol: "🌰", isCorrect: true },
      { id: "b", label: "Felled Log (🪵)", symbol: "🪵", isCorrect: false },
      { id: "c", label: "Apple (🍎)", symbol: "🍎", isCorrect: false },
      { id: "d", label: "Cactus (🌵)", symbol: "🌵", isCorrect: false },
    ],
    explanation: "The botanical progression moves forward through developmental stages: Seed (🌰) ➔ Sprout (🌱) ➔ Leaves (🌿) ➔ Tree (🌳).",
    attentionTip: "Temporal progression mapping grounds attentional flow in natural life cycles.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MATCHING SYMBOLS (6 Challenges)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "mat-1",
    type: "matching-symbols",
    difficulty: "easy",
    title: "Target Beacon Locator",
    instructions: "Locate the target beacon: 🎯. Which option matches this exact symbol?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "🎯", label: "Target Bullseye" },
      ],
    },
    options: [
      { id: "a", label: "Target Bullseye (🎯)", symbol: "🎯", isCorrect: true },
      { id: "b", label: "Magic 8-Ball (🎱)", symbol: "🎱", isCorrect: false },
      { id: "c", label: "Life Preserver (🛟)", symbol: "🛟", isCorrect: false },
      { id: "d", label: "Dart Board Arrow (🏹)", symbol: "🏹", isCorrect: false },
    ],
    explanation: "Option A (🎯) is an exact visual match for the central bullseye target.",
    attentionTip: "Rapid template matching is an instinctive visual process when locating designated anchors.",
  },
  {
    id: "mat-2",
    type: "matching-symbols",
    difficulty: "easy",
    title: "Matching Twin Leaves",
    instructions: "Among the four forest gifts below, find the duplicate matching pair of identical leaves:",
    visualContext: {
      layoutType: "grid",
      items: [
        { id: "i1", symbol: "🍂", label: "Fallen Maple Leaf" },
        { id: "i2", symbol: "🍃", label: "Fluttering Green Leaf" },
        { id: "i3", symbol: "🍁", label: "Red Autumn Maple" },
        { id: "i4", symbol: "🍃", label: "Fluttering Green Leaf" },
      ],
    },
    options: [
      { id: "a", label: "Fluttering Green Leaf (🍃)", symbol: "🍃", isCorrect: true },
      { id: "b", label: "Fallen Maple (🍂)", symbol: "🍂", isCorrect: false },
      { id: "c", label: "Red Autumn Leaf (🍁)", symbol: "🍁", isCorrect: false },
      { id: "d", label: "Clover (☘️)", symbol: "☘️", isCorrect: false },
    ],
    explanation: "The fluttering green leaf (🍃) appears twice in the display, forming the duplicate pair.",
    attentionTip: "Divided attention allows you to hold multiple candidates in working memory simultaneously.",
  },
  {
    id: "mat-3",
    type: "matching-symbols",
    difficulty: "medium",
    title: "Subtle Emoticon Discrimination",
    instructions: "Target: Relieved Calm Smile 😌. Find the exact match among slightly different facial expressions:",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "😌", label: "Relieved smile (closed eyes, gentle mouth)" },
      ],
    },
    options: [
      { id: "a", label: "Relieved Smile (😌)", symbol: "😌", isCorrect: true },
      { id: "b", label: "Sleeping Face (😴)", symbol: "😴", isCorrect: false },
      { id: "c", label: "Blushing Smile (😊)", symbol: "😊", isCorrect: false },
      { id: "d", label: "Winking Face (😉)", symbol: "😉", isCorrect: false },
    ],
    explanation: "The relieved smile (😌) features gently downward curved closed eyes and a relaxed mouth, distinct from sleeping, blushing, or winking.",
    attentionTip: "Micro-facial feature discrimination trains social perceptual acuity and emotional attunement.",
  },
  {
    id: "mat-4",
    type: "matching-symbols",
    difficulty: "medium",
    title: "Musical Harmony Matching",
    instructions: "Target: Eighth Notes (🎶). Which option matches the pair of musical notes rather than a single note?",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "🎶", label: "Multiple Musical Notes" },
      ],
    },
    options: [
      { id: "a", label: "Multiple Notes (🎶)", symbol: "🎶", isCorrect: true },
      { id: "b", label: "Single Note (🎵)", symbol: "🎵", isCorrect: false },
      { id: "c", label: "Bell (🔔)", symbol: "🔔", isCorrect: false },
      { id: "d", label: "Speaker (🔊)", symbol: "🔊", isCorrect: false },
    ],
    explanation: "Option A (🎶) shows the multi-note cluster, distinguishing it from the solitary quarter note (🎵).",
    attentionTip: "Discerning quantity within similar icons strengthens focal resolution.",
  },
  {
    id: "mat-5",
    type: "matching-symbols",
    difficulty: "hard",
    title: "Chromatic Hourglass Matching",
    instructions: "Target: Finished Hourglass with sand fully collected at the base: ⌛. Distinguish it from flowing sand (⏳):",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "⌛", label: "Hourglass with sand settled at bottom" },
      ],
    },
    options: [
      { id: "a", label: "Settled Hourglass (⌛)", symbol: "⌛", isCorrect: true },
      { id: "b", label: "Flowing Hourglass (⏳)", symbol: "⏳", isCorrect: false },
      { id: "c", label: "Alarm Clock (⏰)", symbol: "⏰", isCorrect: false },
      { id: "d", label: "Stopwatch (⏱️)", symbol: "⏱️", isCorrect: false },
    ],
    explanation: "The settled hourglass (⌛) represents completed flow with horizontal resting sand, whereas the active hourglass (⏳) shows sand actively in motion.",
    attentionTip: "Noticing internal states within identically framed tools refines fine-detail processing.",
  },
  {
    id: "mat-6",
    type: "matching-symbols",
    difficulty: "hard",
    title: "Constellation Star Discrimination",
    instructions: "Target: Glowing Sparkle (❇️). Find the exact 8-ray asterisk match among 4-point, 5-point, and 12-point stars:",
    visualContext: {
      layoutType: "row",
      items: [
        { id: "i1", symbol: "❇️", label: "Green Sparkle Asterisk" },
      ],
    },
    options: [
      { id: "a", label: "Green Sparkle Asterisk (❇️)", symbol: "❇️", isCorrect: true },
      { id: "b", label: "Eight-Spoked Star (✳️)", symbol: "✳️", isCorrect: false },
      { id: "c", label: "Four-Point Star (✨)", symbol: "✨", isCorrect: false },
      { id: "d", label: "Star of David / Hexagram (✡️)", symbol: "✡️", isCorrect: false },
    ],
    explanation: "Option A (❇️) matches the diamond-faceted sparkle rays, while ✳️ has thin wire lines and ✨ shows clustered 4-point flares.",
    attentionTip: "High-density stroke analysis exercises peripheral-to-foveal zoom control.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SEQUENCE MEMORY (6 Challenges)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "seq-1",
    type: "sequence-memory",
    difficulty: "easy",
    title: "Three Elements Recall",
    instructions: "Remember this 3-item nature sequence: 💧 ➔ 🌱 ➔ ☀️. Which option lists them in the exact order?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["💧 (Water)", "🌱 (Seedling)", "☀️ (Sunlight)"],
    },
    options: [
      { id: "a", label: "💧 Water ➔ 🌱 Seedling ➔ ☀️ Sunlight", symbol: "💧🌱☀️", isCorrect: true },
      { id: "b", label: "🌱 Seedling ➔ 💧 Water ➔ ☀️ Sunlight", symbol: "🌱💧☀️", isCorrect: false },
      { id: "c", label: "☀️ Sunlight ➔ 💧 Water ➔ 🌱 Seedling", symbol: "☀️💧🌱", isCorrect: false },
      { id: "d", label: "💧 Water ➔ ☀️ Sunlight ➔ 🌱 Seedling", symbol: "💧☀️🌱", isCorrect: false },
    ],
    explanation: "Watering the soil (💧) prompts the sprout to rise (🌱) towards the warm sun (☀️).",
    attentionTip: "Narrative chaining ('Water feeds the sprout under the sun') binds items into a single memory trace.",
  },
  {
    id: "seq-2",
    type: "sequence-memory",
    difficulty: "easy",
    title: "Traffic Light Flow",
    instructions: "Recall the sequence: 🔴 ➔ 🟡 ➔ 🟢. Which sequence preserves this progression?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["🔴 (Red)", "🟡 (Yellow)", "🟢 (Green)"],
    },
    options: [
      { id: "a", label: "🔴 Red ➔ 🟡 Yellow ➔ 🟢 Green", symbol: "🔴🟡🟢", isCorrect: true },
      { id: "b", label: "🟢 Green ➔ 🟡 Yellow ➔ 🔴 Red", symbol: "🟢🟡🔴", isCorrect: false },
      { id: "c", label: "🟡 Yellow ➔ 🔴 Red ➔ 🟢 Green", symbol: "🟡🔴🟢", isCorrect: false },
      { id: "d", label: "🔴 Red ➔ 🟢 Green ➔ 🟡 Yellow", symbol: "🔴🟢🟡", isCorrect: false },
    ],
    explanation: "The standard sequence moves from Red through transition Yellow into Green.",
    attentionTip: "Associating abstract sequences with familiar schemas makes recall nearly effortless.",
  },
  {
    id: "seq-3",
    type: "sequence-memory",
    difficulty: "medium",
    title: "Four Seasons Walk",
    instructions: "Remember this 4-station journey: 🌸 (Spring) ➔ ☀️ (Summer) ➔ 🍂 (Autumn) ➔ ❄️ (Winter). Which order is correct?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["🌸", "☀️", "🍂", "❄️"],
    },
    options: [
      { id: "a", label: "🌸 ➔ ☀️ ➔ 🍂 ➔ ❄️", symbol: "🌸☀️🍂❄️", isCorrect: true },
      { id: "b", label: "🌸 ➔ 🍂 ➔ ☀️ ➔ ❄️", symbol: "🌸🍂☀️❄️", isCorrect: false },
      { id: "c", label: "❄️ ➔ 🍂 ➔ ☀️ ➔ 🌸", symbol: "❄️🍂☀️🌸", isCorrect: false },
      { id: "d", label: "☀️ ➔ 🌸 ➔ ❄️ ➔ 🍂", symbol: "☀️🌸❄️🍂", isCorrect: false },
    ],
    explanation: "Spring blooms (🌸) transition to Summer warmth (☀️), Autumn leaves (🍂), and Winter frost (❄️).",
    attentionTip: "Mental chronological timelines leverage episodic memory structures in the hippocampus.",
  },
  {
    id: "seq-4",
    type: "sequence-memory",
    difficulty: "medium",
    title: "Rhythmic Heartbeat Cadence",
    instructions: "Recall the 4-beat rhythm: 💓 ➔ 💙 ➔ 💓 ➔ 💜. Which pattern matches the heart sequence?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["💓 (Pink Pulse)", "💙 (Blue Calm)", "💓 (Pink Pulse)", "💜 (Purple Peace)"],
    },
    options: [
      { id: "a", label: "💓 Pink ➔ 💙 Blue ➔ 💓 Pink ➔ 💜 Purple", symbol: "💓💙💓💜", isCorrect: true },
      { id: "b", label: "💙 Blue ➔ 💓 Pink ➔ 💜 Purple ➔ 💓 Pink", symbol: "💙💓💜💓", isCorrect: false },
      { id: "c", label: "💓 Pink ➔ 💜 Purple ➔ 💓 Pink ➔ 💙 Blue", symbol: "💓💜💓💙", isCorrect: false },
      { id: "d", label: "💓 Pink ➔ 💓 Pink ➔ 💙 Blue ➔ 💜 Purple", symbol: "💓💓💙💜", isCorrect: false },
    ],
    explanation: "The cadence alternates Pink to Blue, returns to Pink, then resolves to Purple.",
    attentionTip: "Internal auditory pacing ('Pulse, Blue, Pulse, Purple') adds an auditory loop to visual memory.",
  },
  {
    id: "seq-5",
    type: "sequence-memory",
    difficulty: "hard",
    title: "Five-Star Orbit",
    instructions: "Memorize the 5-symbol celestial orbit: ⭐ ➔ 🌙 ➔ 🪐 ➔ ☄️ ➔ ☀️. Which reproduces all five in exact order?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["⭐ (Star)", "🌙 (Moon)", "🪐 (Saturn)", "☄️ (Comet)", "☀️ (Sun)"],
    },
    options: [
      { id: "a", label: "⭐ ➔ 🌙 ➔ 🪐 ➔ ☄️ ➔ ☀️", symbol: "⭐🌙🪐☄️☀️", isCorrect: true },
      { id: "b", label: "⭐ ➔ 🌙 ➔ ☄️ ➔ 🪐 ➔ ☀️", symbol: "⭐🌙☄️🪐☀️", isCorrect: false },
      { id: "c", label: "🌙 ➔ ⭐ ➔ 🪐 ➔ ☄️ ➔ ☀️", symbol: "🌙⭐🪐☄️☀️", isCorrect: false },
      { id: "d", label: "⭐ ➔ 🪐 ➔ 🌙 ➔ ☀️ ➔ ☄️", symbol: "⭐🪐🌙☀️☄️", isCorrect: false },
    ],
    explanation: "The sequence progresses: Star ➔ Moon ➔ Saturn ➔ Comet ➔ Sun.",
    attentionTip: "Chunking 5 items into 2 groups (Star-Moon, then Saturn-Comet-Sun) keeps you within working memory capacity (Miller's 7±2).",
  },
  {
    id: "seq-6",
    type: "sequence-memory",
    difficulty: "hard",
    title: "Grounding Senses Countdown",
    instructions: "Recall the 5 senses sequence: 👁️ (See) ➔ ✋ (Touch) ➔ 👂 (Hear) ➔ 👃 (Smell) ➔ 👅 (Taste). Which is correct?",
    visualContext: {
      layoutType: "sequence",
      sequenceItems: ["👁️", "✋", "👂", "👃", "👅"],
    },
    options: [
      { id: "a", label: "👁️ See ➔ ✋ Touch ➔ 👂 Hear ➔ 👃 Smell ➔ 👅 Taste", symbol: "👁️✋👂👃👅", isCorrect: true },
      { id: "b", label: "👁️ See ➔ 👂 Hear ➔ ✋ Touch ➔ 👃 Smell ➔ 👅 Taste", symbol: "👁️👂✋👃👅", isCorrect: false },
      { id: "c", label: "✋ Touch ➔ 👁️ See ➔ 👂 Hear ➔ 👅 Taste ➔ 👃 Smell", symbol: "✋👁️👂👅👃", isCorrect: false },
      { id: "d", label: "👁️ See ➔ ✋ Touch ➔ 👃 Smell ➔ 👂 Hear ➔ 👅 Taste", symbol: "👁️✋👃👂👅", isCorrect: false },
    ],
    explanation: "This matches the clinical 5-4-3-2-1 somatic grounding sequence: Vision (5), Tactile (4), Auditory (3), Olfactory (2), Gustatory (1).",
    attentionTip: "Somatic anchoring connects cognitive memory directly with physical bodily presence.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SPOT THE DIFFERENCE (6 Challenges)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "spot-1",
    type: "spot-difference",
    difficulty: "easy",
    title: "The Garden Vista",
    instructions: "Compare Scene A and Scene B. Exactly one element in Scene B has been altered. What changed?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Scene A (Original Garden)",
        elements: ["🌳", "🏡", "🌻", "☀️"],
        details: "Tree on left, cozy house in middle, blooming sunflower, radiant sun in sky.",
      },
      rightScene: {
        title: "Scene B (Subtle Change)",
        elements: ["🌳", "🏡", "🌻", "🌧️"],
        details: "Tree on left, cozy house in middle, blooming sunflower, gentle rain cloud in sky.",
      },
    },
    options: [
      { id: "a", label: "The Sun (☀️) changed into a Rain Cloud (🌧️)", symbol: "☀️ ➔ 🌧️", isCorrect: true },
      { id: "b", label: "The Tree (🌳) changed into a Flower", symbol: "🌳 ➔ 🌺", isCorrect: false },
      { id: "c", label: "The House (🏡) disappeared", symbol: "🏡", isCorrect: false },
      { id: "d", label: "The Sunflower (🌻) changed color", symbol: "🌻", isCorrect: false },
    ],
    explanation: "In Scene A the sky contains a radiant sun (☀️), while in Scene B it has shifted into a gentle rain cloud (🌧️).",
    attentionTip: "Systematic quadrant scanning (top-left, top-right, bottom-left, bottom-right) prevents missing peripheral changes.",
  },
  {
    id: "spot-2",
    type: "spot-difference",
    difficulty: "easy",
    title: "Tea Table Gathering",
    instructions: "Compare Table A and Table B. Which item on Table B has been substituted?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Table A",
        elements: ["🍵", "🫖", "🍪", "🕯️"],
        details: "Green tea cup, teapot, cookie, warm candle.",
      },
      rightScene: {
        title: "Table B",
        elements: ["🍵", "🫖", "🧁", "🕯️"],
        details: "Green tea cup, teapot, frosted cupcake, warm candle.",
      },
    },
    options: [
      { id: "a", label: "The Cookie (🍪) was replaced by a Cupcake (🧁)", symbol: "🍪 ➔ 🧁", isCorrect: true },
      { id: "b", label: "The Teapot (🫖) was replaced by a Coffee Pot", symbol: "🫖", isCorrect: false },
      { id: "c", label: "The Candle (🕯️) was blown out", symbol: "🕯️", isCorrect: false },
      { id: "d", label: "The Green Tea (🍵) changed into Water", symbol: "🍵", isCorrect: false },
    ],
    explanation: "The cookie (🍪) in the lower-left slot was swapped for a frosted cupcake (🧁).",
    attentionTip: "Pairwise item matching quickly flags substitutions in structured arrays.",
  },
  {
    id: "spot-3",
    type: "spot-difference",
    difficulty: "medium",
    title: "Night Sky Constellation",
    instructions: "Inspect both celestial arrangements. What object appeared in Sky B that was absent in Sky A?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Sky A",
        elements: ["🌙", "⭐", "⭐", "🌌"],
        details: "Crescent moon, two stars, milky way backdrop.",
      },
      rightScene: {
        title: "Sky B",
        elements: ["🌙", "⭐", "⭐", "🛸", "🌌"],
        details: "Crescent moon, two stars, flying saucer, milky way backdrop.",
      },
    },
    options: [
      { id: "a", label: "A Flying Saucer (🛸) arrived in Sky B", symbol: "🛸 Added", isCorrect: true },
      { id: "b", label: "One Star (⭐) went dark", symbol: "⭐ Missing", isCorrect: false },
      { id: "c", label: "The Moon (🌙) became full", symbol: "🌕", isCorrect: false },
      { id: "d", label: "The Milky Way (🌌) disappeared", symbol: "🌌 Missing", isCorrect: false },
    ],
    explanation: "Sky B has an additional element: a flying saucer (🛸) traversing the space between the stars.",
    attentionTip: "Density counting (4 items in Scene A vs. 5 in Scene B) immediately flags insertions.",
  },
  {
    id: "spot-4",
    type: "spot-difference",
    difficulty: "medium",
    title: "Sanctuary Bookshelf",
    instructions: "Compare Bookshelf A and Bookshelf B. Which item was rearranged or removed?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Bookshelf A",
        elements: ["📚", "🪴", "⏰", "🧸"],
        details: "Books stack, potted plant, alarm clock, teddy bear.",
      },
      rightScene: {
        title: "Bookshelf B",
        elements: ["📚", "🪴", "⏳", "🧸"],
        details: "Books stack, potted plant, hourglass, teddy bear.",
      },
    },
    options: [
      { id: "a", label: "The Alarm Clock (⏰) was replaced by an Hourglass (⏳)", symbol: "⏰ ➔ ⏳", isCorrect: true },
      { id: "b", label: "The Potted Plant (🪴) lost its leaves", symbol: "🪴", isCorrect: false },
      { id: "c", label: "The Books (📚) were closed", symbol: "📚", isCorrect: false },
      { id: "d", label: "The Teddy Bear (🧸) was removed", symbol: "🧸", isCorrect: false },
    ],
    explanation: "The mechanical alarm clock (⏰) on shelf 3 was substituted with a quiet sand hourglass (⏳).",
    attentionTip: "Noticing functional tool replacements promotes flexible cognitive schema switching.",
  },
  {
    id: "spot-5",
    type: "spot-difference",
    difficulty: "hard",
    title: "Forest Stream Ecosystem",
    instructions: "Examine both riparian stream scenes. Which animal guest has quietly moved into Stream B?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Stream A",
        elements: ["🏞️", "🐟", "🦆", "🪨", "🪵"],
        details: "Mountain stream, leaping fish, swimming duck, river rock, mossy log.",
      },
      rightScene: {
        title: "Stream B",
        elements: ["🏞️", "🐟", "🦆", "🐸", "🪵"],
        details: "Mountain stream, leaping fish, swimming duck, sitting frog, mossy log.",
      },
    },
    options: [
      { id: "a", label: "The River Rock (🪨) was replaced by a Green Frog (🐸)", symbol: "🪨 ➔ 🐸", isCorrect: true },
      { id: "b", label: "The Duck (🦆) flew away", symbol: "🦆 Missing", isCorrect: false },
      { id: "c", label: "The Fish (🐟) changed swimming direction", symbol: "🐟 Flipped", isCorrect: false },
      { id: "d", label: "The Log (🪵) floated downriver", symbol: "🪵 Missing", isCorrect: false },
    ],
    explanation: "Where the river rock (🪨) sat beside the water in Stream A, a friendly green frog (🐸) is now perched in Stream B.",
    attentionTip: "Attending to inanimate vs. animate swaps exercises semantic object categorization.",
  },
  {
    id: "spot-6",
    type: "spot-difference",
    difficulty: "hard",
    title: "Nightstand Mindful Setup",
    instructions: "Compare Nightstand A and Nightstand B. What small nighttime item was subtly added to Nightstand B?",
    visualContext: {
      layoutType: "comparison",
      leftScene: {
        title: "Nightstand A",
        elements: ["📖", "👓", "💧", "🕯️"],
        details: "Journal, reading glasses, water glass, soothing candle.",
      },
      rightScene: {
        title: "Nightstand B",
        elements: ["📖", "👓", "💧", "🕯️", "🎧"],
        details: "Journal, reading glasses, water glass, soothing candle, and sleep headphones.",
      },
    },
    options: [
      { id: "a", label: "Sleep Headphones (🎧) were added to Nightstand B", symbol: "🎧 Added", isCorrect: true },
      { id: "b", label: "The Candle (🕯️) melted completely", symbol: "🕯️ Melted", isCorrect: false },
      { id: "c", label: "The Reading Glasses (👓) were folded", symbol: "👓 Folded", isCorrect: false },
      { id: "d", label: "The Water Glass (💧) was emptied", symbol: "💧 Empty", isCorrect: false },
    ],
    explanation: "Nightstand B contains all four original items plus sleep headphones (🎧) laid out for evening soundscapes.",
    attentionTip: "Detecting peripheral additions without disruption sharpens holistic visual field vigilance.",
  },
];
