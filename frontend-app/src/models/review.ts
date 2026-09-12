import type { PageResponse } from "./admin";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  hidden: boolean;
  isHidden?: boolean;
  createdAt: string;
  classBookingId?: number;
  ptBookingId?: number;
  memberName?: string;
  memberEmail?: string;
  member?: {
    id?: number;
    fullName?: string;
    email?: string;
  };
  targetType?: string;
  targetName?: string;
  message?: string;
}

export interface ReviewQueryParams {
  rating?: number | string;
  hidden?: boolean | string;
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

export type ReviewPageResponse = PageResponse<Review>;
