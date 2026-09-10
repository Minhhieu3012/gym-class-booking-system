// Enums & Status Types for Classes & Bookings
export type GymClassStatus = "SCHEDULED" | "FULL" | "CANCELLED" | "COMPLETED";
export type TimeSlotStatus = "AVAILABLE" | "BOOKED" | "INACTIVE";
export type AttendanceStatus = "NOT_MARKED" | "PRESENT" | "ABSENT";
export type ClassBookingStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";
export type PTBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

// Gym Class Model
export interface GymClass {
  id: number;
  title: string;
  maxCapacity: number;
  currentCount: number;
  startTime: string;
  endTime: string;
  status: GymClassStatus | string;
  classTypeId: number;
  classTypeName?: string;
  trainerId: number;
  trainerName?: string;
  roomId: number;
  roomName?: string;
}

// Trainer Time Slot Model
export interface TrainerTimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus | string;
  trainerId?: number;
  trainerName?: string;
}

// Class Booking Model
export interface ClassBooking {
  id: number;
  gymClassId?: number;
  gymClass?: GymClass;
  memberId?: number;
  memberName?: string;
  memberPackageId?: number;
  bookedAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelReason?: string | null;
  attendanceStatus: AttendanceStatus | string;
  status: ClassBookingStatus | string;
}

// PT Booking Model
export interface PTBooking {
  id: number;
  trainerId: number;
  trainerName?: string;
  memberId?: number;
  memberName?: string;
  timeSlotId: number;
  trainerTimeSlotId?: number;
  trainerTimeSlot?: TrainerTimeSlot;
  timeSlot?: TrainerTimeSlot;
  memberPackageId?: number;
  sessionNote: string;
  healthNote?: string | null;
  rejectReason?: string | null;
  bookedAt: string;
  cancelledAt?: string | null;
  attendanceStatus: AttendanceStatus | string;
  status: PTBookingStatus | string;
}

// Request DTOs
export interface ClassBookingRequest {
  gymClassId: number;
  memberPackageId?: number;
}

export interface PTBookingRequest {
  trainerId: number;
  timeSlotId: number;
  memberPackageId?: number;
  sessionNote: string;
  healthNote?: string;
}

export interface CancelBookingRequest {
  cancelReason: string;
}

export interface RejectPTRequest {
  rejectReason: string;
}

// Query Parameters
export interface ClassQueryParams {
  page?: number;
  size?: number;
  classTypeId?: number;
  trainerId?: number;
  roomId?: number;
  status?: GymClassStatus | string;
  from?: string;
  to?: string;
  keyword?: string;
}

export interface ClassBookingQueryParams {
  page?: number;
  size?: number;
  status?: ClassBookingStatus | string;
  from?: string;
  to?: string;
}

export interface PTBookingQueryParams {
  page?: number;
  size?: number;
  status?: PTBookingStatus | string;
  from?: string;
  to?: string;
}

export interface TrainerTimeSlotQueryParams {
  from?: string;
  to?: string;
  status?: TimeSlotStatus | string;
}
