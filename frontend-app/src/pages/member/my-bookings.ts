import template from "./my-bookings.html?raw";
import "./my-bookings.css";
import { bookingService } from "../../services/booking.service";
import interactionService from "../../services/interaction.service";
import { initNotification } from "../../components/notification-popover";
import type { ClassBooking, PTBooking } from "../../models/booking";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
  Modal: {
    new (el: Element, options?: unknown): { show(): void; hide(): void };
    getOrCreateInstance(
      el: Element,
      options?: unknown,
    ): { show(): void; hide(): void };
    getInstance(el: Element): { show(): void; hide(): void } | null;
  };
};

// State tạm lưu thông tin lượt đặt đang được đánh giá
let currentReviewBookingId: number | null = null;
let currentReviewBookingType: "class" | "pt" | null = null;
let currentReviewButton: HTMLButtonElement | null = null;

/**
 * Định dạng thời gian và ngày tháng
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
 * Trả về thông tin badge trạng thái
 */
function getStatusBadge(status: string): {
  label: string;
  badgeClass: string;
  cardClass: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Đã xác nhận",
        badgeClass: "status-badge-confirmed",
        cardClass: "status-confirmed",
      };
    case "PENDING":
      return {
        label: "Chờ xác nhận",
        badgeClass: "status-badge-pending",
        cardClass: "status-pending",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        badgeClass: "status-badge-cancelled",
        cardClass: "status-cancelled",
      };
    case "REJECTED":
      return {
        label: "Bị từ chối",
        badgeClass: "status-badge-rejected",
        cardClass: "status-rejected",
      };
    case "COMPLETED":
      return {
        label: "Đã hoàn tất",
        badgeClass: "status-badge-completed",
        cardClass: "status-completed",
      };
    default:
      return {
        label: status,
        badgeClass: "status-badge-cancelled",
        cardClass: "",
      };
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
  const toastEl = document.querySelector<HTMLElement>("#my-bookings-toast");
  const msgEl = document.querySelector<HTMLElement>("#bookings-toast-message");
  const iconEl = document.querySelector<HTMLElement>("#bookings-toast-icon");

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
 * Mở modal đánh giá cho một booking cụ thể
 */
function handleOpenReviewModal(btn: HTMLButtonElement): void {
  const bookingIdStr = btn.getAttribute("data-booking-id");
  const bookingType = btn.getAttribute("data-booking-type") as "class" | "pt";

  if (!bookingIdStr || !bookingType) return;

  currentReviewBookingId = Number(bookingIdStr);
  currentReviewBookingType = bookingType;
  currentReviewButton = btn;

  // Reset form đánh giá
  const commentInput =
    document.querySelector<HTMLTextAreaElement>("#reviewComment");
  if (commentInput) {
    commentInput.value = "";
  }
  const ratingSelect =
    document.querySelector<HTMLSelectElement>("#reviewRating");
  if (ratingSelect) {
    ratingSelect.value = "5";
  }

  // Mở Bootstrap Modal
  const modalEl = document.getElementById("reviewModal");
  if (modalEl) {
    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    } else {
      modalEl.classList.add("show");
      modalEl.style.display = "block";
    }
  }
}

/**
 * Xử lý submit form đánh giá và gọi API
 */
async function handleSubmitReview(): Promise<void> {
  if (!currentReviewBookingId || !currentReviewBookingType) {
    alert("Không tìm thấy thông tin lượt đặt cần đánh giá.");
    return;
  }

  const ratingSelect =
    document.querySelector<HTMLSelectElement>("#reviewRating");
  const commentInput =
    document.querySelector<HTMLTextAreaElement>("#reviewComment");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#submitReviewBtn");

  const rating = Number(ratingSelect?.value || 5);
  const comment = commentInput?.value.trim() || "";

  if (!comment) {
    alert("Vui lòng nhập nội dung nhận xét trước khi gửi đánh giá.");
    commentInput?.focus();
    return;
  }

  // Chuẩn bị payload dựa vào bookingType
  const payload =
    currentReviewBookingType === "class"
      ? { classBookingId: currentReviewBookingId, rating, comment }
      : { ptBookingId: currentReviewBookingId, rating, comment };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi...";
    }

    // TODO(mock-pending-api): chờ BE hoàn thiện ReviewController — xem api-contract.md mục 14
    await interactionService.createReview(payload);

    // Đóng Modal
    const modalEl = document.getElementById("reviewModal");
    if (modalEl) {
      if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
      } else {
        modalEl.classList.remove("show");
        modalEl.style.display = "none";
      }
    }

    // Hiển thị thông báo thành công
    alert("Đánh giá thành công!");
    showToast("Đánh giá thành công!", true);

    // Disable nút 'Đánh giá' của item vừa rồi
    if (currentReviewButton) {
      currentReviewButton.disabled = true;
      currentReviewButton.classList.remove("btn-warning");
      currentReviewButton.classList.add("btn-secondary");
      currentReviewButton.innerHTML = `
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Đã đánh giá</span>
      `;
    }

    // Reset state
    currentReviewBookingId = null;
    currentReviewBookingType = null;
    currentReviewButton = null;
  } catch (error: unknown) {
    console.error("Lỗi khi gửi đánh giá:", error);
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Không thể gửi đánh giá. Vui lòng thử lại sau!";
    alert(`Lỗi: ${msg}`);
    showToast(msg, false);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi đánh giá";
    }
  }
}

/**
 * TAB 1: Tải lịch đặt lớp học nhóm của hội viên
 * GET /class-bookings/me
 */
export async function loadMyClassBookings(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>(
    "#member-class-bookings-container",
  );
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="text-neutral mt-2 mb-0">Đang tải lịch đặt lớp nhóm...</p>
    </div>
  `;

  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện ClassBookingController — xem api-contract.md mục 9
    const response = await bookingService.getMyClassBookings();
    const bookings: ClassBooking[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <p class="text-neutral mb-0">Bạn chưa có lịch đặt lớp học nào.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings
      .map((b) => {
        const title = b.gymClass?.title || `Lớp học #${b.gymClassId || b.id}`;
        const classType = b.gymClass?.classTypeName || "Lớp nhóm";
        const trainer = b.gymClass?.trainerName || "Huấn luyện viên Gym";
        const room = b.gymClass?.roomName ? `· Phòng: ${b.gymClass.roomName}` : "";
        const timeData = formatDateTime(b.gymClass?.startTime, b.gymClass?.endTime);
        const statusInfo = getStatusBadge(b.status);

        // CHỈ hiển thị nút Hủy lịch nếu status là CONFIRMED hoặc PENDING.
        // TUYỆT ĐỐI KHÔNG làm nút Đổi lịch (Reschedule).
        const canCancel = b.status === "CONFIRMED" || b.status === "PENDING";
        const isCompleted = b.status === "COMPLETED";

        return `
          <div class="booking-card ${statusInfo.cardClass} shadow-theme-sm">
            <div class="row align-items-center g-3">
              <div class="col-12 col-md-8">
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="status-badge ${statusInfo.badgeClass}">● ${escapeHtml(statusInfo.label)}</span>
                  <span class="badge-theme badge-active px-2 py-1 fs-8">${escapeHtml(classType)}</span>
                  <span class="text-neutral fs-8 fw-semibold">MÃ: #CB-${String(b.id).padStart(4, "0")}</span>
                </div>

                <h3 class="fs-5 fw-bold text-secondary-theme mb-2">${escapeHtml(title)}</h3>

                <div class="d-flex flex-wrap align-items-center gap-2 gap-md-3">
                  <div class="booking-meta-pill">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Khung giờ: <strong class="text-primary-theme">${escapeHtml(timeData.time)}</strong> (${escapeHtml(timeData.date)})</span>
                  </div>

                  <div class="booking-meta-pill">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>HLV: <strong>${escapeHtml(trainer)}</strong> ${escapeHtml(room)}</span>
                  </div>
                </div>

                ${
                  b.cancellationReason || b.cancelReason
                    ? `<div class="note-box text-danger mt-2"><strong>Lý do hủy:</strong> ${escapeHtml(b.cancellationReason || b.cancelReason)}</div>`
                    : ""
                }
              </div>

              <div class="col-12 col-md-4 d-flex justify-content-md-end gap-2 flex-wrap">
                ${
                  canCancel
                    ? `
                  <button 
                    type="button" 
                    class="btn btn-danger btn-cancel-booking btn-cancel-class-booking" 
                    data-booking-id="${b.id}"
                    data-booking-title="${escapeHtml(title)}"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span class="ms-1">Hủy lịch</span>
                  </button>
                `
                    : ""
                }
                ${
                  isCompleted
                    ? `
                  <button 
                    type="button" 
                    class="btn btn-warning btn-review text-dark fw-semibold d-inline-flex align-items-center gap-1"
                    data-booking-id="${b.id}"
                    data-booking-type="class"
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span>Đánh giá</span>
                  </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải lịch đặt lớp nhóm:", error);
    container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Không thể tải danh sách lớp học đã đặt lúc này. Vui lòng thử lại sau!
      </div>
    `;
  }
}

/**
 * TAB 2: Tải lịch đặt PT 1-1 của hội viên
 * GET /pt-bookings/me
 */
export async function loadMyPTBookings(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>(
    "#member-pt-bookings-container",
  );
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
      <p class="text-neutral mt-2 mb-0">Đang tải lịch đặt PT 1-1...</p>
    </div>
  `;

  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện PTBookingController — xem api-contract.md mục 10
    const response = await bookingService.getMyPTBookings();
    const bookings: PTBooking[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <p class="text-neutral mb-0">Bạn chưa có lịch đặt PT nào.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings
      .map((b) => {
        const trainer = b.trainerName || `HLV #${b.trainerId}`;
        const timeData = formatDateTime(
          b.timeSlot?.startTime || b.trainerTimeSlot?.startTime,
          b.timeSlot?.endTime || b.trainerTimeSlot?.endTime,
        );
        const statusInfo = getStatusBadge(b.status);

        // CHỈ hiển thị nút Hủy lịch nếu status là CONFIRMED hoặc PENDING.
        // TUYỆT ĐỐI KHÔNG làm nút Đổi lịch (Reschedule).
        const canCancel = b.status === "CONFIRMED" || b.status === "PENDING";
        const isCompleted = b.status === "COMPLETED";

        return `
          <div class="booking-card ${statusInfo.cardClass} shadow-theme-sm">
            <div class="row align-items-center g-3">
              <div class="col-12 col-md-8">
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="status-badge ${statusInfo.badgeClass}">● ${escapeHtml(statusInfo.label)}</span>
                  <span class="badge-theme badge-active px-2 py-1 fs-8">1-1 PT</span>
                  <span class="text-neutral fs-8 fw-semibold">MÃ: #PT-${String(b.id).padStart(4, "0")}</span>
                </div>

                <h3 class="fs-5 fw-bold text-secondary-theme mb-2">Huấn luyện cá nhân cùng HLV ${escapeHtml(trainer)}</h3>

                <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <div class="booking-meta-pill">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Khung giờ: <strong class="text-primary-theme">${escapeHtml(timeData.time)}</strong> (${escapeHtml(timeData.date)})</span>
                  </div>
                </div>

                <!-- Mục tiêu & ghi chú sức khỏe -->
                ${
                  b.sessionNote
                    ? `<div class="note-box text-secondary-theme mb-1"><strong>Mục tiêu:</strong> ${escapeHtml(b.sessionNote)}</div>`
                    : ""
                }
                ${
                  b.healthNote
                    ? `<div class="note-box text-neutral mb-1"><strong>Sức khỏe/Lưu ý:</strong> ${escapeHtml(b.healthNote)}</div>`
                    : ""
                }
                ${
                  b.rejectReason
                    ? `<div class="note-box text-danger mt-2"><strong>Lý do từ chối từ HLV:</strong> ${escapeHtml(b.rejectReason)}</div>`
                    : ""
                }
              </div>

              <div class="col-12 col-md-4 d-flex justify-content-md-end gap-2 flex-wrap">
                ${
                  canCancel
                    ? `
                  <button 
                    type="button" 
                    class="btn btn-danger btn-cancel-booking btn-cancel-pt-booking" 
                    data-booking-id="${b.id}"
                    data-booking-trainer="${escapeHtml(trainer)}"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span class="ms-1">Hủy lịch</span>
                  </button>
                `
                    : ""
                }
                ${
                  isCompleted
                    ? `
                  <button 
                    type="button" 
                    class="btn btn-warning btn-review text-dark fw-semibold d-inline-flex align-items-center gap-1"
                    data-booking-id="${b.id}"
                    data-booking-type="pt"
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span>Đánh giá</span>
                  </button>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải lịch đặt PT:", error);
    container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Không thể tải danh sách lịch PT đã đặt lúc này. Vui lòng thử lại sau!
      </div>
    `;
  }
}

/**
 * Xử lý hủy lịch lớp nhóm
 */
async function handleCancelClassBooking(btn: HTMLButtonElement): Promise<void> {
  const bookingIdRaw = btn.getAttribute("data-booking-id");
  if (!bookingIdRaw) return;

  const bookingId = parseInt(bookingIdRaw, 10);
  if (isNaN(bookingId)) return;

  // Dùng window.prompt yêu cầu nhập lý do hủy theo yêu cầu đề bài
  const cancelReason = window.prompt(
    "Vui lòng nhập lý do bạn muốn hủy lịch lớp học này (lưu ý hủy trước ít nhất 24 tiếng):",
    "Bận việc đột xuất",
  );

  // Nếu user nhấn Cancel trên prompt
  if (cancelReason === null) return;

  const reasonTrimmed = cancelReason.trim();
  if (!reasonTrimmed) {
    alert("Vui lòng nhập lý do hủy lịch!");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    <span class="ms-1">Đang hủy...</span>
  `;

  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện ClassBookingController — xem api-contract.md mục 9
    await bookingService.cancelClassBooking(bookingId, {
      cancelReason: reasonTrimmed,
    });
    showToast("Hủy lịch lớp học thành công! Số lượt tập đã được hoàn trả.");
    await loadMyClassBookings();
  } catch (error: unknown) {
    console.error("Lỗi khi hủy lịch lớp học:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message ||
      "Không thể hủy lịch! Lưu ý quy định: chỉ được phép hủy trước giờ bắt đầu ít nhất 24 tiếng.";
    showToast(errorMessage, false);
    btn.disabled = false;
    btn.innerHTML = `<span class="ms-1">Hủy lịch</span>`;
  }
}

/**
 * Xử lý hủy lịch PT 1-1
 */
async function handleCancelPTBooking(btn: HTMLButtonElement): Promise<void> {
  const bookingIdRaw = btn.getAttribute("data-booking-id");
  if (!bookingIdRaw) return;

  const bookingId = parseInt(bookingIdRaw, 10);
  if (isNaN(bookingId)) return;

  // Dùng window.prompt yêu cầu nhập lý do hủy theo yêu cầu đề bài
  const cancelReason = window.prompt(
    "Vui lòng nhập lý do bạn muốn hủy lịch hẹn PT 1-1 này (lưu ý hủy trước ít nhất 24 tiếng):",
    "Bận việc đột xuất",
  );

  // Nếu user nhấn Cancel trên prompt
  if (cancelReason === null) return;

  const reasonTrimmed = cancelReason.trim();
  if (!reasonTrimmed) {
    alert("Vui lòng nhập lý do hủy lịch!");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status"></span>
    <span class="ms-1">Đang hủy...</span>
  `;

  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện PTBookingController — xem api-contract.md mục 10
    await bookingService.cancelPTBooking(bookingId, {
      cancelReason: reasonTrimmed,
    });
    showToast("Hủy lịch hẹn PT thành công! Khung giờ và lượt tập đã được hoàn lại.");
    await loadMyPTBookings();
  } catch (error: unknown) {
    console.error("Lỗi khi hủy lịch PT:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message ||
      "Không thể hủy lịch! Lưu ý quy định: chỉ được phép hủy trước giờ tập ít nhất 24 tiếng.";
    showToast(errorMessage, false);
    btn.disabled = false;
    btn.innerHTML = `<span class="ms-1">Hủy lịch</span>`;
  }
}

/**
 * Gắn sự kiện trên trang
 */
function attachEvents(): void {
  // Nút reload Tab 1
  const btnRefreshClass = document.querySelector<HTMLButtonElement>(
    "#btn-refresh-class-bookings",
  );
  if (btnRefreshClass) {
    btnRefreshClass.addEventListener("click", () => loadMyClassBookings());
  }

  // Nút reload Tab 2
  const btnRefreshPT = document.querySelector<HTMLButtonElement>(
    "#btn-refresh-pt-bookings",
  );
  if (btnRefreshPT) {
    btnRefreshPT.addEventListener("click", () => loadMyPTBookings());
  }

  // Bắt sự kiện click Hủy lịch / Đánh giá lớp học (Event delegation)
  const classContainer = document.querySelector<HTMLDivElement>(
    "#member-class-bookings-container",
  );
  if (classContainer) {
    classContainer.addEventListener("click", (event: MouseEvent) => {
      const cancelTarget = (
        event.target as HTMLElement
      ).closest<HTMLButtonElement>(".btn-cancel-class-booking");
      if (cancelTarget && !cancelTarget.disabled) {
        event.preventDefault();
        handleCancelClassBooking(cancelTarget);
        return;
      }

      const reviewTarget = (
        event.target as HTMLElement
      ).closest<HTMLButtonElement>(".btn-review");
      if (reviewTarget && !reviewTarget.disabled) {
        event.preventDefault();
        handleOpenReviewModal(reviewTarget);
      }
    });
  }

  // Bắt sự kiện click Hủy lịch / Đánh giá PT (Event delegation)
  const ptContainer = document.querySelector<HTMLDivElement>(
    "#member-pt-bookings-container",
  );
  if (ptContainer) {
    ptContainer.addEventListener("click", (event: MouseEvent) => {
      const cancelTarget = (
        event.target as HTMLElement
      ).closest<HTMLButtonElement>(".btn-cancel-pt-booking");
      if (cancelTarget && !cancelTarget.disabled) {
        event.preventDefault();
        handleCancelPTBooking(cancelTarget);
        return;
      }

      const reviewTarget = (
        event.target as HTMLElement
      ).closest<HTMLButtonElement>(".btn-review");
      if (reviewTarget && !reviewTarget.disabled) {
        event.preventDefault();
        handleOpenReviewModal(reviewTarget);
      }
    });
  }

  // Bắt sự kiện click nút Gửi đánh giá trên Modal
  const submitReviewBtn = document.querySelector<HTMLButtonElement>(
    "#submitReviewBtn",
  );
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      handleSubmitReview();
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
  initNotification();
  attachEvents();
  await Promise.all([loadMyClassBookings(), loadMyPTBookings()]);
}

// Re-export để thuận tiện
export { bookingService };
