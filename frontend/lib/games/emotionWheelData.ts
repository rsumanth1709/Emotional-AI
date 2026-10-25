/**
 * MindCare AI — Emotion Wheel Data & Scenarios
 *
 * Clinical & Learning Principles:
 * 1. Emotional Granularity: Differentiating nuanced emotional states (e.g., Frustration vs Anger,
 *    Disappointment vs Sadness, Anxiety vs Fear) promotes emotional self-regulation.
 * 2. Emotional Overlap & Ambivalence: Humans regularly experience multiple blended emotions at once
 *    (e.g., Gratitude + Sadness at a graduation; Relief + Disappointment after a difficult decision).
 * 3. Non-Inference Safeguard: External signs (facial expressions, text messages) are cues,
 *    never definitive proof of another person's subjective internal state.
 */

export interface EmotionWheelSector {
  id: string;
  name: string;
  emoji: string;
  family: "joy" | "sadness" | "anger" | "fear" | "peace";
  familyLabel: string;
  simpleDefinition: string;
  somaticCue: string;
  relatedEmotions: string[];
  journalPrompt: string;
  colorHex: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

export interface WheelScenarioQuestion {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  primaryEmotionId: string;
  title: string;
  scenario: string;
  options: Array<{
    id: string;
    emotionId: string;
    label: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  blendedEmotionsNote: string;
}

export const WHEEL_EMOTIONS: EmotionWheelSector[] = [
  {
    id: "happiness",
    name: "Happiness",
    emoji: "☀️",
    family: "joy",
    familyLabel: "Joy & Vitality",
    simpleDefinition: "A sense of delight, pleasant expansiveness, and general well-being.",
    somaticCue: "Warmth in chest, relaxed facial muscles, open and upright posture.",
    relatedEmotions: ["Joy", "Contentment", "Playfulness", "Cheerfulness"],
    journalPrompt: "What is an ordinary moment this week that brought a brief spark of warmth or delight?",
    colorHex: "#F59E0B", // Amber 500
    bgLight: "bg-amber-50 dark:bg-amber-950/40",
    textColor: "text-amber-800 dark:text-amber-300",
    borderColor: "border-amber-400 dark:border-amber-600",
  },
  {
    id: "excitement",
    name: "Excitement",
    emoji: "🚀",
    family: "joy",
    familyLabel: "Joy & Vitality",
    simpleDefinition: "High-energy anticipation of a pleasurable upcoming event or discovery.",
    somaticCue: "Bouncing energy, quickened pulse, bright alert eyes, quickened speech.",
    relatedEmotions: ["Enthusiasm", "Eagerness", "Thrill", "Exhilaration"],
    journalPrompt: "What is something on your horizon you feel energized or curious to experience?",
    colorHex: "#EC4899", // Pink 500
    bgLight: "bg-pink-50 dark:bg-pink-950/40",
    textColor: "text-pink-800 dark:text-pink-300",
    borderColor: "border-pink-400 dark:border-pink-600",
  },
  {
    id: "gratitude",
    name: "Gratitude",
    emoji: "✨",
    family: "joy",
    familyLabel: "Joy & Vitality",
    simpleDefinition: "Warm appreciation for kindness, support, or beauty received from outside oneself.",
    somaticCue: "Soft throat, full and tender chest, grounding sense of sufficiency.",
    relatedEmotions: ["Thankfulness", "Appreciation", "Blessing", "Humility"],
    journalPrompt: "Who is someone who offered you quiet support recently, and how did it feel to receive it?",
    colorHex: "#10B981", // Emerald 500
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-800 dark:text-emerald-300",
    borderColor: "border-emerald-400 dark:border-emerald-600",
  },
  {
    id: "calmness",
    name: "Calmness",
    emoji: "🍃",
    family: "peace",
    familyLabel: "Equilibrium & Rest",
    simpleDefinition: "A tranquil state of inner ease where the body's rest-and-digest mode is active.",
    somaticCue: "Unclenched jaw, dropped shoulders, smooth diaphragmatic breathing.",
    relatedEmotions: ["Serenity", "Tranquility", "Peacefulness", "Groundedness"],
    journalPrompt: "Where is a physical space or time of day where your body feels safe enough to let its guard down?",
    colorHex: "#14B8A6", // Teal 500
    bgLight: "bg-teal-50 dark:bg-teal-950/40",
    textColor: "text-teal-800 dark:text-teal-300",
    borderColor: "border-teal-400 dark:border-teal-600",
  },
  {
    id: "relief",
    name: "Relief",
    emoji: "🕊️",
    family: "peace",
    familyLabel: "Equilibrium & Rest",
    simpleDefinition: "The soothing release of tension following the removal or passing of anticipated distress.",
    somaticCue: "A spontaneous deep exhale, heaviness falling from shoulders, limp limbs.",
    relatedEmotions: ["Unburdening", "Solace", "Deliverance", "Reassurance"],
    journalPrompt: "What was a looming worry that resolved more gently than your anxious mind anticipated?",
    colorHex: "#06B6D4", // Cyan 500
    bgLight: "bg-cyan-50 dark:bg-cyan-950/40",
    textColor: "text-cyan-800 dark:text-cyan-300",
    borderColor: "border-cyan-400 dark:border-cyan-600",
  },
  {
    id: "fear",
    name: "Fear",
    emoji: "⚡",
    family: "fear",
    familyLabel: "Apprehension & Threat",
    simpleDefinition: "A biological alarm response to perceived immediate danger, physical or psychological.",
    somaticCue: "Pounding heart, adrenaline rush, dry throat, urge to freeze or flee.",
    relatedEmotions: ["Terror", "Dread", "Panic", "Horror"],
    journalPrompt: "When fear shows up, what physical anchor (e.g. feet on floor, hand on heart) helps you remember current safety?",
    colorHex: "#8B5CF6", // Violet 500
    bgLight: "bg-violet-50 dark:bg-violet-950/40",
    textColor: "text-violet-800 dark:text-violet-300",
    borderColor: "border-violet-400 dark:border-violet-600",
  },
  {
    id: "anxiety",
    name: "Anxiety",
    emoji: "🌪️",
    family: "fear",
    familyLabel: "Apprehension & Threat",
    simpleDefinition: "Unease and hyper-vigilance about uncertain, anticipated future outcomes.",
    somaticCue: "Fluttering stomach, shallow breathing, neck tension, racing 'what-if' thoughts.",
    relatedEmotions: ["Worry", "Nervousness", "Restlessness", "Apprehension"],
    journalPrompt: "What is one 'what-if' story your mind is telling you today, and what is a realistic, grounded counter-fact?",
    colorHex: "#6366F1", // Indigo 500
    bgLight: "bg-indigo-50 dark:bg-indigo-950/40",
    textColor: "text-indigo-800 dark:text-indigo-300",
    borderColor: "border-indigo-400 dark:border-indigo-600",
  },
  {
    id: "sadness",
    name: "Sadness",
    emoji: "🌧️",
    family: "sadness",
    familyLabel: "Grief & Tender Loss",
    simpleDefinition: "A tender, reflective emotional response to loss, disappointment, or longing.",
    somaticCue: "Heaviness behind the eyes, slowed movements, quiet ache in the center of the chest.",
    relatedEmotions: ["Grief", "Sorrow", "Melancholy", "Heartache"],
    journalPrompt: "If your sadness had a quiet voice, what boundary, need, or precious thing would it be asking you to care for?",
    colorHex: "#3B82F6", // Blue 500
    bgLight: "bg-blue-50 dark:bg-blue-950/40",
    textColor: "text-blue-800 dark:text-blue-300",
    borderColor: "border-blue-400 dark:border-blue-600",
  },
  {
    id: "loneliness",
    name: "Loneliness",
    emoji: "🍂",
    family: "sadness",
    familyLabel: "Grief & Tender Loss",
    simpleDefinition: "A painful ache stemming from a perceived gap between desired and actual connection.",
    somaticCue: "Hollow sensation in chest, feeling invisible, low social motivation.",
    relatedEmotions: ["Isolation", "Alienation", "Abandonment", "Exclusion"],
    journalPrompt: "What is a small, low-pressure way you can feel connected today (a pet, nature walk, cozy book, or brief text)?",
    colorHex: "#64748B", // Slate 500
    bgLight: "bg-slate-50 dark:bg-slate-900/40",
    textColor: "text-slate-800 dark:text-slate-300",
    borderColor: "border-slate-400 dark:border-slate-600",
  },
  {
    id: "disappointment",
    name: "Disappointment",
    emoji: "🥀",
    family: "sadness",
    familyLabel: "Grief & Tender Loss",
    simpleDefinition: "The sinking feeling when reality falls short of meaningful positive expectations.",
    somaticCue: "Drop in the pit of stomach, slumped posture, sudden deflated sigh.",
    relatedEmotions: ["Disillusionment", "Dismay", "Defeat", "Chagrin"],
    journalPrompt: "What hopeful expectation recently fell through, and how can you offer yourself gentle kindness right now?",
    colorHex: "#6B7280", // Gray 500
    bgLight: "bg-gray-50 dark:bg-gray-900/40",
    textColor: "text-gray-800 dark:text-gray-300",
    borderColor: "border-gray-400 dark:border-gray-600",
  },
  {
    id: "anger",
    name: "Anger",
    emoji: "🔥",
    family: "anger",
    familyLabel: "Boundary & Injustice",
    simpleDefinition: "An invigorating biological signal that a boundary has been crossed, violated, or treated unfairly.",
    somaticCue: "Flushed cheeks, clenched jaw, tightened fists, rapid energetic heat.",
    relatedEmotions: ["Rage", "Indignation", "Fury", "Resentment"],
    journalPrompt: "What personal boundary or core value was being threatened the last time you felt a spark of anger?",
    colorHex: "#EF4444", // Red 500
    bgLight: "bg-red-50 dark:bg-red-950/40",
    textColor: "text-red-800 dark:text-red-300",
    borderColor: "border-red-400 dark:border-red-600",
  },
  {
    id: "frustration",
    name: "Frustration",
    emoji: "⚡",
    family: "anger",
    familyLabel: "Boundary & Injustice",
    simpleDefinition: "Irritation and blocked energy arising when obstacles impede progress toward an achievable goal.",
    somaticCue: "Tightness across brow, restless hands, sharp short exhales, gritted teeth.",
    relatedEmotions: ["Irritation", "Annoyance", "Exasperation", "Impatience"],
    journalPrompt: "What process is currently feeling blocked or slow, and what is one small thing entirely within your control?",
    colorHex: "#F97316", // Orange 500
    bgLight: "bg-orange-50 dark:bg-orange-950/40",
    textColor: "text-orange-800 dark:text-orange-300",
    borderColor: "border-orange-400 dark:border-orange-600",
  },
];

export const WHEEL_SCENARIO_QUESTIONS: WheelScenarioQuestion[] = [
  // ── EASY SCENARIOS ───────────────────────────────────────────────────────────
  {
    id: "q-1",
    difficulty: "easy",
    primaryEmotionId: "gratitude",
    title: "The Unexpected Hot Soup",
    scenario:
      "After battling a rough flu all week, Priya opens her door to find her neighbor left a thermos of homemade ginger broth with a kind note. A soft warmth fills her chest.",
    options: [
      { id: "a", emotionId: "gratitude", label: "Gratitude (✨)", isCorrect: true },
      { id: "b", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: false },
      { id: "c", emotionId: "fear", label: "Fear (⚡)", isCorrect: false },
      { id: "d", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
    ],
    explanation:
      "Gratitude arises from recognizing an act of unexpected benevolence and support from another person.",
    blendedEmotionsNote:
      "Priya may also feel relief that she doesn't have to cook, and mild vulnerability about being seen in a weak state.",
  },
  {
    id: "q-2",
    difficulty: "easy",
    primaryEmotionId: "relief",
    title: "The Sound of the Negative Test Result",
    scenario:
      "Marcus waited 5 days for the results of an urgent medical biopsy. When the doctor calls and says 'everything looks completely clear and benign', Marcus lets out a long shuddering breath and collapses gently into his sofa.",
    options: [
      { id: "a", emotionId: "relief", label: "Relief (🕊️)", isCorrect: true },
      { id: "b", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: false },
      { id: "c", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: false },
      { id: "d", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
    ],
    explanation:
      "Relief occurs when a sustained threat or dread-inducing uncertainty vanishes, releasing sympathetic nervous tension.",
    blendedEmotionsNote:
      "Often accompanied by delayed emotional exhaustion as the adrenaline rush drains away.",
  },
  {
    id: "q-3",
    difficulty: "easy",
    primaryEmotionId: "frustration",
    title: "The Infinite Loading Spinner",
    scenario:
      "Julian spent 3 hours typing a detailed application. When he clicks submit, the webpage freezes, gives an error code 500, and clears all fields. Julian grits his teeth and grips his mouse tightly.",
    options: [
      { id: "a", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: true },
      { id: "b", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
      { id: "c", emotionId: "gratitude", label: "Gratitude (✨)", isCorrect: false },
      { id: "d", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: false },
    ],
    explanation:
      "Frustration is the immediate reaction to being thwarted or obstructed from reaching a goal after investing earnest effort.",
    blendedEmotionsNote:
      "May also blend with helplessness or underlying anger at poorly designed technology.",
  },
  {
    id: "q-4",
    difficulty: "easy",
    primaryEmotionId: "loneliness",
    title: "The Quiet Friday Evening",
    scenario:
      "Kavita scrolls through social media on a Friday night, watching group photos of colleagues at dinner where she wasn't invited. The apartment feels unnaturally still, and she feels an ache in the center of her chest.",
    options: [
      { id: "a", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: true },
      { id: "b", emotionId: "happiness", label: "Happiness (☀️)", isCorrect: false },
      { id: "c", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: false },
      { id: "d", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
    ],
    explanation:
      "Loneliness reflects the subjective pain of feeling disconnected, overlooked, or isolated from meaningful community.",
    blendedEmotionsNote:
      "Can frequently coexist with envy of others' apparent ease, or shame around feeling excluded.",
  },
  {
    id: "q-5",
    difficulty: "easy",
    primaryEmotionId: "happiness",
    title: "The Community Garden Harvest",
    scenario:
      "After months of weeding, the community tomato patch is overflowing with ripe red fruit. Neighbors of all ages gather to pick and taste them, laughing under the sun. Elena smiles with deep ease.",
    options: [
      { id: "a", emotionId: "happiness", label: "Happiness (☀️)", isCorrect: true },
      { id: "b", emotionId: "anxiety", label: "Anxiety (🌪️)", isCorrect: false },
      { id: "c", emotionId: "fear", label: "Fear (⚡)", isCorrect: false },
      { id: "d", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: false },
    ],
    explanation:
      "Happiness is a warm, harmonious state of joy and satisfaction rooted in shared connection and fruitful work.",
    blendedEmotionsNote:
      "Blends seamlessly with pride in collective effort and sensory pleasure.",
  },
  {
    id: "q-6",
    difficulty: "easy",
    primaryEmotionId: "sadness",
    title: "The Farewell Box",
    scenario:
      "David packs up his childhood pet's leash and food bowl after saying goodbye at the vet clinic. He sits quietly on the floor, his eyes heavy with tears.",
    options: [
      { id: "a", emotionId: "sadness", label: "Sadness (🌧️)", isCorrect: true },
      { id: "b", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: false },
      { id: "c", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: false },
      { id: "d", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
    ],
    explanation:
      "Sadness and grief are healthy, natural responses acknowledging the profound value of a bond that has ended.",
    blendedEmotionsNote:
      "Tears and withdrawal allow the nervous system to honor and slowly integrate irreversible loss.",
  },

  // ── MEDIUM SCENARIOS ─────────────────────────────────────────────────────────
  {
    id: "q-7",
    difficulty: "medium",
    primaryEmotionId: "disappointment",
    title: "The Dream Internship Finalist",
    scenario:
      "Aria made it to the final interview round out of 500 applicants and felt deeply connected to the interviewers. Today she received an email saying they chose another candidate with slightly more tenure. Her stomach drops and her posture deflates.",
    options: [
      { id: "a", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: true },
      { id: "b", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
      { id: "c", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
      { id: "d", emotionId: "relief", label: "Relief (🕊️)", isCorrect: false },
    ],
    explanation:
      "Disappointment is the specific emotional deflation experienced when reality does not match high, invested hopes.",
    blendedEmotionsNote:
      "Aria can simultaneously feel pride in reaching the top 2 while wrestling with sorrow and questioning her self-efficacy.",
  },
  {
    id: "q-8",
    difficulty: "medium",
    primaryEmotionId: "calmness",
    title: "The Dawn Lake Mist",
    scenario:
      "Sitting on a wooden dock at 6:00 AM, Daniel watches the mist hover over the glass-like water. His shoulders drop, his jaw releases, and his thoughts settle into slow, quiet presence.",
    options: [
      { id: "a", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: true },
      { id: "b", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: false },
      { id: "c", emotionId: "anxiety", label: "Anxiety (🌪️)", isCorrect: false },
      { id: "d", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: false },
    ],
    explanation:
      "Calmness is characterized by parasympathetic autonomic regulation, stillness, and an absence of perceived threat.",
    blendedEmotionsNote:
      "Often merges into subtle awe or gentle gratitude for the sensory quietude.",
  },
  {
    id: "q-9",
    difficulty: "medium",
    primaryEmotionId: "excitement",
    title: "The Boarding Gate Announcement",
    scenario:
      "Leila holds her passport and boarding pass for a solo trip across New Zealand she planned for two years. As her group is called, she bounces on her toes, laughs aloud, and feels a surge of vitality.",
    options: [
      { id: "a", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: true },
      { id: "b", emotionId: "sadness", label: "Sadness (🌧️)", isCorrect: false },
      { id: "c", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: false },
      { id: "d", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
    ],
    explanation:
      "Excitement is marked by elevated dopamine and adrenaline focused on eager anticipation of adventure and novelty.",
    blendedEmotionsNote:
      "It is normal to experience excitement intertwined with travel anxiety about logistics.",
  },
  {
    id: "q-10",
    difficulty: "medium",
    primaryEmotionId: "anxiety",
    title: "The Unread Notification",
    scenario:
      "Samuel's phone buzzes with a message from his supervisor: 'Can you step into my office at 9:00 AM tomorrow?' Samuel's stomach flutters, his palms sweat, and his mind races through every task he submitted this quarter.",
    options: [
      { id: "a", emotionId: "anxiety", label: "Anxiety (🌪️)", isCorrect: true },
      { id: "b", emotionId: "happiness", label: "Happiness (☀️)", isCorrect: false },
      { id: "c", emotionId: "gratitude", label: "Gratitude (✨)", isCorrect: false },
      { id: "d", emotionId: "relief", label: "Relief (🕊️)", isCorrect: false },
    ],
    explanation:
      "Anxiety is future-oriented rumination and somatic vigilance triggered by ambiguity and uncertain stakes.",
    blendedEmotionsNote:
      "Distinguishable from acute fear because there is no present physical danger, only cognitive anticipation of danger.",
  },
  {
    id: "q-11",
    difficulty: "medium",
    primaryEmotionId: "anger",
    title: "The Stolen Credit",
    scenario:
      "During an executive meeting, a coworker presents the innovative deck that Maya drafted all weekend as 'my own proprietary framework.' Maya feels heat rush to her collarbones and her jaw tightly clenches.",
    options: [
      { id: "a", emotionId: "anger", label: "Anger (🔥)", isCorrect: true },
      { id: "b", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: false },
      { id: "c", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
      { id: "d", emotionId: "happiness", label: "Happiness (☀️)", isCorrect: false },
    ],
    explanation:
      "Anger is the boundary-enforcement emotion triggered when personal rights, fairness, or dignity are trampled upon.",
    blendedEmotionsNote:
      "Can co-occur with humiliation or fear of creating a scene in front of senior executives.",
  },
  {
    id: "q-12",
    difficulty: "medium",
    primaryEmotionId: "fear",
    title: "The Sudden Screech on the Highway",
    scenario:
      "Driving at night in heavy rain, Tariq hears tires violently screech right beside him as a semi-truck skids into his lane. His pupils dilate, his heart beats against his ribs, and he swerves onto the shoulder instantly.",
    options: [
      { id: "a", emotionId: "fear", label: "Fear (⚡)", isCorrect: true },
      { id: "b", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: false },
      { id: "c", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: false },
      { id: "d", emotionId: "gratitude", label: "Gratitude (✨)", isCorrect: false },
    ],
    explanation:
      "Fear is an instantaneous primitive survival mechanism prioritizing immediate motor reflexes to protect bodily life.",
    blendedEmotionsNote:
      "Once the car stops safely, intense relief and shaking adrenaline follow.",
  },

  // ── HARD SCENARIOS (Complex Blends & Granularity) ───────────────────────────
  {
    id: "q-13",
    difficulty: "hard",
    primaryEmotionId: "relief",
    title: "The Bittersweet Resignation",
    scenario:
      "Tasha worked 80-hour weeks for two years at a toxic firm that eroded her sleep and health. Today she turned in her security badge. Walking out the glass revolving doors into the fresh air, her shoulders finally drop, though she mourns lost dreams.",
    options: [
      { id: "a", emotionId: "relief", label: "Relief (🕊️)", isCorrect: true },
      { id: "b", emotionId: "excitement", label: "Excitement (🚀)", isCorrect: false },
      { id: "c", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
      { id: "d", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: false },
    ],
    explanation:
      "The dominant somatic experience is relief (shedding an overwhelming burden), even as grief and uncertainty co-exist.",
    blendedEmotionsNote:
      "Illustrates emotional duality: one can feel profound relief while grieving what could have been.",
  },
  {
    id: "q-14",
    difficulty: "hard",
    primaryEmotionId: "disappointment",
    title: "The Canceled Family Reunion",
    scenario:
      "After a year of family disputes, Noah organized a reconciliation dinner that everyone agreed to attend. Two hours before the event, group texts come in canceling one by one with thin excuses. Noah stares at the decorated dining table in silence.",
    options: [
      { id: "a", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: true },
      { id: "b", emotionId: "fear", label: "Fear (⚡)", isCorrect: false },
      { id: "c", emotionId: "calmness", label: "Calmness (🍃)", isCorrect: false },
      { id: "d", emotionId: "happiness", label: "Happiness (☀️)", isCorrect: false },
    ],
    explanation:
      "Disappointment is the primary experience when a vulnerable hope for relational healing is deflated.",
    blendedEmotionsNote:
      "A classic mix of disappointment, heartbreak (sadness), and protective irritation (frustration).",
  },
  {
    id: "q-15",
    difficulty: "hard",
    primaryEmotionId: "anxiety",
    title: "The Imposter at the Podium",
    scenario:
      "Dr. Vance is about to deliver the keynote address at an international neuroscience congress. She is fully prepared with 50 citations, yet as the emcee introduces her, her stomach twists with fear that someone will uncover that she doesn't belong.",
    options: [
      { id: "a", emotionId: "anxiety", label: "Anxiety & Apprehension (🌪️)", isCorrect: true },
      { id: "b", emotionId: "anger", label: "Anger (🔥)", isCorrect: false },
      { id: "c", emotionId: "loneliness", label: "Loneliness (🍂)", isCorrect: false },
      { id: "d", emotionId: "relief", label: "Relief (🕊️)", isCorrect: false },
    ],
    explanation:
      "Imposter phenomenon manifests primarily as anticipatory evaluation anxiety, despite demonstrated competence.",
    blendedEmotionsNote:
      "Can sit right alongside genuine professional pride and passion for the subject matter.",
  },
  {
    id: "q-16",
    difficulty: "hard",
    primaryEmotionId: "gratitude",
    title: "The Hospital Discharge Porch",
    scenario:
      "After six weeks recovering from a serious vehicular accident, Omar is wheeled out onto his sunlit home porch. He looks at his partner holding a fresh blanket, looks at his healing legs, and tears well up in his eyes as he whispers 'thank you for life.'",
    options: [
      { id: "a", emotionId: "gratitude", label: "Gratitude (✨)", isCorrect: true },
      { id: "b", emotionId: "frustration", label: "Frustration (⚡)", isCorrect: false },
      { id: "c", emotionId: "fear", label: "Fear (⚡)", isCorrect: false },
      { id: "d", emotionId: "disappointment", label: "Disappointment (🥀)", isCorrect: false },
    ],
    explanation:
      "Gratitude in the wake of trauma is a profound, solemn recognition of the fragility of existence and the gift of survival.",
    blendedEmotionsNote:
      "Often co-mingles with grief for the traumatic event and somatic vulnerability.",
  },
];
