import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  Trainer,
  TrainerQueryParams,
  TrainerProfileRequest,
  TrainerProfileUpdateRequest,
  TrainerApprovalResponse,
} from "../models/trainer";

export class TrainerServiceClass {
  async getTrainers(
    params?: TrainerQueryParams | any,
  ): Promise<PageResponse<Trainer> | Trainer[]> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
      if (params.status && params.status !== "ALL") cleanParams.status = params.status;
      if (params.specialization && params.specialization !== "ALL") {
        cleanParams.specialization = params.specialization;
      }
      if (params.keyword && String(params.keyword).trim() !== "") {
        cleanParams.keyword = String(params.keyword).trim();
      }
    }
    const { data } = await apiClient.get<PageResponse<Trainer> | Trainer[]>("/trainers", {
      params: cleanParams,
    });
    return data;
  }

  async getTrainerById(id: number): Promise<Trainer> {
    const { data } = await apiClient.get<Trainer>(`/trainers/${id}`);
    return data;
  }

  async createProfile(payload: TrainerProfileRequest): Promise<Trainer> {
    const { data } = await apiClient.post<Trainer>(
      "/trainers/profile",
      payload,
    );
    return data;
  }

  async updateProfile(payload: TrainerProfileUpdateRequest): Promise<Trainer> {
    const { data } = await apiClient.patch<Trainer>(
      "/trainers/profile",
      payload,
    );
    return data;
  }

  async approveTrainer(id: number): Promise<TrainerApprovalResponse> {
    const { data } = await apiClient.patch<TrainerApprovalResponse>(
      `/admin/trainers/${id}/approve`,
    );
    return data;
  }

  async rejectTrainer(id: number, reason: string): Promise<void> {
    await apiClient.patch<void>(`/admin/trainers/${id}/reject`, {
      reason,
    });
  }
}

export const trainerService = new TrainerServiceClass();
export const TrainerService = trainerService;
export default trainerService;
