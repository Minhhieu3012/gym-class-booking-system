import { apiClient, axiosInstance } from "../core/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  MessageResponse,
} from "../models/auth";
import type { PageResponse } from "../models/admin";

// Response của POST /upload
export interface UploadFileResponse {
  imageUrl: string;
  format: string;
  createdAt: string;
}

export interface UserResponseDTO {
  id: number;
  phone: string;
  email: string;
  fullName: string;
  address?: string;
  avatarUrl?: string;
  role: "MEMBER" | "TRAINER" | "ADMIN" | string;
  status: "ACTIVE" | "LOCKED" | "PENDING" | "REJECTED" | string;
}

export interface UserQueryParams {
  page?: number;
  size?: number;
  role?: string;
  status?: string;
  keyword?: string;
  sort?: string;
}

export interface UserStatusUpdateRequest {
  status: string;
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

  // GET /users
  async getUsers(
    params?: UserQueryParams | any,
  ): Promise<PageResponse<UserResponseDTO> | UserResponseDTO[]> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
      if (params.role && params.role !== "ALL") cleanParams.role = params.role;
      if (params.status && params.status !== "ALL") cleanParams.status = params.status;
      if (params.keyword && String(params.keyword).trim() !== "") {
        cleanParams.keyword = String(params.keyword).trim();
      }
      if (params.sort) cleanParams.sort = params.sort;
    }

    const { data } = await apiClient.get<PageResponse<UserResponseDTO> | UserResponseDTO[]>("/users", {
      params: cleanParams,
    });
    return data;
  },

  // PATCH /users/{userId}/status
  async updateUserStatus(
    userId: number,
    status: string,
  ): Promise<UserResponseDTO> {
    const { data } = await apiClient.patch<UserResponseDTO>(
      `/users/${userId}/status`,
      { status },
    );
    return data;
  },
};

export const UserService = {
  ...userService,
  axios: axiosInstance,
};
export default userService;
