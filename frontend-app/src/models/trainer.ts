export type TrainerStatus = "PENDING" | "ACTIVE" | "LOCKED" | "REJECTED";

export interface Trainer {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
  hourlyFee?: number;
  bio?: string;
  avatarUrl?: string | null;
  status?: TrainerStatus;
}
export type TrainerResponseDTO = Trainer;

export interface TrainerQueryParams {
  page?: number;
  size?: number;
  specialization?: string;
  status?: TrainerStatus | "ALL" | string;
  keyword?: string;
}

export interface TrainerProfileRequest {
  specialization: string;
  experienceYears: number;
  hourlyFee: number;
  bio?: string;
}
export type TrainerProfileRequestDTO = TrainerProfileRequest;

export interface TrainerProfileUpdateRequest {
  specialization?: string;
  experienceYears?: number;
  hourlyFee?: number;
  bio?: string;
}
export type TrainerProfileUpdateRequestDTO = TrainerProfileUpdateRequest;

export interface RejectTrainerPayload {
  reason: string;
}
export type RejectTrainerRequestDTO = RejectTrainerPayload;

export interface TrainerApprovalResponse {
  id?: number;
  trainerId?: number;
  status: TrainerStatus;
  approvedBy?: number;
  approvedAt?: string;
}
export type TrainerApprovalResponseDTO = TrainerApprovalResponse;
