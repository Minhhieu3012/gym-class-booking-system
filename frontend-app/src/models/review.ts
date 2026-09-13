import type { PageResponse } from "./admin";

export type ReviewTargetType = "CLASS" | "PT";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  hidden: boolean;
  isHidden?: boolean;
  createdAt: string;
  classBookingId?: number | null;
  ptBookingId?: number | null;
  memberName?: string;
  memberEmail?: string;
  member?: {
    id?: number;
    fullName?: string;
    email?: string;
  };
  targetType?: ReviewTargetType | string;
  targetName?: string;
  message?: string;
}
export type ReviewResponseDTO = Review;

export interface CreateReviewRequest {
  classBookingId?: number;
  ptBookingId?: number;
  rating: number;
  comment: string;
}
export type CreateReviewRequestDTO = CreateReviewRequest;

export interface ReviewQueryParams {
  rating?: number | "ALL" | string;
  hidden?: boolean | "ALL" | string;
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

export type ReviewPageResponse = PageResponse<Review>;
