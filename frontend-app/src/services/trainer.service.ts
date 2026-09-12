import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  Trainer,
  TrainerQueryParams,
  TrainerApprovalResponse,
} from "../models/trainer";

export class TrainerServiceClass {
  /**
   * Lấy danh sách Huấn luyện viên
   * GET /trainers
   */
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

  /**
   * Lấy chi tiết Huấn luyện viên
   * GET /trainers/{id}
   */
  async getTrainerById(id: number): Promise<Trainer> {
    const { data } = await apiClient.get<Trainer>(`/trainers/${id}`);
    return data;
  }

  /**
   * Duyệt hồ sơ Huấn luyện viên
   * PATCH /admin/trainers/${id}/approve
   */
  async approveTrainer(id: number): Promise<TrainerApprovalResponse> {
    const { data } = await apiClient.patch<TrainerApprovalResponse>(
      `/admin/trainers/${id}/approve`,
    );
    return data;
  }

  /**
   * Từ chối hồ sơ Huấn luyện viên kèm lý do
   * PATCH /admin/trainers/${id}/reject
   */
  async rejectTrainer(id: number, reason: string): Promise<void> {
    await apiClient.patch<void>(`/admin/trainers/${id}/reject`, {
      reason,
    });
  }
}

export const trainerService = new TrainerServiceClass();
export const TrainerService = trainerService;
export default trainerService;
