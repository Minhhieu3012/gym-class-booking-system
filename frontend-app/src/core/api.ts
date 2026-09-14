import axios from "axios";
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import type {
  AuthUser,
  LoginResponse,
  UserRole,
} from "../models/auth";

// ============================================================
// API Error
// ============================================================

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  timestamp?: string;
}

// ============================================================
// Local Storage
// ============================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  USER: "user",
} as const;

// ============================================================
// Public endpoints
// ============================================================

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-trainer",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// ============================================================
// Axios instance
// ============================================================

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstance = apiClient;

// ============================================================
// Request interceptor
// ============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";

    const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    if (!isPublic) {
      const accessToken = localStorage.getItem(
        STORAGE_KEYS.ACCESS_TOKEN,
      );

      if (accessToken) {
        config.headers.Authorization =
          `Bearer ${accessToken}`;
      }
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// ============================================================
// Clear authentication
// ============================================================

export function clearAuthAndRedirect(): void {
  localStorage.removeItem(
    STORAGE_KEYS.ACCESS_TOKEN,
  );

  localStorage.removeItem(
    STORAGE_KEYS.USER,
  );

  window.location.href = "/login";
}

// ============================================================
// Response interceptor
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
      (endpoint) => url.includes(endpoint),
    );

    if (
      status === 401 &&
      !isPublicEndpoint
    ) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

// ============================================================
// Session
// ============================================================

export function setSession(
  data: LoginResponse,
): void {
  localStorage.setItem(
    STORAGE_KEYS.ACCESS_TOKEN,
    data.accessToken,
  );

  localStorage.setItem(
    STORAGE_KEYS.USER,
    JSON.stringify(data.user),
  );
}

// ============================================================
// Current stored user
// ============================================================

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(
    STORAGE_KEYS.USER,
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ============================================================
// Authentication
// ============================================================

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(
    STORAGE_KEYS.ACCESS_TOKEN,
  );
}

// ============================================================
// Role
// ============================================================

export function hasRole(
  ...roles: UserRole[]
): boolean {
  const user = getStoredUser();

  return (
    !!user &&
    roles.includes(user.role)
  );
}

export default apiClient;