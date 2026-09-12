import { UserService, type UserResponseDTO, type UserQueryParams } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./users.html?raw";
import "./users.css";

export function render(): string {
  return template;
}

// ══════════════════════════════════════════
// STATE QUẢN LÝ NGƯỜI DÙNG & BỘ LỌC
// ══════════════════════════════════════════
let currentStatusUserId: number | null = null;
let currentStatusUserName: string = "";
let currentStatusUserEmail: string = "";
let currentTargetStatus: string = "LOCKED";
let usersState: UserResponseDTO[] = [];
let filtersState: UserQueryParams = {
  keyword: "",
  role: "ALL",
  status: "ALL",
  page: 0,
  size: 10,
};
let totalElements: number = 0;
let totalPages: number = 1;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Hiển thị Toast thông báo trên góc màn hình
 */
function showUserToast(message: string, type: "success" | "danger" = "success"): void {
  let container = document.getElementById("user-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "user-toast-container";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1090";
    document.body.appendChild(container);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0 show shadow-lg rounded-3`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold py-2 px-3">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;

  container.appendChild(toastEl);
  setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => toastEl.remove(), 300);
  }, 3500);
}

/**
 * Mở modal xác nhận thay đổi trạng thái người dùng (Khóa / Mở khóa)
 */
function openUserStatusModal(userId: number, userName: string, userEmail: string, targetStatus: string): void {
  currentStatusUserId = userId;
  currentStatusUserName = userName;
  currentStatusUserEmail = userEmail;
  currentTargetStatus = targetStatus;

  const isLocking = targetStatus === "LOCKED";

  const titleEl = document.getElementById("userStatusModalTitle");
  const iconEl = document.getElementById("userStatusModalIcon");
  const badgeIconEl = document.getElementById("userStatusModalBadgeIcon");
  const nameEl = document.getElementById("userStatusModalUserName");
  const emailEl = document.getElementById("userStatusModalUserEmail");
  const msgEl = document.getElementById("userStatusConfirmMessage");
  const subMsgEl = document.getElementById("userStatusSubMessage");
  const confirmBtn = document.getElementById("btn-confirm-user-status") as HTMLButtonElement | null;
  const infoBox = document.getElementById("userStatusModalInfoBox");

  if (titleEl) {
    titleEl.textContent = isLocking ? "Xác nhận Khóa tài khoản" : "Xác nhận Mở khóa tài khoản";
    titleEl.className = isLocking ? "fw-bold text-danger" : "fw-bold text-success";
  }

  if (nameEl) nameEl.textContent = userName;
  if (emailEl) emailEl.textContent = `${userEmail} (ID: #${userId})`;

  if (isLocking) {
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-danger">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>`;
    }
    if (badgeIconEl) {
      badgeIconEl.innerHTML = `
        <div class="rounded-circle bg-danger-subtle text-danger p-2 d-flex align-items-center justify-content-center">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>`;
    }
    if (infoBox) {
      infoBox.className = "d-flex align-items-center gap-3 p-3 rounded-3 mb-3 border bg-danger-subtle border-danger-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>KHÓA</strong> tài khoản của <strong>${userName}</strong> không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Người dùng này sẽ bị chặn đăng nhập vào hệ thống ngay sau khi tài khoản bị khóa.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-danger px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Khóa</span>`;
    }
  } else {
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-success">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>`;
    }
    if (badgeIconEl) {
      badgeIconEl.innerHTML = `
        <div class="rounded-circle bg-success-subtle text-success p-2 d-flex align-items-center justify-content-center">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </div>`;
    }
    if (infoBox) {
      infoBox.className = "d-flex align-items-center gap-3 p-3 rounded-3 mb-3 border bg-success-subtle border-success-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>MỞ KHÓA</strong> cho tài khoản của <strong>${userName}</strong> không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Người dùng sẽ có thể đăng nhập và sử dụng dịch vụ trở lại bình thường.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-success px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Mở khóa</span>`;
    }
  }

  const modalEl = document.getElementById("userStatusModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl);
    if (modalInstance) {
      modalInstance.show();
    } else {
      modalEl.classList.add("show");
      modalEl.style.display = "block";
    }
  }
}

/**
 * Đóng modal xác nhận thay đổi trạng thái người dùng
 */
function closeUserStatusModal(): void {
  const modalEl = document.getElementById("userStatusModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
    }
  }
  currentStatusUserId = null;
  currentStatusUserName = "";
  currentStatusUserEmail = "";
}

/**
 * Hiển thị Badge cho Trạng thái tài khoản
 * - ACTIVE: xanh lá
 * - LOCKED: đỏ
 * - PENDING: vàng
 * - REJECTED: xám đậm
 */
function renderStatusBadge(status: string): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "ACTIVE":
      return `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-semibold">ACTIVE</span>`;
    case "LOCKED":
      return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill fw-semibold">LOCKED</span>`;
    case "PENDING":
      return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 rounded-pill fw-semibold">PENDING</span>`;
    case "REJECTED":
      return `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1 rounded-pill fw-semibold">REJECTED</span>`;
    default:
      return `<span class="badge bg-light text-dark border px-3 py-1 rounded-pill">${status}</span>`;
  }
}

/**
 * Hiển thị Badge cho Vai trò người dùng (Role)
 */
function renderRoleBadge(role: string): string {
  const r = (role || "").toUpperCase();
  switch (r) {
    case "ADMIN":
      return `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill fw-bold">ADMIN</span>`;
    case "TRAINER":
      return `<span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded-pill fw-bold">TRAINER</span>`;
    case "MEMBER":
      return `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded-pill fw-bold">MEMBER</span>`;
    default:
      return `<span class="badge bg-light text-dark border px-2 py-1 rounded-pill">${role}</span>`;
  }
}

/**
 * Render bảng danh sách người dùng vào #user-table-body
 */
function renderTable(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#user-table-body");
  const countBadge = document.querySelector<HTMLElement>("#users-count-badge");
  const paginationInfo = document.querySelector<HTMLElement>("#table-pagination-info");

  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${totalElements} người dùng`;
  }

  if (paginationInfo) {
    const start = totalElements === 0 ? 0 : (filtersState.page ?? 0) * (filtersState.size ?? 10) + 1;
    const end = Math.min(
      ((filtersState.page ?? 0) + 1) * (filtersState.size ?? 10),
      totalElements,
    );
    paginationInfo.textContent = `Hiển thị ${start} - ${end} trên tổng số ${totalElements} người dùng`;
  }

  if (!usersState || usersState.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          <div class="mb-2">
            <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div class="fw-semibold text-dark mb-1">Không tìm thấy người dùng nào</div>
          <div class="small text-muted">Vui lòng thử điều chỉnh lại bộ lọc tìm kiếm.</div>
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const currentUser = getStoredUser();

  const rowsHtml = usersState
    .map((user) => {
      const isCurrentAdmin = currentUser && currentUser.id === user.id;
      const isActive = user.status === "ACTIVE";

      // Nút Khóa (màu đỏ) nếu ACTIVE, Mở khóa (màu xanh) nếu LOCKED hoặc khác
      let actionBtnHtml = "";
      if (isCurrentAdmin) {
        actionBtnHtml = `
          <span class="badge bg-light text-muted border px-2 py-1" title="Bạn không thể tự khóa tài khoản hiện tại của mình">
            Hiện tại
          </span>`;
      } else if (isActive) {
        actionBtnHtml = `
          <button
            type="button"
            class="btn btn-sm btn-outline-danger btn-toggle-status d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
            data-id="${user.id}"
            data-name="${user.fullName}"
            data-email="${user.email}"
            data-target-status="LOCKED"
            title="Khóa tài khoản này"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style="pointer-events: none;">Khóa</span>
          </button>`;
      } else {
        actionBtnHtml = `
          <button
            type="button"
            class="btn btn-sm btn-outline-success btn-toggle-status d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
            data-id="${user.id}"
            data-name="${user.fullName}"
            data-email="${user.email}"
            data-target-status="ACTIVE"
            title="Mở khóa tài khoản này"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
            <span style="pointer-events: none;">Mở khóa</span>
          </button>`;
      }

      return `
        <tr class="user-table-row">
          <td class="ps-4 fw-bold text-muted small">#${user.id}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="user-avatar-mini rounded-circle d-flex align-items-center justify-content-center fw-bold">
                ${(user.fullName || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="fw-semibold text-dark">${user.fullName || "--"}</div>
                <div class="text-muted extra-small">${user.address || "Chưa cập nhật địa chỉ"}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="text-dark">${user.email}</span>
          </td>
          <td>
            <span class="text-muted">${user.phone || "--"}</span>
          </td>
          <td>
            ${renderRoleBadge(user.role)}
          </td>
          <td>
            ${renderStatusBadge(user.status)}
          </td>
          <td class="text-end pe-4">
            ${actionBtnHtml}
          </td>
        </tr>`;
    })
    .join("");

  tbody.innerHTML = rowsHtml;
  renderPagination();
}

/**
 * Render nút phân trang
 */
function renderPagination(): void {
  const controls = document.querySelector<HTMLElement>("#pagination-controls");
  if (!controls) return;

  if (totalPages <= 1) {
    controls.innerHTML = "";
    return;
  }

  const currentPage = filtersState.page ?? 0;
  let html = "";

  // Prev Button
  html += `
    <li class="page-item ${currentPage === 0 ? "disabled" : ""}">
      <button class="page-link btn-page" data-page="${currentPage - 1}">Trước</button>
    </li>`;

  // Page Numbers
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link btn-page" data-page="${i}">${i + 1}</button>
        </li>`;
    } else if (
      (i === currentPage - 2 && i > 1) ||
      (i === currentPage + 2 && i < totalPages - 2)
    ) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Next Button
  html += `
    <li class="page-item ${currentPage === totalPages - 1 ? "disabled" : ""}">
      <button class="page-link btn-page" data-page="${currentPage + 1}">Sau</button>
    </li>`;

  controls.innerHTML = html;
}

/**
 * Tải danh sách người dùng từ API qua UserService
 */
export async function loadUsers(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>("#user-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Đang tải dữ liệu...
        </td>
      </tr>`;
  }

  try {
    const res = await UserService.getUsers(filtersState);

    if (Array.isArray(res)) {
      usersState = res;
      totalElements = res.length;
      totalPages = 1;
    } else if (res && Array.isArray(res.content)) {
      usersState = res.content;
      totalElements = res.totalElements ?? res.content.length;
      totalPages = res.totalPages ?? 1;
    } else {
      usersState = [];
      totalElements = 0;
      totalPages = 1;
    }

    renderTable();
  } catch (error) {
    console.error("Lỗi khi tải danh sách người dùng:", error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            <div class="fw-bold mb-1">Không thể kết nối đến máy chủ</div>
            <div class="small text-muted mb-3">Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</div>
            <button type="button" id="btn-retry-load" class="btn btn-sm btn-outline-primary rounded-3 px-3">
              Thử lại
            </button>
          </td>
        </tr>`;
      document.querySelector("#btn-retry-load")?.addEventListener("click", () => loadUsers());
    }
  }
}

/**
 * Gắn các sự kiện cho bộ lọc, tìm kiếm và nút thao tác
 */
function setupEventListeners(): void {
  // 1. Delegated Click Listener cho nút Khóa / Mở khóa -> Mở Modal
  const tbody = document.querySelector<HTMLTableSectionElement>("#user-table-body");
  tbody?.addEventListener("click", async (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-toggle-status");
    if (!btn) return;

    const userId = Number(btn.dataset.id);
    const userName = btn.dataset.name || "người dùng";
    const userEmail = btn.dataset.email || "";
    const nextStatus = btn.dataset.targetStatus || "LOCKED";

    openUserStatusModal(userId, userName, userEmail, nextStatus);
  });

  // 1b. Xử lý nút xác nhận trong Modal thay đổi trạng thái
  const confirmStatusBtn = document.querySelector<HTMLButtonElement>("#btn-confirm-user-status");
  confirmStatusBtn?.addEventListener("click", async () => {
    if (!currentStatusUserId) return;

    const originalText = confirmStatusBtn.innerHTML;
    const isLocking = currentTargetStatus === "LOCKED";
    try {
      confirmStatusBtn.disabled = true;
      confirmStatusBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang xử lý...</span>`;

      await UserService.updateUserStatus(currentStatusUserId, currentTargetStatus);
      closeUserStatusModal();
      showUserToast(
        isLocking
          ? `Đã khóa tài khoản "${currentStatusUserName}" (${currentStatusUserEmail}) thành công!`
          : `Đã mở khóa tài khoản "${currentStatusUserName}" (${currentStatusUserEmail}) thành công!`,
        "success",
      );
      await loadUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      showUserToast("Cập nhật trạng thái người dùng thất bại! Vui lòng thử lại.", "danger");
    } finally {
      confirmStatusBtn.disabled = false;
      confirmStatusBtn.innerHTML = originalText;
    }
  });

  // 2. Phân trang clicks
  const paginationControls = document.querySelector<HTMLElement>("#pagination-controls");
  paginationControls?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-page");
    if (!btn) return;
    const pageNum = Number(btn.dataset.page);
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages && pageNum !== filtersState.page) {
      filtersState.page = pageNum;
      loadUsers();
    }
  });

  // 3. Dropdown Role filter
  const roleSelect = document.querySelector<HTMLSelectElement>("#filter-role");
  roleSelect?.addEventListener("change", () => {
    filtersState.role = roleSelect.value;
    filtersState.page = 0;
    loadUsers();
  });

  // 4. Dropdown Status filter
  const statusSelect = document.querySelector<HTMLSelectElement>("#filter-status");
  statusSelect?.addEventListener("change", () => {
    filtersState.status = statusSelect.value;
    filtersState.page = 0;
    loadUsers();
  });

  // 5. Input tìm kiếm Keyword (Debounce 300ms)
  const keywordInput = document.querySelector<HTMLInputElement>("#filter-keyword");
  keywordInput?.addEventListener("input", () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      filtersState.keyword = keywordInput.value.trim();
      filtersState.page = 0;
      loadUsers();
    }, 300);
  });

  // 6. Nút Reset Filters
  const resetBtn = document.querySelector<HTMLButtonElement>("#btn-reset-filters");
  resetBtn?.addEventListener("click", () => {
    if (keywordInput) keywordInput.value = "";
    if (roleSelect) roleSelect.value = "ALL";
    if (statusSelect) statusSelect.value = "ALL";
    filtersState = {
      keyword: "",
      role: "ALL",
      status: "ALL",
      page: 0,
      size: 10,
    };
    loadUsers();
  });
}

/**
 * Hiển thị tên Admin trên Header và Sidebar
 */
function setupAdminProfile(): void {
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
 * Xử lý sự kiện đăng xuất
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
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = "/auth/login.html";
    }
  });
}

/**
 * Làm nổi bật sidebar active link
 */
function highlightActiveNav(): void {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".admin-nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "/admin/users" && href === "/admin/users")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

/**
 * Hàm khởi tạo trang Quản lý Người dùng
 */
export function init(): void {
  highlightActiveNav();
  setupAdminProfile();
  setupLogoutAction();
  setupEventListeners();
  loadUsers();
}

// Khởi chạy an toàn khi chạy standalone hoặc SPA
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#user-table-body")) {
        init();
      }
    });
  } else {
    if (document.querySelector("#user-table-body")) {
      init();
    }
  }
}
