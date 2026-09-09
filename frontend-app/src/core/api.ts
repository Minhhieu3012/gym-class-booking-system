import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

// Error response shape
export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp?: string; // ISO 8601
}

// Key lưu dữ liệu đăng nhập trong localStorage
const STORAGE_KEYS = {
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

// Request interceptor — tự động gắn Authorization header
// Bỏ qua nếu request gọi tới một trong các PUBLIC_ENDPOINTS
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

    // Chỉ coi 401 là "token hết hạn" khi lỗi đến từ endpoint CẦN đăng nhập.
    // Phải để nguyên cho page tự hiển thị lỗi, không được redirect.
    if (status === 401 && !isPublicEndpoint) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // Các lỗi còn lại (400 / 403 / 404 / 409 / 500...):
    // Không tự hiện alert/toast tại đây.
    // Reject với ApiErrorResponse đã parse để page/service tự xử lý UI.
    return Promise.reject(error);
  },
);
