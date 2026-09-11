import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthUser, LoginResponse, UserRole } from "../models/auth";
import MockAdapter from "axios-mock-adapter";

// Error response shape
export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp?: string; // ISO 8601
}

// Key lưu dữ liệu đăng nhập trong localStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// Danh sách các endpoint PUBLIC — không gắn Authorization header
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/register-trainer",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Tạo axios instance dùng chung
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — tự động gắn Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const isPublic = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    if (!isPublic) {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Xóa dữ liệu đăng nhập và chuyển về trang Login
export function clearAuthAndRedirect(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = "/login";
}

// Response interceptor — xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      url.includes(endpoint),
    );

    // 401 là "token hết hạn" khi lỗi đến từ endpoint CẦN đăng nhập.
    // Phải để nguyên cho page tự hiển thị lỗi, không được redirect.
    if (status === 401 && !isPublicEndpoint) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // Không tự hiện alert/toast tại đây.
    // Reject với ApiErrorResponse đã parse để page/service tự xử lý UI.
    return Promise.reject(error);
  },
);

// ---- Session helpers ----

// Lưu toàn bộ session sau khi login/register thành công.
export function setSession(data: LoginResponse): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

// Đọc lại user hiện tại từ localStorage (đồng bộ, không cần gọi API).
// Dùng cho router guard
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// Kiểm tra role — dùng trong router guard cho route /admin/*, v.v.
export function hasRole(...roles: UserRole[]): boolean {
  const user = getStoredUser();
  return !!user && roles.includes(user.role);
}

// ==========================================
// MOCK API SETUP (Dành cho Giai đoạn 1 & 2)
// Đổi thành `false` khi ghép API thật với Backend
// ==========================================
const USE_MOCK = true;

if (USE_MOCK) {
  // delayResponse: 800ms để giả lập độ trễ mạng thật
  const mock = new MockAdapter(apiClient, { delayResponse: 800 });

  // ----------------------------------------
  // 1. AUTH & USER (Phase 1)
  // ----------------------------------------
  mock.onPost(/\/auth\/login/).reply(200, {
    accessToken: "mock-jwt-trainer-token",
    refreshToken: "mock-jwt-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: 5,
      fullName: "Trần Văn Trainer",
      phone: "0987654321",
      email: "trainer@example.com",
      role: "TRAINER",
      status: "ACTIVE",
    },
  });

  mock.onPost(/\/auth\/register/).reply(201, {
    message: "Registration successful",
    userId: 2,
  });

  mock.onGet(/\/users\/me/).reply(200, {
    id: 5,
    fullName: "Trần Văn Trainer",
    phone: "0987654321",
    email: "trainer@example.com",
    role: "TRAINER",
    status: "ACTIVE",
  });

  // ----------------------------------------
  // 2. PACKAGES & PAYMENT (Phase 2)
  // ----------------------------------------
  const mockAvailablePackages = [
    {
      id: 1,
      name: "Premium 20 Sessions",
      description: "Gói 20 buổi tập",
      price: 2000000,
      durationDays: 90,
      sessionCount: 20,
      isActive: true,
    },
    {
      id: 2,
      name: "Basic 10 Sessions",
      description: "Gói 10 buổi tập",
      price: 1200000,
      durationDays: 45,
      sessionCount: 10,
      isActive: true,
    },
  ];

  const mockMyPackages: any[] = [
    {
      id: 10,
      packageId: 1,
      packageName: "Premium 20 Sessions",
      startDate: "2026-09-01",
      endDate: "2026-12-01",
      sessionsRemaining: 18,
      status: "ACTIVE",
    },
  ];

  mock.onGet(/\/packages/).reply(200, {
    content: mockAvailablePackages,
  });

  mock.onGet(/\/member-packages\/me/).reply(() => {
    return [200, { content: [...mockMyPackages] }];
  });

  mock.onPost(/\/member-packages/).reply((config) => {
    let pkgId = 1;
    try {
      const body = JSON.parse(config.data);
      if (body.packageId) pkgId = Number(body.packageId);
    } catch {}

    const matchedPkg = mockAvailablePackages.find((p) => p.id === pkgId);
    const newMemberPkg = {
      id: mockMyPackages.length + 11,
      memberPackageId: mockMyPackages.length + 11,
      packageId: pkgId,
      packageName: matchedPkg?.name || "Premium 20 Sessions",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "2026-12-31",
      sessionsRemaining: matchedPkg?.sessionCount ?? 20,
      status: "ACTIVE",
      transactionCode: `TXN-MOCK-${Date.now()}`,
    };

    mockMyPackages.unshift(newMemberPkg);

    return [201, newMemberPkg];
  });

  // ----------------------------------------
  // 3. GROUP CLASSES (Phase 2)
  // ----------------------------------------
  const todayStr = new Date().toISOString().split("T")[0];

  const mockClasses: any[] = [
    {
      id: 1,
      title: "Morning Yoga",
      classTypeId: 1,
      classTypeName: "Yoga",
      maxCapacity: 20,
      currentCount: 19,
      startTime: `${todayStr}T15:00:00`,
      endTime: `${todayStr}T16:00:00`,
      trainerId: 5,
      trainerName: "Trần Văn Trainer",
      roomId: 1,
      roomName: "Studio Yoga A",
      status: "SCHEDULED",
    },
    {
      id: 2,
      title: "Zumba Cardio",
      classTypeId: 2,
      classTypeName: "Zumba",
      maxCapacity: 20,
      currentCount: 20,
      startTime: `${todayStr}T17:00:00`,
      endTime: `${todayStr}T18:00:00`,
      trainerId: 6,
      trainerName: "Lê Thị Zumba",
      roomId: 2,
      roomName: "Studio Dance B",
      status: "FULL",
    },
  ];

  mock.onGet(/\/class-types/).reply(200, {
    content: [
      { id: 1, name: "Yoga", description: "Yoga cơ bản & Nâng cao" },
      { id: 2, name: "Zumba", description: "Zumba Cardio Sôi Động" },
    ],
  });

  mock.onGet(/\/classes/).reply((config) => {
    let list = mockClasses.map((c) => ({ ...c }));
    if (config.params?.classTypeId) {
      list = list.filter(
        (c) => c.classTypeId === Number(config.params.classTypeId),
      );
    }
    if (config.params?.from) {
      const selectedDate = String(config.params.from).split("T")[0];
      list = list.map((c) => ({
        ...c,
        startTime: `${selectedDate}${c.startTime.substring(10)}`,
        endTime: `${selectedDate}${c.endTime.substring(10)}`,
      }));
    }
    return [200, { content: list }];
  });

  const mockClassBookings: any[] = [
    {
      id: 100,
      gymClassId: 1,
      status: "CONFIRMED",
      bookedAt: new Date().toISOString(),
      gymClass: {
        id: 1,
        title: "Morning Yoga",
        classTypeName: "Yoga",
        trainerName: "Trần Văn Trainer",
        roomName: "Studio Yoga A",
        startTime: `${todayStr}T08:00:00`,
        endTime: `${todayStr}T09:00:00`,
      },
    },
  ];

  mock.onPost(/\/class-bookings/).reply((config) => {
    let gymClassId = 1;
    try {
      const body = JSON.parse(config.data);
      if (body.gymClassId) gymClassId = Number(body.gymClassId);
    } catch {}

    const targetClass = mockClasses.find((c) => c.id === gymClassId);
    if (targetClass) {
      targetClass.currentCount += 1;
      if (targetClass.currentCount >= targetClass.maxCapacity) {
        targetClass.status = "FULL";
      }
    }

    const newBooking = {
      id: Date.now(),
      gymClassId,
      status: "CONFIRMED",
      attendanceStatus: "NOT_MARKED",
      bookedAt: new Date().toISOString(),
      gymClass: targetClass
        ? {
            id: targetClass.id,
            title: targetClass.title,
            classTypeName: targetClass.classTypeName,
            trainerName: targetClass.trainerName,
            roomName: targetClass.roomName,
            startTime: targetClass.startTime,
            endTime: targetClass.endTime,
          }
        : undefined,
    };
    mockClassBookings.unshift(newBooking);

    return [201, newBooking];
  });

  mock.onGet(/\/class-bookings\/me/).reply(() => {
    return [200, { content: [...mockClassBookings] }];
  });

  mock.onPatch(/\/class-bookings\/\d+\/cancel/).reply((config) => {
    const match = config.url?.match(/\/class-bookings\/(\d+)\/cancel/);
    const id = match ? Number(match[1]) : 100;
    let cancelReason = "Bận việc đột xuất";
    try {
      const body = JSON.parse(config.data);
      if (body.cancelReason) cancelReason = body.cancelReason;
    } catch {}

    const booking = mockClassBookings.find((b) => b.id === id);
    if (booking) {
      booking.status = "CANCELLED";
      booking.cancelReason = cancelReason;
      booking.cancelledAt = new Date().toISOString();
    }
    return [200, { message: "Cancelled successfully", booking }];
  });

  // ----------------------------------------
  // 4. PT BOOKING 1-1 (Phase 2)
  // ----------------------------------------
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const mockPTBookings: any[] = [
    {
      id: 200,
      trainerId: 5,
      trainerName: "Trần Văn Trainer",
      timeSlotId: 20,
      status: "PENDING",
      bookedAt: new Date().toISOString(),
      sessionNote: "Tập trung tăng cơ vai và ngực",
      healthNote: "Cổ tay hơi mỏi nhẹ",
      timeSlot: {
        id: 20,
        startTime: `${tomorrowStr}T09:00:00`,
        endTime: `${tomorrowStr}T10:00:00`,
      },
    },
  ];

  const mockTrainerTimeSlots: any[] = [
    {
      id: 20,
      startTime: `${tomorrowStr}T09:00:00`,
      endTime: `${tomorrowStr}T10:00:00`,
      status: "AVAILABLE",
    },
    {
      id: 21,
      startTime: `${tomorrowStr}T14:00:00`,
      endTime: `${tomorrowStr}T15:00:00`,
      status: "AVAILABLE",
    },
    {
      id: 22,
      startTime: `${tomorrowStr}T16:00:00`,
      endTime: `${tomorrowStr}T17:00:00`,
      status: "BOOKED",
    },
    {
      id: 23,
      startTime: `${dayAfterStr}T10:00:00`,
      endTime: `${dayAfterStr}T11:00:00`,
      status: "AVAILABLE",
    },
  ];

  mock.onGet(/\/trainers\/\d+\/time-slots/).reply(() => {
    return [200, { content: [...mockTrainerTimeSlots] }];
  });

  mock.onGet(/\/trainers/).reply(200, {
    content: [
      {
        id: 5,
        fullName: "Trần Văn Trainer",
        specialization: "Giảm cân & Tăng cơ",
        experienceYears: 5,
        bio: "Chuyên gia xây dựng lộ trình tăng cơ, giảm mỡ khoa học.",
      },
      {
        id: 6,
        fullName: "Lê Thị Huấn Luyện",
        specialization: "Pilates & Phục hồi",
        experienceYears: 4,
        bio: "Tập trung cải thiện tư thế, độ dẻo dai và sức bền lõi cơ thể.",
      },
    ],
  });

  // Cập nhật cho Trainer tự tạo slot
  mock.onPost(/\/trainers\/time-slots/).reply((config) => {
    let startTime = `${tomorrowStr}T08:00:00`;
    let endTime = `${tomorrowStr}T09:00:00`;
    try {
      const body = JSON.parse(config.data);
      if (body.startTime) startTime = body.startTime;
      if (body.endTime) endTime = body.endTime;
    } catch {}

    const newSlot = {
      id: Date.now(),
      startTime,
      endTime,
      status: "AVAILABLE",
    };
    mockTrainerTimeSlots.push(newSlot);

    return [201, newSlot];
  });

  mock.onPatch(/\/trainers\/time-slots\/\d+\/deactivate/).reply((config) => {
    const match = config.url?.match(/\/trainers\/time-slots\/(\d+)\/deactivate/);
    const id = match ? Number(match[1]) : 0;
    const slot = mockTrainerTimeSlots.find((s) => s.id === id);
    if (slot) {
      slot.status = "INACTIVE";
    }
    return [200, { status: "INACTIVE", message: "Deactivated successfully" }];
  });

  mock.onPost(/\/pt-bookings/).reply((config) => {
    let trainerId = 5;
    let timeSlotId = 20;
    let sessionNote = "Tập luyện thể hình cá nhân";
    let healthNote = "";
    try {
      const body = JSON.parse(config.data);
      if (body.trainerId) trainerId = Number(body.trainerId);
      if (body.timeSlotId) timeSlotId = Number(body.timeSlotId);
      if (body.sessionNote) sessionNote = body.sessionNote;
      if (body.healthNote) healthNote = body.healthNote;
    } catch {}

    const newPT = {
      id: Date.now(),
      trainerId,
      trainerName: trainerId === 6 ? "Lê Thị Huấn Luyện" : "Trần Văn Trainer",
      timeSlotId,
      status: "PENDING",
      bookedAt: new Date().toISOString(),
      sessionNote,
      healthNote,
      timeSlot: {
        id: timeSlotId,
        startTime: `${tomorrowStr}T14:00:00`,
        endTime: `${tomorrowStr}T15:00:00`,
      },
    };
    mockPTBookings.unshift(newPT);

    return [201, newPT];
  });

  mock.onGet(/\/pt-bookings\/me/).reply(() => {
    return [200, { content: [...mockPTBookings] }];
  });

  mock.onPatch(/\/pt-bookings\/\d+\/cancel/).reply((config) => {
    const match = config.url?.match(/\/pt-bookings\/(\d+)\/cancel/);
    const id = match ? Number(match[1]) : 200;
    let cancelReason = "Bận việc đột xuất";
    try {
      const body = JSON.parse(config.data);
      if (body.cancelReason) cancelReason = body.cancelReason;
    } catch {}

    const booking = mockPTBookings.find((b) => b.id === id);
    if (booking) {
      booking.status = "CANCELLED";
      booking.rejectReason = `Hội viên đã hủy: ${cancelReason}`;
    }
    return [200, { message: "Cancelled successfully", booking }];
  });

  // ----------------------------------------
  // 5. TRAINER ACTIONS
  // ----------------------------------------
  const mockTrainerRequests: any[] = [
    {
      id: 201,
      memberId: 1,
      memberName: "Nguyễn Văn Member",
      sessionNote: "Tập trung tăng cơ vai và lưng xô",
      healthNote: "Không có chấn thương",
      status: "PENDING",
      bookedAt: new Date().toISOString(),
      timeSlot: {
        id: 20,
        startTime: `${tomorrowStr}T09:00:00`,
        endTime: `${tomorrowStr}T10:00:00`,
      },
    },
    {
      id: 202,
      memberId: 2,
      memberName: "Trần Thị Học Viên",
      sessionNote: "Cải thiện tư thế và giảm đau mỏi vai gáy",
      healthNote: "Hay bị đau khớp gối khi vận động mạnh",
      status: "PENDING",
      bookedAt: new Date().toISOString(),
      timeSlot: {
        id: 21,
        startTime: `${tomorrowStr}T14:00:00`,
        endTime: `${tomorrowStr}T15:00:00`,
      },
    },
  ];

  mock.onGet(/\/pt-bookings\/trainer\/me/).reply(() => {
    return [200, { content: [...mockTrainerRequests] }];
  });

  mock.onPatch(/\/pt-bookings\/\d+\/confirm/).reply((config) => {
    const match = config.url?.match(/\/pt-bookings\/(\d+)\/confirm/);
    const id = match ? Number(match[1]) : 201;
    const req = mockTrainerRequests.find((r) => r.id === id);
    if (req) {
      req.status = "CONFIRMED";
    }
    return [200, { status: "CONFIRMED", message: "Confirmed successfully" }];
  });

  mock.onPatch(/\/pt-bookings\/\d+\/reject/).reply((config) => {
    const match = config.url?.match(/\/pt-bookings\/(\d+)\/reject/);
    const id = match ? Number(match[1]) : 202;
    let reason = "Huấn luyện viên bận lịch công tác đột xuất";
    try {
      const body = JSON.parse(config.data);
      if (body.rejectReason) reason = body.rejectReason;
    } catch {}

    const req = mockTrainerRequests.find((r) => r.id === id);
    if (req) {
      req.status = "REJECTED";
      req.rejectReason = reason;
    }
    return [200, { status: "REJECTED", message: "Rejected successfully" }];
  });

  // Bỏ qua các API không được định nghĩa ở trên (cho phép gọi thật nếu có)
  mock.onAny().passThrough();
}
