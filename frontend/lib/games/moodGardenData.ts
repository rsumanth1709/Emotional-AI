/**
 * MindCare AI — Mood Garden Botanical & Wellness Nurture Configuration
 * 
 * Clinical, non-punitive virtual garden celebrating all human emotional states.
 * Tears and rain water the soil just as much as sunshine. Zero streaks, zero guilt.
 */

export type PlantStage = "empty" | "seed" | "sprout" | "bud" | "bloom";

export interface PlantVariety {
  id: string;
  name: string;
  meaning: string;
  nurturedBy: string;
  accentColor: string;
  emoji: string;
  stages: {
    seed: { label: string; icon: string; desc: string };
    sprout: { label: string; icon: string; desc: string };
    bud: { label: string; icon: string; desc: string };
    bloom: { label: string; icon: string; desc: string };
  };
}

export interface GardenDecoration {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tokenCost: number;
}

export interface GardenPlotState {
  plot_index: number;
  plant_id: string | null;
  stage: PlantStage;
  planted_at: string | null;
}

export const PLANT_VARIETIES: Record<string, PlantVariety> = {
  lavender: {
    id: "lavender",
    name: "Calm Lavender",
    meaning: "Gentle Pacing & Nervous System Ease",
    nurturedBy: "Deep breathwork & quiet moments",
    accentColor: "from-purple-400 to-indigo-500",
    emoji: "🪻",
    stages: {
      seed: { label: "Planted Seed", icon: "🌱", desc: "Resting comfortably in cool, damp soil." },
      sprout: { label: "Green Shoot", icon: "🌿", desc: "A slender green shoot reaching toward the morning sky." },
      bud: { label: "Purple Bud", icon: "🌾", desc: "Tiny violet buds swelling with soothing aromatic oils." },
      bloom: { label: "Fragrant Lavender", icon: "🪻", desc: "Full, velvety bloom releasing a calming fragrance." },
    },
  },
  sunflower: {
    id: "sunflower",
    name: "Hope Sunflower",
    meaning: "Warmth & Spotting Small Daily Joys",
    nurturedBy: "Gratitude reflections & shared smiles",
    accentColor: "from-amber-400 to-orange-500",
    emoji: "🌻",
    stages: {
      seed: { label: "Golden Seed", icon: "🌱", desc: "Nestled safely underneath the warm earth." },
      sprout: { label: "Sturdy Seedling", icon: "🌿", desc: "Two hearty leaves unfurling toward the light." },
      bud: { label: "Green Coronet", icon: "🌾", desc: "A heavy round bud waiting for dawn's golden light." },
      bloom: { label: "Radiant Sunflower", icon: "🌻", desc: "Bright golden petals following the sun's trajectory." },
    },
  },
  fern: {
    id: "fern",
    name: "Resilience Fern",
    meaning: "Thriving in Shadows & Emotional Honesty",
    nurturedBy: "Honoring sadness, grief, and quiet tears",
    accentColor: "from-emerald-500 to-teal-600",
    emoji: "🌿",
    stages: {
      seed: { label: "Woodland Spore", icon: "🌱", desc: "A tiny spore taking root in rich moss." },
      sprout: { label: "Curled Fiddlehead", icon: "🌀", desc: "A resilient spiral patiently preparing to uncoil." },
      bud: { label: "Unfurling Frond", icon: "🍃", desc: "Delicate lace-like fronds opening horizontally." },
      bloom: { label: "Lush Ancient Fern", icon: "🌿", desc: "Vibrant, verdant fronds that flourish in rainfall." },
    },
  },
  rose: {
    id: "rose",
    name: "Compassion Rose",
    meaning: "Self-Kindness & Forgiving One's Imperfections",
    nurturedBy: "Compassion whispers & gentle boundary-setting",
    accentColor: "from-rose-400 to-pink-600",
    emoji: "🌹",
    stages: {
      seed: { label: "Tender Cutting", icon: "🌱", desc: "Rooting gently into nourishing loam." },
      sprout: { label: "Thorny Stem", icon: "🌿", desc: "A strong cane growing protective defenses." },
      bud: { label: "Crimson Rosebud", icon: "🌷", desc: "Petals tightly embraced in a protective spiral." },
      bloom: { label: "Velvet Rose", icon: "🌹", desc: "Rich, fragrant petals open in vulnerability and grace." },
    },
  },
  lotus: {
    id: "lotus",
    name: "Mindful Lotus",
    meaning: "Purity of Presence Rising from Silt",
    nurturedBy: "Meditative pauses & mindful grounding",
    accentColor: "from-cyan-400 to-teal-500",
    emoji: "🪷",
    stages: {
      seed: { label: "Aquatic Seed", icon: "🌱", desc: "Anchored in still, fertile waterbed silt." },
      sprout: { label: "Submerged Stem", icon: "🌿", desc: "Rising steadily through dark, cool water." },
      bud: { label: "Floating Bud", icon: "🌾", desc: "Resting upon a wide emerald lily pad." },
      bloom: { label: "Sacred Lotus Blossom", icon: "🪷", desc: "Untouched by the silt, shining in radiant peace." },
    },
  },
  marigold: {
    id: "marigold",
    name: "Courage Marigold",
    meaning: "Brave Action in the Face of Uncertainty",
    nurturedBy: "Facing fear & taking value-aligned steps",
    accentColor: "from-orange-400 to-amber-600",
    emoji: "🌼",
    stages: {
      seed: { label: "Hardy Seed", icon: "🌱", desc: "Ready to weather frost and spring winds." },
      sprout: { label: "Pinnate Leaves", icon: "🌿", desc: "Feathery leaves standing upright and proud." },
      bud: { label: "Tightly Packed Bud", icon: "🌾", desc: "Petals wound tightly like a ball of amber yarn." },
      bloom: { label: "Blazing Marigold", icon: "🌼", desc: "Dense golden blossoms protecting garden soil." },
    },
  },
};

export const GARDEN_DECORATIONS: GardenDecoration[] = [
  {
    id: "lantern",
    name: "Zen Stone Lantern",
    description: "Casts a warm, gentle amber glow over garden paths at dusk.",
    emoji: "🏮",
    tokenCost: 1,
  },
  {
    id: "bench",
    name: "Cedar Contemplation Bench",
    description: "A peaceful wooden seat to rest, breathe, and gaze at your flowers.",
    emoji: "🪑",
    tokenCost: 2,
  },
  {
    id: "fountain",
    name: "Bamboo Stone Fountain",
    description: "Rippling water producing soothing pink noise for garden visitors.",
    emoji: "⛲",
    tokenCost: 3,
  },
  {
    id: "chimes",
    name: "Wind Song Chimes",
    description: "Soft metallic and bamboo harmonies responding to gentle breezes.",
    emoji: "🎐",
    tokenCost: 2,
  },
  {
    id: "lights",
    name: "Fairy Twinkle Lights",
    description: "Delicate warm light orbs strung along the garden borders.",
    emoji: "✨",
    tokenCost: 2,
  },
  {
    id: "stones",
    name: "Stacked River Stones",
    description: "Smooth basalt stones balanced in meditative equilibrium.",
    emoji: "🪨",
    tokenCost: 1,
  },
];

export const VALID_MOODS = [
  { id: "calm", label: "Calm / Peaceful", emoji: "🫧", color: "text-sky-500", note: "Stillness settles into the soil." },
  { id: "anxious", label: "Anxious / Restless", emoji: "⚡", color: "text-amber-500", note: "Your honest feeling grounds the roots." },
  { id: "sad", label: "Sad / Grieving", emoji: "🌧️", color: "text-blue-500", note: "Tears are the rain that feeds the earth." },
  { id: "joyful", label: "Joyful / Hopeful", emoji: "☀️", color: "text-yellow-500", note: "Warm sunshine bathes the garden." },
  { id: "tired", label: "Tired / Burned Out", emoji: "🌙", color: "text-indigo-400", note: "Rest is when roots quietly grow deep." },
  { id: "frustrated", label: "Frustrated / Tense", emoji: "🔥", color: "text-rose-500", note: "Honest emotion brings needed renewal." },
  { id: "grateful", label: "Grateful / Content", emoji: "🌿", color: "text-emerald-500", note: "Gratitude enriches the garden soil." },
];
