import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  Package,
  MemberPackage,
  BuyPackageRequest,
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
  async buyPackage(data: BuyPackageRequest): Promise<any> {
    const { data: responseData } = await apiClient.post<any>(
      "/transactions",
      data,
    );
    return responseData;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
