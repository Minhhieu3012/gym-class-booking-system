// Generic — PageResponse<T>
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index (0-based)
}

// Room APIs
export type RoomStatus = "ACTIVE" | "INACTIVE";

// GET /rooms
export interface RoomQueryParams {
  page?: number;
  size?: number;
  status?: RoomStatus;
}

// GET /rooms  |  GET /rooms/{id}
export interface RoomResponse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  status: RoomStatus;
}

// POST /rooms
export interface CreateRoomRequest {
  name: string;
  location: string;
  capacity: number;
  status: RoomStatus;
}

// PATCH /rooms/{id}
export interface UpdateRoomRequest {
  name?: string;
  location?: string;
  capacity?: number;
}

// PATCH /rooms/{id}/status
export interface UpdateRoomStatusRequest {
  status: RoomStatus;
}

// Class Type APIs
// GET /class-types
export interface ClassTypeQueryParams {
  page?: number;
  size?: number;
}

// GET /class-types  |  GET /class-types/{id}
export interface ClassTypeResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

// POST /class-types
export interface CreateClassTypeRequest {
  name: string;
  description: string;
  isActive: boolean;
}

// PATCH /class-types/{id}
export interface UpdateClassTypeRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Package APIs

// GET /packages
// Query params per contract: page, size, isActive
export interface PackageQueryParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}

// GET /packages  |  GET /packages/{id}
export interface PackageResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
}

// POST /packages
export interface CreatePackageRequest {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
}

// PATCH /packages/{id}
export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  sessionCount?: number;
  isActive?: boolean;
}

// PATCH /packages/{id}/deactivate

// Analytics Overview API
// GET /admin/analytics/overview
export interface AnalyticsOverview {
  totalMembers: number;
  totalTrainers: number;
  totalClassesConducted: number;
  totalMockRevenue: number;
  attendanceRate: number;
  activeBookingsCount: number;
}
