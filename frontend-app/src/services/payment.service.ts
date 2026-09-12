import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  Package,
  MemberPackage,
  BuyPackageRequest,
  TransactionResponse,
  PackageQueryParams,
  MemberPackageQueryParams,
} from "../models/package";

export class PaymentService {
  /**
   * Lấy danh sách các gói tập khả dụng trong hệ thống
   * GET /packages
   */
  async getAvailablePackages(
    params?: PackageQueryParams,
  ): Promise<PageResponse<Package>> {
    const { data } = await apiClient.get<PageResponse<Package>>("/packages", {
      params,
    });
    return data;
  }

  /**
   * Lấy danh sách gói tập cá nhân của hội viên hiện tại
   * GET /member-packages/me
   */
  async getMyPackages(
    params?: MemberPackageQueryParams,
  ): Promise<PageResponse<MemberPackage>> {
    const { data } = await apiClient.get<PageResponse<MemberPackage>>(
      "/member-packages/me",
      { params },
    );
    return data;
  }

  /**
   * Mua gói tập mới cho hội viên hiện tại (Tạo giao dịch)
   * POST /transactions
   */
  async buyPackage(data: BuyPackageRequest): Promise<TransactionResponse> {
    const { data: responseData } = await apiClient.post<TransactionResponse>(
      "/transactions",
      data,
    );
    return responseData;
  }

  /**
   * Lấy danh sách giao dịch cho Quản trị viên
   * GET /transactions
   */
  async getTransactions(
    params?: any,
  ): Promise<PageResponse<TransactionResponse>> {
    const { data } = await apiClient.get<PageResponse<TransactionResponse>>(
      "/transactions",
      { params },
    );
    return data;
  }

  /**
   * Cập nhật trạng thái giao dịch (Duyệt: SUCCESS, Hủy: FAILED)
   * PATCH /transactions/${id}/status
   */
  async updateTransactionStatus(
    id: number,
    status: string,
  ): Promise<TransactionResponse> {
    const { data } = await apiClient.patch<TransactionResponse>(
      `/transactions/${id}/status`,
      { status },
    );
    return data;
  }

  /**
   * Điều chỉnh lượt tập thủ công cho gói tập hội viên
   * PATCH /member-packages/${id}/adjust
   */
  async adjustMemberPackage(
    id: number,
    payload: {
      sessionsAdjustment?: number;
      newEndDate?: string;
      reason: string;
    },
  ): Promise<MemberPackage> {
    const { data } = await apiClient.patch<MemberPackage>(
      `/member-packages/${id}/adjust`,
      payload,
    );
    return data;
  }
}

// Standalone functions for direct import
export const getTransactions = (params?: any) =>
  paymentService.getTransactions(params);
export const updateTransactionStatus = (id: number, status: string) =>
  paymentService.updateTransactionStatus(id, status);
export const adjustMemberPackage = (id: number, payload: any) =>
  paymentService.adjustMemberPackage(id, payload);

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
