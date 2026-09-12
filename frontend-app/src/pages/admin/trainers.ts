import { TrainerService } from "../../services/trainer.service";
import type { Trainer, TrainerQueryParams } from "../../models/trainer";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./trainers.html?raw";
import "./trainers.css";

export function render(): string {
  return template;
}

// ══════════════════════════════════════════
// STATE QUẢN LÝ XÉT DUYỆT TRAINER
// ══════════════════════════════════════════
let currentRejectId: number | null = null;
let currentRejectTrainerName: string = "";
let currentApproveId: number | null = null;
let currentApproveTrainerName: string = "";
let trainersState: Trainer[] = [];
let filtersState: TrainerQueryParams = {
  status: "PENDING",
  keyword: "",
  specialization: "",
  page: 0,
  size: 10,
};
let totalElements: number = 0;
let totalPages: number = 1;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Hiển thị Toast thông báo trên góc màn hình
 */
function showTrainerToast(message: string, type: "success" | "danger" = "success"): void {
  let container = document.getElementById("trainer-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "trainer-toast-container";
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
 * Format tiền tệ VNĐ cho phí theo giờ
 */
function formatFee(amount?: number): string {
  if (amount === undefined || amount === null) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Hiển thị Badge cho Trạng thái hồ sơ
 */
function renderStatusBadge(status?: string): string {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "PENDING":
      return `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill fw-semibold">PENDING</span>`;
    case "ACTIVE":
      return `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-semibold">ACTIVE</span>`;
    case "REJECTED":
      return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill fw-semibold">REJECTED</span>`;
    default:
      return `<span class="badge bg-light text-dark border px-3 py-1 rounded-pill">${status || "--"}</span>`;
  }
}

/**
 * Mở modal phê duyệt hồ sơ
 */
function openApproveModal(id: number, name: string): void {
  currentApproveId = id;
  currentApproveTrainerName = name;

  const nameEl = document.getElementById("approve-trainer-name");
  const infoEl = document.getElementById("approve-trainer-info");
  if (nameEl) nameEl.textContent = name;
  if (infoEl) infoEl.textContent = `Huấn luyện viên (ID: #${id})`;

  const modalEl = document.getElementById("approveModal");
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
 * Đóng modal phê duyệt hồ sơ
 */
function closeApproveModal(): void {
  const modalEl = document.getElementById("approveModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
    }
  }
  currentApproveId = null;
  currentApproveTrainerName = "";
}

/**
 * Mở modal từ chối hồ sơ
 */
function openRejectModal(id: number, name: string): void {
  currentRejectId = id;
  currentRejectTrainerName = name;

  const textarea = document.querySelector<HTMLTextAreaElement>("#reject-reason");
  const errorMsg = document.querySelector<HTMLElement>("#reject-reason-error");
  if (textarea) textarea.value = "";
  if (errorMsg) errorMsg.classList.add("d-none");

  const modalEl = document.getElementById("rejectModal");
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
 * Đóng modal từ chối hồ sơ
 */
function closeRejectModal(): void {
  const modalEl = document.getElementById("rejectModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
    }
  }
  currentRejectId = null;
  currentRejectTrainerName = "";
}

/**
 * Render bảng danh sách Huấn luyện viên
 */
function renderTable(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#trainer-table-body");
  const countBadge = document.querySelector<HTMLElement>("#trainers-count-badge");
  const paginationInfo = document.querySelector<HTMLElement>("#trainer-pagination-info");

  if (!tbody) return;

  if (countBadge) {
    const currentStatusText = filtersState.status === "ALL" ? "tất cả" : filtersState.status;
    countBadge.textContent = `${totalElements} hồ sơ (${currentStatusText})`;
  }

  if (paginationInfo) {
    const start = totalElements === 0 ? 0 : (filtersState.page ?? 0) * (filtersState.size ?? 10) + 1;
    const end = Math.min(
      ((filtersState.page ?? 0) + 1) * (filtersState.size ?? 10),
      totalElements,
    );
    paginationInfo.textContent = `Hiển thị ${start} - ${end} trên tổng số ${totalElements} hồ sơ`;
  }

  if (!trainersState || trainersState.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <div class="mb-2">
            <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div class="fw-semibold text-dark mb-1">Không có hồ sơ nào phù hợp</div>
          <div class="small text-muted">Hiện tại không có huấn luyện viên nào theo điều kiện tìm kiếm.</div>
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const rowsHtml = trainersState
    .map((trainer) => {
      const isPending = trainer.status === "PENDING";
      const isActive = trainer.status === "ACTIVE";

      // Ở cột "Thao tác", với mỗi Trainer PENDING tạo 2 nút: Duyệt (Xanh) và Từ chối (Đỏ)
      let actionButtonsHtml = "";
      if (isPending) {
        actionButtonsHtml = `
          <div class="d-inline-flex gap-2 justify-content-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-success btn-approve-trainer d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
              data-id="${trainer.id}"
              data-name="${trainer.fullName}"
              title="Phê duyệt hồ sơ này"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="pointer-events: none;">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style="pointer-events: none;">Duyệt</span>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger btn-reject-trainer d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
              data-id="${trainer.id}"
              data-name="${trainer.fullName}"
              title="Từ chối hồ sơ này"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span style="pointer-events: none;">Từ chối</span>
            </button>
          </div>`;
      } else if (isActive) {
        actionButtonsHtml = `
          <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-3">
            Đã duyệt
          </span>`;
      } else {
        actionButtonsHtml = `
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-3">
            Đã từ chối
          </span>`;
      }

      return `
        <tr class="trainer-table-row">
          <td class="ps-4 fw-bold text-muted small">#${trainer.id}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="trainer-avatar-mini rounded-circle d-flex align-items-center justify-content-center fw-bold">
                ${(trainer.fullName || "T").charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="fw-semibold text-dark">${trainer.fullName || "--"}</div>
                <div class="text-muted extra-small text-truncate" style="max-width: 180px;">${trainer.bio || "Chưa có tiểu sử"}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="text-dark">${trainer.email || "--"}</span>
          </td>
          <td>
            <span class="badge bg-light text-dark border px-2 py-1 fw-normal">${trainer.specialization || "Tổng quát"}</span>
          </td>
          <td class="text-center">
            <span class="fw-medium">${trainer.experienceYears ?? "--"} năm</span>
          </td>
          <td class="text-end fw-semibold text-dark">
            ${formatFee(trainer.hourlyFee)}
          </td>
          <td class="text-center">
            ${renderStatusBadge(trainer.status)}
          </td>
          <td class="text-end pe-4">
            ${actionButtonsHtml}
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
  const controls = document.querySelector<HTMLElement>("#trainer-pagination-controls");
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
      <button class="page-link btn-trainer-page" data-page="${currentPage - 1}">Trước</button>
    </li>`;

  // Page Numbers
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link btn-trainer-page" data-page="${i}">${i + 1}</button>
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
      <button class="page-link btn-trainer-page" data-page="${currentPage + 1}">Sau</button>
    </li>`;

  controls.innerHTML = html;
}

/**
 * Tải danh sách hồ sơ Huấn luyện viên
 * Mặc định load status: PENDING
 */
export async function loadPendingTrainers(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>("#trainer-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Đang tải dữ liệu hồ sơ huấn luyện viên...
        </td>
      </tr>`;
  }

  try {
    const res = await TrainerService.getTrainers(filtersState);

    if (Array.isArray(res)) {
      trainersState = res;
      totalElements = res.length;
      totalPages = 1;
    } else if (res && Array.isArray(res.content)) {
      trainersState = res.content;
      totalElements = res.totalElements ?? res.content.length;
      totalPages = res.totalPages ?? 1;
    } else {
      trainersState = [];
      totalElements = 0;
      totalPages = 1;
    }

    renderTable();
  } catch (error) {
    console.error("Lỗi khi tải danh sách huấn luyện viên:", error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-danger">
            <div class="fw-bold mb-1">Không thể tải dữ liệu từ máy chủ</div>
            <div class="small text-muted mb-3">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.</div>
            <button type="button" id="btn-trainer-retry-load" class="btn btn-sm btn-outline-primary rounded-3 px-3">
              Thử lại
            </button>
          </td>
        </tr>`;
      document.querySelector("#btn-trainer-retry-load")?.addEventListener("click", () => loadPendingTrainers());
    }
  }
}

/**
 * Gắn các sự kiện cho nút Duyệt, Từ chối, Modal và Bộ lọc
 */
function setupEventListeners(): void {
  // 1. Delegated Click Listener cho nút Duyệt / Từ chối trên bảng
  const tbody = document.querySelector<HTMLTableSectionElement>("#trainer-table-body");
  tbody?.addEventListener("click", async (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Nút Duyệt -> Mở Approve Modal
    const approveBtn = target.closest<HTMLButtonElement>(".btn-approve-trainer");
    if (approveBtn) {
      const trainerId = Number(approveBtn.dataset.id);
      const trainerName = approveBtn.dataset.name || "Huấn luyện viên";
      openApproveModal(trainerId, trainerName);
      return;
    }

    // Nút Từ chối -> Mở Reject Modal
    const rejectBtn = target.closest<HTMLButtonElement>(".btn-reject-trainer");
    if (rejectBtn) {
      const trainerId = Number(rejectBtn.dataset.id);
      const trainerName = rejectBtn.dataset.name || "Huấn luyện viên";
      openRejectModal(trainerId, trainerName);
      return;
    }
  });

  // 2. Nút xác nhận duyệt trong Modal
  const confirmApproveBtn = document.querySelector<HTMLButtonElement>("#btn-confirm-approve");
  confirmApproveBtn?.addEventListener("click", async () => {
    if (!currentApproveId) return;

    const originalText = confirmApproveBtn.innerHTML;
    try {
      confirmApproveBtn.disabled = true;
      confirmApproveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang duyệt...</span>`;

      await TrainerService.approveTrainer(currentApproveId);
      closeApproveModal();
      showTrainerToast(`Đã phê duyệt hồ sơ HLV "${currentApproveTrainerName}" thành công!`, "success");
      await loadPendingTrainers();
    } catch (err) {
      console.error("Lỗi khi duyệt hồ sơ trainer:", err);
      showTrainerToast("Phê duyệt hồ sơ thất bại. Vui lòng thử lại sau!", "danger");
    } finally {
      confirmApproveBtn.disabled = false;
      confirmApproveBtn.innerHTML = originalText;
    }
  });

  // 3. Nút xác nhận từ chối trong Modal
  const confirmRejectBtn = document.querySelector<HTMLButtonElement>("#btn-confirm-reject");
  confirmRejectBtn?.addEventListener("click", async () => {
    if (!currentRejectId) return;

    const textarea = document.querySelector<HTMLTextAreaElement>("#reject-reason");
    const errorMsg = document.querySelector<HTMLElement>("#reject-reason-error");
    const reason = textarea?.value.trim() ?? "";

    if (!reason) {
      if (errorMsg) errorMsg.classList.remove("d-none");
      textarea?.focus();
      return;
    }
    if (errorMsg) errorMsg.classList.add("d-none");

    const originalText = confirmRejectBtn.innerHTML;
    try {
      confirmRejectBtn.disabled = true;
      confirmRejectBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang xử lý...</span>`;

      await TrainerService.rejectTrainer(currentRejectId, reason);
      closeRejectModal();
      showTrainerToast(`Đã từ chối hồ sơ của HLV "${currentRejectTrainerName}" thành công!`, "success");
      await loadPendingTrainers();
    } catch (err) {
      console.error("Lỗi khi từ chối hồ sơ trainer:", err);
      showTrainerToast("Từ chối hồ sơ thất bại. Vui lòng thử lại sau!", "danger");
    } finally {
      confirmRejectBtn.disabled = false;
      confirmRejectBtn.innerHTML = originalText;
    }
  });

  // 3. Phân trang clicks
  const paginationControls = document.querySelector<HTMLElement>("#trainer-pagination-controls");
  paginationControls?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-trainer-page");
    if (!btn) return;
    const pageNum = Number(btn.dataset.page);
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages && pageNum !== filtersState.page) {
      filtersState.page = pageNum;
      loadPendingTrainers();
    }
  });

  // 4. Dropdown Status filter
  const statusSelect = document.querySelector<HTMLSelectElement>("#trainer-filter-status");
  statusSelect?.addEventListener("change", () => {
    filtersState.status = statusSelect.value;
    filtersState.page = 0;
    loadPendingTrainers();
  });

  // 5. Input Specialization filter (Debounce 300ms)
  const specInput = document.querySelector<HTMLInputElement>("#trainer-filter-specialization");
  specInput?.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersState.specialization = specInput.value.trim();
      filtersState.page = 0;
      loadPendingTrainers();
    }, 300);
  });

  // 6. Input Keyword filter (Debounce 300ms)
  const keywordInput = document.querySelector<HTMLInputElement>("#trainer-filter-keyword");
  keywordInput?.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersState.keyword = keywordInput.value.trim();
      filtersState.page = 0;
      loadPendingTrainers();
    }, 300);
  });

  // 7. Reset Filters Button
  const resetBtn = document.querySelector<HTMLButtonElement>("#btn-trainer-reset-filters");
  resetBtn?.addEventListener("click", () => {
    if (keywordInput) keywordInput.value = "";
    if (specInput) specInput.value = "";
    if (statusSelect) statusSelect.value = "PENDING";
    filtersState = {
      status: "PENDING",
      keyword: "",
      specialization: "",
      page: 0,
      size: 10,
    };
    loadPendingTrainers();
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
    if (href === currentPath || (currentPath === "/admin/trainers" && href === "/admin/trainers")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

/**
 * Hàm khởi tạo trang Xét duyệt Huấn luyện viên
 */
export function init(): void {
  highlightActiveNav();
  setupAdminProfile();
  setupLogoutAction();
  setupEventListeners();
  loadPendingTrainers();
}

// Khởi chạy an toàn khi chạy standalone hoặc SPA
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#trainer-table-body")) {
        init();
      }
    });
  } else {
    if (document.querySelector("#trainer-table-body")) {
      init();
    }
  }
}
