import { paymentService } from "../../services/payment.service";
import type { TransactionResponse, TransactionQueryParams } from "../../models/package";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./transactions.html?raw";
import "./transactions.css";

export function render(): string {
  return template;
}

// ══════════════════════════════════════════
// STATE QUẢN LÝ GIAO DỊCH
// ══════════════════════════════════════════
let currentActionTxId: number | null = null;
let currentActionStatus: "SUCCESS" | "FAILED" = "SUCCESS";

let transactionsState: TransactionResponse[] = [];
let filtersState: TransactionQueryParams = {
  status: "ALL",
  keyword: "",
  page: 0,
  size: 10,
};
let totalElements: number = 0;
let totalPages: number = 1;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Định dạng tiền tệ VND
 */
function formatVND(amount: number | string | undefined | null): string {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numeric);
}

/**
 * Định dạng ngày giờ hiển thị
 */
function formatDateTime(isoString?: string): string {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Hiển thị Toast thông báo trên góc màn hình
 */
function showTransactionToast(message: string, type: "success" | "danger" = "success"): void {
  let container = document.getElementById("transaction-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "transaction-toast-container";
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
 * Render Huy hiệu trạng thái giao dịch
 */
function renderStatusBadge(status: string): string {
  const upper = (status || "").toUpperCase();
  if (upper === "PENDING") {
    return `
      <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 rounded-pill fw-semibold">
        Chờ xử lý
      </span>`;
  }
  if (upper === "SUCCESS") {
    return `
      <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-semibold">
        Thành công
      </span>`;
  }
  if (upper === "FAILED") {
    return `
      <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill fw-semibold">
        Thất bại
      </span>`;
  }
  return `
    <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1 rounded-pill fw-semibold">
      ${status}
    </span>`;
}

/**
 * Render Phương thức thanh toán
 */
function renderPaymentMethodBadge(method?: string): string {
  const m = (method || "").toUpperCase();
  if (m === "MOCK") {
    return `<span class="badge bg-info-subtle text-info border border-info-subtle rounded-3 extra-small">Mô phỏng (MOCK)</span>`;
  }
  if (m === "CASH") {
    return `<span class="badge bg-secondary-subtle text-dark border border-secondary-subtle rounded-3 extra-small">Tiền mặt (CASH)</span>`;
  }
  return `<span class="badge bg-light text-secondary border rounded-3 extra-small">${method || "--"}</span>`;
}

/**
 * Mở modal xác nhận Duyệt (SUCCESS) hoặc Hủy (FAILED) giao dịch
 */
function openTransactionConfirmModal(
  id: number,
  status: "SUCCESS" | "FAILED",
  code: string,
  member: string,
  pkgName: string,
  amountFormatted: string,
): void {
  currentActionTxId = id;
  currentActionStatus = status;

  const isApprove = status === "SUCCESS";

  const titleEl = document.getElementById("transactionConfirmModalTitle");
  const iconEl = document.getElementById("transactionConfirmModalIcon");
  const codeEl = document.getElementById("modalTxCode");
  const memberEl = document.getElementById("modalTxMember");
  const pkgEl = document.getElementById("modalTxPackage");
  const amountEl = document.getElementById("modalTxAmount");
  const msgEl = document.getElementById("transactionConfirmMessage");
  const subMsgEl = document.getElementById("transactionConfirmSubMessage");
  const confirmBtn = document.getElementById("btn-confirm-transaction-status") as HTMLButtonElement | null;
  const infoBox = document.getElementById("transactionConfirmInfoBox");

  if (codeEl) codeEl.textContent = code;
  if (memberEl) memberEl.textContent = member;
  if (pkgEl) pkgEl.textContent = pkgName;
  if (amountEl) amountEl.textContent = amountFormatted;

  if (isApprove) {
    if (titleEl) {
      titleEl.textContent = "Xác nhận Duyệt giao dịch";
      titleEl.className = "modal-title fw-bold text-success";
    }
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-success">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>`;
    }
    if (infoBox) {
      infoBox.className = "p-3 rounded-3 mb-3 border bg-success-subtle border-success-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>DUYỆT</strong> giao dịch <code>${code}</code> không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Sau khi duyệt, hệ thống sẽ tự động kích hoạt gói tập và cấp lượt tập cho học viên.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-success px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Duyệt</span>`;
    }
  } else {
    if (titleEl) {
      titleEl.textContent = "Xác nhận Hủy giao dịch";
      titleEl.className = "modal-title fw-bold text-danger";
    }
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-danger">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>`;
    }
    if (infoBox) {
      infoBox.className = "p-3 rounded-3 mb-3 border bg-danger-subtle border-danger-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>HỦY</strong> giao dịch <code>${code}</code> không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Giao dịch sẽ chuyển sang trạng thái Thất bại (FAILED) và không kích hoạt gói tập.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-danger px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Hủy</span>`;
    }
  }

  const modalEl = document.getElementById("transactionConfirmModal");
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
 * Đóng modal xác nhận
 */
function closeTransactionConfirmModal(): void {
  const modalEl = document.getElementById("transactionConfirmModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
    }
  }
  currentActionTxId = null;
}

/**
 * Render bảng danh sách giao dịch
 */
function renderTable(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#transaction-table-body");
  const countBadge = document.querySelector<HTMLElement>("#transactions-count-badge");
  const paginationInfo = document.querySelector<HTMLElement>("#transaction-pagination-info");

  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${totalElements} giao dịch`;
  }

  if (paginationInfo) {
    const start = totalElements === 0 ? 0 : (filtersState.page ?? 0) * (filtersState.size ?? 10) + 1;
    const end = Math.min(
      ((filtersState.page ?? 0) + 1) * (filtersState.size ?? 10),
      totalElements,
    );
    paginationInfo.textContent = `Hiển thị ${start} - ${end} trên tổng số ${totalElements} giao dịch`;
  }

  if (!transactionsState || transactionsState.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-5 text-muted">
          <div class="mb-2">
            <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div class="fw-semibold text-dark mb-1">Không tìm thấy giao dịch nào</div>
          <div class="small text-muted">Vui lòng điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc trạng thái.</div>
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const rowsHtml = transactionsState
    .map((tx) => {
      const isPending = (tx.status || "").toUpperCase() === "PENDING";
      const memberName = tx.memberName || (tx.memberId ? `Hội viên #${tx.memberId}` : "Hội viên");
      const memberEmail = tx.memberEmail || "";
      const packageName = tx.packageName || (tx.packageId ? `Gói tập #${tx.packageId}` : "Gói tập Gym");
      const formattedAmount = formatVND(tx.amount);
      const code = tx.transactionCode || `TX-${tx.id}`;

      let actionHtml = "";
      if (isPending) {
        actionHtml = `
          <div class="d-flex align-items-center justify-content-end gap-1">
            <button
              type="button"
              class="btn btn-sm btn-outline-success btn-tx-action d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-medium"
              data-id="${tx.id}"
              data-action="SUCCESS"
              data-code="${code}"
              data-member="${memberName}"
              data-package="${packageName}"
              data-amount="${formattedAmount}"
              title="Duyệt giao dịch và kích hoạt gói tập"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style="pointer-events: none;">Duyệt</span>
            </button>

            <button
              type="button"
              class="btn btn-sm btn-outline-danger btn-tx-action d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-medium"
              data-id="${tx.id}"
              data-action="FAILED"
              data-code="${code}"
              data-member="${memberName}"
              data-package="${packageName}"
              data-amount="${formattedAmount}"
              title="Hủy giao dịch này"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span style="pointer-events: none;">Hủy</span>
            </button>
          </div>`;
      } else {
        actionHtml = `<span class="badge bg-light text-muted border extra-small">Đã hoàn tất</span>`;
      }

      return `
        <tr class="transaction-table-row">
          <td class="ps-4 fw-bold text-muted small">#${tx.id}</td>
          <td>
            <div class="fw-bold font-monospace text-dark small" title="${code}">
              ${code}
            </div>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="transaction-avatar-mini rounded-circle d-flex align-items-center justify-content-center fw-bold">
                ${memberName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="fw-semibold text-dark">${memberName}</div>
                <div class="text-muted extra-small">${memberEmail || "--"}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="fw-semibold text-primary small text-truncate" style="max-width: 180px;" title="${packageName}">
              ${packageName}
            </div>
          </td>
          <td class="text-end fw-bold text-dark">
            ${formattedAmount}
          </td>
          <td class="text-center">
            ${renderPaymentMethodBadge(tx.paymentMethod as string)}
          </td>
          <td class="small text-muted">
            ${formatDateTime(tx.createdAt)}
          </td>
          <td class="text-center">
            ${renderStatusBadge(tx.status)}
          </td>
          <td class="pe-4 text-end">
            ${actionHtml}
          </td>
        </tr>`;
    })
    .join("");

  tbody.innerHTML = rowsHtml;
  renderPagination();
}

/**
 * Render pagination controls
 */
function renderPagination(): void {
  const controls = document.querySelector<HTMLElement>("#transaction-pagination-controls");
  if (!controls) return;

  if (totalPages <= 1) {
    controls.innerHTML = "";
    return;
  }

  const currentPage = filtersState.page ?? 0;
  let html = "";

  html += `
    <li class="page-item ${currentPage === 0 ? "disabled" : ""}">
      <button class="page-link btn-transaction-page" data-page="${currentPage - 1}">Trước</button>
    </li>`;

  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link btn-transaction-page" data-page="${i}">${i + 1}</button>
        </li>`;
    } else if (
      (i === currentPage - 2 && i > 1) ||
      (i === currentPage + 2 && i < totalPages - 2)
    ) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  html += `
    <li class="page-item ${currentPage === totalPages - 1 ? "disabled" : ""}">
      <button class="page-link btn-transaction-page" data-page="${currentPage + 1}">Sau</button>
    </li>`;

  controls.innerHTML = html;
}

/**
 * Tải danh sách giao dịch từ PaymentService
 */
export async function loadTransactions(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>("#transaction-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-4 text-muted">
          <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Đang tải dữ liệu giao dịch...
        </td>
      </tr>`;
  }

  try {
    const paramsToSend: any = {
      page: filtersState.page ?? 0,
      size: filtersState.size ?? 10,
    };
    if (filtersState.status && filtersState.status !== "ALL") {
      paramsToSend.status = filtersState.status;
    }

    const res = await paymentService.getTransactions(paramsToSend);

    let rawList: TransactionResponse[] = [];
    if (Array.isArray(res)) {
      rawList = res;
      totalElements = res.length;
      totalPages = 1;
    } else if (res && Array.isArray(res.content)) {
      rawList = res.content;
      totalElements = res.totalElements ?? res.content.length;
      totalPages = res.totalPages ?? 1;
    } else {
      rawList = [];
      totalElements = 0;
      totalPages = 1;
    }

    // Client-side keyword filter if keyword is given
    if (filtersState.keyword && filtersState.keyword.trim().length > 0) {
      const kw = filtersState.keyword.toLowerCase().trim();
      transactionsState = rawList.filter(
        (tx) =>
          (tx.transactionCode || "").toLowerCase().includes(kw) ||
          (tx.memberName || "").toLowerCase().includes(kw) ||
          (tx.memberEmail || "").toLowerCase().includes(kw) ||
          (tx.packageName || "").toLowerCase().includes(kw),
      );
    } else {
      transactionsState = rawList;
    }

    renderTable();
  } catch (error) {
    console.error("Lỗi khi tải danh sách giao dịch:", error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-5 text-danger">
            <div class="fw-bold mb-1">Không thể tải dữ liệu giao dịch từ máy chủ</div>
            <div class="small text-muted mb-3">Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</div>
            <button type="button" id="btn-tx-retry-load" class="btn btn-sm btn-outline-primary rounded-3 px-3">
              Thử lại
            </button>
          </td>
        </tr>`;
      document.querySelector("#btn-tx-retry-load")?.addEventListener("click", () => loadTransactions());
    }
  }
}

/**
 * Gắn các sự kiện cho bộ lọc, tìm kiếm và nút thao tác
 */
function setupEventListeners(): void {
  // 1. Delegated Click Listener cho nút Duyệt / Hủy
  const tbody = document.querySelector<HTMLTableSectionElement>("#transaction-table-body");
  tbody?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-tx-action");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = (btn.dataset.action || "SUCCESS") as "SUCCESS" | "FAILED";
    const code = btn.dataset.code || `TX-${id}`;
    const member = btn.dataset.member || "Hội viên";
    const pkg = btn.dataset.package || "Gói tập";
    const amount = btn.dataset.amount || "0 đ";

    openTransactionConfirmModal(id, action, code, member, pkg, amount);
  });

  // 1b. Xử lý nút xác nhận trong Modal
  const confirmBtn = document.querySelector<HTMLButtonElement>("#btn-confirm-transaction-status");
  confirmBtn?.addEventListener("click", async () => {
    if (!currentActionTxId) return;

    const originalText = confirmBtn.innerHTML;
    const isApprove = currentActionStatus === "SUCCESS";

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang xử lý...</span>`;

      await paymentService.updateTransactionStatus(currentActionTxId, currentActionStatus);

      if (isApprove) {
        showTransactionToast(`Đã duyệt giao dịch #${currentActionTxId} thành công! Gói tập đã được kích hoạt.`, "success");
      } else {
        showTransactionToast(`Đã hủy giao dịch #${currentActionTxId} thành công!`, "danger");
      }

      closeTransactionConfirmModal();
      await loadTransactions();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái giao dịch:", err);
      showTransactionToast("Cập nhật giao dịch thất bại. Vui lòng kiểm tra lại!", "danger");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
    }
  });

  // 2. Dropdown Lọc trạng thái
  const statusSelect = document.querySelector<HTMLSelectElement>("#filter-status");
  statusSelect?.addEventListener("change", () => {
    filtersState.status = statusSelect.value;
    filtersState.page = 0;
    loadTransactions();
  });

  // 3. Ô tìm kiếm Keyword (Debounce 300ms)
  const keywordInput = document.querySelector<HTMLInputElement>("#filter-keyword");
  keywordInput?.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersState.keyword = keywordInput.value.trim();
      filtersState.page = 0;
      loadTransactions();
    }, 300);
  });

  // 4. Nút Đặt lại bộ lọc
  const resetBtn = document.querySelector<HTMLButtonElement>("#btn-reset-filters");
  resetBtn?.addEventListener("click", () => {
    if (keywordInput) keywordInput.value = "";
    if (statusSelect) statusSelect.value = "ALL";
    filtersState = {
      status: "ALL",
      keyword: "",
      page: 0,
      size: 10,
    };
    loadTransactions();
  });

  // 5. Nút Làm mới
  const refreshBtn = document.querySelector<HTMLButtonElement>("#btn-refresh-transactions");
  refreshBtn?.addEventListener("click", () => {
    loadTransactions();
  });

  // 6. Phân trang clicks
  const paginationControls = document.querySelector<HTMLElement>("#transaction-pagination-controls");
  paginationControls?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-transaction-page");
    if (!btn) return;
    const pageNum = Number(btn.dataset.page);
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages && pageNum !== filtersState.page) {
      filtersState.page = pageNum;
      loadTransactions();
    }
  });
}

/**
 * Hiển thị thông tin Admin
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
  const logoutBtn = document.querySelector<HTMLElement>("#btn-logout");
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
 * Highlight Sidebar Active Link
 */
function highlightActiveNav(): void {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".admin-nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "/admin/transactions" && href === "/admin/transactions")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

/**
 * Khởi tạo trang Quản lý Giao dịch
 */
export function init(): void {
  highlightActiveNav();
  setupAdminProfile();
  setupLogoutAction();
  setupEventListeners();
  loadTransactions();
}

// Khởi chạy an toàn khi chạy standalone hoặc SPA
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#transaction-table-body")) {
        init();
      }
    });
  } else {
    if (document.querySelector("#transaction-table-body")) {
      init();
    }
  }
}
