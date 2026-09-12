import { AdminCoreService } from "../../services/admin-core.service";
import type { AnalyticsOverview } from "../../models/admin";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./dashboard.html?raw";
import "./dashboard.css";

export function render(): string {
  return template;
}

/**
 * Định dạng số tiền sang định dạng tiền tệ VNĐ (ví dụ: 158.000.000 ₫)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Render dữ liệu vào 6 KPI Cards trên giao diện
 */
export function renderAnalytics(data: AnalyticsOverview): void {
  // 1. Total Members
  const elTotalMembers = document.querySelector<HTMLElement>("#total-members");
  if (elTotalMembers) {
    elTotalMembers.textContent = (data.totalMembers ?? 0).toLocaleString("vi-VN");
  }

  // 2. Total Trainers
  const elTotalTrainers = document.querySelector<HTMLElement>("#total-trainers");
  if (elTotalTrainers) {
    elTotalTrainers.textContent = (data.totalTrainers ?? 0).toLocaleString("vi-VN");
  }

  // 3. Total Classes Conducted
  const elClassesConducted = document.querySelector<HTMLElement>("#total-classes-conducted");
  if (elClassesConducted) {
    elClassesConducted.textContent = (data.totalClassesConducted ?? 0).toLocaleString("vi-VN");
  }
  const elClassesAlias = document.querySelector<HTMLElement>("#total-classes");
  if (elClassesAlias) {
    elClassesAlias.textContent = (data.totalClassesConducted ?? 0).toLocaleString("vi-VN");
  }

  // 4. Total Mock Revenue (VNĐ)
  const elRevenue = document.querySelector<HTMLElement>("#total-revenue");
  if (elRevenue) {
    elRevenue.textContent = formatVND(data.totalMockRevenue ?? 0);
  }
  const elRevenueAlias = document.querySelector<HTMLElement>("#total-mock-revenue");
  if (elRevenueAlias) {
    elRevenueAlias.textContent = formatVND(data.totalMockRevenue ?? 0);
  }

  // 5. Attendance Rate
  const elAttendance = document.querySelector<HTMLElement>("#attendance-rate");
  if (elAttendance) {
    const rate = data.attendanceRate ?? 0;
    elAttendance.textContent = `${rate}%`;
  }

  // 6. Active Bookings Count
  const elActiveBookings = document.querySelector<HTMLElement>("#active-bookings-count");
  if (elActiveBookings) {
    elActiveBookings.textContent = (data.activeBookingsCount ?? 0).toLocaleString("vi-VN");
  }
  const elActiveBookingsAlias = document.querySelector<HTMLElement>("#active-bookings");
  if (elActiveBookingsAlias) {
    elActiveBookingsAlias.textContent = (data.activeBookingsCount ?? 0).toLocaleString("vi-VN");
  }
}

/**
 * Gọi API GET /admin/analytics/overview qua AdminCoreService
 */
export async function fetchAndRenderOverview(): Promise<void> {
  try {
    const data = await AdminCoreService.getAnalyticsOverview();
    renderAnalytics(data);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu thống kê tổng quan:", error);
    // Thiết lập fallback hiển thị mặc định nếu chưa kết nối được backend
    const elRevenue = document.querySelector<HTMLElement>("#total-revenue");
    if (elRevenue && elRevenue.textContent === "--") {
      elRevenue.textContent = "0 ₫";
    }
  }
}

/**
 * Hiển thị tên người dùng Admin từ storage nếu có
 */
function setupAdminName(): void {
  const user = getStoredUser();
  const displayName = user?.fullName || user?.email || user?.phone || "Admin";
  
  const headerName = document.querySelector<HTMLElement>("#admin-name");
  if (headerName) {
    headerName.textContent = displayName;
  }
  
  const sidebarName = document.querySelector<HTMLElement>("#sidebar-admin-name");
  if (sidebarName) {
    sidebarName.textContent = displayName;
  }
}

/**
 * Xử lý sự kiện đăng xuất: gọi authService.logout, xóa token và điều hướng về /auth/login.html
 */
function setupLogoutAction(): void {
  const logoutBtn = document.querySelector<HTMLElement>("#btn-logout") ||
    document.querySelector<HTMLElement>("#logout-btn");
    
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    try {
      if (authService && typeof authService.logout === "function") {
        await authService.logout();
      }
    } catch (err) {
      console.warn("Lỗi khi gọi API logout:", err);
    } finally {
      // Đảm bảo xóa sạch token xác thực và thông tin user
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Chuyển hướng về /auth/login.html theo yêu cầu
      window.location.href = "/auth/login.html";
    }
  });
}

/**
 * Làm nổi bật mục menu đang chọn trên Sidebar
 */
function highlightActiveNav(): void {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".admin-nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "/admin" && href === "/admin/dashboard")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

/**
 * Hàm khởi tạo chính của Dashboard
 */
export function init(): void {
  highlightActiveNav();
  setupAdminName();
  setupLogoutAction();
  fetchAndRenderOverview();
}

// Khởi chạy an toàn cho cả môi trường SPA lẫn standalone HTML
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#kpi-cards-grid")) {
        init();
      }
    });
  } else {
    if (document.querySelector("#kpi-cards-grid")) {
      init();
    }
  }
}
