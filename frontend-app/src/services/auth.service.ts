import type { AxiosError } from "axios";
import {
  apiClient,
  setSession,
  clearAuthAndRedirect,
} from "../core/api";
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
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    setSession(data);
    return data;
  },

  async registerMember(
    payload: RegisterMemberRequest,
  ): Promise<RegisterMemberResponse> {
    const { data } = await apiClient.post<RegisterMemberResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async registerTrainer(
    payload: RegisterTrainerRequest,
  ): Promise<RegisterTrainerResponse> {
    const { data } = await apiClient.post<RegisterTrainerResponse>(
      "/auth/register-trainer",
      payload,
    );
    return data;
  },

  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAuthAndRedirect();
    }
  },

  extractErrorMessage(error: unknown): string {
    const err = error as AxiosError<ApiErrorResponse>;

    if (err.response?.data) {
      const data = err.response.data;

      if (typeof data === "string") {
        return data;
      }

      if (data.message) {
        return data.message;
      }

      const validationErrors = (data as any).errors;
      if (validationErrors) {
        if (Array.isArray(validationErrors)) {
          return validationErrors
            .map((item) => item.message || item.defaultMessage)
            .filter(Boolean)
            .join(", ");
        }

        if (typeof validationErrors === "object") {
          return Object.values(validationErrors)
            .flat()
            .join(", ");
        }
      }
    }

    if (err.message) {
      return err.message;
    }

    return "An error occurred. Please try again.";
  },
};

export default authService;