/**
 * MindCare AI — Emotion Detective Scenario Dataset
 * 
 * 30+ original educational scenarios categorized across 10 target emotions:
 * - Happiness
 * - Sadness
 * - Anger
 * - Fear
 * - Anxiety
 * - Surprise
 * - Calmness
 * - Loneliness
 * - Excitement
 * - Frustration
 * 
 * Organized into Easy, Medium, and Hard difficulties with comprehensive educational explanations.
 */

export type EmotionType =
  | "Happiness"
  | "Sadness"
  | "Anger"
  | "Fear"
  | "Anxiety"
  | "Surprise"
  | "Calmness"
  | "Loneliness"
  | "Excitement"
  | "Frustration";

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface EmotionScenario {
  id: string;
  difficulty: DifficultyLevel;
  scenario: string;
  context: string;
  options: EmotionType[];
  correctEmotion: EmotionType;
  educationalExplanation: string;
  secondaryEmotionsNote?: string;
  clues: string[];
}

export interface EmotionMeta {
  name: EmotionType;
  emoji: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  description: string;
}

export const EMOTIONS_CONFIG: Record<EmotionType, EmotionMeta> = {
  Happiness: {
    name: "Happiness",
    emoji: "😊",
    badgeColor: "text-amber-500 dark:text-amber-300",
    borderColor: "border-amber-400 dark:border-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    description: "Feelings of joy, satisfaction, contentment, and positive well-being.",
  },
  Sadness: {
    name: "Sadness",
    emoji: "😢",
    badgeColor: "text-blue-500 dark:text-blue-300",
    borderColor: "border-blue-400 dark:border-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    description: "Feelings of sorrow, loss, disappointment, or feeling down.",
  },
  Anger: {
    name: "Anger",
    emoji: "😠",
    badgeColor: "text-red-500 dark:text-red-300",
    borderColor: "border-red-400 dark:border-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    description: "Strong feeling of displeasure or antagonism aroused by a perceived wrong or boundary violation.",
  },
  Fear: {
    name: "Fear",
    emoji: "😨",
    badgeColor: "text-purple-500 dark:text-purple-300",
    borderColor: "border-purple-400 dark:border-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    description: "A natural protective emotional response to perceived imminent danger or threat.",
  },
  Anxiety: {
    name: "Anxiety",
    emoji: "😰",
    badgeColor: "text-teal-500 dark:text-teal-300",
    borderColor: "border-teal-400 dark:border-teal-500",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    description: "Unease, worry, or nervousness regarding future uncertain events or outcomes.",
  },
  Surprise: {
    name: "Surprise",
    emoji: "😲",
    badgeColor: "text-yellow-500 dark:text-yellow-300",
    borderColor: "border-yellow-400 dark:border-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/40",
    description: "A brief startle reaction provoked by unexpected, novel, or startling events.",
  },
  Calmness: {
    name: "Calmness",
    emoji: "😌",
    badgeColor: "text-emerald-500 dark:text-emerald-300",
    borderColor: "border-emerald-400 dark:border-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    description: "A serene state of mental and physical peace, stability, and somatic regulation.",
  },
  Loneliness: {
    name: "Loneliness",
    emoji: "🥺",
    badgeColor: "text-slate-500 dark:text-slate-300",
    borderColor: "border-slate-400 dark:border-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-950/40",
    description: "The emotional distress experienced when there is a perceived gap in social connection or companionship.",
  },
  Excitement: {
    name: "Excitement",
    emoji: "🤩",
    badgeColor: "text-orange-500 dark:text-orange-300",
    borderColor: "border-orange-400 dark:border-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    description: "High-energy positive anticipation and enthusiasm about an upcoming experience or milestone.",
  },
  Frustration: {
    name: "Frustration",
    emoji: "😤",
    badgeColor: "text-rose-500 dark:text-rose-300",
    borderColor: "border-rose-400 dark:border-rose-500",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    description: "The irritation or annoyance that arises when an effort is blocked or progress is continually impeded.",
  },
};

export const SCENARIOS: EmotionScenario[] = [
  // ── EASY LEVEL SCENARIOS (1 to 10) ─────────────────────────────────────────
  {
    id: "sc-easy-01",
    difficulty: "easy",
    scenario: "Jordan worked tirelessly on an art project for weeks. Today, the gallery announced Jordan's artwork won first place.",
    context: "Recognition of creative accomplishment and celebration.",
    options: ["Happiness", "Anger", "Fear", "Sadness"],
    correctEmotion: "Happiness",
    educationalExplanation: "Accomplishing a long-sought goal and receiving public recognition commonly activates happiness, validation, and personal fulfillment.",
    clues: ["Won first place", "Celebrated creative achievement", "Hard work paid off"],
  },
  {
    id: "sc-easy-02",
    difficulty: "easy",
    scenario: "Sam opens the front door on a Friday evening, and twenty close friends suddenly jump out shouting, 'Happy Birthday!'",
    context: "An unannounced celebration planned in secret.",
    options: ["Surprise", "Loneliness", "Anger", "Calmness"],
    correctEmotion: "Surprise",
    educationalExplanation: "A sudden, unexpected turn of events elicits surprise. While Sam may quickly transition to joy or gratitude, the immediate reaction is surprise.",
    clues: ["Friends jumped out suddenly", "Unexpected birthday gathering", "Immediate shock"],
  },
  {
    id: "sc-easy-03",
    difficulty: "easy",
    scenario: "Maya's beloved pet dog of twelve years passed away peacefully last night. The house feels quiet and empty.",
    context: "Loss of a long-time companion.",
    options: ["Sadness", "Excitement", "Calmness", "Anger"],
    correctEmotion: "Sadness",
    educationalExplanation: "Grieving the loss of a cherished relationship or pet is an essential, natural expression of sadness and mourning.",
    clues: ["Quiet, empty house", "Loss of a lifelong companion", "Tears and mourning"],
  },
  {
    id: "sc-easy-04",
    difficulty: "easy",
    scenario: "Alex practiced a presentation several times but still feels stomach butterflies and dry mouth right before walking onto the stage.",
    context: "Impending public speaking performance.",
    options: ["Anxiety", "Excitement", "Calmness", "Surprise"],
    correctEmotion: "Anxiety",
    educationalExplanation: "Stomach butterflies and apprehensive anticipatory thoughts before an important evaluation are hallmark signs of performance anxiety.",
    secondaryEmotionsNote: "Performance anxiety often coexists with excitement, as adrenaline prepares the body to perform.",
    clues: ["Butterflies in stomach", "Anticipating evaluation", "Nervous apprehension"],
  },
  {
    id: "sc-easy-05",
    difficulty: "easy",
    scenario: "David spent three hours assembling a bookshelf. On the final step, the main support board snapped in half, ruining the entire build.",
    context: "Effort obstructed right before completion.",
    options: ["Frustration", "Calmness", "Loneliness", "Happiness"],
    correctEmotion: "Frustration",
    educationalExplanation: "Frustration occurs when persistent, dedicated effort meets an unexpected roadblock that blocks completion of a goal.",
    clues: ["Spent hours on task", "Snapped on the very last step", "Blocked progress"],
  },
  {
    id: "sc-easy-06",
    difficulty: "easy",
    scenario: "Walking down a dimly lit forest trail alone, Liam suddenly hears an aggressive growl and heavy footsteps rushing from the bushes.",
    context: "Immediate physical threat in the dark.",
    options: ["Fear", "Calmness", "Sadness", "Loneliness"],
    correctEmotion: "Fear",
    educationalExplanation: "Fear is an instinctual survival response that mobilizes fight-or-flight energy when a direct, immediate physical threat is detected.",
    clues: ["Aggressive growl", "Sudden rush in dark woods", "Heart rate spikes immediately"],
  },
  {
    id: "sc-easy-07",
    difficulty: "easy",
    scenario: "Elena sits on her balcony with a warm herbal tea, watching raindrops ripple across a garden pond without any phone notifications or deadlines.",
    context: "Intentional relaxation in a peaceful environment.",
    options: ["Calmness", "Anger", "Anxiety", "Fear"],
    correctEmotion: "Calmness",
    educationalExplanation: "Calmness is characterized by low physical arousal, quiet mindfulness, and feeling unbothered by external pressures or deadlines.",
    clues: ["Warm tea", "No notifications or pressure", "Peaceful observation"],
  },
  {
    id: "sc-easy-08",
    difficulty: "easy",
    scenario: "Marcus just booked tickets to see his favorite music band live for the very first time next month, and can't stop smiling and counting down the days.",
    context: "Anticipating a long-awaited joyful experience.",
    options: ["Excitement", "Fear", "Sadness", "Calmness"],
    correctEmotion: "Excitement",
    educationalExplanation: "Excitement features energizing positive arousal, intense eagerness, and forward-looking anticipation.",
    clues: ["Counting down days", "Eager smile", "High energy anticipation"],
  },
  {
    id: "sc-easy-09",
    difficulty: "easy",
    scenario: "Kiran notices that a colleague took complete credit in a team meeting for an innovative report Kiran spent the whole weekend drafting.",
    context: "Unfair treatment and boundary violation.",
    options: ["Anger", "Happiness", "Calmness", "Surprise"],
    correctEmotion: "Anger",
    educationalExplanation: "Anger is provoked when an injustice occurs, someone violates an ethical boundary, or credit is deliberately stolen.",
    clues: ["Effort stolen", "Injustice in front of peers", "Sense of violation"],
  },
  {
    id: "sc-easy-10",
    difficulty: "easy",
    scenario: "Noah moved to a bustling new city for university. Eating dinner alone in a crowded cafeteria where everyone else is laughing with friends.",
    context: "Social disconnection in a crowded environment.",
    options: ["Loneliness", "Anger", "Surprise", "Happiness"],
    correctEmotion: "Loneliness",
    educationalExplanation: "Loneliness isn't just about physical isolation; it frequently occurs in crowds when one feels emotionally disconnected and longs for belonging.",
    clues: ["Eating alone amid groups", "New city without support network", "Longing for connection"],
  },

  // ── MEDIUM LEVEL SCENARIOS (11 to 20) ──────────────────────────────────────
  {
    id: "sc-med-11",
    difficulty: "medium",
    scenario: "Priya submitted her master's thesis draft. Her advisor sent back an email saying, 'Please come to my office first thing Monday morning to discuss your submission.'",
    context: "Vague communication with high stakes.",
    options: ["Anxiety", "Happiness", "Calmness", "Loneliness"],
    correctEmotion: "Anxiety",
    educationalExplanation: "Ambiguous, high-stakes messages from authority figures frequently trigger anxiety as the mind attempts to forecast worst-case scenarios.",
    secondaryEmotionsNote: "Curiosity or hope might also be present, but ambiguous phrasing predominantly provokes anticipatory worry.",
    clues: ["Ambiguous request", "High-stakes thesis", "Waiting until Monday without details"],
  },
  {
    id: "sc-med-12",
    difficulty: "medium",
    scenario: "Carlos spent three months applying to 60 jobs without receiving a single interview request, despite constantly refining his resume.",
    context: "Repeated unseen effort yielding no response.",
    options: ["Frustration", "Fear", "Excitement", "Surprise"],
    correctEmotion: "Frustration",
    educationalExplanation: "Prolonged fruitless effort against an unresponsive system generates deep frustration and cognitive fatigue.",
    secondaryEmotionsNote: "Over time, chronic frustration can transition into sadness or helplessness if coping resources aren't replenished.",
    clues: ["60 applications", "Constant refinement", "Wall of silence"],
  },
  {
    id: "sc-med-13",
    difficulty: "medium",
    scenario: "After a chaotic week of family emergencies and hospital visits, Sarah closes her bedroom door, takes three long breaths, and feels her shoulders finally drop.",
    context: "De-escalation after intense crisis.",
    options: ["Calmness", "Excitement", "Anger", "Loneliness"],
    correctEmotion: "Calmness",
    educationalExplanation: "The release of physiological tension after surviving a storm represents relief and the gentle restoration of calmness.",
    clues: ["Shoulders dropping", "Deep breaths", "Restoration of safety"],
  },
  {
    id: "sc-med-14",
    difficulty: "medium",
    scenario: "Zoe notices her friend group made a private weekend beach trip group chat and went on vacation together without inviting her or mentioning it.",
    context: "Subtle peer exclusion.",
    options: ["Loneliness", "Calmness", "Fear", "Excitement"],
    correctEmotion: "Loneliness",
    educationalExplanation: "Social ostracism or feeling intentionally left out by established friends creates sharp emotional pain and acute feelings of loneliness.",
    secondaryEmotionsNote: "Hurt, sadness, and quiet resentment often blend together with loneliness here.",
    clues: ["Private chat excluded her", "Left behind on trip", "Feeling invisible to friends"],
  },
  {
    id: "sc-med-15",
    difficulty: "medium",
    scenario: "Tariq receives a notification that a software package he wrote open-source was starred by over 5,000 developers overnight and featured on the front page of TechNews.",
    context: "Overwhelming positive and unexpected attention.",
    options: ["Excitement", "Anger", "Sadness", "Loneliness"],
    correctEmotion: "Excitement",
    educationalExplanation: "Sudden explosive validation for personal passion projects triggers high dopamine activation and vibrant excitement.",
    clues: ["5,000 stars overnight", "Front page tech spotlight", "Burst of creative momentum"],
  },
  {
    id: "sc-med-16",
    difficulty: "medium",
    scenario: "A driver cuts across three lanes of traffic without signaling, forcing Mateo to slam on his brakes and honk furiously as his groceries spill across the car floor.",
    context: "Reckless danger imposed by another person.",
    options: ["Anger", "Sadness", "Calmness", "Loneliness"],
    correctEmotion: "Anger",
    educationalExplanation: "When someone's reckless negligence threatens our physical safety and causes disruption, indignation and anger flare immediately.",
    secondaryEmotionsNote: "A brief spike of fear occurs first to trigger the reflex brake, followed quickly by anger.",
    clues: ["Reckless endangerment", "Slamming on horn", "Spilled groceries and violation"],
  },
  {
    id: "sc-med-17",
    difficulty: "medium",
    scenario: "Aisha is hiking on a mountain trail when thick fog suddenly rolls in, obscuring all markers, and her phone battery immediately drops to 1%.",
    context: "Disorientation in an unfamiliar vulnerable setting.",
    options: ["Fear", "Happiness", "Frustration", "Calmness"],
    correctEmotion: "Fear",
    educationalExplanation: "Losing bearings in a high-risk natural environment while losing communication triggers existential fear and heightened vigilance.",
    clues: ["Thick fog obscuring path", "Battery dying", "Vulnerable mountain environment"],
  },
  {
    id: "sc-med-18",
    difficulty: "medium",
    scenario: "Daniel packs his final suitcase to move out of his childhood bedroom. He looks at the marks on the doorframe measuring his height from age 5 to 18.",
    context: "Bittersweet milestone transition.",
    options: ["Sadness", "Anger", "Fear", "Frustration"],
    correctEmotion: "Sadness",
    educationalExplanation: "Nostalgic sadness often accompanies closing a cherished life chapter, acknowledging that a formative period has permanently concluded.",
    secondaryEmotionsNote: "This scenario exemplifies poignant nostalgia—sadness over the passage of time alongside quiet gratitude.",
    clues: ["Doorframe height marks", "Leaving childhood home", "Ache of time passing"],
  },
  {
    id: "sc-med-19",
    difficulty: "medium",
    scenario: "Nadia checks her bank statement expecting her usual balance, but sees an unexpected deposit titled 'Government Tax Rebate' of $1,400.",
    context: "Unanticipated windfall.",
    options: ["Surprise", "Sadness", "Loneliness", "Anger"],
    correctEmotion: "Surprise",
    educationalExplanation: "Receiving unexpected money without prior warning creates an immediate startle reaction of surprise before turning to delight.",
    clues: ["Unexpected $1,400", "Zero advance notice", "Checking statement twice in disbelief"],
  },
  {
    id: "sc-med-20",
    difficulty: "medium",
    scenario: "After months of rehabilitation for a knee surgery, Kenji successfully runs his first full 5K race without any pain or limping.",
    context: "Restoration of physical health and self-efficacy.",
    options: ["Happiness", "Fear", "Anger", "Loneliness"],
    correctEmotion: "Happiness",
    educationalExplanation: "Regaining physical autonomy and achieving a hard-fought healing milestone brings deep joy and self-confidence.",
    clues: ["First pain-free 5K", "Rehab successfully concluded", "Joy of recovery"],
  },

  // ── HARD LEVEL SCENARIOS (21 to 32) ─────────────────────────────────────────
  {
    id: "sc-hard-21",
    difficulty: "hard",
    scenario: "Clara has been offered her dream job abroad in Paris, but taking it means leaving her aging parents and partner behind for two full years.",
    context: "Complex moral and life choice with competing emotional pulls.",
    options: ["Anxiety", "Anger", "Surprise", "Calmness"],
    correctEmotion: "Anxiety",
    educationalExplanation: "When two core values clash (career fulfillment vs. relational attachment), the agonizing decision-making process is dominated by conflict-driven anxiety.",
    secondaryEmotionsNote: "Excitement about Paris and grief over separation will also swirl together.",
    clues: ["Agonizing dilemma", "Compromised attachments", "Uncertain future trade-offs"],
  },
  {
    id: "sc-hard-22",
    difficulty: "hard",
    scenario: "Javier is a dedicated nurse who has completed seven consecutive 12-hour shifts in an understaffed ward. His hands tremble slightly, and he feels emotionally hollow and distant.",
    context: "Chronic systemic overwork and compassion fatigue.",
    options: ["Frustration", "Happiness", "Excitement", "Surprise"],
    correctEmotion: "Frustration",
    educationalExplanation: "Chronic systemic barriers that prevent professionals from delivering the quality of care they care about produce chronic frustration and moral injury.",
    secondaryEmotionsNote: "Compassion fatigue also encompasses deep sadness, physical exhaustion, and numbness.",
    clues: ["7 consecutive 12-hour shifts", "Emotional depletion", "Systemic understaffing barriers"],
  },
  {
    id: "sc-hard-23",
    difficulty: "hard",
    scenario: "Leila is attending her ex-partner's wedding as an invited guest. When the vows are read, she smiles genuinely while feeling a hollow knot deep in her chest.",
    context: "Complex blended relational emotional processing.",
    options: ["Sadness", "Anger", "Excitement", "Calmness"],
    correctEmotion: "Sadness",
    educationalExplanation: "Complex emotional maturity allows one to feel genuine goodwill for someone while simultaneously carrying the quiet sadness of shared history ending.",
    clues: ["Hollow knot in chest", "Witnessing vows of former partner", "Poignant sense of finality"],
  },
  {
    id: "sc-hard-24",
    difficulty: "hard",
    scenario: "Tom has been practicing mindfulness meditation for two years. During a tense corporate restructuring meeting where coworkers are arguing, he remains grounded, breathing steadily without reacting.",
    context: "Practiced somatic regulation amidst systemic external tension.",
    options: ["Calmness", "Fear", "Sadness", "Excitement"],
    correctEmotion: "Calmness",
    educationalExplanation: "Calmness is not merely the absence of chaos; it is the cultivated ability to stay grounded, centered, and regulated even when surrounding environments are chaotic.",
    clues: ["Steadied breath", "Refusal to take the bait", "Grounding amidst workplace turmoil"],
  },
  {
    id: "sc-hard-25",
    difficulty: "hard",
    scenario: "A freelance coder has worked remotely from home for four months without a single in-person human conversation, interacting only via automated ticket updates and pull requests.",
    context: "Chronic digital isolation.",
    options: ["Loneliness", "Anger", "Surprise", "Happiness"],
    correctEmotion: "Loneliness",
    educationalExplanation: "Remote convenience can mask profound social starvation. Human nervous systems need authentic, embodied connection to regulate; without it, chronic loneliness sets in.",
    clues: ["Months without in-person speech", "Transactional ticket-only communication", "Invisible social starvation"],
  },
  {
    id: "sc-hard-26",
    difficulty: "hard",
    scenario: "Siddharth practiced the piano sonata thousands of times until muscle memory took over. The second he walks onto the concert hall stage, his hands go ice cold and his vision tunnels.",
    context: "Acute sympathetic nervous system hijack under spotlight.",
    options: ["Fear", "Sadness", "Calmness", "Anger"],
    correctEmotion: "Fear",
    educationalExplanation: "Acute stage fright is an intense neurobiological fear response where the sympathetic nervous system triggers peripheral vasoconstriction (cold hands) and tunnel vision.",
    secondaryEmotionsNote: "While mild nervousness is anxiety, acute physical paralysis and tunnel vision reflect a full-blown fear response.",
    clues: ["Hands ice cold", "Tunnel vision", "Sympathetic fight-or-flight flood"],
  },
  {
    id: "sc-hard-27",
    difficulty: "hard",
    scenario: "An engineer was promised a team lead promotion in writing six months ago. Today, management quietly brought in an outside hire for the role and pretended the written promise never existed.",
    context: "Institutional betrayal and gaslighting.",
    options: ["Anger", "Fear", "Calmness", "Surprise"],
    correctEmotion: "Anger",
    educationalExplanation: "Institutional betrayal—where an authority breaches trust and invalidates commitment—triggers intense, justifiable indignation and anger.",
    clues: ["Broken written agreement", "Gaslighting by leadership", "Violation of trust and integrity"],
  },
  {
    id: "sc-hard-28",
    difficulty: "hard",
    scenario: "Hannah stands in the maternity ward, looking through the nursery window at her newborn daughter sleeping peacefully after 28 hours of labor.",
    context: "Transcendent emotional relief and unconditional love.",
    options: ["Happiness", "Frustration", "Anger", "Fear"],
    correctEmotion: "Happiness",
    educationalExplanation: "The culmination of intense physical labor and the birth of a child brings profound, transformative happiness and emotional transcendence.",
    clues: ["Looking at newborn", "Relief after labor", "Deep protective joy"],
  },
  {
    id: "sc-hard-29",
    difficulty: "hard",
    scenario: "An avid astronomer spent five years building a private telescope. Looking through the lens on a crisp autumn midnight, they observe an undocumented comet streaking across the Orion constellation.",
    context: "Encountering the unexpected sublime.",
    options: ["Surprise", "Anger", "Loneliness", "Calmness"],
    correctEmotion: "Surprise",
    educationalExplanation: "Stumbling upon the completely novel and uncharted in scientific observation generates awe and deep intellectual surprise.",
    clues: ["Undocumented comet", "Staring in disbelief", "Sudden scientific anomaly"],
  },
  {
    id: "sc-hard-30",
    difficulty: "hard",
    scenario: "An independent game developer receives an official notification that their passion game was accepted into the Tokyo Game Show main showcase.",
    context: "Major milestone breakthrough in a creative career.",
    options: ["Excitement", "Sadness", "Calmness", "Fear"],
    correctEmotion: "Excitement",
    educationalExplanation: "Achieving a global stage after years of isolated work stimulates exhilarating excitement and enthusiastic anticipation.",
    clues: ["Selected for international showcase", "Pacing room with joy", "Electrified anticipation"],
  },
  {
    id: "sc-hard-31",
    difficulty: "hard",
    scenario: "A patient with a chronic autoimmune condition sits in a quiet exam room. The specialist enters, sits down gently, and begins with: 'I am so sorry, but the biopsy came back with concerning markers.'",
    context: "Receiving life-altering clinical news.",
    options: ["Fear", "Anger", "Excitement", "Calmness"],
    correctEmotion: "Fear",
    educationalExplanation: "Facing existential uncertainty regarding physical survival and health activates a profound, visceral fear of the unknown.",
    clues: ["Concerning biopsy markers", "Gentle clinical sorrow", "Existential threat to health"],
  },
  {
    id: "sc-hard-32",
    difficulty: "hard",
    scenario: "A customer service representative has been on hold for 45 minutes trying to reach insurance support for an urgently needed prescription, only for the automated voice to say 'Call cannot be completed' and disconnect.",
    context: "Bureaucratic roadblock during an urgent health need.",
    options: ["Frustration", "Happiness", "Calmness", "Surprise"],
    correctEmotion: "Frustration",
    educationalExplanation: "Powerlessness in the face of an impersonal, failing system while trying to secure essential care produces severe, acute frustration.",
    clues: ["45 minutes on hold", "Urgent prescription denied", "Automated click and disconnect"],
  },
];
