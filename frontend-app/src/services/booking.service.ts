import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  GymClass,
  TrainerTimeSlot,
  ClassBooking,
  PTBooking,
  ClassBookingRequest,
  PTBookingRequest,
  CancelBookingRequest,
  RejectPTRequest,
  ClassQueryParams,
  ClassBookingQueryParams,
  PTBookingQueryParams,
  TrainerTimeSlotQueryParams,
} from "../models/booking";

export class BookingService {
  // ==========================================
  // LUỒNG CLASS (LỚP HỌC NHÓM)
  // ==========================================

  /**
   * Lấy danh sách lịch các lớp học nhóm
   * GET /classes
   */
  async getClasses(
    params?: ClassQueryParams,
  ): Promise<PageResponse<GymClass>> {
    const { data } = await apiClient.get<PageResponse<GymClass>>("/classes", {
      params,
    });
    return data;
  }

  /**
   * Đặt chỗ tham gia lớp học nhóm
   * POST /class-bookings
   */
  async bookClass(data: ClassBookingRequest): Promise<ClassBooking> {
    const { data: responseData } = await apiClient.post<ClassBooking>(
      "/class-bookings",
      data,
    );
    return responseData;
  }

  /**
   * Lấy lịch sử/danh sách các buổi học nhóm mà hội viên hiện tại đã đặt
   * GET /class-bookings/me
   */
  async getMyClassBookings(
    params?: ClassBookingQueryParams,
  ): Promise<PageResponse<ClassBooking>> {
    const { data } = await apiClient.get<PageResponse<ClassBooking>>(
      "/class-bookings/me",
      { params },
    );
    return data;
  }

  /**
   * Hủy đặt chỗ lớp học nhóm (yêu cầu trước giờ bắt đầu >= 24h)
   * PATCH /class-bookings/{id}/cancel
   */
  async cancelClassBooking(
    id: number,
    data: CancelBookingRequest,
  ): Promise<ClassBooking> {
    const { data: responseData } = await apiClient.patch<ClassBooking>(
      `/class-bookings/${id}/cancel`,
      data,
    );
    return responseData;
  }

  // ==========================================
  // LUỒNG PT (HUẤN LUYỆN VIÊN CÁ NHÂN 1-1)
  // ==========================================

  /**
   * Lấy danh sách khung giờ (time slots) còn trống của một huấn luyện viên
   * GET /trainers/{trainerId}/time-slots
   */
  async getTrainerTimeSlots(
    trainerId: number,
    params?: TrainerTimeSlotQueryParams,
  ): Promise<TrainerTimeSlot[]> {
    const { data } = await apiClient.get<
      { content?: TrainerTimeSlot[] } | TrainerTimeSlot[]
    >(`/trainers/${trainerId}/time-slots`, {
      params,
    });
    if (Array.isArray(data)) {
      return data;
    }
    return data.content ?? [];
  }

  /**
   * Đặt lịch tập với huấn luyện viên cá nhân (PT)
   * POST /pt-bookings
   */
  async bookPT(data: PTBookingRequest): Promise<PTBooking> {
    const { data: responseData } = await apiClient.post<PTBooking>(
      "/pt-bookings",
      data,
    );
    return responseData;
  }

  /**
   * Lấy danh sách lịch tập PT của hội viên hiện tại
   * GET /pt-bookings/me
   */
  async getMyPTBookings(
    params?: PTBookingQueryParams,
  ): Promise<PageResponse<PTBooking>> {
    const { data } = await apiClient.get<PageResponse<PTBooking>>(
      "/pt-bookings/me",
      { params },
    );
    return data;
  }

  /**
   * Hủy lịch tập PT (yêu cầu trước giờ tập >= 24h nếu do hội viên hủy)
   * PATCH /pt-bookings/{id}/cancel
   */
  async cancelPTBooking(
    id: number,
    data: CancelBookingRequest,
  ): Promise<PTBooking> {
    const { data: responseData } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/cancel`,
      data,
    );
    return responseData;
  }

  /**
   * Lấy danh sách yêu cầu đặt lịch PT gửi đến huấn luyện viên hiện tại
   * GET /pt-bookings/trainer/me
   */
  async getPTRequestsForTrainer(
    params?: PTBookingQueryParams,
  ): Promise<PageResponse<PTBooking>> {
    const { data } = await apiClient.get<PageResponse<PTBooking>>(
      "/pt-bookings/trainer/me",
      { params },
    );
    return data;
  }

  /**
   * Huấn luyện viên xác nhận chấp nhận yêu cầu đặt lịch PT
   * PATCH /pt-bookings/{id}/confirm
   */
  async confirmPTBooking(id: number): Promise<PTBooking> {
    const { data } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/confirm`,
    );
    return data;
  }

  /**
   * Huấn luyện viên từ chối yêu cầu đặt lịch PT kèm lý do
   * PATCH /pt-bookings/{id}/reject
   */
  async rejectPTBooking(
    id: number,
    data: RejectPTRequest,
  ): Promise<PTBooking> {
    const { data: responseData } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/reject`,
      data,
    );
    return responseData;
  }
}

// Export singleton instance
export const bookingService = new BookingService();
export default bookingService;
