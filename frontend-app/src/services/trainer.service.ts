import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type { Trainer, TrainerQueryParams } from "../models/trainer";

export class TrainerService {
  /**
   * Lấy danh sách Huấn luyện viên
   * GET /trainers
   */
  async getTrainers(
    params?: TrainerQueryParams,
  ): Promise<PageResponse<Trainer>> {
    const { data } = await apiClient.get<PageResponse<Trainer>>("/trainers", {
      params,
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
}

export const trainerService = new TrainerService();
export default trainerService;
