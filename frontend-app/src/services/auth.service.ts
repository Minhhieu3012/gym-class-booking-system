import type { AxiosError } from "axios";
import { apiClient, setSession, clearAuthAndRedirect } from "../core/api";
import type { ApiErrorResponse } from "../core/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterMemberRequest,
  RegisterMemberResponse,
  RegisterTrainerRequest,
  RegisterTrainerResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
  UserProfile,
} from "../models/auth";

export const authService = {
  // POST /auth/login
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    setSession(data);
    return data;
  },

  // POST /auth/register
  async registerMember(
    payload: RegisterMemberRequest,
  ): Promise<RegisterMemberResponse> {
    const { data } = await apiClient.post<RegisterMemberResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  // POST /auth/register-trainer
  async registerTrainer(
    payload: RegisterTrainerRequest,
  ): Promise<RegisterTrainerResponse> {
    const { data } = await apiClient.post<RegisterTrainerResponse>(
      "/auth/register-trainer",
      payload,
    );
    return data;
  },

  // POST /auth/forgot-password
  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  // POST /auth/reset-password
  async resetPassword(payload: ResetPasswordRequest): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },

  // GET /auth/me — dùng để refresh lại thông tin user mới nhất
  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/auth/me");
    return data;
  },

  // POST /auth/logout — trả 204
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAuthAndRedirect();
    }
  },

  // Trích message lỗi để hiển thị trực tiếp lên form
  extractErrorMessage(error: unknown): string {
    const err = error as AxiosError<ApiErrorResponse>;
    return err.response?.data?.message ?? "Đã có lỗi xảy ra, vui lòng thử lại.";
  },
};
