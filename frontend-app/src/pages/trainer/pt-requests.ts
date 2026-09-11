import template from "./pt-requests.html?raw";
import "./pt-requests.css";
import { bookingService, BookingService } from "../../services/booking.service";
import type { PTBooking } from "../../models/booking";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

/**
 * Định dạng khoảng thời gian và ngày
 */
function formatDateTime(
  startStr?: string,
  endStr?: string,
): { time: string; date: string } {
  if (!startStr) return { time: "—", date: "—" };
  try {
    const start = new Date(startStr);
    const startH = String(start.getHours()).padStart(2, "0");
    const startM = String(start.getMinutes()).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const y = start.getFullYear();

    let endPart = "";
    if (endStr) {
      const end = new Date(endStr);
      const endH = String(end.getHours()).padStart(2, "0");
      const endM = String(end.getMinutes()).padStart(2, "0");
      endPart = ` - ${endH}:${endM}`;
    }

    return {
      time: `${startH}:${startM}${endPart}`,
      date: `${d}/${m}/${y}`,
    };
  } catch {
    return { time: startStr, date: "" };
  }
}

/**
 * Xử lý chuỗi chống XSS
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
 * Hiển thị Toast thông báo cho Trainer
 */
function showToast(message: string, isSuccess = true): void {
  const toastEl = document.querySelector<HTMLElement>("#trainer-toast");
  const msgEl = document.querySelector<HTMLElement>("#trainer-toast-message");
  const iconEl = document.querySelector<HTMLElement>("#trainer-toast-icon");

  if (msgEl) {
    msgEl.textContent = message;
  }

  if (toastEl) {
    if (isSuccess) {
      toastEl.classList.remove("bg-danger");
      toastEl.classList.add("bg-success");
      if (iconEl) {
        iconEl.innerHTML = `
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
      }
    } else {
      toastEl.classList.remove("bg-success");
      toastEl.classList.add("bg-danger");
      if (iconEl) {
        iconEl.innerHTML = `
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        `;
      }
    }

    if (typeof bootstrap !== "undefined" && bootstrap.Toast) {
      const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
      toast.show();
      return;
    }
  }

  alert(message);
}

/**
 * Tải danh sách yêu cầu PT gửi tới Trainer
 * GET /pt-bookings/trainer/me
 * LƯU Ý QUAN TRỌNG: Lọc chỉ hiển thị các request có status là PENDING
 */
export async function loadPTRequests(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>(
    "#trainer-requests-container",
  );
  const countBadge = document.querySelector<HTMLSpanElement>(
    "#pending-count-badge",
  );
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="text-neutral mt-2 mb-0">Đang tải danh sách yêu cầu PT...</p>
    </div>
  `;

  try {
    const response = await bookingService.getPTRequestsForTrainer();
    const allRequests: PTBooking[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    // Lọc chỉ hiển thị các request có status là PENDING theo yêu cầu đề bài
    const pendingRequests = allRequests.filter((r) => r.status === "PENDING");

    if (countBadge) {
      countBadge.textContent = String(pendingRequests.length);
    }

    if (pendingRequests.length === 0) {
      container.innerHTML = `
        <div class="empty-requests-card shadow-theme-sm">
          <div class="empty-icon-wrap">
            <svg width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="fw-bold text-secondary-theme fs-5 mb-1">Hiện không có yêu cầu nào đang chờ duyệt</h3>
          <p class="text-neutral mb-0" style="max-width: 440px; margin: 0 auto;">
            Tất cả các yêu cầu đặt lịch đã được xử lý hoặc chưa có học viên nào gửi yêu cầu mới. Hãy quay lại sau!
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = pendingRequests
      .map((req) => {
        const memberName =
          req.memberName ||
          (req as unknown as { member?: { fullName?: string } }).member
            ?.fullName ||
          `Học viên #${req.memberId || req.id}`;

        const initial = memberName.charAt(0).toUpperCase();

        const timeData = formatDateTime(
          req.timeSlot?.startTime || req.trainerTimeSlot?.startTime,
          req.timeSlot?.endTime || req.trainerTimeSlot?.endTime,
        );

        return `
          <div class="trainer-request-card shadow-theme-sm" id="request-card-${req.id}">
            <div class="row align-items-center g-3">
              <!-- Cột 1: Thông tin học viên & thời gian -->
              <div class="col-12 col-md-7">
                <div class="d-flex align-items-center gap-3 mb-2">
                  <div class="member-avatar-box">
                    ${initial}
                  </div>
                  <div>
                    <h3 class="member-name mb-0">${escapeHtml(memberName)}</h3>
                    <span class="badge bg-warning text-dark fs-8 fw-semibold">ĐANG CHỜ DUYỆT</span>
                    <span class="text-neutral fs-8 ms-1">MÃ: #REQ-${String(req.id).padStart(4, "0")}</span>
                  </div>
                </div>

                <div class="d-flex flex-wrap align-items-center gap-2 mt-2 mb-3">
                  <div class="request-meta-pill">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Khung giờ yêu cầu: <strong class="text-primary-theme">${escapeHtml(timeData.time)}</strong> (${escapeHtml(timeData.date)})</span>
                  </div>
                </div>

                <!-- Mục tiêu & Lưu ý sức khỏe -->
                <div class="row g-2">
                  <div class="col-12 col-sm-6">
                    <div class="request-note-box h-100">
                      <div class="request-note-title">MỤC TIÊU BUỔI TẬP:</div>
                      <p class="request-note-content">${escapeHtml(req.sessionNote || "Chưa cung cấp mục tiêu cụ thể")}</p>
                    </div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="request-note-box h-100">
                      <div class="request-note-title">LƯU Ý SỨC KHỎE:</div>
                      <p class="request-note-content">${escapeHtml(req.healthNote || "Không có chấn thương/bệnh lý ghi nhận")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cột 2: Nút Hành động (Chấp nhận & Từ chối) -->
              <div class="col-12 col-md-5 d-flex justify-content-md-end align-items-center gap-2">
                <button 
                  type="button" 
                  class="btn btn-outline-danger btn-reject-pt flex-fill flex-md-grow-0" 
                  data-request-id="${req.id}"
                  data-member-name="${escapeHtml(memberName)}"
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Từ chối</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-success btn-confirm-pt flex-fill flex-md-grow-0" 
                  data-request-id="${req.id}"
                  data-member-name="${escapeHtml(memberName)}"
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Chấp nhận</span>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải danh sách yêu cầu PT:", error);
    container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Không thể tải danh sách yêu cầu PT lúc này. Vui lòng thử lại sau!
      </div>
    `;
  }
}

/**
 * Xử lý khi HLV bấm "Chấp nhận"
 */
async function handleConfirmPTRequest(btn: HTMLButtonElement): Promise<void> {
  const requestIdRaw = btn.getAttribute("data-request-id");
  const memberName = btn.getAttribute("data-member-name") || "học viên";
  if (!requestIdRaw) return;

  const id = parseInt(requestIdRaw, 10);
  if (isNaN(id)) return;

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    <span class="ms-1">Đang duyệt...</span>
  `;

  try {
    await bookingService.confirmPTBooking(id);
    showToast(`Đã chấp nhận buổi tập với ${memberName} thành công!`, true);

    // Xóa item khỏi danh sách trên DOM theo yêu cầu đề bài
    const cardEl = document.querySelector<HTMLElement>(`#request-card-${id}`);
    if (cardEl) {
      cardEl.remove();
    }

    // Cập nhật lại số lượng trên badge
    const remainingCards = document.querySelectorAll(".trainer-request-card");
    const countBadge = document.querySelector<HTMLSpanElement>(
      "#pending-count-badge",
    );
    if (countBadge) {
      countBadge.textContent = String(remainingCards.length);
    }

    // Nếu không còn card nào thì reload để hiện empty state
    if (remainingCards.length === 0) {
      await loadPTRequests();
    }
  } catch (error: unknown) {
    console.error("Lỗi khi xác nhận lịch PT:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message || "Xác nhận lịch hẹn không thành công!";
    showToast(errorMessage, false);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Xử lý khi HLV bấm "Từ chối"
 */
async function handleRejectPTRequest(btn: HTMLButtonElement): Promise<void> {
  const requestIdRaw = btn.getAttribute("data-request-id");
  const memberName = btn.getAttribute("data-member-name") || "học viên";
  if (!requestIdRaw) return;

  const id = parseInt(requestIdRaw, 10);
  if (isNaN(id)) return;

  // Dùng window.prompt yêu cầu nhập lý do từ chối (rejectReason)
  const rejectReason = window.prompt(
    `Nhập lý do từ chối yêu cầu của ${memberName}:`,
    "Huấn luyện viên bận lịch công tác đột xuất",
  );

  // Nếu user bấm Cancel
  if (rejectReason === null) return;

  const reasonTrimmed = rejectReason.trim();
  if (!reasonTrimmed) {
    alert("Vui lòng nhập lý do từ chối!");
    return;
  }

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    <span class="ms-1">Đang từ chối...</span>
  `;

  try {
    await bookingService.rejectPTBooking(id, { rejectReason: reasonTrimmed });
    showToast(`Đã từ chối yêu cầu của ${memberName}!`, true);

    // Xóa item khỏi danh sách trên DOM theo yêu cầu đề bài
    const cardEl = document.querySelector<HTMLElement>(`#request-card-${id}`);
    if (cardEl) {
      cardEl.remove();
    }

    // Cập nhật lại số lượng trên badge
    const remainingCards = document.querySelectorAll(".trainer-request-card");
    const countBadge = document.querySelector<HTMLSpanElement>(
      "#pending-count-badge",
    );
    if (countBadge) {
      countBadge.textContent = String(remainingCards.length);
    }

    // Nếu không còn card nào thì reload để hiện empty state
    if (remainingCards.length === 0) {
      await loadPTRequests();
    }
  } catch (error: unknown) {
    console.error("Lỗi khi từ chối lịch PT:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message || "Từ chối yêu cầu không thành công!";
    showToast(errorMessage, false);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Gắn các sự kiện trên trang
 */
function attachEvents(): void {
  // Nút reload
  const btnRefresh = document.querySelector<HTMLButtonElement>(
    "#btn-refresh-pt-requests",
  );
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => loadPTRequests());
  }

  // Event delegation cho container
  const container = document.querySelector<HTMLDivElement>(
    "#trainer-requests-container",
  );
  if (container) {
    container.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Nút Chấp nhận
      const confirmBtn = target.closest<HTMLButtonElement>(".btn-confirm-pt");
      if (confirmBtn && !confirmBtn.disabled) {
        event.preventDefault();
        handleConfirmPTRequest(confirmBtn);
        return;
      }

      // Nút Từ chối
      const rejectBtn = target.closest<HTMLButtonElement>(".btn-reject-pt");
      if (rejectBtn && !rejectBtn.disabled) {
        event.preventDefault();
        handleRejectPTRequest(rejectBtn);
        return;
      }
    });
  }
}

/**
 * Render view template
 */
export function render(): string {
  return template;
}

/**
 * Khởi tạo dữ liệu khi view mount vào DOM
 */
export async function init(): Promise<void> {
  attachEvents();
  await loadPTRequests();
}

// Re-export để thuận tiện
export { BookingService };
