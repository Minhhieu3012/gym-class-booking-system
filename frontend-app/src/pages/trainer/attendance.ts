import template from "./attendance.html?raw";
import "./attendance.css";
import { bookingService } from "../../services/booking.service";
import interactionService from "../../services/interaction.service";
import { initNotification } from "../../components/notification-popover";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

export interface AttendanceBookingItem {
  id: number;
  type: "class" | "pt";
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  sessionTitle: string;
  time: string;
  roomOrLocation?: string;
  attendanceStatus?: "PRESENT" | "ABSENT" | "NOT_MARKED" | string;
  isMarked?: boolean;
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
  const toastEl = document.querySelector<HTMLElement>("#attendance-toast");
  const msgEl = document.querySelector<HTMLElement>("#attendance-toast-message");
  const iconEl = document.querySelector<HTMLElement>("#attendance-toast-icon");

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
      const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
      toast.show();
      return;
    }
  }

  alert(message);
}

/**
 * Cập nhật số lượng trên badge tóm tắt
 */
function updateSummaryBadge(): void {
  const badge = document.querySelector<HTMLElement>("#attendance-summary-badge");
  if (!badge) return;

  const rows = document.querySelectorAll<HTMLTableRowElement>("#attendance-table-body tr.attendance-row");
  const completedRows = document.querySelectorAll<HTMLTableRowElement>(
    "#attendance-table-body tr.attendance-row-completed",
  );
  badge.textContent = `Đã điểm danh: ${completedRows.length}/${rows.length}`;
}

/**
 * Render bảng danh sách điểm danh
 */
function renderAttendanceTable(bookings: AttendanceBookingItem[]): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#attendance-table-body");
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5 text-muted">
          <p class="mb-0">Không có hội viên nào cần điểm danh trong buổi học hôm nay.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings
    .map((item) => {
      const isMarked = item.isMarked || false;
      const typeLabel = item.type === "class" ? "Lớp nhóm" : "1-1 PT";
      const typeBadgeClass = item.type === "class" ? "bg-info text-dark" : "bg-primary";
      const code = `#${item.type.toUpperCase()}-${String(item.id).padStart(4, "0")}`;

      return `
        <tr 
          class="attendance-row ${isMarked ? "attendance-row-completed" : ""}" 
          data-booking-id="${item.id}" 
          data-booking-type="${item.type}"
          id="attendance-row-${item.type}-${item.id}"
        >
          <td class="ps-4 fw-bold text-secondary-theme">
            ${escapeHtml(code)}
          </td>
          <td>
            <span class="badge ${typeBadgeClass} rounded-pill px-2 py-1 fs-8">
              ${escapeHtml(typeLabel)}
            </span>
          </td>
          <td>
            <div class="fw-bold text-secondary-theme">${escapeHtml(item.memberName)}</div>
            <small class="text-neutral">${escapeHtml(item.memberPhone || item.memberEmail || "")}</small>
          </td>
          <td>
            <div class="fw-semibold text-secondary-theme">${escapeHtml(item.sessionTitle)}</div>
            <small class="text-primary-theme">${escapeHtml(item.time)}${
              item.roomOrLocation ? ` · ${escapeHtml(item.roomOrLocation)}` : ""
            }</small>
          </td>
          <td class="text-center">
            <div class="btn-group btn-group-sm radio-attendance-group" role="group" aria-label="Attendance status">
              <input 
                type="radio" 
                class="btn-check" 
                name="attendance-${item.type}-${item.id}" 
                id="status-present-${item.type}-${item.id}" 
                value="PRESENT" 
                autocomplete="off"
                ${item.attendanceStatus === "PRESENT" || (!isMarked && item.attendanceStatus !== "ABSENT") ? "checked" : ""}
                ${isMarked ? "disabled" : ""}
              >
              <label class="btn btn-outline-success d-flex align-items-center gap-1" for="status-present-${item.type}-${item.id}">
                <span>✔ Có mặt</span>
              </label>

              <input 
                type="radio" 
                class="btn-check" 
                name="attendance-${item.type}-${item.id}" 
                id="status-absent-${item.type}-${item.id}" 
                value="ABSENT" 
                autocomplete="off"
                ${item.attendanceStatus === "ABSENT" ? "checked" : ""}
                ${isMarked ? "disabled" : ""}
              >
              <label class="btn btn-outline-danger d-flex align-items-center gap-1" for="status-absent-${item.type}-${item.id}">
                <span>✖ Vắng mặt</span>
              </label>
            </div>
          </td>
          <td class="text-end pe-4">
            <button 
              type="button" 
              class="btn btn-sm ${isMarked ? "btn-secondary" : "btn-primary"} btn-save-attendance fw-semibold px-3"
              ${isMarked ? "disabled" : ""}
            >
              ${isMarked ? "Đã điểm danh" : "Lưu điểm danh"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  updateSummaryBadge();
}

/**
 * Vô hiệu hóa hàng sau khi đã điểm danh thành công
 */
function disableRow(row: HTMLElement, status: string): void {
  row.classList.add("attendance-row-completed", "opacity-50");

  // Vô hiệu hóa tất cả input radio trong hàng
  const radios = row.querySelectorAll<HTMLInputElement>("input[type='radio']");
  radios.forEach((r) => {
    r.disabled = true;
  });

  // Cập nhật nút bấm
  const saveBtn = row.querySelector<HTMLButtonElement>(".btn-save-attendance");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.remove("btn-primary");
    saveBtn.classList.add("btn-secondary");
    saveBtn.textContent = status === "PRESENT" ? "Đã có mặt" : "Đã vắng mặt";
  }

  updateSummaryBadge();
}

/**
 * Xử lý lưu điểm danh cho 1 hàng
 */
async function handleSaveAttendance(row: HTMLElement, saveBtn: HTMLButtonElement): Promise<void> {
  const bookingIdStr = row.getAttribute("data-booking-id");
  const bookingType = row.getAttribute("data-booking-type") as "class" | "pt" | null;

  if (!bookingIdStr || !bookingType) {
    alert("Không tìm thấy thông tin lượt đặt.");
    return;
  }

  const bookingId = Number(bookingIdStr);

  // Lấy giá trị trạng thái (PRESENT/ABSENT) mà Trainer đã chọn
  const selectedRadio = row.querySelector<HTMLInputElement>(
    `input[name="attendance-${bookingType}-${bookingId}"]:checked`,
  );

  if (!selectedRadio || !selectedRadio.value) {
    alert("Vui lòng chọn trạng thái điểm danh (Có mặt hoặc Vắng mặt).");
    return;
  }

  const attendanceStatus = selectedRadio.value; // "PRESENT" hoặc "ABSENT"

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";

    // Gọi API tương ứng theo bookingType
    if (bookingType === "class") {
      await interactionService.markClassAttendance(bookingId, attendanceStatus);
    } else {
      await interactionService.markPTAttendance(bookingId, attendanceStatus);
    }

    // Hiển thị thông báo thành công (alert/toast) theo đúng kỳ vọng kịch bản
    alert("Điểm danh thành công");
    showToast("Điểm danh thành công", true);

    // Vô hiệu hóa hàng đó và làm mờ để ngăn điểm danh lại
    disableRow(row, attendanceStatus);
  } catch (error: unknown) {
    console.error("Lỗi khi lưu điểm danh:", error);
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Điểm danh thất bại. Vui lòng thử lại sau!";
    alert(`Lỗi: ${msg}`);
    showToast(msg, false);
    saveBtn.disabled = false;
    saveBtn.textContent = "Lưu điểm danh";
  }
}

/**
 * Gắn các sự kiện tương tác
 */
function attachEvents(): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#attendance-table-body");
  if (!tbody) return;

  // Event delegation cho nút 'Lưu điểm danh' của từng dòng
  tbody.addEventListener("click", (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      ".btn-save-attendance",
    );
    if (!target || target.disabled) return;

    const row = target.closest<HTMLTableRowElement>("tr.attendance-row");
    if (row) {
      event.preventDefault();
      handleSaveAttendance(row, target);
    }
  });
}

/**
 * Render template view
 */
export function render(): string {
  return template;
}

/**
 * Khởi tạo dữ liệu và sự kiện khi mount view
 */
export async function init(): Promise<void> {
  initNotification();
  attachEvents();

  try {
    const ptResponse = await bookingService.getPTRequestsForTrainer();
    const ptList = Array.isArray(ptResponse) ? ptResponse : (ptResponse?.content ?? []);

    const bookings: AttendanceBookingItem[] = ptList.map((pt) => {
      const startTime = pt.timeSlot?.startTime || pt.trainerTimeSlot?.startTime;
      const endTime = pt.timeSlot?.endTime || pt.trainerTimeSlot?.endTime;
      let timeFormatted = "Theo thỏa thuận";
      if (startTime) {
        const start = new Date(startTime);
        const sH = String(start.getHours()).padStart(2, "0");
        const sM = String(start.getMinutes()).padStart(2, "0");
        let ePart = "";
        if (endTime) {
          const end = new Date(endTime);
          ePart = ` - ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        }
        timeFormatted = `${sH}:${sM}${ePart}`;
      }

      return {
        id: pt.id,
        type: "pt" as const,
        memberName: pt.memberName || `Hội viên #${pt.memberId}`,
        memberEmail: pt.memberEmail,
        memberPhone: pt.memberPhone,
        sessionTitle: pt.sessionNote || "Buổi tập cá nhân 1-1",
        time: timeFormatted,
        roomOrLocation: pt.location || "Khu vực tập luyện PT",
        attendanceStatus: pt.attendanceStatus || "NOT_MARKED",
        isMarked: pt.attendanceStatus === "PRESENT" || pt.attendanceStatus === "ABSENT",
      };
    });

    renderAttendanceTable(bookings);
  } catch (error) {
    console.error("Lỗi khi tải danh sách điểm danh:", error);
    showToast("Không thể tải danh sách điểm danh từ hệ thống.", false);
    renderAttendanceTable([]);
  }
}
