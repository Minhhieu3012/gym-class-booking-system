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

export const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-trainer",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/class-types",
  "/packages",
  "/trainers",
  "/rooms",
  "/reviews",
  "/classes",
  "/upload",
];

export function isPublicEndpoint(url: string): boolean {
  const cleanUrl = url.split("?")[0];
  // Bất kỳ endpoint nào thuộc prefix admin, member, trainer (trừ /trainers công khai), chat đều là private
  if (
    cleanUrl.startsWith("/admin") ||
    cleanUrl.startsWith("/member") ||
    cleanUrl.startsWith("/chat") ||
    (cleanUrl.startsWith("/trainer/") && !cleanUrl.startsWith("/trainers"))
  ) {
    return false;
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => {
    return cleanUrl === endpoint || cleanUrl.startsWith(endpoint + "/");
  });
}

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
// Helper: Check JWT Expiration
// ============================================================

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(jsonStr);
    if (!payload.exp) return false;
    // Buffer of 10 seconds before expiration
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch {
    return false;
  }
}

// ============================================================
// Request interceptor
// ============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const isPublic = isPublicEndpoint(url);

    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      if (isTokenExpired(accessToken)) {
        // Token đã hết hạn: xóa khỏi storage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        // Chỉ điều hướng về /login nếu là endpoint bắt buộc xác thực
        if (!isPublic) {
          clearAuthAndRedirect();
          return Promise.reject(
            new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
          );
        }
      } else {
        // Gắn header Authorization nếu token còn hạn
        config.headers.Authorization = `Bearer ${accessToken}`;
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
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);

  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const isPublicPage =
      pathname === "/" ||
      pathname === "" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/register-trainer" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname.startsWith("/auth/");

    // Chỉ redirect nếu người dùng đang ở các trang yêu cầu đăng nhập
    if (!isPublicPage) {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
  }
}

// ============================================================
// Response interceptor
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    if ((status === 401 || status === 403) && !isPublicEndpoint(url)) {
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