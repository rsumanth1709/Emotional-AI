// MindCare AI — TypeScript Type Definitions

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  xp: number;
  level: number;
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
  persona?: string;
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
  crisis_severity?: string;
  crisis_type?: string;
  crisis_resources?: CrisisResource[];
  persona?: string;
  timestamp: string;
}

export interface SessionSummary {
  session_id: string;
  message_count?: number;
  last_message?: string;
  last_emotion?: string | null;
  last_active?: string;
  title?: string;
  created_at?: string;
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
  summary?: string | null;
  ai_analysis?: string | null;
  tags?: string | null;
  entry_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalAnalyzeResponse {
  emotion: string;
  confidence: number;
  sentiment: string;
  stress_score: number;
  all_scores: Record<string, number>;
  summary: string;
  keywords: string[];
  suggested_tags: string[];
  mood_score: number;
}

export interface WritingSuggestionResponse {
  suggestion_type: "continue" | "reframe" | "reflect" | "prompt";
  title: string;
  text: string;
  reflection_questions?: string[];
}

export interface DailyMoodTimelineItem {
  date: string;
  mood_score: number;
  dominant_emotion: string;
  entry_count: number;
}

export interface MonthlyInsightsData {
  year: number;
  month: number;
  total_entries: number;
  current_streak: number;
  avg_mood_score: number;
  dominant_emotion: string;
  emotion_distribution: EmotionDistribution[];
  daily_timeline: DailyMoodTimelineItem[];
  ai_retrospective: string;
  growth_highlights: string[];
  self_care_tips: string[];
}

export interface HourlyMood {
  hour: string;
  mood_score: number;
  dominant_emotion: string;
}

export interface HeatmapDay {
  date: string;
  mood_score: number;
  count: number;
}

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
}

export interface AnalyticsData {
  emotion_distribution: EmotionDistribution[];
  weekly_mood: WeeklyMood[];
  monthly_trend: MonthlyTrend[];
  hourly_mood: HourlyMood[];
  calendar_heatmap: HeatmapDay[];
  streak_stats: StreakStats;
  improvement_score: number;
  volatility_score: number;
  total_sessions: number;
  avg_stress: number;
  avg_mood: number;
  most_frequent_emotion: string;
}

export interface ChallengeItem {
  key: string;
  name: string;
  description: string;
  reward_xp: number;
  completed: boolean;
}

export interface BadgeItem {
  badge_name: string;
  badge_type: string;
  unlocked_at: string;
  description: string;
}

export interface GamificationSummary {
  xp: number;
  level: number;
  next_level_xp: number;
  level_progress_percentage: number;
  current_streak: number;
  longest_streak: number;
  daily_challenges: ChallengeItem[];
  weekly_reward_completed: boolean;
  unlocked_badges: BadgeItem[];
}

export interface RecommendationItem {
  id: string;
  category: string;
  title: string;
  author: string;
  description: string;
  link: string;
  emotions: string[];
  mood_effect: string;
  duration: string;
}

export interface RecommendationCategory {
  key: string;
  label: string;
  icon: string;
}

export interface RecommendationResponse {
  emotion_context: string;
  category_filter: string | null;
  total_count: number;
  recommendations: RecommendationItem[];
}

export interface VoiceProcessResponse {
  transcription: string;
  detected_voice_emotion: string;
  voice_confidence: number;
  detected_text_emotion: string;
  fused_emotion: string;
  detected_language: string;
  response_text: string;
  persona: string;
  session_id: string;
  message_id: string;
}

export interface TomorrowPrediction {
  predicted_mood: number;
  predicted_emotion: string;
  stress_probability: number;
  stress_risk_level: string;
  confidence_min: number;
  confidence_max: number;
  trend_direction: string;
}

export interface DayForecastItem {
  date: string;
  day_name: string;
  predicted_mood: number;
  dominant_emotion: string;
  stress_probability: number;
  confidence_min: number;
  confidence_max: number;
}

export interface PredictiveInsightItem {
  title: string;
  description: string;
  type: "tip" | "warning" | "insight";
}

export interface PredictiveForecastResponse {
  tomorrow: TomorrowPrediction;
  weekly_forecast: DayForecastItem[];
  insights: PredictiveInsightItem[];
  model_metadata: {
    model_type: string;
    sequence_length: number;
    feature_dimensions: number;
    rmse_mood: number;
    monte_carlo_samples: number;
  };
}

export interface RAGPassage {
  id: string;
  title: string;
  category: string;
  content: string;
  target_emotions: string[];
  relevance_score: number;
  emotion_boosted: boolean;
}

export interface RAGResponse {
  query: string;
  emotion_context: string;
  total_retrieved: number;
  passages: RAGPassage[];
  rag_prompt_context: string;
}

export interface FederatedStatus {
  current_round: number;
  total_participating_clients: number;
  privacy_budget_epsilon: number;
  privacy_budget_delta: number;
  aggregation_algorithm: string;
  global_accuracy_score: number;
  accuracy_gain_pct: number;
  on_device_privacy: string;
}

export interface WearableBiometrics {
  heart_rate_bpm: number;
  hrv_ms: number;
  sleep_hours: number;
  rem_sleep_percentage: number;
  step_count: number;
}

export interface WearableFusionData {
  biometrics: WearableBiometrics;
  physiological_stress_score: number;
  text_emotion_stress_score: number;
  fused_bio_emotional_stress_score: number;
  autonomic_nervous_system_state: string;
  recovery_status: string;
  biometric_fusion_confidence: number;
}

export interface WearableLogEntry {
  id: string;
  heart_rate_bpm: number;
  hrv_ms: number;
  sleep_hours: number;
  rem_sleep_percentage: number;
  step_count: number;
  skin_conductance: number | null;
  recorded_at: string;
}

export interface WearableSummaryReading {
  recorded_at: string;
  heart_rate_bpm: number;
  hrv_ms: number;
  sleep_hours: number;
  rem_sleep_percentage: number;
  step_count: number;
}

export interface WearableSummary {
  period_days: number;
  total_readings: number;
  avg_heart_rate_bpm: number;
  avg_hrv_ms: number;
  avg_sleep_hours: number;
  avg_rem_percentage: number;
  avg_step_count: number;
  sleep_quality_score: number;
  recovery_index: number;
  trend: "improving" | "stable" | "worsening";
  readings: WearableSummaryReading[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Emotion" | "Trigger" | "Coping Strategy" | "Outcome" | "Progress";
  color: string;
  description?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  node_types?: string[];
  mermaid_code: string;
}

export interface EmotionSubgraphData {
  anchor_emotion: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface GraphPathData {
  found: boolean;
  path_ids: string[];
  path_nodes: GraphNode[];
  path_edges: GraphEdge[];
}

export interface StrategyRecommendation {
  strategy_id: string;
  strategy: string;
  description: string;
  efficacy_score: number;
  expected_outcome: string;
  color: string;
}

export interface PersonalizedGraphData {
  top_emotions: { emotion_id: string; label: string; frequency: number }[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  personalized: boolean;
}

export interface ONNXMetaResponse {
  model_file: string;
  file_size_kb: number;
  input_tensor: string;
  output_tensor: string;
  opset_version: number;
  supported_runtimes: string[];
  privacy: string;
}

export interface FeedbackItem {
  id: string;
  item_type: string;
  item_id: string | null;
  rating: number;
  category_tag: string | null;
  feedback_text: string | null;
  created_at: string;
}

export interface UserPreferencesResponse {
  total_feedback_count: number;
  positive_count: number;
  negative_count: number;
  positive_rate_pct: number;
  preferred_categories: string[];
  suppressed_categories: string[];
  neutral_categories: string[];
  affinity_multipliers: Record<string, number>;
  recent_feedback: FeedbackItem[];
  learning_status: "gathering_data" | "learning" | "adapting" | "personalised";
  model_confidence: number;
}
