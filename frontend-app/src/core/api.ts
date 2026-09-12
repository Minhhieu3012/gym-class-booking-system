import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthUser, LoginResponse, UserRole } from "../models/auth";

// Error response shape
export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp?: string; // ISO 8601
}

// Key lưu dữ liệu đăng nhập trong localStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// Danh sách các endpoint PUBLIC — không gắn Authorization header
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-trainer",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Tạo axios instance dùng chung
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstance = apiClient;

// Request interceptor — tự động gắn Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    if (!isPublic) {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Xóa dữ liệu đăng nhập và chuyển về trang Login
export function clearAuthAndRedirect(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = "/login";
}

// Response interceptor — xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    // 401 là "token hết hạn" khi lỗi đến từ endpoint CẦN đăng nhập.
    // Phải để nguyên cho page tự hiển thị lỗi, không được redirect.
    if (status === 401 && !isPublicEndpoint) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // Không tự hiện alert/toast tại đây.
    // Reject với ApiErrorResponse đã parse để page/service tự xử lý UI.
    return Promise.reject(error);
  },
);

// ---- Session helpers ----

// Lưu toàn bộ session sau khi login/register thành công.
export function setSession(data: LoginResponse): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

// Đọc lại user hiện tại từ localStorage (đồng bộ, không cần gọi API).
// Dùng cho router guard
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// Kiểm tra role — dùng trong router guard cho route /admin/*, v.v.
export function hasRole(...roles: UserRole[]): boolean {
  const user = getStoredUser();
  return !!user && roles.includes(user.role);
}

export default apiClient;
