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

export interface NotificationItem {
  id: number;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  user?: any;
}

export interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  hidden: boolean;
  member?: any;
  classBooking?: any;
  ptBooking?: any;
}

export interface ProgressNoteItem {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  member?: any;
  trainer?: any;
}

export interface UnreadCountResponse {
  count?: number;
  unreadCount?: number;
  [key: string]: any;
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
  ): Promise<any> {
    const { data } = await api.patch(
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
  ): Promise<any> {
    const { data } = await api.patch(
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
  async createReview(data: {
    classBookingId?: number;
    ptBookingId?: number;
    rating: number;
    comment: string;
  }): Promise<ReviewItem | any> {
    const { data: responseData } = await api.post<ReviewItem | any>(
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
  async getMyNotifications(params?: {
    page?: number;
    size?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<PageResponse<NotificationItem> | any> {
    const { data } = await api.get<PageResponse<NotificationItem> | any>(
      "/notifications/me",
      { params },
    );
    return data;
  }

  /**
   * Lấy số lượng thông báo chưa đọc của người dùng hiện tại
   * GET /notifications/me/unread-count
   */
  async getUnreadNotificationCount(): Promise<UnreadCountResponse | number | any> {
    const { data } = await api.get<UnreadCountResponse | number | any>(
      "/notifications/me/unread-count",
    );
    return data;
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   * PATCH /notifications/${id}/read
   */
  async markNotificationAsRead(id: number): Promise<any> {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  }

  /**
   * Đánh dấu toàn bộ thông báo của người dùng hiện tại là đã đọc
   * PATCH /notifications/me/read-all
   */
  async markAllNotificationsAsRead(): Promise<any> {
    const { data } = await api.patch("/notifications/me/read-all");
    return data;
  }

  /**
   * Huấn luyện viên tạo ghi chú tiến độ cho hội viên
   * POST /progress-notes
   * Payload: { memberId, content }
   */
  async createProgressNote(data: {
    memberId: number;
    content: string;
  }): Promise<ProgressNoteItem | any> {
    const { data: responseData } = await api.post<ProgressNoteItem | any>(
      "/progress-notes",
      data,
    );
    return responseData;
  }
}

// Export singleton instance
export const interactionService = new InteractionService();
export default interactionService;
