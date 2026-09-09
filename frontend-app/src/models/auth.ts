// Auth & User Models
export type UserRole = "MEMBER" | "TRAINER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "LOCKED" | "REJECTED";

// Login — POST /auth/login
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
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

// Register Member — POST /auth/register
export interface BaseRegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}
export interface RegisterMemberRequest extends BaseRegisterRequest {}
export interface RegisterMemberResponse {
  id: number;
  phone: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

// Register Trainer — POST /auth/register-trainer
export interface RegisterTrainerRequest extends BaseRegisterRequest {
  specialization: string;
  experienceYears: number;
  hourlyFee: number;
  bio: string;
  avatarUrl?: string;
}

export interface RegisterTrainerResponse {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  message: string;
}

// Forgot Password — POST /auth/forgot-password
export interface ForgotPasswordRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

// Reset Password — POST /auth/reset-password
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Get Current User — GET /auth/me
// Get My Profile  — GET /users/me
export interface UserProfile extends AuthUser {
  address?: string | null;
  avatarUrl?: string | null;
}

// Update My Profile — PATCH /users/me
export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

// Change Password — PATCH /users/me/password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Update User Status — PATCH /users/{id}/status
export interface UpdateUserStatusRequest {
  status: UserStatus;
}
