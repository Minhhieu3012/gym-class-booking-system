// Enums & Types for Packages & Member Packages
export type PaymentMethod = "CASH" | "MOCK";
export type MemberPackageStatus = "ACTIVE" | "EXPIRED";

// Package definition
export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
}

// Member Package definition
export interface MemberPackage {
  id: number;
  memberPackageId?: number;
  packageId: number;
  packageName?: string;
  packageDescription?: string;
  package?: Package;
  memberId?: number;
  memberName?: string;
  startDate: string;
  endDate: string;
  sessionsRemaining: number;
  status: MemberPackageStatus | string;
  priorityOrder?: number;
  transactionCode?: string;
}

// Request DTOs
export interface BuyPackageRequest {
  packageId: number;
  paymentMethod: PaymentMethod | string;
}

// Query Parameters
export interface PackageQueryParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}

export interface MemberPackageQueryParams {
  page?: number;
  size?: number;
  status?: MemberPackageStatus | string;
}
