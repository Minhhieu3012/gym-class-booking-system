import { apiClient, axiosInstance } from "../core/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  MessageResponse,
  UserResponseDTO,
  UserRole,
  UserStatus,
} from "../models/auth";
import type { PageResponse } from "../models/admin";

export interface UploadFileResponse {
  imageUrl: string;
  format: string;
  createdAt: string;
}

export type { UserResponseDTO };

export interface UserQueryParams {
  page?: number;
  size?: number;
  role?: UserRole | "ALL" | string;
  status?: UserStatus | "ALL" | string;
  keyword?: string;
  sort?: string;
}

export interface UserStatusUpdateRequest {
  status: UserStatus | string;
}

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>("/users/me");
    return data;
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>("/users/me", payload);
    return data;
  },

  async changePassword(
    payload: ChangePasswordRequest,
  ): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(
      "/users/me/password",
      payload,
    );
    return data;
  },

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

  async updateUserStatus(
    userId: number,
    status: UserStatus | string,
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
