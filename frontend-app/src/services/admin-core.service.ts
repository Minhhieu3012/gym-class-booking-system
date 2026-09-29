import { apiClient, axiosInstance, getStoredUser } from "../core/api";
import type {
  PageResponse,
  RoomQueryParams,
  RoomResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  UpdateRoomStatusRequest,
  ClassTypeQueryParams,
  ClassTypeResponse,
  CreateClassTypeRequest,
  UpdateClassTypeRequest,
  PackageQueryParams,
  PackageResponse,
  CreatePackageRequest,
  UpdatePackageRequest,
  AnalyticsOverview,
} from "../models/admin";

export type { AnalyticsOverview };

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    const { data } = await apiClient.get<AnalyticsOverview>(
      "/admin/analytics/overview",
    );
    if (data && typeof data.totalMembers === "number") {
      return data;
    }
  } catch {
    // Fallback: Aggregate real data from live database endpoints
  }

  try {
    const [usersRes, trainersRes, txsRes, classesRes, bookingsRes] =
      await Promise.allSettled([
        apiClient.get<PageResponse<any>>("/users", { params: { size: 100 } }),
        apiClient.get<PageResponse<any>>("/trainers", {
          params: { size: 100 },
        }),
        apiClient.get<PageResponse<any>>("/admin/transactions", {
          params: { size: 100 },
        }),
        apiClient.get<PageResponse<any>>("/admin/classes", {
          params: { size: 100 },
        }),
        apiClient.get<PageResponse<any>>("/class-bookings", {
          params: { size: 100 },
        }),
      ]);

    const users =
      usersRes.status === "fulfilled" ? usersRes.value.data.content || [] : [];
    const membersCount = users.filter((u: any) => u.role === "MEMBER").length;

    const trainers =
      trainersRes.status === "fulfilled"
        ? trainersRes.value.data.content || []
        : [];
    const trainersCount =
      trainers.length > 0
        ? trainers.length
        : users.filter((u: any) => u.role === "TRAINER").length;

    const txs =
      txsRes.status === "fulfilled" ? txsRes.value.data.content || [] : [];
    const totalRevenue = txs
      .filter((t: any) => (t.status || "").toUpperCase() === "SUCCESS")
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    const classes =
      classesRes.status === "fulfilled"
        ? classesRes.value.data.content || []
        : [];
    const classesConducted =
      classes.filter((c: any) => {
        const isPast = c.endTime
          ? new Date(c.endTime).getTime() < Date.now()
          : false;
        return (c.status || "").toUpperCase() === "COMPLETED" || isPast;
      }).length;

    const bookings =
      bookingsRes.status === "fulfilled"
        ? bookingsRes.value.data.content || []
        : [];
    const activeBookings = bookings.filter(
      (b: any) => (b.status || "").toUpperCase() === "CONFIRMED",
    ).length;

    const attendedCount = bookings.filter(
      (b: any) => (b.status || "").toUpperCase() === "ATTENDED",
    ).length;
    const attendanceRate =
      bookings.length > 0
        ? Math.round((attendedCount / bookings.length) * 100)
        : 0;

    return {
      totalMembers: membersCount,
      totalTrainers: trainersCount,
      totalClassesConducted: classesConducted,
      totalMockRevenue: totalRevenue,
      attendanceRate: attendanceRate,
      activeBookingsCount: activeBookings,
    };
  } catch (err) {
    console.error("Lỗi khi tổng hợp dữ liệu thống kê từ database:", err);
    return {
      totalMembers: 0,
      totalTrainers: 0,
      totalClassesConducted: 0,
      totalMockRevenue: 0,
      attendanceRate: 0,
      activeBookingsCount: 0,
    };
  }
}

export const analyticsService = {
  getOverview: getAnalyticsOverview,
  getAnalyticsOverview,
};

export const roomService = {
  async getAll(params?: RoomQueryParams): Promise<PageResponse<RoomResponse>> {
    const { data } = await apiClient.get<PageResponse<RoomResponse>>("/rooms", {
      params,
    });
    return data;
  },

  async getById(id: number): Promise<RoomResponse> {
    const { data } = await apiClient.get<RoomResponse>(`/rooms/${id}`);
    return data;
  },

  async create(payload: CreateRoomRequest): Promise<RoomResponse> {
    const { data } = await apiClient.post<RoomResponse>("/admin/rooms", payload);
    return data;
  },

  async update(id: number, payload: UpdateRoomRequest): Promise<RoomResponse> {
    const { data } = await apiClient.patch<RoomResponse>(
      `/admin/rooms/${id}`,
      payload,
    );
    return data;
  },

  async updateStatus(
    id: number,
    payload: UpdateRoomStatusRequest,
  ): Promise<RoomResponse> {
    const { data } = await apiClient.patch<RoomResponse>(
      `/admin/rooms/${id}/status`,
      payload,
    );
    return data;
  },
};

function normalizeClassType(item: any): ClassTypeResponse {
  if (!item) return item;
  const active = Boolean(item.active ?? item.isActive ?? false);
  return {
    ...item,
    active,
    isActive: active,
  };
}

function normalizePackage(item: any): PackageResponse {
  if (!item) return item;
  const active = Boolean(item.active ?? item.isActive ?? false);
  return {
    ...item,
    active,
    isActive: active,
  };
}

export const classTypeService = {
  async getPublicClassTypes(
    params?: ClassTypeQueryParams,
  ): Promise<PageResponse<ClassTypeResponse>> {
    const { data } = await apiClient.get<PageResponse<ClassTypeResponse>>(
      "/class-types",
      { params },
    );
    if (data && Array.isArray(data.content)) {
      data.content = data.content.map(normalizeClassType);
    }
    return data;
  },

  async getAll(
    params?: ClassTypeQueryParams,
  ): Promise<PageResponse<ClassTypeResponse>> {
    const user = getStoredUser();
    const isAdmin = user?.role === "ADMIN";
    const endpoint = isAdmin ? "/admin/class-types" : "/class-types";

    const queryParams: Record<string, any> = { ...params };
    if (params && params.status) {
      queryParams.active = params.status === "ACTIVE";
      delete queryParams.status;
    }
    try {
      const { data } = await apiClient.get<PageResponse<ClassTypeResponse>>(
        endpoint,
        { params: queryParams },
      );
      if (data && Array.isArray(data.content)) {
        data.content = data.content.map(normalizeClassType);
      }
      return data;
    } catch (err) {
      if (endpoint === "/admin/class-types") {
        const { data } = await apiClient.get<PageResponse<ClassTypeResponse>>(
          "/class-types",
          { params: queryParams },
        );
        if (data && Array.isArray(data.content)) {
          data.content = data.content.map(normalizeClassType);
        }
        return data;
      }
      throw err;
    }
  },

  async getById(id: number): Promise<ClassTypeResponse> {
    const { data } = await apiClient.get<ClassTypeResponse>(
      `/admin/class-types/${id}`,
    );
    return normalizeClassType(data);
  },

  async create(payload: CreateClassTypeRequest): Promise<ClassTypeResponse> {
    const active = payload.active ?? payload.isActive ?? true;
    const body: Record<string, any> = {
      name: payload.name,
      description: payload.description,
      active,
    };
    const { data } = await apiClient.post<ClassTypeResponse>(
      "/admin/class-types",
      body,
    );
    return normalizeClassType(data);
  },

  async update(
    id: number,
    payload: UpdateClassTypeRequest,
  ): Promise<ClassTypeResponse> {
    const body: Record<string, any> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.active !== undefined) {
      body.active = payload.active;
    } else if (payload.isActive !== undefined) {
      body.active = payload.isActive;
    }
    const { data } = await apiClient.patch<ClassTypeResponse>(
      `/admin/class-types/${id}`,
      body,
    );
    return normalizeClassType(data);
  },
};

export const packageService = {
  async getAll(
    params?: PackageQueryParams,
  ): Promise<PageResponse<PackageResponse>> {
    const { data } = await apiClient.get<PageResponse<PackageResponse>>(
      "/admin/packages",
      { params },
    );
    if (data && Array.isArray(data.content)) {
      data.content = data.content.map(normalizePackage);
    }
    return data;
  },

  async getById(id: number): Promise<PackageResponse> {
    const { data } = await apiClient.get<PackageResponse>(
      `/admin/packages/${id}`,
    );
    return normalizePackage(data);
  },

  async create(payload: CreatePackageRequest): Promise<PackageResponse> {
    const active = payload.active ?? payload.isActive ?? true;
    const body = {
      ...payload,
      active,
    };
    const { data } = await apiClient.post<PackageResponse>(
      "/admin/packages",
      body,
    );
    return normalizePackage(data);
  },

  async update(
    id: number,
    payload: UpdatePackageRequest,
  ): Promise<PackageResponse> {
    const body: Record<string, any> = { ...payload };
    if (payload.active !== undefined) {
      body.active = payload.active;
    } else if (payload.isActive !== undefined) {
      body.active = payload.isActive;
    }
    const { data } = await apiClient.patch<PackageResponse>(
      `/admin/packages/${id}`,
      body,
    );
    return normalizePackage(data);
  },

  async deactivate(id: number): Promise<PackageResponse> {
    return this.update(id, { isActive: false, active: false });
  },

  async activate(id: number): Promise<PackageResponse> {
    return this.update(id, { isActive: true, active: true });
  },
};

import { reviewService } from "./review.service";
export const getAllReviews = reviewService.getAllReviews.bind(reviewService);
export const hideReview = reviewService.hideReview.bind(reviewService);
export const showReview = reviewService.showReview.bind(reviewService);
export { reviewService };

import { paymentService } from "./payment.service";
export const getTransactions =
  paymentService.getTransactions.bind(paymentService);
export const updateTransactionStatus =
  paymentService.updateTransactionStatus.bind(paymentService);
export const adjustMemberPackage =
  paymentService.adjustMemberPackage.bind(paymentService);
export { paymentService };

export const AdminCoreService = {
  getAnalyticsOverview,
  analyticsService,
  roomService,
  classTypeService,
  packageService,
  reviewService,
  getAllReviews,
  hideReview,
  showReview,
  paymentService,
  getTransactions,
  updateTransactionStatus,
  adjustMemberPackage,
  axios: axiosInstance,
};

export const adminCoreService = AdminCoreService;
export default AdminCoreService;
