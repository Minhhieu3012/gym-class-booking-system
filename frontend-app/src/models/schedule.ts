export type ScheduleType = "CLASS" | "PT";

export type ScheduleStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "REJECTED";

export type AttendanceStatus =
  | "NOT_MARKED"
  | "PRESENT"
  | "ABSENT";

export interface MemberScheduleItem {
  bookingId: number;
  type: ScheduleType;
  title: string;
  classTypeName?: string | null;
  trainerName?: string | null;
  roomName?: string | null;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  attendanceStatus?: AttendanceStatus | null;
  sessionNote?: string | null;
}

export interface MemberScheduleResponse {
  schedules: MemberScheduleItem[];
}