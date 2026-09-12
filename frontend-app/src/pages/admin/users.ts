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
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Khóa</span>
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
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
            <span>Mở khóa</span>
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
  // 1. Delegated Click Listener cho nút Khóa / Mở khóa
  const tbody = document.querySelector<HTMLTableSectionElement>("#user-table-body");
  tbody?.addEventListener("click", async (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-toggle-status");
    if (!btn) return;

    const userId = Number(btn.dataset.id);
    const userName = btn.dataset.name || "người dùng";
    const userEmail = btn.dataset.email || "";
    const nextStatus = btn.dataset.targetStatus || "LOCKED";
    const isLocking = nextStatus === "LOCKED";

    const confirmMessage = isLocking
      ? `Bạn có chắc chắn muốn KHÓA tài khoản của "${userName}" (${userEmail})?\nNgười dùng này sẽ không thể đăng nhập sau khi bị khóa.`
      : `Bạn có chắc chắn muốn MỞ KHÓA cho tài khoản "${userName}" (${userEmail})?\nNgười dùng sẽ có thể đăng nhập trở lại bình thường.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const originalHtml = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang xử lý...</span>`;

      await UserService.updateUserStatus(userId, nextStatus);
      await loadUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      alert("Cập nhật trạng thái người dùng thất bại! Vui lòng thử lại.");
      btn.disabled = false;
      btn.innerHTML = originalHtml;
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
