export type GymClassStatus = "SCHEDULED" | "FULL" | "CANCELLED" | "COMPLETED";

export type TimeSlotStatus = "AVAILABLE" | "BOOKED" | "INACTIVE";

export type AttendanceStatus = "NOT_MARKED" | "PRESENT" | "ABSENT";

export type ClassBookingStatus =
  | "PENDING"
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

export interface GymClass {
  id: number;
  title: string;
  maxCapacity: number;
  currentCount: number;
  startTime: string;
  endTime: string;
  status: GymClassStatus;
  classTypeId: number;
  classTypeName?: string;
  trainerId: number;
  trainerName?: string;
  roomId: number;
  roomName?: string;
}
export type GymClassResponseDTO = GymClass;

export interface TrainerTimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  trainerId?: number;
  trainerName?: string;
}
export type TrainerTimeSlotResponseDTO = TrainerTimeSlot;

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
  attendanceStatus: AttendanceStatus;
  status: ClassBookingStatus;
}
export type ClassBookingResponseDTO = ClassBooking;

export interface PTBooking {
  id: number;
  trainerId?: number;
  trainerName?: string;
  memberId?: number;
  memberName?: string;
  timeSlotId?: number;
  trainerTimeSlotId?: number;
  trainerTimeSlot?: TrainerTimeSlot;
  timeSlot?: TrainerTimeSlot;
  memberPackageId?: number;
  sessionNote: string;
  healthNote?: string | null;
  rejectReason?: string | null;
  bookedAt: string;
  cancelledAt?: string | null;
  attendanceStatus: AttendanceStatus;
  status: PTBookingStatus;
}
export type PTBookingResponseDTO = PTBooking;

export interface ClassBookingRequest {
  gymClassId: number;
  memberPackageId?: number;
}
export type ClassBookingCreateRequestDTO = ClassBookingRequest;

export interface PTBookingRequest {
  trainerTimeSlotId?: number;
  memberPackageId?: number;
  sessionNote: string;
  healthNote?: string;
}
export type PTBookingCreateRequestDTO = PTBookingRequest;

export interface CancelBookingRequest {
  cancelReason?: string;
  reason?: string;
}
export type PTBookingCancelRequestDTO = CancelBookingRequest;

export interface RejectPTRequest {
  rejectReason: string;
}
export type PTBookingDecisionRequestDTO = RejectPTRequest;

export interface CreateTimeSlotRequest {
  startTime: string;
  endTime: string;
}
export type TrainerTimeSlotRequestDTO = CreateTimeSlotRequest;

export interface UpdateTimeSlotRequest {
  startTime?: string;
  endTime?: string;
}
export type TrainerTimeSlotUpdateRequestDTO = UpdateTimeSlotRequest;

export interface CreateGymClassRequest {
  classTypeId: number;
  trainerId: number;
  roomId: number;
  title: string;
  maxCapacity: number;
  startTime: string;
  endTime: string;
}
export type GymClassRequestDTO = CreateGymClassRequest;

export interface UpdateGymClassRequest {
  classTypeId?: number;
  trainerId?: number;
  roomId?: number;
  title?: string;
  maxCapacity?: number;
  startTime?: string;
  endTime?: string;
}
export type GymClassUpdateRequestDTO = UpdateGymClassRequest;

export interface UpdateAttendanceRequest {
  attendanceStatus: AttendanceStatus;
}
export type AttendanceUpdateRequestDTO = UpdateAttendanceRequest;

export interface ClassQueryParams {
  page?: number;
  size?: number;
  classTypeId?: number;
  trainerId?: number;
  roomId?: number;
  status?: GymClassStatus;
  from?: string;
  to?: string;
  keyword?: string;
}

export interface ClassBookingQueryParams {
  page?: number;
  size?: number;
  gymClassId?: number;
  memberId?: number;
  trainerId?: number;
  status?: ClassBookingStatus;
  attendanceStatus?: AttendanceStatus;
  from?: string;
  to?: string;
}

export interface PTBookingQueryParams {
  page?: number;
  size?: number;
  trainerId?: number;
  memberId?: number;
  status?: PTBookingStatus;
  attendanceStatus?: AttendanceStatus;
  from?: string;
  to?: string;
}

export interface TrainerTimeSlotQueryParams {
  from?: string;
  to?: string;
  status?: TimeSlotStatus;
  page?: number;
  size?: number;
}
