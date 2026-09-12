import api from "../core/api";
import type { PageResponse } from "../models/admin";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface CreateReviewRequest {
  classBookingId?: number;
  ptBookingId?: number;
  rating: number;
  comment: string;
}

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
  bookingId: number;
  bookingType: string;
  attendanceStatus: string;
  message: string;
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

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  hidden: boolean;
  member?: UserSummary;
  classBooking?: { id: number };
  ptBooking?: { id: number };
}

export interface ProgressNoteItem {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
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
  message?: string;
  [key: string]: unknown;
}

// ==========================================
// INTERACTION SERVICE
// ==========================================

export class InteractionService {
  /**
   * Điểm danh hội viên tham gia lớp học nhóm
   * PATCH /class-bookings/${bookingId}/attendance
   * Payload: { attendanceStatus }
   */
  async markClassAttendance(
    bookingId: number,
    attendanceStatus: string,
  ): Promise<AttendanceResponse> {
    const { data } = await api.patch<AttendanceResponse>(
      `/class-bookings/${bookingId}/attendance`,
      { attendanceStatus },
    );
    return data;
  }

  /**
   * Điểm danh buổi tập với huấn luyện viên cá nhân (PT)
   * PATCH /pt-bookings/${bookingId}/attendance
   * Payload: { attendanceStatus }
   */
  async markPTAttendance(
    bookingId: number,
    attendanceStatus: string,
  ): Promise<AttendanceResponse> {
    const { data } = await api.patch<AttendanceResponse>(
      `/pt-bookings/${bookingId}/attendance`,
      { attendanceStatus },
    );
    return data;
  }

  /**
   * Tạo đánh giá (Review) cho lớp học hoặc buổi tập PT
   * POST /reviews
   * Payload: { classBookingId?, ptBookingId?, rating, comment }
   */
  async createReview(data: CreateReviewRequest): Promise<ReviewItem> {
    const { data: responseData } = await api.post<ReviewItem>(
      "/reviews",
      data,
    );
    return responseData;
  }

  /**
   * Lấy danh sách thông báo của người dùng hiện tại
   * GET /notifications/me
   * Query params: { page?, size?, isRead?, type? }
   */
  async getMyNotifications(
    params?: NotificationQueryParams,
  ): Promise<PageResponse<NotificationItem>> {
    const { data } = await api.get<PageResponse<NotificationItem>>(
      "/notifications/me",
      { params },
    );
    return data;
  }

  /**
   * Lấy số lượng thông báo chưa đọc của người dùng hiện tại
   * GET /notifications/me/unread-count
   */
  async getUnreadNotificationCount(): Promise<UnreadCountResponse> {
    const { data } = await api.get<UnreadCountResponse>(
      "/notifications/me/unread-count",
    );
    return data;
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   * PATCH /notifications/${id}/read
   */
  async markNotificationAsRead(id: number): Promise<ActionMessageResponse> {
    const { data } = await api.patch<ActionMessageResponse>(
      `/notifications/${id}/read`,
    );
    return data;
  }

  /**
   * Đánh dấu toàn bộ thông báo của người dùng hiện tại là đã đọc
   * PATCH /notifications/me/read-all
   */
  async markAllNotificationsAsRead(): Promise<ActionMessageResponse> {
    const { data } = await api.patch<ActionMessageResponse>(
      "/notifications/me/read-all",
    );
    return data;
  }

  /**
   * Huấn luyện viên tạo ghi chú tiến độ cho hội viên
   * POST /progress-notes
   * Payload: { memberId, content }
   */
  async createProgressNote(
    data: CreateProgressNoteRequest,
  ): Promise<ProgressNoteItem> {
    const { data: responseData } = await api.post<ProgressNoteItem>(
      "/progress-notes",
      data,
    );
    return responseData;
  }
}

// Export singleton instance
export const interactionService = new InteractionService();
export default interactionService;
