import { apiClient } from "../core/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  MessageResponse,
} from "../models/auth";

// Response của POST /upload
export interface UploadFileResponse {
  imageUrl: string;
  format: string;
  createdAt: string;
}

export const userService = {
  // GET /users/me
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/users/me");
    return data;
  },

  // PATCH /users/me
  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>("/users/me", payload);
    return data;
  },

  // PATCH /users/me/password
  async changePassword(
    payload: ChangePasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(
      "/users/me/password",
      payload,
    );
    return data;
  },

  // POST /upload — Content-Type multipart/form-data.
  async uploadAvatar(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<UploadFileResponse>(
      "/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};
