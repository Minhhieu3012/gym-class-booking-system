export type PaymentMethod = "CASH" | "MOCK";

export type MemberPackageStatus = "ACTIVE" | "EXPIRED";

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  sessionCount: number;
  isActive: boolean;
  active?: boolean;
}
export type PackageResponseDTO = Package;

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
  status: MemberPackageStatus;
  priorityOrder?: number;
  transactionCode?: string;
}
export type MemberPackageResponseDTO = MemberPackage;

export interface BuyPackageRequest {
  packageId: number;
  paymentMethod: PaymentMethod;
}
export type TransactionCreateRequestDTO = BuyPackageRequest;

export interface TransactionResponse {
  id: number;
  amount: number;
  status: TransactionStatus;
  transactionCode: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  completedAt?: string | null;
  memberId?: number;
  memberName?: string;
  memberEmail?: string;
  packageId?: number;
  packageName?: string;
  memberPackageId?: number;
}
export type TransactionResponseDTO = TransactionResponse;

export interface AdjustMemberPackageRequest {
  sessionsAdjustment?: number;
  newEndDate?: string;
  remainingSessions?: number;
  extensionDays?: number;
  reason: string;
}

export interface UpdateTransactionStatusRequest {
  status: TransactionStatus;
}

export interface PackageQueryParams {
  page?: number;
  size?: number;
  isActive?: boolean;
  active?: boolean;
}

export interface MemberPackageQueryParams {
  memberId?: number;
  page?: number;
  size?: number;
  status?: MemberPackageStatus | "ALL" | string;
}

export interface TransactionQueryParams {
  memberId?: number;
  status?: TransactionStatus | "ALL" | string;
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
}
