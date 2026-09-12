// Trainer Models
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
  status?: string;
}

export interface TrainerQueryParams {
  page?: number;
  size?: number;
  specialization?: string;
  status?: string;
  keyword?: string;
}

export interface RejectTrainerPayload {
  reason: string;
}

export interface TrainerApprovalResponse {
  trainerId: number;
  status: string;
  approvedBy?: number;
  approvedAt?: string;
}
