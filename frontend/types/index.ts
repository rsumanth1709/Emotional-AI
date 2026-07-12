// MindCare AI — TypeScript Type Definitions

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion?: string;
  sentiment?: string;
  stress_score?: number;
  confidence?: number;
  is_crisis?: boolean;
  created_at: string;
}

export interface EmotionResult {
  emotion: string;
  sentiment: string;
  stress_score: number;
  confidence: number;
  all_scores: Record<string, number>;
}

export interface CrisisResource {
  name: string;
  number: string;
  description: string;
}

export interface ChatResponse {
  message_id: string;
  session_id: string;
  response: string;
  emotion_result: EmotionResult;
  is_crisis: boolean;
  crisis_resources?: CrisisResource[];
  timestamp: string;
}

export interface SessionSummary {
  session_id: string;
  message_count: number;
  last_message: string;
  last_emotion: string | null;
  last_active: string;
}

export interface DashboardStats {
  total_chats: number;
  avg_mood_score: number;
  most_frequent_emotion: string;
  current_stress_level: number;
  mental_wellness_score: number;
}

export interface EmotionDistribution {
  emotion: string;
  count: number;
  percentage: number;
}

export interface WeeklyMood {
  day: string;
  mood_score: number;
  dominant_emotion: string;
}

export interface MonthlyTrend {
  date: string;
  mood_score: number;
}

export interface DashboardData {
  stats: DashboardStats;
  today_emotion: string | null;
  emotion_distribution: EmotionDistribution[];
  weekly_mood: WeeklyMood[];
  monthly_trend: MonthlyTrend[];
  recent_chats: Message[];
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  emotion_tag: string | null;
  mood_score: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  emotion_distribution: EmotionDistribution[];
  weekly_mood: WeeklyMood[];
  monthly_trend: MonthlyTrend[];
  total_sessions: number;
  avg_stress: number;
  avg_mood: number;
  most_frequent_emotion: string;
}
