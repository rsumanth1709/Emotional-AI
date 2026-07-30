// MindCare AI — Axios API Client
import axios, { AxiosError } from "axios";
import type {
  AuthTokens, ChatResponse, DashboardData,
  AnalyticsData, JournalEntry, JournalAnalyzeResponse, WritingSuggestionResponse, MonthlyInsightsData,
  Message, SessionSummary, User, GamificationSummary,
  RecommendationCategory, RecommendationResponse, VoiceProcessResponse,
  PredictiveForecastResponse, RAGResponse, FederatedStatus, WearableFusionData,
  WearableLogEntry, WearableSummary,
  KnowledgeGraphData, EmotionSubgraphData, GraphPathData, StrategyRecommendation, PersonalizedGraphData,
  ONNXMetaResponse, UserPreferencesResponse
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 90000,
});

// ── Request Interceptor: attach JWT ─────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mindcare_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: handle 401 ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const isLoginOrSignup = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/signup");
    if (error.response?.status === 401 && !isLoginOrSignup && typeof window !== "undefined") {
      localStorage.removeItem("mindcare_token");
      localStorage.removeItem("mindcare_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>("/auth/login", { email, password }),

  signup: (data: {
    email: string; username: string; full_name?: string;
    password: string; consent_given: boolean;
  }) => api.post<AuthTokens>("/auth/signup", data),

  getMe: () => api.get<User>("/auth/me"),

  updateMe: (data: { full_name?: string }) => api.put<User>("/auth/me", data),

  deleteAccount: () => api.delete("/auth/me"),
};

// ── Chat API ─────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (message: string, session_id?: string, persona?: string) =>
    api.post<ChatResponse>("/chat", { message, session_id, persona }),

  getSessions: () => api.get<SessionSummary[]>("/chat/sessions"),

  getSession: (session_id: string) =>
    api.get<Message[]>(`/chat/sessions/${session_id}`),

  deleteSession: (session_id: string) =>
    api.delete(`/chat/sessions/${session_id}`),

  sendMultimodalMessage: (formData: FormData) =>
    api.post<ChatResponse>("/chat/multimodal", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ── Dashboard API ─────────────────────────────────────────────────────────
export const dashboardAPI = {
  getDashboard: () => api.get<DashboardData>("/dashboard"),
};

// ── Analytics API ─────────────────────────────────────────────────────────
export const analyticsAPI = {
  getAnalytics: () => api.get<AnalyticsData>("/analytics"),
};

// ── Journal API ───────────────────────────────────────────────────────────
export const journalAPI = {
  getEntries: () => api.get<JournalEntry[]>("/journal"),

  createEntry: (data: {
    title: string;
    content: string;
    emotion_tag?: string;
    mood_score: number;
    summary?: string;
    ai_analysis?: string;
    tags?: string;
    entry_date?: string;
  }) => api.post<JournalEntry>("/journal", data),

  updateEntry: (
    id: string,
    data: {
      title?: string;
      content?: string;
      emotion_tag?: string;
      mood_score?: number;
      summary?: string;
      ai_analysis?: string;
      tags?: string;
      entry_date?: string;
    }
  ) => api.put<JournalEntry>(`/journal/${id}`, data),

  deleteEntry: (id: string) => api.delete(`/journal/${id}`),

  analyzeEntry: (data: { title?: string; content: string }) =>
    api.post<JournalAnalyzeResponse>("/journal/analyze", data),

  generateSuggestions: (data: {
    title?: string;
    content: string;
    type: "continue" | "reframe" | "reflect" | "prompt";
  }) => api.post<WritingSuggestionResponse>("/journal/suggestions", data),

  getMonthlyInsights: (year?: number, month?: number) =>
    api.get<MonthlyInsightsData>("/journal/monthly-insights", {
      params: { year, month },
    }),

  searchEntries: (params?: {
    q?: string;
    emotion?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get<JournalEntry[]>("/journal/search", { params }),
};

// ── Memory API ────────────────────────────────────────────────────────────
export const memoryAPI = {
  getMemories: () => api.get<any[]>("/memory"),
  deleteMemory: (id: string) => api.delete(`/memory/${id}`),
  deleteAllMemories: () => api.delete("/memory"),
};

// ── Wellness & Gamification API ───────────────────────────────────────────
export const wellnessAPI = {
  getGamification: () => api.get<GamificationSummary>("/wellness/gamification"),
};

// ── Recommendation API ────────────────────────────────────────────────────
export const recommendationAPI = {
  getRecommendations: (params?: { emotion?: string; category?: string; mood_target?: string; limit?: number }) =>
    api.get<RecommendationResponse>("/recommendations", { params }),

  getCategories: () =>
    api.get<RecommendationCategory[]>("/recommendations/categories"),
};

// ── Voice Assistant API ───────────────────────────────────────────────────
export const voiceAPI = {
  processVoice: (formData: FormData) =>
    api.post<VoiceProcessResponse>("/voice/process", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ── Predictive AI API ─────────────────────────────────────────────────────
export const predictiveAPI = {
  getForecast: () => api.get<PredictiveForecastResponse>("/predictive/forecast"),
  retrainModel: () => api.post<{ status: string; message: string }>("/predictive/retrain"),
};

// ── Wearable Integration API ──────────────────────────────────────────────
export const wearableAPI = {
  logBiometrics: (data: {
    heart_rate_bpm: number;
    hrv_ms: number;
    sleep_hours: number;
    rem_sleep_percentage: number;
    step_count: number;
    skin_conductance?: number;
  }) => api.post("/wearable/log", data),

  getHistory: (limit?: number) =>
    api.get<WearableLogEntry[]>("/wearable/history", { params: { limit } }),

  getSummary: (days?: number) =>
    api.get<WearableSummary>("/wearable/summary", { params: { days } }),

  getFusion: (text_stress_score?: number) =>
    api.get<WearableFusionData>("/wearable/fusion", { params: { text_stress_score } }),
};

// ── Research AI API ───────────────────────────────────────────────────────
export const researchAPI = {
  queryRAG: (query: string, emotion_context?: string, top_k?: number) =>
    api.post<RAGResponse>("/research/rag/query", { query, emotion_context, top_k }),

  getFLStatus: () => api.get<FederatedStatus>("/research/federated/status"),

  submitFLUpdate: (client_id: string, local_gradients: number[], sample_count?: number) =>
    api.post("/research/federated/update", { client_id, local_gradients, sample_count }),

  logWearable: (data: {
    heart_rate_bpm: number;
    hrv_ms: number;
    sleep_hours: number;
    rem_sleep_percentage: number;
    step_count: number;
    skin_conductance?: number;
  }) => api.post("/research/wearable/log", data),

  getWearableFusion: (text_stress_score?: number) =>
    api.get<WearableFusionData>("/research/wearable/fusion", {
      params: { text_stress_score },
    }),

  getKnowledgeGraph: () => api.get<KnowledgeGraphData>("/research/knowledge-graph"),

  getEmotionSubgraph: (emotionId: string) =>
    api.get<EmotionSubgraphData>(`/research/knowledge-graph/emotion/${emotionId}`),

  getGraphPath: (fromId: string, toId: string) =>
    api.get<GraphPathData>("/research/knowledge-graph/path", { params: { from_id: fromId, to_id: toId } }),

  recommendStrategies: (emotion: string) =>
    api.get<StrategyRecommendation[]>(`/research/knowledge-graph/recommend/${emotion}`),

  getPersonalizedGraph: () =>
    api.get<PersonalizedGraphData>("/research/knowledge-graph/personalized"),

  getONNXInfo: () => api.get<ONNXMetaResponse>("/research/onnx/model-info"),

  submitFeedback: (data: {
    item_type: string;
    rating: number;
    item_id?: string;
    feedback_text?: string;
    category_tag?: string;
  }) => api.post<{ message: string; id: string }>("/research/feedback", data),

  getFeedbackPreferences: () =>
    api.get<UserPreferencesResponse>("/research/feedback/preferences"),

  getUserPreferences: () =>
    api.get<UserPreferencesResponse>("/research/feedback/preferences"),

  getItemFeedback: (itemIds: string[]) =>
    api.get<Record<string, number>>("/research/feedback/items", { params: { item_ids: itemIds.join(",") } }),

  getEmotionProfile: (days: number = 30) =>
    api.get<any>("/research/emotion-profile", { params: { days } }),
};

export const goalAPI = {
  getGoals: () => api.get<any[]>("/goals"),
  generateGoal: (data?: { emotion_override?: string }) => api.post<{ message: string; goal_id: string }>("/goals/generate", data || {}),
  toggleMilestone: (milestoneId: string) => api.post<any>(`/goals/milestones/${milestoneId}/toggle`),
  clearHistory: () => api.delete<{ message: string; cleared_count: number }>("/goals/history"),
  deleteGoal: (goalId: string) => api.delete<{ message: string }>(`/goals/${goalId}`),
  deleteSelectedGoals: (goalIds: string[]) => api.post<{ message: string; deleted_count: number }>("/goals/delete-selected", { goal_ids: goalIds }),
};

export const reminderAPI = {
  getReminders: () => api.get<any[]>("/reminders"),
  createReminder: (data: {
    title: string;
    reminder_type: string;
    scheduled_time: string;
    frequency?: string;
    custom_days?: string;
    note?: string;
    sound_enabled?: boolean;
  }) => api.post<{ message: string; reminder: any }>("/reminders", data),
  updateReminder: (id: string, data: any) => api.put(`/reminders/${id}`, data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}`),
  recordAction: (id: string, actionTaken: "completed" | "snoozed" | "missed") =>
    api.post(`/reminders/${id}/action`, { action_taken: actionTaken }),
  getHistory: (days: number = 30) => api.get<any>("/reminders/history", { params: { days } }),
  checkDue: () => api.get<any[]>("/reminders/check"),
};

export default api;
