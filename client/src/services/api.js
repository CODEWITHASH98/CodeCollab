import axios from "axios";
import { API_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Enable cookies for CSRF
});

// ✅ Add token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session if token expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optional: redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  guestLogin: async (userName) => {
    const response = await api.post("/api/auth/guest", { userName });
    return response.data;
  },

  login: async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      return response.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  register: async (userName, email, password) => {
    try {
      const response = await api.post("/api/auth/register", { userName, email, password });
      return response.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  me: async () => {
    try {
      const response = await api.get("/api/auth/me");
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

export const roomAPI = {
  createRoom: async () => {
    const response = await api.post("/api/rooms");
    return response.data;
  },

  getRoom: async (roomId) => {
    const response = await api.get(`/api/rooms/${roomId}`);
    return response.data;
  },

  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/api/rooms/${roomId}`);
      return response.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  getActiveRooms: async () => {
    try {
      const response = await api.get("/api/rooms");
      return response.data;
    } catch (err) {
      return { success: false, error: err.message, data: { rooms: [] } };
    }
  },
};

export const executionAPI = {
  execute: async (code, language) => {
    const response = await api.post("/api/execute", { code, language });
    return response.data;
  },

  reviewCode: async (code, language) => {
    const response = await api.post("/api/execute/review", { code, language });
    return response.data;
  },

  explainCode: async (code, language) => {
    const response = await api.post("/api/execute/explain", { code, language });
    return response.data;
  },

  getLanguages: async () => {
    try {
      const response = await api.get("/api/execute/languages");
      return response.data;
    } catch (err) {
      return { success: false, error: err.message, data: { languages: [] } };
    }
  },

  getAIStatus: async () => {
    try {
      const response = await api.get("/api/execute/ai/status");
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

export const analyticsAPI = {
  startSession: async (roomId) => {
    const response = await api.post("/api/analytics/session/start", { roomId });
    return response.data;
  },

  endSession: async (roomId) => {
    const response = await api.post("/api/analytics/session/end", { roomId });
    return response.data;
  },

  getSessionStats: async (roomId) => {
    const response = await api.get(`/api/analytics/session/${roomId}`);
    return response.data;
  },

  getReport: async (roomId) => {
    const response = await api.get(`/api/analytics/report/${roomId}`);
    return response.data;
  },

  trackEvent: async (roomId, eventType, data) => {
    const response = await api.post("/api/analytics/event", { roomId, eventType, data });
    return response.data;
  }
};

export default api;
