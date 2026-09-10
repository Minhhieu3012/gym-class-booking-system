import template from "./packages.html?raw";
import "./packages.css";
import { paymentService, PaymentService } from "../../services/payment.service";
import type { Package, MemberPackage } from "../../models/package";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

/**
 * Định dạng tiền tệ VNĐ (ví dụ: 1.500.000 đ)
 */
function formatCurrency(amount?: number | null): string {
  if (amount == null) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

/**
 * Định dạng ngày tháng DD/MM/YYYY
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Xử lý chuỗi an toàn chống XSS
 */
function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Hiển thị thông báo Toast hoặc Alert
 */
function showToastMessage(message: string, isSuccess = true): void {
  const toastEl = document.querySelector<HTMLElement>("#package-toast");
  const msgEl = document.querySelector<HTMLElement>("#toast-message");
  if (msgEl) {
    msgEl.textContent = message;
  }
  if (toastEl) {
    if (isSuccess) {
      toastEl.classList.remove("bg-danger");
      toastEl.classList.add("bg-success");
    } else {
      toastEl.classList.remove("bg-success");
      toastEl.classList.add("bg-danger");
    }

    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
      const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
      toast.show();
      return;
    }
  }
  alert(message);
}

/**
 * Tải danh sách gói tập của hội viên hiện tại
 * GET /member-packages/me
 */
export async function loadMyPackages(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#my-packages-container");
  if (!container) return;

  try {
    // Hiển thị loading spinner
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
        <span class="text-neutral ms-2">Đang tải gói tập của bạn...</span>
      </div>
    `;

    const response = await paymentService.getMyPackages();
    const myPackages: MemberPackage[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (myPackages.length === 0) {
      container.innerHTML = `
        <div class="empty-packages-card">
          <div class="empty-icon-wrap">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="fw-bold text-secondary-theme fs-5 mb-1">Bạn chưa có gói tập nào</h3>
          <p class="text-neutral mb-3" style="max-width: 420px; margin: 0 auto;">
            Hiện tại bạn chưa đăng ký gói tập nào hoặc các gói trước đây đã hết hạn. Hãy khám phá và đăng ký gói tập mới bên dưới!
          </p>
          <a href="#available-packages-section" class="btn-brand text-decoration-none d-inline-flex align-items-center gap-2">
            <span>Khám phá gói tập ngay</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      `;
      return;
    }

    // Render danh sách các thẻ Card làm nổi bật sessionsRemaining, startDate, endDate, status
    container.innerHTML = myPackages
      .map((item) => {
        const isActive = item.status === "ACTIVE";
        const statusBadgeClass = isActive ? "badge-active" : "badge-inactive";
        const statusText = isActive ? "ĐANG HOẠT ĐỘNG" : "ĐÃ HẾT HẠN";
        const cardModifier = isActive ? "active-card" : "expired-card";
        const counterModifier = isActive ? "" : "expired";
        const packageName = item.packageName || item.package?.name || `Gói tập #${item.packageId || item.id}`;

        return `
          <div class="my-package-card ${cardModifier} p-3 p-md-4 shadow-theme-sm">
            <div class="row align-items-center g-3">
              <!-- Cột thông tin gói & trạng thái -->
              <div class="col-12 col-md-7">
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="badge-theme ${statusBadgeClass} px-3 py-1">● ${escapeHtml(statusText)}</span>
                  <span class="text-neutral fs-7 fw-semibold">MÃ GÓI: #MP-${String(item.id || item.memberPackageId || 0).padStart(4, "0")}</span>
                </div>
                <h3 class="fw-bold text-secondary-theme fs-4 mb-2">${escapeHtml(packageName)}</h3>
                
                <!-- Ngày hiệu lực -->
                <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
                  <div class="date-pill text-neutral">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Kích hoạt: <strong class="text-secondary-theme">${formatDate(item.startDate)}</strong></span>
                  </div>
                  <div class="date-pill text-neutral">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Hết hạn: <strong class="text-secondary-theme">${formatDate(item.endDate)}</strong></span>
                  </div>
                </div>
              </div>

              <!-- Cột làm nổi bật chỉ số sessionsRemaining -->
              <div class="col-12 col-md-5 d-flex justify-content-md-end">
                <div class="session-counter-block ${counterModifier} w-100 w-md-auto">
                  <div class="session-number">${item.sessionsRemaining ?? 0}</div>
                  <div class="session-label">Lượt tập còn lại</div>
                  ${
                    isActive && (item.sessionsRemaining ?? 0) <= 3
                      ? `<div class="text-danger fw-bold fs-7 mt-1">Sắp hết lượt tập!</div>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải gói tập của tôi:", error);
    container.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>Không thể tải danh sách gói tập của bạn lúc này. Vui lòng thử lại sau.</div>
      </div>
    `;
  }
}

/**
 * Tải danh sách gói tập hệ thống cung cấp
 * GET /packages (isActive: true)
 */
export async function loadAvailablePackages(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#available-packages-container");
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
        <span class="text-neutral ms-2">Đang tải danh sách gói tập...</span>
      </div>
    `;

    const response = await paymentService.getAvailablePackages({ isActive: true });
    const packages: Package[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (packages.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info text-center py-4">
            Hiện tại không có gói tập nào đang mở đăng ký. Vui lòng quay lại sau!
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = packages
      .map((pkg, index) => {
        const isBestValue = index === 1 || pkg.sessionCount >= 20;

        return `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="available-package-card shadow-theme-sm position-relative">
              ${isBestValue ? `<span class="package-popular-badge">PHỔ BIẾN NHẤT</span>` : ""}
              
              <h3 class="package-name">${escapeHtml(pkg.name)}</h3>
              <p class="text-neutral fs-7 mb-0">${escapeHtml(pkg.description || "Gói rèn luyện thể chất toàn diện")}</p>

              <!-- Giá gói tập -->
              <div class="package-price-wrap">
                <span class="package-price">${formatCurrency(pkg.price)}</span>
                <span class="package-currency">/ gói</span>
              </div>

              <!-- Chi tiết quyền lợi -->
              <ul class="package-feature-list">
                <li class="package-feature-item">
                  <svg class="feature-check-icon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Số buổi tập: <strong class="text-secondary-theme">${pkg.sessionCount} buổi</strong></span>
                </li>
                <li class="package-feature-item">
                  <svg class="feature-check-icon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Thời hạn sử dụng: <strong class="text-secondary-theme">${pkg.durationDays} ngày</strong></span>
                </li>
                <li class="package-feature-item">
                  <svg class="feature-check-icon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Áp dụng cho mọi lớp Group Class &amp; PT</span>
                </li>
                <li class="package-feature-item">
                  <svg class="feature-check-icon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Kích hoạt tự động ngay sau khi thanh toán</span>
                </li>
              </ul>

              <!-- Nút Mua gói này -->
              <button 
                type="button" 
                class="btn-brand w-100 justify-content-center btn-buy-package" 
                data-package-id="${pkg.id}"
                data-package-name="${escapeHtml(pkg.name)}"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Mua gói này</span>
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải gói tập khả dụng:", error);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          Không thể tải danh sách gói tập khả dụng. Vui lòng thử lại sau.
        </div>
      </div>
    `;
  }
}

/**
 * Xử lý sự kiện mua gói tập
 */
async function handleBuyPackageClick(btn: HTMLButtonElement): Promise<void> {
  const packageIdRaw = btn.getAttribute("data-package-id");
  if (!packageIdRaw) return;

  const packageId = parseInt(packageIdRaw, 10);
  if (isNaN(packageId)) return;

  // Lưu lại HTML ban đầu của nút và chuyển sang trạng thái loading
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span class="ms-1">Đang xử lý thanh toán...</span>
  `;

  try {
    // Gọi API mua gói tập với phương thức MOCK theo yêu cầu
    await paymentService.buyPackage({
      packageId,
      paymentMethod: "MOCK",
    });

    // Hiển thị thông báo thành công
    showToastMessage("Thanh toán thành công & Gói tập đã được kích hoạt!", true);

    // Tự động làm mới danh sách gói tập của tôi
    await loadMyPackages();

    // Cuộn mượt lên phần Gói tập của tôi
    const myPackagesSection = document.querySelector<HTMLElement>("#my-packages-section");
    if (myPackagesSection) {
      myPackagesSection.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error: unknown) {
    console.error("Lỗi khi mua gói tập:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message || "Thanh toán thất bại! Vui lòng thử lại.";
    showToastMessage(errorMessage, false);
  } finally {
    // Khôi phục nút bấm
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Gắn các bộ lắng nghe sự kiện trên trang
 */
function attachEvents(): void {
  // 1. Nút làm mới danh sách gói tập của tôi
  const refreshBtn = document.querySelector<HTMLButtonElement>("#btn-refresh-my-packages");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadMyPackages();
    });
  }

  // 2. Bắt sự kiện click nút "Mua gói này" (Event delegation trên container)
  const availableContainer = document.querySelector<HTMLDivElement>("#available-packages-container");
  if (availableContainer) {
    availableContainer.addEventListener("click", (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-buy-package");
      if (target) {
        event.preventDefault();
        handleBuyPackageClick(target);
      }
    });
  }
}

/**
 * Render HTML view template
 */
export function render(): string {
  return template;
}

/**
 * Khởi tạo dữ liệu và sự kiện sau khi view đã được mount vào DOM
 */
export async function init(): Promise<void> {
  attachEvents();
  await Promise.all([loadMyPackages(), loadAvailablePackages()]);
}

// Re-export để tương thích với các module khác
export { PaymentService };
