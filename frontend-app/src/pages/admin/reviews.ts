import { ReviewService } from "../../services/review.service";
import type { Review, ReviewQueryParams } from "../../models/review";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./reviews.html?raw";
import "./reviews.css";

export function render(): string {
  return template;
}

// ══════════════════════════════════════════
// STATE QUẢN LÝ KIỂM DUYỆT ĐÁNH GIÁ
// ══════════════════════════════════════════
let currentActionReviewId: number | null = null;
let currentActionType: "HIDE" | "SHOW" = "HIDE";

let reviewsState: Review[] = [];
let filtersState: ReviewQueryParams = {
  rating: "ALL",
  hidden: "ALL",
  keyword: "",
  page: 0,
  size: 10,
};
let totalElements: number = 0;
let totalPages: number = 1;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Hiển thị Toast thông báo trên góc màn hình
 */
function showReviewToast(message: string, type: "success" | "danger" = "success"): void {
  let container = document.getElementById("review-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "review-toast-container";
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
 * Render số sao (1 đến 5 sao) dạng biểu tượng màu vàng/cam
 */
function renderRatingStars(rating: number): string {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating || 5)));
  let starsHtml = "";

  for (let i = 1; i <= 5; i++) {
    if (i <= safeRating) {
      starsHtml += `<span class="star-icon star-filled">★</span>`;
    } else {
      starsHtml += `<span class="star-icon star-empty">☆</span>`;
    }
  }

  return `
    <div class="d-flex flex-column align-items-center gap-1">
      <div class="star-rating-container" title="${safeRating} / 5 sao">
        ${starsHtml}
      </div>
      <span class="badge bg-light text-secondary border extra-small star-rating-badge">${safeRating}.0 / 5</span>
    </div>`;
}

/**
 * Render Badge trạng thái: Công khai (Xanh) vs Bị ẩn (Đỏ/Xám)
 */
function renderStatusBadge(isHidden?: boolean): string {
  if (isHidden) {
    return `
      <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill fw-semibold">
        Bị ẩn
      </span>`;
  }
  return `
    <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-semibold">
      Công khai
    </span>`;
}

/**
 * Render Badge đối tượng đánh giá (Class vs PT)
 */
function renderTargetBadge(targetType?: string, targetName?: string): string {
  const isPT = (targetType || "").toUpperCase() === "PT";
  const name = targetName || "Chưa xác định";

  if (isPT) {
    return `
      <div>
        <span class="badge bg-purple-subtle text-purple border border-purple-subtle px-2 py-1 mb-1 rounded-3 extra-small" style="background-color: #f3e8ff; color: #7e22ce; border-color: #e9d5ff;">
          Huấn luyện viên PT
        </span>
        <div class="fw-semibold text-dark small text-truncate" style="max-width: 170px;" title="${name}">${name}</div>
      </div>`;
  }

  return `
    <div>
      <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 mb-1 rounded-3 extra-small">
        Lớp học Gym
      </span>
      <div class="fw-semibold text-dark small text-truncate" style="max-width: 170px;" title="${name}">${name}</div>
    </div>`;
}

/**
 * Mở modal xác nhận Ẩn / Hiện đánh giá
 */
function openReviewStatusModal(
  id: number,
  action: "HIDE" | "SHOW",
  memberName: string,
  targetName: string,
  comment: string,
): void {
  currentActionReviewId = id;
  currentActionType = action;

  const isHiding = action === "HIDE";

  const titleEl = document.getElementById("reviewStatusModalTitle");
  const iconEl = document.getElementById("reviewStatusModalIcon");
  const badgeIconEl = document.getElementById("reviewStatusModalBadgeIcon");
  const memberEl = document.getElementById("reviewStatusModalMember");
  const targetEl = document.getElementById("reviewStatusModalTarget");
  const commentEl = document.getElementById("reviewStatusModalComment");
  const msgEl = document.getElementById("reviewStatusConfirmMessage");
  const subMsgEl = document.getElementById("reviewStatusSubMessage");
  const confirmBtn = document.getElementById("btn-confirm-review-status") as HTMLButtonElement | null;
  const infoBox = document.getElementById("reviewStatusModalInfoBox");

  if (titleEl) {
    titleEl.textContent = isHiding ? "Xác nhận Ẩn đánh giá" : "Xác nhận Công khai đánh giá";
    titleEl.className = isHiding ? "fw-bold text-danger" : "fw-bold text-success";
  }

  if (memberEl) memberEl.textContent = `Người đánh giá: ${memberName}`;
  if (targetEl) targetEl.textContent = `Đối tượng: ${targetName} (ID review: #${id})`;
  if (commentEl) commentEl.textContent = `"${comment || "(Không có bình luận)"}"`;

  if (isHiding) {
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-danger">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>`;
    }
    if (badgeIconEl) {
      badgeIconEl.innerHTML = `
        <div class="rounded-circle bg-danger-subtle text-danger p-2 d-flex align-items-center justify-content-center">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          </svg>
        </div>`;
    }
    if (infoBox) {
      infoBox.className = "d-flex align-items-start gap-3 p-3 rounded-3 mb-3 border bg-danger-subtle border-danger-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>ẨN</strong> đánh giá này khỏi trang người dùng không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Sau khi bị ẩn, đánh giá này sẽ không còn hiển thị cho các hội viên khác trên website.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-danger px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Ẩn</span>`;
    }
  } else {
    if (iconEl) {
      iconEl.innerHTML = `
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-success">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>`;
    }
    if (badgeIconEl) {
      badgeIconEl.innerHTML = `
        <div class="rounded-circle bg-success-subtle text-success p-2 d-flex align-items-center justify-content-center">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>`;
    }
    if (infoBox) {
      infoBox.className = "d-flex align-items-start gap-3 p-3 rounded-3 mb-3 border bg-success-subtle border-success-subtle";
    }
    if (msgEl) {
      msgEl.innerHTML = `Bạn có chắc chắn muốn <strong>CÔNG KHAI (HIỆN)</strong> lại đánh giá này không?`;
    }
    if (subMsgEl) {
      subMsgEl.textContent = "Đánh giá sẽ được hiển thị công khai bình thường cho tất cả học viên xem.";
    }
    if (confirmBtn) {
      confirmBtn.className = "btn btn-success px-4 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm";
      confirmBtn.innerHTML = `<span>Xác nhận Hiện</span>`;
    }
  }

  const modalEl = document.getElementById("reviewStatusModal");
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
 * Đóng modal xác nhận thay đổi trạng thái review
 */
function closeReviewStatusModal(): void {
  const modalEl = document.getElementById("reviewStatusModal");
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
    }
  }
  currentActionReviewId = null;
}

/**
 * Render bảng danh sách đánh giá
 */
function renderTable(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#review-table-body");
  const countBadge = document.querySelector<HTMLElement>("#reviews-count-badge");
  const paginationInfo = document.querySelector<HTMLElement>("#review-pagination-info");

  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${totalElements} đánh giá`;
  }

  if (paginationInfo) {
    const start = totalElements === 0 ? 0 : (filtersState.page ?? 0) * (filtersState.size ?? 10) + 1;
    const end = Math.min(
      ((filtersState.page ?? 0) + 1) * (filtersState.size ?? 10),
      totalElements,
    );
    paginationInfo.textContent = `Hiển thị ${start} - ${end} trên tổng số ${totalElements} đánh giá`;
  }

  if (!reviewsState || reviewsState.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          <div class="mb-2">
            <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div class="fw-semibold text-dark mb-1">Không tìm thấy đánh giá nào</div>
          <div class="small text-muted">Vui lòng điều chỉnh lại bộ lọc số sao hoặc trạng thái.</div>
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const rowsHtml = reviewsState
    .map((rev) => {
      const isHidden = rev.hidden === true || rev.isHidden === true;
      const memberName = rev.memberName || rev.member?.fullName || "Hội viên";
      const memberEmail = rev.memberEmail || rev.member?.email || "";
      const targetName = rev.targetName || (rev.classBookingId ? "Lớp học" : "PT");
      const comment = rev.comment || "--";

      // Nút Thao tác: Ẩn (icon con mắt gạch chéo) nếu isHidden === false, Hiện (icon con mắt) nếu isHidden === true
      let actionBtnHtml = "";
      if (isHidden) {
        actionBtnHtml = `
          <button
            type="button"
            class="btn btn-sm btn-outline-success btn-toggle-review d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
            data-id="${rev.id}"
            data-action="SHOW"
            data-member="${memberName}"
            data-target="${targetName}"
            data-comment="${comment.replace(/"/g, '&quot;')}"
            title="Công khai (Hiện) lại đánh giá này"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span style="pointer-events: none;">Hiện</span>
          </button>`;
      } else {
        actionBtnHtml = `
          <button
            type="button"
            class="btn btn-sm btn-outline-danger btn-toggle-review d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 fw-medium"
            data-id="${rev.id}"
            data-action="HIDE"
            data-member="${memberName}"
            data-target="${targetName}"
            data-comment="${comment.replace(/"/g, '&quot;')}"
            title="Ẩn đánh giá này khỏi trang người dùng"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span style="pointer-events: none;">Ẩn</span>
          </button>`;
      }

      return `
        <tr class="review-table-row">
          <td class="ps-4 fw-bold text-muted small">#${rev.id}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="review-avatar-mini rounded-circle d-flex align-items-center justify-content-center fw-bold">
                ${memberName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="fw-semibold text-dark">${memberName}</div>
                <div class="text-muted extra-small">${memberEmail || "--"}</div>
              </div>
            </div>
          </td>
          <td>
            ${renderTargetBadge(rev.targetType, rev.targetName)}
          </td>
          <td class="text-center">
            ${renderRatingStars(rev.rating)}
          </td>
          <td>
            <div class="review-comment-cell text-truncate-2" title="${comment.replace(/"/g, '&quot;')}">
              "${comment}"
            </div>
          </td>
          <td class="text-center">
            ${renderStatusBadge(isHidden)}
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
  const controls = document.querySelector<HTMLElement>("#review-pagination-controls");
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
      <button class="page-link btn-review-page" data-page="${currentPage - 1}">Trước</button>
    </li>`;

  // Page Numbers
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link btn-review-page" data-page="${i}">${i + 1}</button>
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
      <button class="page-link btn-review-page" data-page="${currentPage + 1}">Sau</button>
    </li>`;

  controls.innerHTML = html;
}

/**
 * Tải danh sách đánh giá từ ReviewService
 */
export async function loadReviews(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>("#review-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Đang tải danh sách đánh giá...
        </td>
      </tr>`;
  }

  try {
    const res = await ReviewService.getAllReviews(filtersState);

    if (Array.isArray(res)) {
      reviewsState = res;
      totalElements = res.length;
      totalPages = 1;
    } else if (res && Array.isArray(res.content)) {
      reviewsState = res.content;
      totalElements = res.totalElements ?? res.content.length;
      totalPages = res.totalPages ?? 1;
    } else {
      reviewsState = [];
      totalElements = 0;
      totalPages = 1;
    }

    renderTable();
  } catch (error) {
    console.error("Lỗi khi tải danh sách đánh giá:", error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            <div class="fw-bold mb-1">Không thể tải dữ liệu đánh giá từ máy chủ</div>
            <div class="small text-muted mb-3">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</div>
            <button type="button" id="btn-review-retry-load" class="btn btn-sm btn-outline-primary rounded-3 px-3">
              Thử lại
            </button>
          </td>
        </tr>`;
      document.querySelector("#btn-review-retry-load")?.addEventListener("click", () => loadReviews());
    }
  }
}

/**
 * Gắn các sự kiện cho bộ lọc, tìm kiếm và nút thao tác
 */
function setupEventListeners(): void {
  // 1. Delegated Click Listener cho nút Ẩn / Hiện trên bảng
  const tbody = document.querySelector<HTMLTableSectionElement>("#review-table-body");
  tbody?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-toggle-review");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = (btn.dataset.action || "HIDE") as "HIDE" | "SHOW";
    const member = btn.dataset.member || "Hội viên";
    const target = btn.dataset.target || "Dịch vụ";
    const comment = btn.dataset.comment || "";

    openReviewStatusModal(id, action, member, target, comment);
  });

  // 1b. Xử lý nút xác nhận trong Confirm Modal
  const confirmBtn = document.querySelector<HTMLButtonElement>("#btn-confirm-review-status");
  confirmBtn?.addEventListener("click", async () => {
    if (!currentActionReviewId) return;

    const originalText = confirmBtn.innerHTML;
    const isHiding = currentActionType === "HIDE";

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Đang xử lý...</span>`;

      if (isHiding) {
        await ReviewService.hideReview(currentActionReviewId);
        showReviewToast(`Đã ẩn đánh giá #${currentActionReviewId} thành công!`, "success");
      } else {
        await ReviewService.showReview(currentActionReviewId);
        showReviewToast(`Đã công khai đánh giá #${currentActionReviewId} thành công!`, "success");
      }

      closeReviewStatusModal();
      await loadReviews();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái review:", err);
      showReviewToast("Cập nhật trạng thái đánh giá thất bại. Vui lòng thử lại sau!", "danger");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalText;
    }
  });

  // 2. Dropdown Lọc theo số sao
  const ratingSelect = document.querySelector<HTMLSelectElement>("#filter-rating");
  ratingSelect?.addEventListener("change", () => {
    filtersState.rating = ratingSelect.value;
    filtersState.page = 0;
    loadReviews();
  });

  // 3. Dropdown Lọc theo trạng thái ẩn/hiện
  const statusSelect = document.querySelector<HTMLSelectElement>("#filter-status");
  statusSelect?.addEventListener("change", () => {
    const val = statusSelect.value;
    if (val === "VISIBLE") {
      filtersState.hidden = false;
    } else if (val === "HIDDEN") {
      filtersState.hidden = true;
    } else {
      filtersState.hidden = "ALL";
    }
    filtersState.page = 0;
    loadReviews();
  });

  // 4. Ô tìm kiếm Keyword (Debounce 300ms)
  const keywordInput = document.querySelector<HTMLInputElement>("#filter-keyword");
  keywordInput?.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersState.keyword = keywordInput.value.trim();
      filtersState.page = 0;
      loadReviews();
    }, 300);
  });

  // 5. Nút Đặt lại bộ lọc
  const resetBtn = document.querySelector<HTMLButtonElement>("#btn-reset-filters");
  resetBtn?.addEventListener("click", () => {
    if (keywordInput) keywordInput.value = "";
    if (ratingSelect) ratingSelect.value = "ALL";
    if (statusSelect) statusSelect.value = "ALL";
    filtersState = {
      rating: "ALL",
      hidden: "ALL",
      keyword: "",
      page: 0,
      size: 10,
    };
    loadReviews();
  });

  // 6. Nút Làm mới
  const refreshBtn = document.querySelector<HTMLButtonElement>("#btn-refresh-reviews");
  refreshBtn?.addEventListener("click", () => {
    loadReviews();
  });

  // 7. Phân trang clicks
  const paginationControls = document.querySelector<HTMLElement>("#review-pagination-controls");
  paginationControls?.addEventListener("click", (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-review-page");
    if (!btn) return;
    const pageNum = Number(btn.dataset.page);
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages && pageNum !== filtersState.page) {
      filtersState.page = pageNum;
      loadReviews();
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
    if (href === currentPath || (currentPath === "/admin/reviews" && href === "/admin/reviews")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

/**
 * Khởi tạo trang Kiểm duyệt Đánh giá
 */
export function init(): void {
  highlightActiveNav();
  setupAdminProfile();
  setupLogoutAction();
  setupEventListeners();
  loadReviews();
}

// Khởi chạy an toàn khi chạy standalone hoặc SPA
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#review-table-body")) {
        init();
      }
    });
  } else {
    if (document.querySelector("#review-table-body")) {
      init();
    }
  }
}
