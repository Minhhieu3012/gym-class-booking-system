import { apiClient } from "../core/api";
import type { PageResponse } from "../models/admin";
import type {
  Package,
  MemberPackage,
  BuyPackageRequest,
  TransactionResponse,
  TransactionStatus,
  AdjustMemberPackageRequest,
  PackageQueryParams,
  MemberPackageQueryParams,
  TransactionQueryParams,
} from "../models/package";

export class PaymentService {
  async getAvailablePackages(
    params?: PackageQueryParams,
  ): Promise<PageResponse<Package>> {
    const { data } = await apiClient.get<PageResponse<Package>>("/packages", {
      params,
    });
    return data;
  }

  async getPackageById(id: number): Promise<Package> {
    const { data } = await apiClient.get<Package>(`/packages/${id}`);
    return data;
  }

  async getMyPackages(
    params?: MemberPackageQueryParams,
  ): Promise<PageResponse<MemberPackage>> {
    const { data } = await apiClient.get<PageResponse<MemberPackage>>(
      "/member-packages/me",
      { params },
    );
    return data;
  }

  async getMyPackageById(id: number): Promise<MemberPackage> {
    const { data } = await apiClient.get<MemberPackage>(
      `/member-packages/me/${id}`,
    );
    return data;
  }

  async buyPackage(payload: BuyPackageRequest): Promise<TransactionResponse> {
    const { data } = await apiClient.post<TransactionResponse>(
      "/transactions",
      payload,
    );
    return data;
  }

  async getTransactions(
    params?: TransactionQueryParams | any,
  ): Promise<PageResponse<TransactionResponse>> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.size !== undefined) cleanParams.size = params.size;
      if (params.memberId !== undefined) cleanParams.memberId = params.memberId;
      if (params.status && params.status !== "ALL") cleanParams.status = params.status;
      if (params.sort) cleanParams.sort = params.sort;
      if (params.keyword && String(params.keyword).trim() !== "") {
        cleanParams.keyword = String(params.keyword).trim();
      }
    }
    const { data } = await apiClient.get<PageResponse<TransactionResponse>>(
      "/admin/transactions",
      { params: cleanParams },
    );
    return data;
  }

  async getMyTransactions(
    params?: TransactionQueryParams,
  ): Promise<PageResponse<TransactionResponse>> {
    const { data } = await apiClient.get<PageResponse<TransactionResponse>>(
      "/transactions/me",
      { params },
    );
    return data;
  }

  async getTransactionById(id: number): Promise<TransactionResponse> {
    const { data } = await apiClient.get<TransactionResponse>(
      `/transactions/${id}`,
    );
    return data;
  }

  async updateTransactionStatus(
    id: number,
    status: TransactionStatus | string,
  ): Promise<TransactionResponse> {
    const { data } = await apiClient.patch<TransactionResponse>(
      `/transactions/${id}/status`,
      { status },
    );
    return data;
  }

  async mockPayment(
    id: number,
    status: TransactionStatus | string,
  ): Promise<TransactionResponse> {
    const { data } = await apiClient.post<TransactionResponse>(
      `/admin/transactions/${id}/mock-payment`,
      null,
      { params: { status } },
    );
    return data;
  }

  async adjustMemberPackage(
    id: number,
    payload: AdjustMemberPackageRequest,
  ): Promise<MemberPackage> {
    const { data } = await apiClient.patch<MemberPackage>(
      `/member-packages/${id}/adjust`,
      payload,
    );
    return data;
  }
}

export const paymentService = new PaymentService();

export const getTransactions = (params?: any) =>
  paymentService.getTransactions(params);

export const updateTransactionStatus = (
  id: number,
  status: TransactionStatus | string,
) => paymentService.updateTransactionStatus(id, status);

export const adjustMemberPackage = (
  id: number,
  payload: AdjustMemberPackageRequest,
) => paymentService.adjustMemberPackage(id, payload);

export default paymentService;
