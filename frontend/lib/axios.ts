// MindCare AI — Axios API Client
import axios, { AxiosError } from "axios";
import type {
  AuthTokens, ChatResponse, DashboardData,
  AnalyticsData, JournalEntry, Message, SessionSummary, User
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
    if (error.response?.status === 401 && typeof window !== "undefined") {
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
  sendMessage: (message: string, session_id?: string) =>
    api.post<ChatResponse>("/chat", { message, session_id }),

  getSessions: () => api.get<SessionSummary[]>("/chat/sessions"),

  getSession: (session_id: string) =>
    api.get<Message[]>(`/chat/sessions/${session_id}`),

  deleteSession: (session_id: string) =>
    api.delete(`/chat/sessions/${session_id}`),
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
    title: string; content: string; emotion_tag?: string; mood_score: number;
  }) => api.post<JournalEntry>("/journal", data),

  deleteEntry: (id: string) => api.delete(`/journal/${id}`),
};

export default api;
