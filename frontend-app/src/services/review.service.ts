import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type { Review, ReviewQueryParams } from "../models/review";

export class ReviewServiceClass {
  /**
   * Lấy danh sách đánh giá
   * GET /reviews
   */
  async getAllReviews(
    params?: ReviewQueryParams | any,
  ): Promise<PageResponse<Review> | Review[]> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
      if (params.rating !== undefined && params.rating !== "ALL" && params.rating !== "") {
        cleanParams.rating = Number(params.rating);
      }
      if (params.hidden !== undefined && params.hidden !== "ALL" && params.hidden !== "") {
        cleanParams.hidden = params.hidden === true || params.hidden === "true";
      }
      if (params.sort) cleanParams.sort = params.sort;
      if (params.keyword && String(params.keyword).trim() !== "") {
        cleanParams.keyword = String(params.keyword).trim();
      }
    }

    const { data } = await apiClient.get<PageResponse<Review> | Review[]>("/reviews", {
      params: cleanParams,
    });
    return data;
  }

  /**
   * Ẩn đánh giá
   * PATCH /reviews/{id}/hide
   */
  async hideReview(id: number): Promise<Review> {
    const { data } = await apiClient.patch<Review>(`/reviews/${id}/hide`);
    return data;
  }

  /**
   * Hiện / Công khai đánh giá
   * PATCH /reviews/{id}/show
   */
  async showReview(id: number): Promise<Review> {
    const { data } = await apiClient.patch<Review>(`/reviews/${id}/show`);
    return data;
  }
}

export const reviewService = new ReviewServiceClass();
export const ReviewService = reviewService;
export default reviewService;
