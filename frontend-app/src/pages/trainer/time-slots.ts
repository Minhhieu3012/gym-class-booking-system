import template from "./time-slots.html?raw";
import "./time-slots.css";
import { bookingService, BookingService } from "../../services/booking.service";
import { getStoredUser } from "../../core/api";
import type { TrainerTimeSlot } from "../../models/booking";

// Khai báo kiểu Bootstrap Toast
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

let cachedSlots: TrainerTimeSlot[] = [];

/**
 * Định dạng ngày giờ và tính thời lượng phút
 */
function formatSlotDisplay(
  startStr: string,
  endStr: string,
): { date: string; time: string; duration: number } {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);

    const startH = String(start.getHours()).padStart(2, "0");
    const startM = String(start.getMinutes()).padStart(2, "0");
    const endH = String(end.getHours()).padStart(2, "0");
    const endM = String(end.getMinutes()).padStart(2, "0");

    const d = String(start.getDate()).padStart(2, "0");
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const y = start.getFullYear();

    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

    return {
      date: `${d}/${m}/${y}`,
      time: `${startH}:${startM} - ${endH}:${endM}`,
      duration: durationMinutes,
    };
  } catch {
    return { date: startStr, time: `${startStr} - ${endStr}`, duration: 60 };
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
 * Hiển thị Toast thông báo
 */
function showToast(message: string, isSuccess = true): void {
  const toastEl = document.querySelector<HTMLElement>("#timeslot-toast");
  const msgEl = document.querySelector<HTMLElement>("#timeslot-toast-message");
  const iconEl = document.querySelector<HTMLElement>("#timeslot-toast-icon");

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
      const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
      toast.show();
      return;
    }
  }

  alert(message);
}

/**
 * Render danh sách khung giờ ra DOM
 */
function renderSlotsList(slots: TrainerTimeSlot[]): void {
  const container = document.querySelector<HTMLDivElement>("#time-slots-container");
  const badgeCount = document.querySelector<HTMLSpanElement>("#slot-count-badge");
  if (!container) return;

  if (badgeCount) {
    badgeCount.textContent = String(slots.length);
  }

  if (slots.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-slots-card shadow-theme-sm">
          <div class="empty-icon-box">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 class="fs-5 fw-bold text-secondary-theme mb-1">Chưa có khung giờ nào</h3>
          <p class="text-neutral fs-7 mb-0">
            Bạn chưa đăng ký khung giờ làm việc nào hoặc không khớp với bộ lọc. Hãy dùng form phía trên để mở khung giờ mới!
          </p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = slots
    .map((slot) => {
      const { date, time, duration } = formatSlotDisplay(slot.startTime, slot.endTime);
      const isAvailable = slot.status === "AVAILABLE";
      const isBooked = slot.status === "BOOKED";

      let cardClass = "card-inactive";
      let badgeHtml = `<span class="slot-badge slot-badge-inactive">● ĐÃ HỦY / TẮT</span>`;

      if (isAvailable) {
        cardClass = "card-available";
        badgeHtml = `<span class="slot-badge slot-badge-available">● SẴN SÀNG NHẬN LỊCH</span>`;
      } else if (isBooked) {
        cardClass = "card-booked";
        badgeHtml = `<span class="slot-badge slot-badge-booked">● ĐÃ CÓ HỌC VIÊN ĐẶT</span>`;
      }

      return `
        <div class="col-12 col-md-6 col-lg-4" id="slot-card-${slot.id}">
          <div class="timeslot-card ${cardClass} p-3 shadow-theme-sm">
            <div class="timeslot-card-header">
              <div class="timeslot-date-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>${escapeHtml(date)}</span>
              </div>
              <div>${badgeHtml}</div>
            </div>

            <h3 class="timeslot-time-title">${escapeHtml(time)}</h3>

            <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top border-theme">
              <div class="timeslot-duration">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Thời lượng: <strong>${duration} phút</strong></span>
              </div>

              <div>
                ${
                  isAvailable
                    ? `
                  <button 
                    type="button" 
                    class="btn btn-outline-danger btn-sm btn-deactivate-slot d-inline-flex align-items-center gap-1"
                    data-slot-id="${slot.id}"
                    data-slot-time="${escapeHtml(time)}"
                    data-slot-date="${escapeHtml(date)}"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hủy slot</span>
                  </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Tải danh sách time slots từ Backend / Mock API
 * GET /trainers/{trainerId}/time-slots
 */
export async function loadTimeSlots(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#time-slots-container");
  if (!container) return;

  const currentUser = getStoredUser();
  const trainerId = currentUser?.id ?? 5;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="text-neutral mt-2 mb-0 fs-7">Đang tải danh sách khung giờ...</p>
    </div>
  `;

  try {
    const slots = await bookingService.getTrainerTimeSlots(trainerId);
    cachedSlots = Array.isArray(slots) ? slots : [];

    // Sắp xếp slot theo thời gian bắt đầu
    cachedSlots.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    // Áp dụng bộ lọc trạng thái hiện tại (nếu có)
    const filterSelect = document.querySelector<HTMLSelectElement>("#filter-slot-status");
    const currentStatus = filterSelect?.value || "";

    if (currentStatus) {
      renderSlotsList(cachedSlots.filter((s) => s.status === currentStatus));
    } else {
      renderSlotsList(cachedSlots);
    }
  } catch (error) {
    console.error("Lỗi khi tải khung giờ:", error);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger text-center">
          Không thể tải danh sách khung giờ lúc này. Vui lòng thử lại sau!
        </div>
      </div>
    `;
  }
}

/**
 * Xử lý sự kiện tạo khung giờ mới
 */
async function handleCreateTimeSlot(e: Event): Promise<void> {
  e.preventDefault();

  const startInput = document.querySelector<HTMLInputElement>("#slot-start-time");
  const endInput = document.querySelector<HTMLInputElement>("#slot-end-time");
  const errorEl = document.querySelector<HTMLDivElement>("#create-slot-error");
  const submitBtn = document.querySelector<HTMLButtonElement>("#btn-create-slot");

  if (!startInput || !endInput || !errorEl || !submitBtn) return;
  errorEl.textContent = "";

  const startVal = startInput.value.trim();
  const endVal = endInput.value.trim();

  if (!startVal || !endVal) {
    errorEl.textContent = "Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.";
    return;
  }

  const startDate = new Date(startVal);
  const endDate = new Date(endVal);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    errorEl.textContent = "Định dạng thời gian không hợp lệ.";
    return;
  }

  if (startDate.getTime() >= endDate.getTime()) {
    errorEl.textContent = "Thời gian bắt đầu phải trước thời gian kết thúc.";
    return;
  }

  if (startDate.getTime() <= Date.now()) {
    errorEl.textContent = "Không thể tạo khung giờ rảnh trong quá khứ.";
    return;
  }

  // Format sang ISO string hoặc YYYY-MM-DDTHH:mm:ss
  const formatToISO = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const originalHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    <span class="ms-1">Đang thêm...</span>
  `;

  try {
    await bookingService.createTimeSlot({
      startTime: formatToISO(startDate),
      endTime: formatToISO(endDate),
    });

    showToast("Thêm khung giờ làm việc thành công!", true);

    // Reset form inputs
    startInput.value = "";
    endInput.value = "";

    await loadTimeSlots();
  } catch (error: unknown) {
    console.error("Lỗi khi tạo khung giờ:", error);
    const err = error as { response?: { data?: { message?: string } } };
    errorEl.textContent =
      err.response?.data?.message || "Không thể tạo khung giờ lúc này. Vui lòng kiểm tra lại!";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

/**
 * Xử lý hủy khung giờ (Deactivate)
 */
async function handleDeactivateSlot(btn: HTMLButtonElement): Promise<void> {
  const slotIdRaw = btn.getAttribute("data-slot-id");
  const slotTime = btn.getAttribute("data-slot-time") || "";
  const slotDate = btn.getAttribute("data-slot-date") || "";

  if (!slotIdRaw) return;
  const slotId = parseInt(slotIdRaw, 10);
  if (isNaN(slotId)) return;

  const confirmed = window.confirm(
    `Bạn có chắc chắn muốn hủy khung giờ [${slotTime} ngày ${slotDate}] này không?`,
  );
  if (!confirmed) return;

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span>`;

  try {
    await bookingService.deactivateTimeSlot(slotId);
    showToast("Đã hủy khung giờ thành công!", true);
    await loadTimeSlots();
  } catch (error: unknown) {
    console.error("Lỗi khi hủy khung giờ:", error);
    const err = error as { response?: { data?: { message?: string } } };
    showToast(err.response?.data?.message || "Không thể hủy khung giờ!", false);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Gắn các bộ lắng nghe sự kiện
 */
function attachEvents(): void {
  // 1. Form submit thêm slot
  const form = document.querySelector<HTMLFormElement>("#create-timeslot-form");
  if (form) {
    form.addEventListener("submit", handleCreateTimeSlot);
  }

  // 2. Click nút Deactivate trên danh sách (Event Delegation)
  const container = document.querySelector<HTMLDivElement>("#time-slots-container");
  if (container) {
    container.addEventListener("click", (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
        ".btn-deactivate-slot",
      );
      if (target && !target.disabled) {
        event.preventDefault();
        handleDeactivateSlot(target);
      }
    });
  }

  // 3. Filter theo trạng thái
  const filterSelect = document.querySelector<HTMLSelectElement>("#filter-slot-status");
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      const val = filterSelect.value;
      if (val) {
        renderSlotsList(cachedSlots.filter((s) => s.status === val));
      } else {
        renderSlotsList(cachedSlots);
      }
    });
  }

  // 4. Nút Refresh
  const btnRefresh = document.querySelector<HTMLButtonElement>("#btn-refresh-slots");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      loadTimeSlots();
    });
  }
}

/**
 * Khởi tạo giá trị mặc định cho ô datetime-local (gợi ý ngày mai 09:00 - 10:00)
 */
function setDefaultDateTimeInputs(): void {
  const startInput = document.querySelector<HTMLInputElement>("#slot-start-time");
  const endInput = document.querySelector<HTMLInputElement>("#slot-end-time");

  if (!startInput || !endInput) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(10, 0, 0, 0);

  const formatInputVal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  startInput.value = formatInputVal(tomorrow);
  endInput.value = formatInputVal(tomorrowEnd);
}

/**
 * Render template HTML
 */
export function render(): string {
  return template;
}

/**
 * Khởi tạo view khi mount vào DOM
 */
export async function init(): Promise<void> {
  setDefaultDateTimeInputs();
  attachEvents();
  await loadTimeSlots();
}

export { BookingService };
