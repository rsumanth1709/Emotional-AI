/**
 * MindCare AI — Calm Bubble Configuration & Gentle Breathing Rhythms
 * 
 * Provides flexible, non-punitive, gentle breathing cadences designed for
 * simple visual relaxation without forced breath-holding.
 */

export interface BreathingRhythm {
  id: string;
  name: string;
  inhaleSeconds: number;
  exhaleSeconds: number;
  description: string;
}

export const BREATHING_RHYTHMS: BreathingRhythm[] = [
  {
    id: "gentle",
    name: "Gentle Flow (4s In • 4s Out)",
    inhaleSeconds: 4,
    exhaleSeconds: 4,
    description: "A natural, balanced rhythm suitable for general relaxation and daytime unwinding.",
  },
  {
    id: "deep",
    name: "Deep Rest (5s In • 5s Out)",
    inhaleSeconds: 5,
    exhaleSeconds: 5,
    description: "Slightly deeper pacing to encourage diaphragmatic expansion and calm racing thoughts.",
  },
  {
    id: "release",
    name: "Extended Release (4s In • 6s Out)",
    inhaleSeconds: 4,
    exhaleSeconds: 6,
    description: "Gentle emphasis on prolonged exhalation to help soften physical muscle tension.",
  },
];

export const DURATION_OPTIONS = [
  { minutes: 1, seconds: 60, label: "1 Minute", subtitle: "Quick grounding pause" },
  { minutes: 3, seconds: 180, label: "3 Minutes", subtitle: "Standard soothing reset" },
  { minutes: 5, seconds: 300, label: "5 Minutes", subtitle: "Deep peaceful immersion" },
];

export const CALMING_MESSAGES = [
  "You gave yourself a moment of stillness. Carry this gentle pace into the rest of your day.",
  "Your breath is a quiet sanctuary, always available whenever the world feels hurried.",
  "Taking a few moments of quiet reflection is an act of deep kindness toward your body and mind.",
  "Notice how your shoulders feel right now. You are doing enough, and you are right on time.",
  "Each breath is a fresh start. You can return to this calm presence anytime you need.",
];
