export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
  numberOfElements?: number;
}

export type RoomStatus = "ACTIVE" | "INACTIVE";

export interface RoomQueryParams {
  page?: number;
  size?: number;
  status?: RoomStatus;
}

export interface RoomResponse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  status: RoomStatus;
}
export type RoomResponseDTO = RoomResponse;

export interface CreateRoomRequest {
  name: string;
  location?: string;
  capacity: number;
  status: RoomStatus;
}
export type RoomRequestDTO = CreateRoomRequest;

export interface UpdateRoomRequest {
  name?: string;
  location?: string;
  capacity?: number;
}
export type RoomUpdateRequestDTO = UpdateRoomRequest;

export interface UpdateRoomStatusRequest {
  status: RoomStatus;
}
export type RoomStatusUpdateRequestDTO = UpdateRoomStatusRequest;

export interface ClassTypeQueryParams {
  page?: number;
  size?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface ClassTypeResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  active?: boolean;
}
export type ClassTypeResponseDTO = ClassTypeResponse;

export interface CreateClassTypeRequest {
  name: string;
  description?: string;
  isActive: boolean;
  active?: boolean;
}
export type ClassTypeRequestDTO = CreateClassTypeRequest;

export interface UpdateClassTypeRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  active?: boolean;
}
export type ClassTypeUpdateRequestDTO = UpdateClassTypeRequest;

export interface PackageQueryParams {
  page?: number;
  size?: number;
  isActive?: boolean;
  active?: boolean;
}

export interface PackageResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
  active?: boolean;
}
export type PackageResponseDTO = PackageResponse;

export interface CreatePackageRequest {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
  active?: boolean;
}
export type PackageRequestDTO = CreatePackageRequest;

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  sessionCount?: number;
  isActive?: boolean;
  active?: boolean;
}
export type PackageUpdateRequestDTO = UpdatePackageRequest;

export interface AnalyticsOverview {
  totalMembers: number;
  totalTrainers: number;
  totalClassesConducted: number;
  totalMockRevenue: number;
  attendanceRate: number;
  activeBookingsCount: number;
}
