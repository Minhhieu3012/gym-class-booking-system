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

// Transaction Response
export interface TransactionResponse {
  id: number;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  transactionCode: string;
  paymentMethod: PaymentMethod | string;
  createdAt: string;
  completedAt?: string;
  memberId?: number;
  memberName?: string;
  memberEmail?: string;
  packageId?: number;
  packageName?: string;
  memberPackageId?: number;
}

export interface AdjustMemberPackageRequest {
  sessionsAdjustment?: number;
  newEndDate?: string;
  reason: string;
}

// Query Parameters
export interface PackageQueryParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}

export interface MemberPackageQueryParams {
  memberId?: number;
  page?: number;
  size?: number;
  status?: MemberPackageStatus | string;
}

export interface TransactionQueryParams {
  memberId?: number;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}

