export type UserRole = "MEMBER" | "TRAINER" | "ADMIN";

export type UserStatus = "PENDING" | "ACTIVE" | "LOCKED" | "REJECTED";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  address?: string | null;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer" | string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterMemberRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
}

export interface RegisterMemberResponse {
  id: number;
  phone: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface RegisterTrainerRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  specialization: string;
  experienceYears: number;
  hourlyFee: number;
  bio?: string;
  address?: string;
  avatarUrl?: string;
}

export interface RegisterTrainerResponse {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UserProfile extends AuthUser {
  address?: string | null;
  avatarUrl?: string | null;
}

export interface UserResponseDTO {
  id: number;
  phone: string;
  email: string;
  fullName: string;
  address?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface UserQueryParams {
  page?: number;
  size?: number;
  role?: UserRole;
  status?: UserStatus;
  keyword?: string;
}