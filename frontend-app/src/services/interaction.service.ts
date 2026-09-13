import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type { CreateReviewRequest, Review } from "../models/review";
import type { AttendanceStatus } from "../models/booking";

export type { CreateReviewRequest };

export interface NotificationQueryParams {
  page?: number;
  size?: number;
  isRead?: boolean;
  type?: string;
}

export interface CreateProgressNoteRequest {
  memberId: number;
  content: string;
}

export interface UserSummary {
  id: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface AttendanceResponse {
  bookingId?: number;
  bookingType?: string;
  attendanceStatus: AttendanceStatus | string;
  message?: string;
}

export interface NotificationItem {
  id: number;
  content: string;
  type: string;
  read: boolean;
  isRead?: boolean;
  createdAt: string;
  readAt?: string;
  user?: UserSummary;
}

export interface ReviewItem extends Review {}

export interface ProgressNoteItem {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  memberId?: number;
  member?: UserSummary;
  trainer?: UserSummary;
  message?: string;
}

export interface UnreadCountResponse {
  count?: number;
  unreadCount?: number;
  data?: number;
}

export interface ActionMessageResponse {
  success?: boolean;
  message?: string;
  id?: number;
  [key: string]: unknown;
}

export class InteractionService {
  async markClassAttendance(
    bookingId: number,
    attendanceStatus: AttendanceStatus | string,
  ): Promise<AttendanceResponse> {
    const { data } = await apiClient.patch<AttendanceResponse>(
      `/class-bookings/${bookingId}/attendance`,
      { attendanceStatus },
    );
    return data;
  }

  async markPTAttendance(
    bookingId: number,
    attendanceStatus: AttendanceStatus | string,
  ): Promise<AttendanceResponse> {
    const { data } = await apiClient.patch<AttendanceResponse>(
      `/pt-bookings/${bookingId}/attendance`,
      { attendanceStatus },
    );
    return data;
  }

  async createReview(payload: CreateReviewRequest): Promise<ReviewItem> {
    const { data } = await apiClient.post<ReviewItem>(
      "/reviews",
      payload,
    );
    return data;
  }

  async getMyNotifications(
    params?: NotificationQueryParams,
  ): Promise<PageResponse<NotificationItem> | NotificationItem[]> {
    const { data } = await apiClient.get<PageResponse<NotificationItem> | NotificationItem[]>(
      "/notifications/me",
      { params },
    );
    return data;
  }

  async getUnreadNotificationCount(): Promise<UnreadCountResponse> {
    const { data } = await apiClient.get<UnreadCountResponse>(
      "/notifications/me/unread-count",
    );
    return data;
  }

  async markNotificationAsRead(id: number): Promise<ActionMessageResponse> {
    const { data } = await apiClient.patch<ActionMessageResponse>(
      `/notifications/${id}/read`,
    );
    return data;
  }

  async markAllNotificationsAsRead(): Promise<ActionMessageResponse> {
    const { data } = await apiClient.patch<ActionMessageResponse>(
      "/notifications/me/read-all",
    );
    return data;
  }

  async resetNotifications(): Promise<ActionMessageResponse> {
    const { data } = await apiClient.post<ActionMessageResponse>(
      "/notifications/reset",
    );
    return data;
  }

  async createProgressNote(
    payload: CreateProgressNoteRequest,
  ): Promise<ProgressNoteItem> {
    const { data } = await apiClient.post<ProgressNoteItem>(
      "/progress-notes",
      payload,
    );
    return data;
  }
}

export const interactionService = new InteractionService();
export default interactionService;
