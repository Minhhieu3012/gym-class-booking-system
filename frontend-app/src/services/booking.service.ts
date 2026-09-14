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
  CreateTimeSlotRequest,
  UpdateTimeSlotRequest,
  AttendanceStatus,
  ClassQueryParams,
  ClassBookingQueryParams,
  PTBookingQueryParams,
  TrainerTimeSlotQueryParams,
} from "../models/booking";

export class BookingService {
  // ==========================================
  // LUỒNG CLASS (LỚP HỌC NHÓM)
  // ==========================================

  async getClasses(
    params?: ClassQueryParams,
  ): Promise<PageResponse<GymClass>> {
    const { data } = await apiClient.get<PageResponse<GymClass>>("/classes", {
      params,
    });
    return data;
  }

  async bookClass(payload: ClassBookingRequest): Promise<ClassBooking> {
    const { data } = await apiClient.post<ClassBooking>(
      "/class-bookings",
      payload,
    );
    return data;
  }

  async getMyClassBookings(
    params?: ClassBookingQueryParams,
  ): Promise<PageResponse<ClassBooking>> {
    const { data } = await apiClient.get<PageResponse<ClassBooking>>(
      "/class-bookings/me",
      { params },
    );
    return data;
  }

  async cancelClassBooking(
    id: number,
    payload: CancelBookingRequest,
  ): Promise<ClassBooking> {
    const { data } = await apiClient.patch<ClassBooking>(
      `/class-bookings/${id}/cancel`,
      payload,
    );
    return data;
  }

  async markClassAttendance(
    id: number,
    attendanceStatus: AttendanceStatus,
  ): Promise<ClassBooking> {
    const { data } = await apiClient.patch<ClassBooking>(
      `/class-bookings/${id}/attendance`,
      { attendanceStatus },
    );
    return data;
  }

  // ==========================================
  // LUỒNG PT (HUẤN LUYỆN VIÊN CÁ NHÂN 1-1)
  // ==========================================

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

  async createTimeSlot(
    payload: CreateTimeSlotRequest,
  ): Promise<TrainerTimeSlot> {
    const { data } = await apiClient.post<TrainerTimeSlot>(
      "/trainers/time-slots",
      payload,
    );
    return data;
  }

  async updateTimeSlot(
    id: number,
    payload: UpdateTimeSlotRequest,
  ): Promise<TrainerTimeSlot> {
    const { data } = await apiClient.patch<TrainerTimeSlot>(
      `/trainers/time-slots/${id}`,
      payload,
    );
    return data;
  }

  async activateTimeSlot(id: number): Promise<TrainerTimeSlot> {
    const { data } = await apiClient.patch<TrainerTimeSlot>(
      `/trainers/time-slots/${id}/activate`,
    );
    return data;
  }

  async deactivateTimeSlot(id: number): Promise<TrainerTimeSlot> {
    const { data } = await apiClient.patch<TrainerTimeSlot>(
      `/trainers/time-slots/${id}/deactivate`,
    );
    return data;
  }

  async bookPT(payload: PTBookingRequest): Promise<PTBooking> {
    const { data } = await apiClient.post<PTBooking>(
      "/pt-bookings",
      payload,
    );
    return data;
  }

  async getMyPTBookings(
    params?: PTBookingQueryParams,
  ): Promise<PageResponse<PTBooking>> {
    const { data } = await apiClient.get<PageResponse<PTBooking>>(
      "/pt-bookings/me",
      { params },
    );
    return data;
  }

  async cancelPTBooking(
    id: number,
    payload: CancelBookingRequest,
  ): Promise<PTBooking> {
    const { data } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/cancel`,
      payload,
    );
    return data;
  }

  async getPTRequestsForTrainer(
    params?: PTBookingQueryParams,
  ): Promise<PageResponse<PTBooking>> {
    const { data } = await apiClient.get<PageResponse<PTBooking>>(
      "/pt-bookings/trainer/me",
      { params },
    );
    return data;
  }

  async confirmPTBooking(id: number): Promise<PTBooking> {
    const { data } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/approve`,
    );
    return data;
  }

  async rejectPTBooking(
    id: number,
    payload: RejectPTRequest,
  ): Promise<PTBooking> {
    const { data } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/reject`,
      payload,
    );
    return data;
  }

  async markPTAttendance(
    id: number,
    attendanceStatus: AttendanceStatus,
  ): Promise<PTBooking> {
    const { data } = await apiClient.patch<PTBooking>(
      `/pt-bookings/${id}/attendance`,
      { attendanceStatus },
    );
    return data;
  }
}

export const bookingService = new BookingService();
export default bookingService;
