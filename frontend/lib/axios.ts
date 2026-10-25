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
  ONNXMetaResponse, UserPreferencesResponse,
  ConsentRecord, ProfessionalProfile, ProfessionalAssignment, ClientSharedSummary, ProfessionalNote, AuditLogItem,
  GameSessionRecord, GameHistoryData
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

  googleAuth: (data: {
    credential?: string;
    access_token?: string;
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  }) => api.post<AuthTokens>("/auth/google", data),

  getGoogleConfig: () => api.get<{ client_id: string }>("/auth/google/config"),

  refreshToken: () => api.post<AuthTokens>("/auth/refresh"),

  updateMe: (data: { full_name?: string }) => api.put<User>("/auth/me", data),

  deleteAccount: () => api.delete("/auth/me"),

  forgotPassword: (email: string) => api.post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/api/auth/reset-password", { token, new_password }),

  verifyEmail: (token: string) => api.post("/api/auth/verify-email", { token }),

  setupMFA: () => api.post<{ secret: string; otpauth_uri: string }>("/api/auth/mfa/setup"),

  verifyMFA: (code: string) => api.post("/api/auth/mfa/verify", { code }),
};

// ── User RBAC API ────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get<User>("/api/user/profile"),
  updateProfile: (data: { full_name?: string }) => api.patch<User>("/api/user/profile", data),
  getDashboard: () => api.get<any>("/api/user/dashboard"),
  getConsents: () => api.get<ConsentRecord[]>("/api/user/consents"),
  createConsent: (data: {
    data_category: string;
    authorized_recipient: string;
    purpose: string;
    expires_days?: number;
  }) => api.post<ConsentRecord>("/api/user/consents", data),
  revokeConsent: (consentId: string) => api.delete(`/api/user/consents/${consentId}`),
  exportData: () => api.get<any>("/api/user/export"),
  deleteAccount: () => api.delete("/api/user/account"),
};

// ── Healthcare Professional API ──────────────────────────────────────────
export const professionalAPI = {
  apply: (data: {
    credentials_reference: string;
    license_number?: string;
    license_issuer?: string;
    specialty?: string;
    bio?: string;
  }) => api.post<ProfessionalProfile>("/api/professional/apply", data),
  getProfile: () => api.get<ProfessionalProfile>("/api/professional/profile"),
  getAssignments: () => api.get<ProfessionalAssignment[]>("/api/professional/assignments"),
  getSharedSummary: (clientId: string) =>
    api.get<ClientSharedSummary>(`/api/professional/clients/${clientId}/shared-summary`),
  getNotes: (clientId: string) =>
    api.get<ProfessionalNote[]>(`/api/professional/clients/${clientId}/notes`),
  createNote: (clientId: string, data: { title: string; notes_text: string }) =>
    api.post<ProfessionalNote>(`/api/professional/clients/${clientId}/notes`, data),
  terminateAssignment: (clientId: string) =>
    api.post(`/api/professional/clients/${clientId}/terminate`),
};

// ── Administrator RBAC API ───────────────────────────────────────────────
export const adminRBACAPI = {
  getDashboard: () => api.get<any>("/api/admin/dashboard"),
  getUsers: (params?: { skip?: number; limit?: number; status_filter?: string }) =>
    api.get<any>("/api/admin/users", { params }),
  updateUserStatus: (userId: string, data: { account_status: string; is_active?: boolean }) =>
    api.patch(`/api/admin/users/${userId}/status`, data),
  getProfessionals: (status_filter?: string) =>
    api.get<ProfessionalProfile[]>("/api/admin/professionals", { params: { status_filter } }),
  verifyProfessional: (userId: string, data: { status: string; rejection_reason?: string }) =>
    api.post<ProfessionalProfile>(`/api/admin/professionals/${userId}/verify`, data),
  getAnalytics: () => api.get<any>("/api/admin/analytics"),
  getAuditLogs: (params?: { limit?: number; action?: string }) =>
    api.get<AuditLogItem[]>("/api/admin/audit-logs", { params }),
  getResources: () => api.get<any[]>("/api/admin/resources"),
  createResource: (data: any) => api.post<any>("/api/admin/resources", data),
};

// ── System Owner API ─────────────────────────────────────────────────────
export const ownerAPI = {
  getAdministrators: () => api.get<User[]>("/api/owner/administrators"),
  createAdministrator: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post<User>("/api/owner/administrators", data),
  getSecuritySettings: () => api.get<any>("/api/owner/security-settings"),
  updateSecuritySettings: (data: any) => api.patch<any>("/api/owner/security-settings", data),
  getFullAuditLogs: (params?: { limit?: number; action?: string }) =>
    api.get<AuditLogItem[]>("/api/owner/audit-logs", { params }),
};

// ── Emotional Wellness Games API ─────────────────────────────────────────
export const gamesAPI = {
  recordSession: (data: {
    game_slug: string;
    score: number;
    total_questions: number;
    correct_count: number;
    difficulty: string;
    duration_seconds?: number;
  }) => api.post<GameSessionRecord>("/api/games/sessions", data),

  getHistory: (game_slug?: string) =>
    api.get<GameHistoryData>("/api/games/history", { params: game_slug ? { game_slug } : undefined }),

  getMoodGarden: () => api.get<any>("/api/games/mood-garden"),
  saveMoodGarden: (data: {
    plots: any[];
    inventory: any;
    activity_history: any[];
    total_nurtures: number;
  }) => api.post<any>("/api/games/mood-garden", data),
  resetMoodGarden: () => api.post<any>("/api/games/mood-garden/reset"),
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
  getPopulationAnalytics: (params?: { time_period?: string; region?: string; age_group?: string }) =>
    api.get<any>("/analytics/population", { params }),
  exportReport: (timePeriod: string = "30d", format: string = "csv") =>
    api.get("/analytics/export", { params: { time_period: timePeriod, format }, responseType: format === "csv" ? "blob" : "json" }),
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
  generateContent: (data: any) => api.post<any>("/wellness/generate", data),
  generateAffirmation: (data: any) => api.post<any>("/wellness/affirmation", data),
  generateBreathing: (data: any) => api.post<any>("/wellness/breathing", data),
  generateMindfulness: (data: any) => api.post<any>("/wellness/mindfulness", data),
  generateJournal: (data: any) => api.post<any>("/wellness/journal", data),
  getDailyPlan: () => api.get<any>("/wellness/daily"),
  getHistory: (limit: number = 30) => api.get<any[]>("/wellness/history", { params: { limit } }),
  completeContent: (contentId: string, data: { status: string; helpful?: boolean; feedback_notes?: string }) =>
    api.post<any>(`/wellness/${contentId}/complete`, data),
  deleteContent: (contentId: string) => api.delete<any>(`/wellness/${contentId}`),
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

  connect: (data: { provider: string; scopes?: string[] }) => api.post<any>("/wearable/connect", data),
  sync: (data?: any) => api.post<any>("/wearable/sync", data || {}),
  disconnect: (provider: string = "Google Health Connect", deleteData: boolean = false) =>
    api.delete<any>("/wearable/disconnect", { params: { provider, delete_data: deleteData } }),
  deleteData: () => api.delete<any>("/wearable/data"),
  getStatus: () => api.get<any>("/wearable/status"),
  getCorrelations: () => api.get<any>("/wearable/correlations"),
  getTimeline: (period: string = "daily") => api.get<any>("/wearable/timeline", { params: { period } }),
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

export const habitAPI = {
  getHabits: () => api.get<any>("/habits"),
  createHabit: (data: {
    title: string;
    category: string;
    target_emotion?: string;
    icon_name?: string;
    frequency?: string;
  }) => api.post<{ message: string; habit: any }>("/habits", data),
  toggleCompletion: (id: string) => api.post<any>(`/habits/${id}/toggle`),
  deleteHabit: (id: string) => api.delete(`/habits/${id}`),
  getAnalytics: (days: number = 30) => api.get<any>("/habits/analytics", { params: { days } }),
};

export const causeAPI = {
  getDashboard: () => api.get<any>("/cause-detection"),
  analyzeText: (data: { text: string; emotion?: string }) =>
    api.post<{ message: string; recorded_triggers: any[] }>("/cause-detection/analyze", data),
  getNetwork: () => api.get<any>("/cause-detection/network"),
  deleteTrigger: (id: string) => api.delete(`/cause-detection/triggers/${id}`),
};

export const explainAPI = {
  getExplanation: (chatId: string) => api.get<any>(`/explain/${chatId}`),
  analyzeText: (text: string) => api.post<any>("/explain/analyze", { text }),
};

export const graphAPI = {
  getFullGraph: () => api.get<any>("/knowledge-graph"),
  getPersonalized: () => api.get<any>("/knowledge-graph/personalized"),
  getEmotionSubgraph: (emotionId: string) => api.get<any>(`/knowledge-graph/subgraph/${emotionId}`),
  getPath: (fromId: string, toId: string) => api.get<any>("/knowledge-graph/path", { params: { from_id: fromId, to_id: toId } }),
  getGraphReasonedRecommendations: (emotion?: string) =>
    api.get<any>("/knowledge-graph/recommend", { params: { emotion } }),
};

export const hybridAPI = {
  getArchitecture: () => api.get<any>("/hybrid-ai/architecture"),
  processQuery: (data: { message: string; persona?: string; session_id?: string; force_strategy?: string }) =>
    api.post<any>("/hybrid-ai/process", data),
};

export const selfEvalAPI = {
  evaluateResponse: (data: { user_input: string; ai_response: string; detected_emotion?: string; is_crisis?: boolean }) =>
    api.post<any>("/self-eval/evaluate", data),
  autoRefineResponse: (data: { user_input: string; original_response: string; detected_emotion?: string }) =>
    api.post<any>("/self-eval/refine", data),
};

export const securityAPI = {
  getOverview: () => api.get<any>("/security/overview"),
  getAuditLogs: (limit: number = 50) => api.get<any[]>("/security/audit-logs", { params: { limit } }),
  getConsents: () => api.get<any>("/security/consent"),
  updateConsent: (consentType: string, granted: boolean) =>
    api.post<any>("/security/consent", { consent_type: consentType, granted }),
  getRetention: () => api.get<any>("/security/retention"),
  updateRetention: (data: { retention_days: number; auto_purge_enabled: boolean; anonymize_on_purge: boolean }) =>
    api.post<any>("/security/retention", data),
  purgeExpiredData: () => api.post<any>("/security/retention/purge"),
  getBackups: () => api.get<any[]>("/security/backups"),
  createBackup: () => api.post<any>("/security/backups/create"),
};

export const facialEmotionAPI = {
  analyzeImage: (formData: FormData) =>
    api.post<any>("/facial-emotion/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getHistory: (limit: number = 30) => api.get<any[]>("/facial-emotion/history", { params: { limit } }),
  getConfig: () => api.get<any>("/facial-emotion/config"),
  updateConfig: (data: { text_weight?: number; image_weight?: number; confidence_threshold?: number }) =>
    api.post<any>("/facial-emotion/config", data),
};

export const videoEmotionAPI = {
  analyzeVideo: (formData: FormData) =>
    api.post<any>("/video-emotion/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  analyzeLiveFrame: (formData: FormData) =>
    api.post<any>("/video-emotion/live-frame", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  saveLiveSession: (data: any) =>
    api.post<any>("/video-emotion/live-session/save", data),
  startSystemCamera: () =>
    api.post<{ success: boolean; device_name: string; message: string }>("/video-emotion/system-camera/start"),
  stopSystemCamera: () =>
    api.post<{ success: boolean; message: string }>("/video-emotion/system-camera/stop"),
  grabSystemCameraFrame: (formData?: FormData) =>
    api.post<any>("/video-emotion/system-camera/frame", formData),
  getStatus: (analysisId: string) => api.get<any>(`/video-emotion/status/${analysisId}`),
  getDetails: (analysisId: string) => api.get<any>(`/video-emotion/${analysisId}`),
  getTimeline: (analysisId: string) => api.get<any[]>(`/video-emotion/${analysisId}/timeline`),
  getTranscript: (analysisId: string) => api.get<any[]>(`/video-emotion/${analysisId}/transcript`),
  deleteAnalysis: (analysisId: string) => api.delete<any>(`/video-emotion/${analysisId}`),
};

export const storyAPI = {
  generateStory: (data: any) => api.post<any>("/stories/generate", data),
  submitChoice: (storyId: string, data: { choice_index: number; choice_text: string }) =>
    api.post<any>(`/stories/${storyId}/interactive-choice`, data),
  continueStory: (storyId: string) => api.post<any>(`/stories/${storyId}/continue`),
  generateAlternativeEnding: (storyId: string, style?: string) =>
    api.post<any>(`/stories/${storyId}/ending`, { style }),
  getDailyStory: () => api.get<any>("/stories/daily"),
  getHistory: (params?: { favorites_only?: boolean; limit?: number }) =>
    api.get<any[]>("/stories/history", { params }),
  toggleFavorite: (storyId: string) => api.post<any>(`/stories/${storyId}/favorite`),
  submitFeedback: (storyId: string, data: { rating: string; theme_feedback?: string; comments?: string }) =>
    api.post<any>(`/stories/${storyId}/feedback`, data),
  deleteStory: (storyId: string) => api.delete<any>(`/stories/${storyId}`),
};

export const mlopsAPI = {
  getModels: () => api.get<any[]>("/ml/models"),
  getModelDetails: (modelId: string) => api.get<any>(`/ml/models/${modelId}`),
  getModelMetrics: (modelId: string) => api.get<any>(`/ml/models/${modelId}/metrics`),
  triggerRetraining: (data: { model_id: string; reason?: string }) => api.post<any>("/ml/retraining/trigger", data),
  getRetrainingJobs: () => api.get<any[]>("/ml/retraining/jobs"),
  approveVersion: (versionId: string, comment?: string) =>
    api.post<any>(`/ml/models/${versionId}/approve`, { decision: "APPROVED", comment }),
  rejectVersion: (versionId: string, comment?: string) =>
    api.post<any>(`/ml/models/${versionId}/reject`, { decision: "REJECTED", comment }),
  deployCanary: (versionId: string) => api.post<any>(`/ml/models/${versionId}/deploy`),
  rollbackModel: (modelId: string, reason?: string) => api.post<any>(`/ml/models/${modelId}/rollback`, { reason }),
  getDatasets: () => api.get<any[]>("/ml/datasets"),
  getAuditLogs: (limit: number = 50) => api.get<any[]>("/ml/audit-logs", { params: { limit } }),
};

export const monitoringAPI = {
  getOverview: () => api.get<any>("/monitoring/overview"),
  getModels: () => api.get<any[]>("/monitoring/models"),
  getModelDetails: (modelId: string) => api.get<any>(`/monitoring/models/${modelId}`),
  getAlerts: (params?: { active_only?: boolean; limit?: number }) =>
    api.get<any[]>("/monitoring/alerts", { params }),
  acknowledgeAlert: (alertId: string) => api.post<any>(`/monitoring/alerts/${alertId}/acknowledge`),
  resolveAlert: (alertId: string) => api.post<any>(`/monitoring/alerts/${alertId}/resolve`),
  ingestTelemetry: (data: any) => api.post<any>("/monitoring/telemetry", data),
  submitGroundTruth: (data: any) => api.post<any>("/monitoring/ground-truth", data),
  getSystemHealth: () => api.get<any>("/health"),
};

export const experimentAPI = {
  getExperiments: () => api.get<any[]>("/experiments"),
  createExperiment: (data: any) => api.post<any>("/experiments", data),
  getExperimentDetails: (experimentId: string) => api.get<any>(`/experiments/${experimentId}`),
  resolveConfiguration: (feature: string = "chatbot") =>
    api.get<any>("/experiments/assignment/resolve", { params: { feature } }),
  getResults: (experimentId: string) => api.get<any>(`/experiments/${experimentId}/results`),
  startExperiment: (experimentId: string) => api.post<any>(`/experiments/${experimentId}/start`),
  pauseExperiment: (experimentId: string) => api.post<any>(`/experiments/${experimentId}/pause`),
  submitFeedback: (experimentId: string, data: { variant_id: string; rating: string; comments?: string }) =>
    api.post<any>(`/experiments/${experimentId}/feedback`, data),
  deployWinner: (experimentId: string) => api.post<any>(`/experiments/${experimentId}/deploy-winner`),
};

export const marketplaceAPI = {
  getCatalog: (query?: string) => api.get<any[]>("/api/v1/marketplace/catalog", { params: { query } }),
  getKeys: () => api.get<any[]>("/api/v1/marketplace/keys"),
  createKey: (data: { key_name: string; environment?: string; tier?: string; scopes?: string[] }) =>
    api.post<any>("/api/v1/marketplace/keys", data),
  revokeKey: (keyId: string) => api.post<any>(`/api/v1/marketplace/keys/${keyId}/revoke`),
  getUsage: () => api.get<any>("/api/v1/marketplace/usage"),
  testTextEmotionAPI: (text: string, apiKey?: string) =>
    api.post<any>(
      "/api/v1/emotions/text",
      { text },
      apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : undefined
    ),
  executeGraphQL: (query: string, apiKey?: string) =>
    api.post<any>(
      "/api/v1/graphql",
      { query },
      apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : undefined
    ),
};

export const benchmarkingAPI = {
  getBenchmarks: () => api.get<any[]>("/api/v1/benchmarks"),
  launchBenchmark: (data: { name: string; dataset_id?: string; random_seed?: number }) =>
    api.post<any>("/api/v1/benchmarks", data),
  getResults: (benchmarkId: string) => api.get<any>(`/api/v1/benchmarks/${benchmarkId}/results`),
  reproduceBenchmark: (benchmarkId: string) => api.post<any>(`/api/v1/benchmarks/${benchmarkId}/reproduce`),
  getModels: () => api.get<any[]>("/api/v1/benchmarks/models"),
  getDatasets: () => api.get<any[]>("/api/v1/benchmarks/datasets"),
};

export const annotationAPI = {
  getTasks: () => api.get<any[]>("/api/v1/annotation/tasks"),
  createTask: (data: { name: string; description?: string; taxonomy?: string[] }) =>
    api.post<any>("/api/v1/annotation/tasks", data),
  getSamples: (taskId: string) => api.get<any[]>(`/api/v1/annotation/tasks/${taskId}/samples`),
  annotateSample: (
    sampleId: string,
    data: { primary_emotion: string; turn_emotions: Record<string, string>; confidence?: number; notes?: string }
  ) => api.post<any>(`/api/v1/annotation/samples/${sampleId}/annotate`, data),
  getAgreement: (taskId: string) => api.get<any>(`/api/v1/annotation/tasks/${taskId}/agreement`),
  exportDataset: (taskId: string, format: string = "json") =>
    api.get<any>(`/api/v1/annotation/tasks/${taskId}/export`, { params: { format } }),
};

export const intensityAPI = {
  analyzeIntensity: (text: string, conversationId?: string, messageId?: string) =>
    api.post<any>("/api/v1/emotions/intensity", { text, conversation_id: conversationId, message_id: messageId }),
  batchAnalyze: (texts: string[]) => api.post<any>("/api/v1/emotions/intensity/batch", { texts }),
  getHistory: (emotion: string = "all", days: number = 30) =>
    api.get<any[]>("/api/v1/emotions/intensity/history", { params: { emotion, days } }),
  getTrends: (period: string = "7d", emotion: string = "all") =>
    api.get<any>("/api/v1/emotions/intensity/trends", { params: { period, emotion } }),
  getBenchmark: () => api.get<any[]>("/api/v1/emotions/intensity/benchmark"),
};

export const transitionsAPI = {
  analyzeTurn: (conversationId: string, emotion: string, intensity?: number, confidence?: number) =>
    api.post<any>("/api/v1/emotions/transitions/analyze", {
      conversation_id: conversationId,
      emotion,
      intensity,
      confidence,
    }),
  getTransitions: (conversationId: string = "conv_001") =>
    api.get<any>("/api/v1/emotions/transitions", { params: { conversation_id: conversationId } }),
  getTimeline: (conversationId: string = "conv_001") =>
    api.get<any>("/api/v1/emotions/timeline", { params: { conversation_id: conversationId } }),
  getVolatility: (conversationId: string = "conv_001", window: number = 10) =>
    api.get<any>("/api/v1/emotions/volatility", { params: { conversation_id: conversationId, window } }),
  getSuddenChanges: (conversationId: string = "conv_001") =>
    api.get<any>("/api/v1/emotions/sudden-changes", { params: { conversation_id: conversationId } }),
  getProlongedPeriods: (conversationId: string = "conv_001") =>
    api.get<any>("/api/v1/emotions/prolonged-periods", { params: { conversation_id: conversationId } }),
  getConsolidatedAnalysis: (conversationId: string = "conv_001") =>
    api.get<any>("/api/v1/emotions/transition-analysis", { params: { conversation_id: conversationId } }),
};

export const triggersAPI = {
  getTriggers: (category: string = "all", status: string = "all") =>
    api.get<any>("/api/v1/emotions/triggers", { params: { category, status } }),
  createTrigger: (data: { description: string; category?: string; emotion?: string; intensity?: number }) =>
    api.post<any>("/api/v1/emotions/triggers", data),
  updateTrigger: (triggerId: string, data: { description?: string; category?: string; emotion?: string }) =>
    api.patch<any>(`/api/v1/emotions/triggers/${triggerId}`, data),
  deleteTrigger: (triggerId: string) => api.delete<any>(`/api/v1/emotions/triggers/${triggerId}`),
  confirmTrigger: (triggerId: string) => api.post<any>(`/api/v1/emotions/triggers/${triggerId}/confirm`),
  rejectTrigger: (triggerId: string) => api.post<any>(`/api/v1/emotions/triggers/${triggerId}/reject`),
  analyzeText: (text: string, emotion?: string, conversationId?: string) =>
    api.post<any>("/api/v1/emotions/triggers/analyze", { text, emotion, conversation_id: conversationId }),
  getFrequency: () => api.get<any>("/api/v1/emotions/triggers/frequency"),
  getEmotionsMatrix: () => api.get<any>("/api/v1/emotions/triggers/emotions"),
  getPatterns: () => api.get<any>("/api/v1/emotions/triggers/patterns"),
  getAnalytics: () => api.get<any>("/api/v1/emotions/triggers/analytics"),
};

export const evaluationAPI = {
  evaluateResponse: (userMessage: string, responseText: string, emotion?: string, selectedPersonality?: string) =>
    api.post<any>("/api/v1/emotions/evaluation/evaluate", {
      user_message: userMessage,
      response_text: responseText,
      emotion,
      selected_personality: selectedPersonality,
    }),
  getHistory: (conversationId?: string) =>
    api.get<any>("/api/v1/emotions/evaluation/history", { params: { conversation_id: conversationId } }),
  getAnalytics: () => api.get<any>("/api/v1/emotions/evaluation/analytics"),
};

export const hallucinationsAPI = {
  verifyResponse: (responseText: string, conversationId?: string) =>
    api.post<any>("/api/v1/emotions/hallucinations/verify", {
      response_text: responseText,
      conversation_id: conversationId,
    }),
  getHistory: () => api.get<any>("/api/v1/emotions/hallucinations/history"),
  getAnalytics: () => api.get<any>("/api/v1/emotions/hallucinations/analytics"),
};

export const ragAPI = {
  retrieve: (query: string, intent?: string, emotion?: string, riskLevel?: string) =>
    api.post<any>("/api/v1/rag/retrieve", {
      query,
      intent,
      emotion,
      risk_level: riskLevel,
    }),
  generate: (message: string, emotion?: string, conversationId?: string) =>
    api.post<any>("/api/v1/rag/generate", {
      message,
      emotion,
      conversation_id: conversationId,
    }),
  getAnalytics: () => api.get<any>("/api/v1/rag/analytics"),
  ingestDocument: (data: { title: string; content: string; topic: string; source_name?: string; source_url?: string }) =>
    api.post<any>("/api/v1/admin/knowledge/documents", data),
  approveDocument: (documentId: string) =>
    api.post<any>(`/api/v1/admin/knowledge/documents/${documentId}/approve`),
};

export const preferencesAPI = {
  getPreferences: () => api.get<any>("/api/v1/preferences"),
  updatePreferences: (data: any) => api.put<any>("/api/v1/preferences", data),
  patchPreference: (key: string, value: any) => api.patch<any>(`/api/v1/preferences/${key}`, { value }),
  resetPreferences: () => api.post<any>("/api/v1/preferences/reset"),
  deletePreferences: () => api.delete<any>("/api/v1/preferences"),
  submitFeedback: (feedbackType: string, feedbackValue?: string, conversationId?: string, messageId?: string) =>
    api.post<any>("/api/v1/response-feedback", {
      feedback_type: feedbackType,
      feedback_value: feedbackValue,
      conversation_id: conversationId,
      message_id: messageId,
    }),
};

export const multilingualAPI = {
  detectLanguage: (text: string) => api.post<any>("/api/v1/language/detect", { text }),
  analyzeMessage: (text: string) => api.post<any>("/api/v1/multilingual/analyze", { text }),
  getPreferences: () => api.get<any>("/api/v1/language/preferences"),
  updatePreferences: (preferredLanguage: string, preferredScript?: string, autoAdapt?: boolean) =>
    api.put<any>("/api/v1/language/preferences", {
      preferred_language: preferredLanguage,
      preferred_script: preferredScript,
      auto_adapt: autoAdapt,
    }),
  getEvalDashboard: () => api.get<any>("/api/v1/admin/multilingual/eval-dashboard"),
};

export const privacyAPI = {
  getStatus: () => api.get<any>("/api/v1/privacy/status"),
  getDataInventory: () => api.get<any>("/api/v1/privacy/data-inventory"),
  updateConsent: (type: string, status: string) => api.put<any>("/api/v1/privacy/consent", { consent_type: type, status }),
  updateRetention: (policy: string) => api.put<any>("/api/v1/privacy/retention", { retention_policy: policy }),
  requestExport: () => api.post<any>("/api/v1/privacy/export"),
  deleteSingleConversation: (id: string) => api.delete<any>(`/api/v1/conversations/${id}`),
  deleteAllConversations: () => api.delete<any>("/api/v1/conversations"),
  deleteMyData: (scopes: string[]) => api.post<any>("/api/v1/privacy/delete-data", { scopes }),
  deleteAccount: () => api.post<any>("/api/v1/privacy/delete-account"),
  runRetentionCleanup: () => api.post<any>("/api/v1/privacy/run-retention-cleanup"),
};

export const privacyAnalyticsAPI = {
  getOverview: () => api.get<any>("/api/v1/admin/analytics/overview"),
  getEmotions: () => api.get<any>("/api/v1/admin/analytics/emotions"),
  getIntensity: () => api.get<any>("/api/v1/admin/analytics/intensity"),
  getTransitions: () => api.get<any>("/api/v1/admin/analytics/transitions"),
  getTriggers: () => api.get<any>("/api/v1/admin/analytics/triggers"),
  getLanguages: () => api.get<any>("/api/v1/admin/analytics/languages"),
  getQuality: () => api.get<any>("/api/v1/admin/analytics/quality"),
  getPrivacyStatus: () => api.get<any>("/api/v1/admin/analytics/privacy"),
  exportAnalytics: () => api.get<any>("/api/v1/admin/analytics/export"),
};

export const llmSecurityAPI = {
  validatePrompt: (prompt: string) => api.post<any>("/api/v1/security/validate-prompt", { prompt }),
  validateOutput: (output: string) => api.post<any>("/api/v1/security/validate-output", { output }),
  validateUpload: (filename: string, fileSize: number, contentType: string) =>
    api.post<any>("/api/v1/security/validate-upload", { filename, file_size: fileSize, content_type: contentType }),
  authorizeTool: (toolName: string, args: any) => api.post<any>("/api/v1/security/authorize-tool", { tool_name: toolName, arguments: args }),
  getOverview: () => api.get<any>("/api/v1/admin/security/overview"),
  getEvents: () => api.get<any>("/api/v1/admin/security/events"),
  getAbuseScores: () => api.get<any>("/api/v1/admin/security/abuse"),
};

export const redteamAPI = {
  runSuite: (category?: string, modelVersion?: string) => api.post<any>("/api/v1/admin/redteam/run", { category, model_version: modelVersion }),
  getRuns: () => api.get<any>("/api/v1/admin/redteam/runs"),
  getRunDetail: (runId: string) => api.get<any>(`/api/v1/admin/redteam/runs/${runId}`),
  getRegressions: () => api.get<any>("/api/v1/admin/redteam/regressions"),
  getMetrics: () => api.get<any>("/api/v1/admin/redteam/metrics"),
  setBaseline: (runId: string) => api.post<any>("/api/v1/admin/redteam/baseline", { run_id: runId }),
};

export const safetyRiskAPI = {
  analyze: (conversationId: string, message: string, countryCode: string = "US") =>
    api.post<any>("/api/v1/safety/analyze", { conversation_id: conversationId, message, country_code: countryCode }),
  getResources: (countryCode: string = "US") => api.get<any>(`/api/v1/safety/resources?country_code=${countryCode}`),
  getOverview: () => api.get<any>("/api/v1/admin/safety/overview"),
  getEvents: () => api.get<any>("/api/v1/admin/safety/events"),
  getAdminResources: () => api.get<any>("/api/v1/admin/safety/resources"),
};

export const hitlAPI = {
  getQueue: () => api.get<any>("/api/v1/admin/reviews"),
  getDetail: (reviewId: string) => api.get<any>(`/api/v1/admin/reviews/${reviewId}`),
  assign: (reviewId: string, reviewerId: string) => api.post<any>(`/api/v1/admin/reviews/${reviewId}/assign`, { reviewer_id: reviewerId }),
  approve: (reviewId: string, humanRiskLevel: string, reason?: string) => api.post<any>(`/api/v1/admin/reviews/${reviewId}/approve`, { human_risk_level: humanRiskLevel, reason }),
  reject: (reviewId: string, humanRiskLevel: string, reason?: string) => api.post<any>(`/api/v1/admin/reviews/${reviewId}/reject`, { human_risk_level: humanRiskLevel, reason }),
  annotate: (reviewId: string, content: string, type: string = "risk_context") => api.post<any>(`/api/v1/admin/reviews/${reviewId}/annotate`, { content, annotation_type: type }),
  escalate: (reviewId: string, toRole: string = "SENIOR_REVIEWER", reason: string = "Disagreement") => api.post<any>(`/api/v1/admin/reviews/${reviewId}/escalate`, { to_role: toRole, reason }),
  getAudit: (reviewId: string) => api.get<any>(`/api/v1/admin/reviews/${reviewId}/audit`),
  getConsent: () => api.get<any>("/api/v1/privacy/review-consent"),
  updateConsent: (status: string) => api.post<any>("/api/v1/privacy/review-consent", { status }),
};

export const researchLabAPI = {
  runExperiment: (modelName: string, seed: number = 42) => api.post<any>("/api/v1/research/experiments", { model_name: modelName, seed }),
  listExperiments: () => api.get<any>("/api/v1/research/experiments"),
  compareModels: () => api.get<any>("/api/v1/research/compare"),
  getDetail: (expId: string) => api.get<any>(`/api/v1/research/experiments/${expId}`),
  reproduce: (expId: string) => api.post<any>(`/api/v1/research/experiments/${expId}/reproduce`, {}),
  runBatch: (models?: string[]) => api.post<any>("/api/v1/research/experiments/batch", { models }),
};

export const errorAnalysisAPI = {
  runAnalysis: (experimentId: string = "EXP-2026-00042") => api.post<any>("/api/v1/research/error-analysis/run", { experiment_id: experimentId }),
  getDetail: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}`),
  getSummary: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}/summary`),
  getCategories: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}/categories`),
  getExamples: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}/examples`),
  getConfusionPairs: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}/confusion-pairs`),
  getRecommendations: (analysisId: string) => api.get<any>(`/api/v1/research/error-analysis/${analysisId}/recommendations`),
  compareModelErrors: () => api.get<any>("/api/v1/research/error-analysis/compare"),
};

export default api;
