/**
 * MindCare AI — Emotion Memory Match Game Data & Generator
 *
 * Clinical & Educational Principles:
 * 1. Emotional Granularity: Differentiating nuanced emotions (e.g., Frustration vs Anger, Awe vs Joy)
 *    promotes cognitive reappraisal and parasympathetic down-regulation.
 * 2. Non-Prescriptive Coping: Coping practices are personal experiments and suggestions,
 *    never universal mandates or forced positive thinking.
 * 3. Zero Happiness Bias: Challenging emotions (sadness, grief, fear, anger) are natural,
 *    valid human signals deserving of equal recognition and care.
 */

export type GameMode = "match-pairs" | "emotion-word" | "emotion-strategy";
export type Difficulty = "easy" | "medium" | "hard";

export interface EmotionEntity {
  id: string;
  name: string;
  emoji: string;
  category: "pleasant" | "challenging" | "regulating" | "reflective";
  somaticExpression: string;
  wordDefinition: string;
  copingStrategyTitle: string;
  copingStrategyDetail: string;
  copingCaveat: string;
  accentGradient: string;
  borderTheme: string;
  bgLight: string;
  textColor: string;
}

export interface EmotionCardItem {
  id: string;
  pairId: string;
  cardRole: "primary" | "secondary";
  gameMode: GameMode;
  title: string;
  subtext: string;
  badgeText: string;
  emoji: string;
  detail: string;
  accentGradient: string;
  borderTheme: string;
  bgLight: string;
  textColor: string;
}

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; pairs: number; totalCards: number; gridCols: string; xpReward: number; description: string }
> = {
  easy: {
    label: "Gentle",
    pairs: 6,
    totalCards: 12,
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    xpReward: 60,
    description: "6 Pairs (12 Cards) — Relaxing, low cognitive load",
  },
  medium: {
    label: "Balanced",
    pairs: 8,
    totalCards: 16,
    gridCols: "grid-cols-2 sm:grid-cols-4",
    xpReward: 80,
    description: "8 Pairs (16 Cards) — Standard memory challenge",
  },
  hard: {
    label: "Deep Focus",
    pairs: 12,
    totalCards: 24,
    gridCols: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
    xpReward: 120,
    description: "12 Pairs (24 Cards) — Expansive emotional granularity exploration",
  },
};

export const GAME_MODES: Record<
  GameMode,
  { title: string; subtitle: string; icon: string; explanation: string }
> = {
  "match-pairs": {
    title: "Mode A: Emotion Matching",
    subtitle: "Twin Emotion Pairs",
    icon: "🎴",
    explanation: "Match pairs of identical emotional states to sharpen visual recognition and somatic awareness.",
  },
  "emotion-word": {
    title: "Mode B: Emotion & Vocabulary",
    subtitle: "Face & Linguistic Label",
    icon: "📖",
    explanation: "Match an emotional expression with its nuanced psychological definition to build emotional granularity ('Name it to tame it').",
  },
  "emotion-strategy": {
    title: "Mode C: Emotion & Coping Strategy",
    subtitle: "Feeling & Soothing Practice",
    icon: "🛡️",
    explanation: "Pair an intense emotional state with a supportive, evidence-based self-regulation practice. (Remember: tools are personal experiments, not one-size-fits-all prescriptions).",
  },
};

export const EMOTIONS_DATASET: EmotionEntity[] = [
  {
    id: "anxiety",
    name: "Anxiety",
    emoji: "🌪️",
    category: "challenging",
    somaticExpression: "Fluttering stomach, shallow chest breathing, restless pacing.",
    wordDefinition: "Apprehension and hyper-vigilance about anticipated future uncertainties.",
    copingStrategyTitle: "5-4-3-2-1 Sensory Grounding",
    copingStrategyDetail: "Acknowledge 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 slow breath.",
    copingCaveat: "Grounding works best when done gently without forcing instant calmness.",
    accentGradient: "from-amber-500 to-orange-600",
    borderTheme: "border-amber-400 dark:border-amber-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/40",
    textColor: "text-amber-800 dark:text-amber-300",
  },
  {
    id: "grief",
    name: "Sadness & Grief",
    emoji: "🌧️",
    category: "challenging",
    somaticExpression: "Heaviness behind eyes, slumped posture, quiet slowdown in energy.",
    wordDefinition: "A natural, healthy emotional response to loss, disappointment, or unfulfilled longing.",
    copingStrategyTitle: "Compassionate Self-Holding",
    copingStrategyDetail: "Place a gentle hand over your chest, wrap up in a warm blanket, and allow tears without self-criticism.",
    copingCaveat: "Grief requires space to be felt; trying to rush out of sadness can increase suffering.",
    accentGradient: "from-blue-500 to-indigo-600",
    borderTheme: "border-blue-400 dark:border-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/40",
    textColor: "text-blue-800 dark:text-blue-300",
  },
  {
    id: "anger",
    name: "Anger & Frustration",
    emoji: "🔥",
    category: "challenging",
    somaticExpression: "Heat in the face, clenched jaw, tightened fists, rapid adrenaline surge.",
    wordDefinition: "An invigorating boundary signal highlighting perceived injustice, obstruction, or violated limits.",
    copingStrategyTitle: "Physical Discharge & Cool Reset",
    copingStrategyDetail: "Shake out your hands briskly, splash cold water on your wrists, and take 3 deep sighs before responding.",
    copingCaveat: "Anger is valid information about boundaries; the goal is mindful channelization, not suppression.",
    accentGradient: "from-rose-500 to-red-600",
    borderTheme: "border-rose-400 dark:border-rose-500",
    bgLight: "bg-rose-50 dark:bg-rose-950/40",
    textColor: "text-rose-800 dark:text-rose-300",
  },
  {
    id: "overwhelm",
    name: "Overwhelm",
    emoji: "🌊",
    category: "challenging",
    somaticExpression: "Mental fog, sensory hypersensitivity, feeling paralyzed by decisions.",
    wordDefinition: "Cognitive and sensory capacity exceeded by simultaneous demands and input.",
    copingStrategyTitle: "Radical Task Triage (Pick Only 1)",
    copingStrategyDetail: "Close 10 browser tabs, step away from screens for 5 minutes, and choose just one micro-step for now.",
    copingCaveat: "Overwhelm signals an overloaded nervous system, not personal inadequacy.",
    accentGradient: "from-cyan-600 to-blue-700",
    borderTheme: "border-cyan-400 dark:border-cyan-500",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/40",
    textColor: "text-cyan-800 dark:text-cyan-300",
  },
  {
    id: "loneliness",
    name: "Loneliness",
    emoji: "🍂",
    category: "challenging",
    somaticExpression: "Hollow ache in the chest, feeling invisible, low social stamina.",
    wordDefinition: "Subjective distress arising from a perceived gap between desired and actual social connection.",
    copingStrategyTitle: "Low-Pressure Micro-Connection",
    copingStrategyDetail: "Send a brief meme or warm text to a friendly contact, or take a gentle stroll around people in a park or cafe.",
    copingCaveat: "Loneliness does not mean you are unlovable; it is an instinctual drive for community.",
    accentGradient: "from-stone-500 to-slate-700",
    borderTheme: "border-stone-400 dark:border-stone-500",
    bgLight: "bg-stone-50 dark:bg-stone-900/40",
    textColor: "text-stone-800 dark:text-stone-300",
  },
  {
    id: "shame",
    name: "Shame & Vulnerability",
    emoji: "🛡️",
    category: "challenging",
    somaticExpression: "Urge to shrink, avert gaze, feeling exposed and flawed.",
    wordDefinition: "Painful belief that one is fundamentally defective, unworthy, or rejected by the group.",
    copingStrategyTitle: "Common Humanity & Safe Disclosure",
    copingStrategyDetail: "Remind yourself: 'Millions have felt this awkward or flawed.' Share the feeling with one empathetic, non-judgmental friend.",
    copingCaveat: "Shame thrives in secrecy and silence; speaking it to a safe person diminishes its power.",
    accentGradient: "from-violet-600 to-purple-800",
    borderTheme: "border-violet-400 dark:border-violet-500",
    bgLight: "bg-violet-50 dark:bg-violet-950/40",
    textColor: "text-violet-800 dark:text-violet-300",
  },
  {
    id: "calmness",
    name: "Calmness & Serenity",
    emoji: "🍃",
    category: "regulating",
    somaticExpression: "Soft shoulders, unclenched jaw, slow diaphragmatic breaths.",
    wordDefinition: "A tranquil physiological state where parasympathetic 'rest-and-digest' is engaged.",
    copingStrategyTitle: "Somatic Anchor & Gratitude Encoding",
    copingStrategyDetail: "Pause and notice the ease in your chest. Savor this safety for 20 seconds so the brain consolidates positive memory.",
    copingCaveat: "Calmness is a transient state, not a permanent expectation.",
    accentGradient: "from-emerald-500 to-teal-600",
    borderTheme: "border-emerald-400 dark:border-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-800 dark:text-emerald-300",
  },
  {
    id: "joy",
    name: "Joy & Savoring",
    emoji: "☀️",
    category: "pleasant",
    somaticExpression: "Warm expansiveness in chest, relaxed upright posture, spontaneous smiling.",
    wordDefinition: "An uplifting, high-vibe emotional state accompanying connection, achievement, or beauty.",
    copingStrategyTitle: "Mindful Savoring & Celebration",
    copingStrategyDetail: "Take a mental photograph of this moment, name three sensory details, and share the good news with someone you trust.",
    copingCaveat: "Savoring is allowed even during turbulent life seasons; joy and struggle often coexist.",
    accentGradient: "from-yellow-400 to-amber-500",
    borderTheme: "border-yellow-400 dark:border-yellow-500",
    bgLight: "bg-yellow-50 dark:bg-yellow-950/40",
    textColor: "text-yellow-800 dark:text-yellow-300",
  },
  {
    id: "fear",
    name: "Fear & Panic",
    emoji: "⚡",
    category: "challenging",
    somaticExpression: "Pounding heart, dry mouth, tunnel vision, intense urge to escape.",
    wordDefinition: "An immediate biological alarm response to perceived imminent danger or severe threat.",
    copingStrategyTitle: "Physiological Sigh & Body Anchor",
    copingStrategyDetail: "Take two quick inhales through your nose, followed by a long, slow exhale through your mouth. Repeat 3 times.",
    copingCaveat: "When panic strikes, logic is temporarily offline; physical regulation comes before rational thinking.",
    accentGradient: "from-purple-600 to-indigo-800",
    borderTheme: "border-purple-400 dark:border-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/40",
    textColor: "text-purple-800 dark:text-purple-300",
  },
  {
    id: "guilt",
    name: "Guilt & Regret",
    emoji: "⚖️",
    category: "reflective",
    somaticExpression: "Knot in stomach, internal moral rumination, heavy heart.",
    wordDefinition: "Discomfort stemming from recognizing that one's actions contradicted personal values or hurt someone.",
    copingStrategyTitle: "Values-Based Active Repair",
    copingStrategyDetail: "Differentiate guilt ('I made a mistake') from shame ('I am a mistake'). Offer a sincere apology or amend if appropriate.",
    copingCaveat: "Healthy guilt prompts constructive repair; obsessive self-punishment does not heal relationships.",
    accentGradient: "from-sky-600 to-indigo-700",
    borderTheme: "border-sky-400 dark:border-sky-500",
    bgLight: "bg-sky-50 dark:bg-sky-950/40",
    textColor: "text-sky-800 dark:text-sky-300",
  },
  {
    id: "awe",
    name: "Awe & Wonder",
    emoji: "🌌",
    category: "reflective",
    somaticExpression: "Goosebumps, wide eyes, deep spontaneous inhalation, feeling delightfully small.",
    wordDefinition: "The emotional response to perceptually vast stimuli that transcend current mental frames.",
    copingStrategyTitle: "Nature & Fractal Immersion",
    copingStrategyDetail: "Gaze at the night sky, towering trees, or intricate architecture to down-regulate the brain's default mode network.",
    copingCaveat: "Even 60 seconds of looking at clouds or leaves can induce micro-moments of awe.",
    accentGradient: "from-indigo-600 to-fuchsia-700",
    borderTheme: "border-indigo-400 dark:border-indigo-500",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/40",
    textColor: "text-indigo-800 dark:text-indigo-300",
  },
  {
    id: "boredom",
    name: "Boredom & Restlessness",
    emoji: "🌫️",
    category: "reflective",
    somaticExpression: "Flat facial expression, fidgeting legs, sighing, low physical drive.",
    wordDefinition: "An aversive state of wanting to engage in satisfying activity but being unable to do so.",
    copingStrategyTitle: "Micro-Novelty & Daydream Permission",
    copingStrategyDetail: "Allow your mind to wander without reaching for your phone, or introduce small novelty like a walk on a new street.",
    copingCaveat: "Boredom is the incubation space for creativity when not immediately filled with algorithmic stimulation.",
    accentGradient: "from-zinc-500 to-neutral-700",
    borderTheme: "border-zinc-400 dark:border-zinc-500",
    bgLight: "bg-zinc-50 dark:bg-zinc-900/40",
    textColor: "text-zinc-800 dark:text-zinc-300",
  },
  {
    id: "compassion",
    name: "Compassion & Warmth",
    emoji: "🌸",
    category: "regulating",
    somaticExpression: "Warm chest, softening around the eyes, openness to another's distress.",
    wordDefinition: "Deep emotional resonance with suffering coupled with the genuine wish to relieve it.",
    copingStrategyTitle: "Loving-Kindness Phrase (Metta)",
    copingStrategyDetail: "Silently whisper: 'May you be safe, may you be peaceful, may you be free from unnecessary pain.'",
    copingCaveat: "Remember to include yourself in the circle of compassion, not just others.",
    accentGradient: "from-pink-500 to-rose-600",
    borderTheme: "border-pink-400 dark:border-pink-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/40",
    textColor: "text-pink-800 dark:text-pink-300",
  },
  {
    id: "gratitude",
    name: "Gratitude & Appreciation",
    emoji: "✨",
    category: "pleasant",
    somaticExpression: "Soft throat, full heart, grounding sense of sufficiency.",
    wordDefinition: "Affirmation of goodness received and acknowledgment that sources of goodness lie outside oneself.",
    copingStrategyTitle: "3 Specific Relational Anchors",
    copingStrategyDetail: "Name 3 precise, small things that supported you today (e.g., 'the aroma of morning coffee', 'a kind checkout clerk').",
    copingCaveat: "Gratitude is an open doorway, not a tool to bypass legitimate grief or anger.",
    accentGradient: "from-amber-400 to-emerald-600",
    borderTheme: "border-amber-400 dark:border-emerald-500",
    bgLight: "bg-amber-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-800 dark:text-emerald-300",
  },
  {
    id: "envy",
    name: "Envy & Comparison",
    emoji: "🌱",
    category: "reflective",
    somaticExpression: "Tightness in throat, feeling deflated, compulsive social media checking.",
    wordDefinition: "Painful longing triggered by witnessing another possessing attributes, status, or items one desires.",
    copingStrategyTitle: "Unmasking the Hidden Yearning",
    copingStrategyDetail: "Ask: 'What does their success reveal about my own dormant values or unmet dreams?' Turn comparison into direction.",
    copingCaveat: "Envy is a compass pointing toward what you care about; it does not make you a bad person.",
    accentGradient: "from-lime-600 to-emerald-700",
    borderTheme: "border-lime-400 dark:border-lime-500",
    bgLight: "bg-lime-50 dark:bg-lime-950/40",
    textColor: "text-lime-800 dark:text-lime-300",
  },
  {
    id: "excitement",
    name: "Excitement & Vitality",
    emoji: "🚀",
    category: "pleasant",
    somaticExpression: "Bouncing energy, elevated heart rate, bright alert eyes, talking faster.",
    wordDefinition: "High-energy physiological arousal anticipating pleasurable upcoming events or discoveries.",
    copingStrategyTitle: "Creative Channeling & Grounded Pacing",
    copingStrategyDetail: "Channel surplus adrenaline into writing, movement, or art while taking steady exhales to prevent adrenal fatigue.",
    copingCaveat: "Excitement shares identical physiology with anxiety; reminding the mind 'I am excited' can transform stress.",
    accentGradient: "from-orange-500 to-pink-600",
    borderTheme: "border-orange-400 dark:border-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/40",
    textColor: "text-orange-800 dark:text-orange-300",
  },
];

/**
 * Fisher-Yates array shuffling
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates an accessible, randomized deck of cards based on GameMode and Difficulty
 */
export function generateMemoryDeck(mode: GameMode, difficulty: Difficulty): EmotionCardItem[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const selectedEmotions = shuffleArray(EMOTIONS_DATASET).slice(0, config.pairs);
  const deck: EmotionCardItem[] = [];

  selectedEmotions.forEach((emotion) => {
    if (mode === "match-pairs") {
      // Mode A: Identical pair of emotion cards with illustration & somatic hint
      deck.push({
        id: `${emotion.id}-a`,
        pairId: emotion.id,
        cardRole: "primary",
        gameMode: mode,
        title: emotion.name,
        subtext: emotion.somaticExpression,
        badgeText: "Emotion State",
        emoji: emotion.emoji,
        detail: emotion.wordDefinition,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });

      deck.push({
        id: `${emotion.id}-b`,
        pairId: emotion.id,
        cardRole: "secondary",
        gameMode: mode,
        title: emotion.name,
        subtext: emotion.somaticExpression,
        badgeText: "Emotion State",
        emoji: emotion.emoji,
        detail: emotion.wordDefinition,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });
    } else if (mode === "emotion-word") {
      // Mode B: Emotion illustration face card paired with its vocabulary definition card
      deck.push({
        id: `${emotion.id}-vis`,
        pairId: emotion.id,
        cardRole: "primary",
        gameMode: mode,
        title: emotion.name,
        subtext: emotion.somaticExpression,
        badgeText: "Expression",
        emoji: emotion.emoji,
        detail: `Somatic Cue: ${emotion.somaticExpression}`,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });

      deck.push({
        id: `${emotion.id}-def`,
        pairId: emotion.id,
        cardRole: "secondary",
        gameMode: mode,
        title: `Meaning of ${emotion.name}`,
        subtext: emotion.wordDefinition,
        badgeText: "Definition",
        emoji: "📖",
        detail: emotion.wordDefinition,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });
    } else {
      // Mode C: Emotion feeling card paired with an evidence-based coping strategy card
      deck.push({
        id: `${emotion.id}-emo`,
        pairId: emotion.id,
        cardRole: "primary",
        gameMode: mode,
        title: emotion.name,
        subtext: emotion.somaticExpression,
        badgeText: "Feeling Signal",
        emoji: emotion.emoji,
        detail: emotion.wordDefinition,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });

      deck.push({
        id: `${emotion.id}-strat`,
        pairId: emotion.id,
        cardRole: "secondary",
        gameMode: mode,
        title: emotion.copingStrategyTitle,
        subtext: emotion.copingStrategyDetail,
        badgeText: "Coping Tool",
        emoji: "🛡️",
        detail: `${emotion.copingStrategyDetail} — (${emotion.copingCaveat})`,
        accentGradient: emotion.accentGradient,
        borderTheme: emotion.borderTheme,
        bgLight: emotion.bgLight,
        textColor: emotion.textColor,
      });
    }
  });

  return shuffleArray(deck);
}
