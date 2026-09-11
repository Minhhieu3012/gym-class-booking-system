import { apiClient } from "../core/api";
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
} from "../models/admin";

// ---- Room APIs  ----
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
    const { data } = await apiClient.post<RoomResponse>("/rooms", payload);
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
      `/admin/rooms/${id}`,
      payload,
    );
    return data;
  },
};

// ---- Class Type APIs  ----
export const classTypeService = {
  async getAll(
    params?: ClassTypeQueryParams,
  ): Promise<PageResponse<ClassTypeResponse>> {
    const { data } = await apiClient.get<PageResponse<ClassTypeResponse>>(
      "/class-types",
      { params },
    );
    return data;
  },
  async getById(id: number): Promise<ClassTypeResponse> {
    const { data } = await apiClient.get<ClassTypeResponse>(
      `/class-types/${id}`,
    );
    return data;
  },
  async create(payload: CreateClassTypeRequest): Promise<ClassTypeResponse> {
    const { data } = await apiClient.post<ClassTypeResponse>(
      "/admin/class-types",
      payload,
    );
    return data;
  },

  async update(
    id: number,
    payload: UpdateClassTypeRequest,
  ): Promise<ClassTypeResponse> {
    const { data } = await apiClient.patch<ClassTypeResponse>(
      `/admin/class-types/${id}`,
      payload,
    );
    return data;
  },
};

// ---- Package APIs  ----
export const packageService = {
  async getAll(
    params?: PackageQueryParams,
  ): Promise<PageResponse<PackageResponse>> {
    const { data } = await apiClient.get<PageResponse<PackageResponse>>(
      "/admin/packages",
      { params },
    );
    return data;
  },
  async getById(id: number): Promise<PackageResponse> {
    const { data } = await apiClient.get<PackageResponse>(
      `/admin/packages/${id}`,
    );
    return data;
  },
  async create(payload: CreatePackageRequest): Promise<PackageResponse> {
    const body: any = {
      ...payload,
      active: payload.isActive ?? true,
    };
    const { data } = await apiClient.post<PackageResponse>(
      "/admin/packages",
      body,
    );
    return data;
  },
  async update(
    id: number,
    payload: UpdatePackageRequest,
  ): Promise<PackageResponse> {
    const body: any = { ...payload };
    if (payload.isActive !== undefined) {
      body.active = payload.isActive;
    }
    const { data } = await apiClient.patch<PackageResponse>(
      `/admin/packages/${id}`,
      body,
    );
    return data;
  },
  // PATCH /admin/packages/{id}
  async deactivate(id: number): Promise<PackageResponse> {
    return this.update(id, { isActive: false });
  },

  // Contract: cập nhật trạng thái isActive = true
  async activate(id: number): Promise<PackageResponse> {
    return this.update(id, { isActive: true });
  },
};
