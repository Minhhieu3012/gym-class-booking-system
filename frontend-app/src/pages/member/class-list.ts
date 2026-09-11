import template from "./class-list.html?raw";
import "./class-list.css";
import { bookingService, BookingService } from "../../services/booking.service";
import { classTypeService } from "../../services/admin-core.service";
import type { GymClass, ClassQueryParams } from "../../models/booking";
import type { ClassTypeResponse } from "../../models/admin";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

/**
 * Lấy ngày hôm nay dưới dạng YYYY-MM-DD theo giờ địa phương
 */
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Định dạng khoảng thời gian (VD: 08:00 - 09:00) và ngày (DD/MM/YYYY)
 */
function formatTimeRange(
  startStr?: string,
  endStr?: string,
): { time: string; date: string } {
  if (!startStr) return { time: "—", date: "—" };
  try {
    const start = new Date(startStr);
    const startH = String(start.getHours()).padStart(2, "0");
    const startM = String(start.getMinutes()).padStart(2, "0");
    const day = String(start.getDate()).padStart(2, "0");
    const month = String(start.getMonth() + 1).padStart(2, "0");
    const year = start.getFullYear();

    let endPart = "";
    if (endStr) {
      const end = new Date(endStr);
      const endH = String(end.getHours()).padStart(2, "0");
      const endM = String(end.getMinutes()).padStart(2, "0");
      endPart = ` - ${endH}:${endM}`;
    }

    return {
      time: `${startH}:${startM}${endPart}`,
      date: `${day}/${month}/${year}`,
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
 * Hiển thị Toast thông báo thành công hoặc lỗi
 */
function showToastMessage(message: string, isSuccess = true): void {
  const toastEl = document.querySelector<HTMLElement>("#booking-toast");
  const msgEl = document.querySelector<HTMLElement>("#toast-message");
  const iconEl = document.querySelector<HTMLElement>("#toast-icon");

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
 * Tải danh mục loại lớp (ClassType) từ Phase 1 đổ vào dropdown filter
 */
export async function loadClassTypes(): Promise<void> {
  const selectEl = document.querySelector<HTMLSelectElement>("#filter-class-type");
  if (!selectEl) return;

  try {
    const page = await classTypeService.getAll({ size: 100 });
    const classTypes: ClassTypeResponse[] = Array.isArray(page)
      ? page
      : (page?.content ?? []);

    // Giữ lại option đầu tiên "Tất cả môn học / loại lớp"
    selectEl.innerHTML = `<option value="">Tất cả môn học / loại lớp</option>`;

    classTypes.forEach((ct) => {
      const option = document.createElement("option");
      option.value = String(ct.id);
      option.textContent = ct.name;
      selectEl.appendChild(option);
    });
  } catch (error) {
    console.warn("Không thể tải danh sách loại lớp:", error);
  }
}

/**
 * Tải danh sách lớp học theo bộ lọc ngày và loại lớp
 * GET /classes
 */
export async function loadClasses(
  date?: string,
  classTypeId?: number,
): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#class-list-container");
  const countBadge = document.querySelector<HTMLSpanElement>("#class-count-badge");
  const dateDisplay = document.querySelector<HTMLSpanElement>("#selected-date-display");
  if (!container) return;

  // Hiển thị loading spinner
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="text-neutral mt-2 mb-0">Đang tìm kiếm các lớp học phù hợp...</p>
    </div>
  `;

  try {
    const params: ClassQueryParams = {
      page: 0,
      size: 50,
    };

    if (classTypeId && !isNaN(classTypeId)) {
      params.classTypeId = classTypeId;
    }

    if (date) {
      params.from = `${date}T00:00:00`;
      params.to = `${date}T23:59:59`;
      if (dateDisplay) {
        const [y, m, d] = date.split("-");
        dateDisplay.textContent = `Ngày: ${d}/${m}/${y}`;
      }
    } else if (dateDisplay) {
      dateDisplay.textContent = "Tất cả ngày";
    }

    const response = await bookingService.getClasses(params);
    const classes: GymClass[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (countBadge) {
      countBadge.textContent = String(classes.length);
    }

    // Nếu không có lớp học nào
    if (classes.length === 0) {
      container.innerHTML = `
        <div class="empty-classes-card shadow-theme-sm">
          <div class="empty-icon-wrap">
            <svg width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 class="fw-bold text-secondary-theme fs-5 mb-1">Không tìm thấy lớp học nào</h3>
          <p class="text-neutral mb-3" style="max-width: 440px; margin: 0 auto;">
            Không có lịch lớp học phù hợp với bộ lọc ngày hoặc môn học bạn đã chọn. Vui lòng chọn ngày khác hoặc đổi loại môn học!
          </p>
        </div>
      `;
      return;
    }

    const now = new Date();

    // Render danh sách cuộn dọc (Vertical List) bằng Bootstrap Card (TUYỆT ĐỐI KHÔNG dùng table hay Calendar)
    container.innerHTML = classes
      .map((cls) => {
        const startTime = new Date(cls.startTime);
        const isPast = startTime.getTime() <= now.getTime();
        const isFull = cls.currentCount >= cls.maxCapacity;

        // Xác định card modifier
        let cardModifier = "class-available";
        if (isPast) {
          cardModifier = "class-past";
        } else if (isFull) {
          cardModifier = "class-full";
        }

        // Logic render nút Đặt lớp theo yêu cầu khắt khe:
        // - Nếu startTime đã qua: Disable nút và đổi text thành "Đã diễn ra"
        // - Nếu currentCount >= maxCapacity: Disable nút và đổi text thành "Đã đầy"
        // - Còn lại: Nút "Đặt ngay" (class: btn-book-class)
        let actionBtnHtml = "";
        if (isPast) {
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-book-class" disabled>
              Đã diễn ra
            </button>
          `;
        } else if (isFull) {
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-book-class" disabled>
              Đã đầy
            </button>
          `;
        } else {
          actionBtnHtml = `
            <button 
              type="button" 
              class="btn-brand btn-book-class" 
              data-class-id="${cls.id}"
              data-class-title="${escapeHtml(cls.title)}"
            >
              <span>Đặt ngay</span>
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          `;
        }

        // Tính tỷ lệ sĩ số & thanh tiến trình
        const capacityPercent = cls.maxCapacity > 0
          ? Math.min(100, Math.round((cls.currentCount / cls.maxCapacity) * 100))
          : 0;

        let progressClass = "progress-available";
        if (isFull) {
          progressClass = "progress-full";
        } else if (capacityPercent >= 80) {
          progressClass = "progress-warning";
        }

        const timeData = formatTimeRange(cls.startTime, cls.endTime);
        const classTypePrefix = cls.classTypeName || "LỚP GROUP";
        const trainerName = cls.trainerName || "Huấn luyện viên Gym";
        const roomName = cls.roomName ? `· Phòng: ${cls.roomName}` : "";

        return `
          <div class="gym-class-card ${cardModifier} p-3 p-md-4 shadow-theme-sm">
            <div class="row align-items-center g-3">
              <!-- Cột 1: Thông tin lớp học, môn học, thời gian, HLV -->
              <div class="col-12 col-md-7 col-lg-8">
                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span class="class-type-badge">
                    ⚡ ${escapeHtml(classTypePrefix)}
                  </span>
                  <span class="text-neutral fs-7 fw-semibold">
                    ${escapeHtml(timeData.date)} ${escapeHtml(roomName)}
                  </span>
                </div>

                <h3 class="class-title mb-2">${escapeHtml(cls.title)}</h3>

                <div class="d-flex flex-wrap align-items-center gap-2 gap-md-3 mt-2">
                  <!-- Giờ bắt đầu - Giờ kết thúc -->
                  <div class="class-meta-pill">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Khung giờ: <strong class="class-time-highlight">${escapeHtml(timeData.time)}</strong></span>
                  </div>

                  <!-- Tên Trainer phụ trách -->
                  <div class="trainer-info">
                    <span class="trainer-icon-wrap">${trainerName.charAt(0).toUpperCase()}</span>
                    <span>HLV: <strong>${escapeHtml(trainerName)}</strong></span>
                  </div>
                </div>
              </div>

              <!-- Cột 2: Sĩ số & Nút Action -->
              <div class="col-12 col-md-5 col-lg-4 d-flex flex-column flex-sm-row flex-md-column align-items-sm-center align-items-md-end justify-content-between gap-3">
                <!-- Sĩ số: currentCount / maxCapacity -->
                <div class="capacity-box w-100 text-sm-start text-md-end">
                  <div class="d-flex justify-content-between justify-content-md-end gap-2 align-items-baseline mb-1">
                    <span class="text-neutral fs-7">Sĩ số lớp:</span>
                    <span class="capacity-text text-secondary-theme">
                      <strong>${cls.currentCount}</strong> / ${cls.maxCapacity} chỗ
                    </span>
                  </div>
                  <div class="capacity-progress">
                    <div 
                      class="capacity-progress-bar ${progressClass}" 
                      style="width: ${capacityPercent}%;"
                    ></div>
                  </div>
                </div>

                <!-- Nút đặt lớp -->
                <div class="w-100 w-sm-auto text-end">
                  ${actionBtnHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải danh sách lớp học:", error);
    container.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>Không thể tải lịch lớp học lúc này. Vui lòng thử lại sau.</div>
      </div>
    `;
  }
}

/**
 * Xử lý sự kiện khi bấm nút "Đặt ngay"
 */
async function handleBookClassClick(btn: HTMLButtonElement): Promise<void> {
  const classIdRaw = btn.getAttribute("data-class-id");
  if (!classIdRaw) return;

  const gymClassId = parseInt(classIdRaw, 10);
  if (isNaN(gymClassId)) return;

  // Chuyển nút sang trạng thái loading
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span class="ms-1">Đang đặt...</span>
  `;

  try {
    // Gọi API bookClass - KHÔNG truyền memberPackageId để Backend tự động chọn gói tối ưu
    await bookingService.bookClass({ gymClassId });

    // Thông báo đặt lớp thành công
    showToastMessage("Đặt lớp thành công!", true);

    // Lấy giá trị bộ lọc hiện tại để load lại danh sách, cập nhật ngay currentCount
    const dateInput = document.querySelector<HTMLInputElement>("#filter-date");
    const typeSelect = document.querySelector<HTMLSelectElement>("#filter-class-type");

    const currentDate = dateInput?.value || "";
    const currentClassTypeId = typeSelect?.value ? parseInt(typeSelect.value, 10) : undefined;

    await loadClasses(currentDate, currentClassTypeId);
  } catch (error: unknown) {
    console.error("Lỗi khi đặt lớp:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message ||
      "Đặt lớp không thành công! Vui lòng kiểm tra lại gói tập hoặc lịch trình của bạn.";
    showToastMessage(errorMessage, false);

    // Khôi phục nút nếu lỗi
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Gắn các bộ lắng nghe sự kiện
 */
function attachEvents(): void {
  const dateInput = document.querySelector<HTMLInputElement>("#filter-date");
  const typeSelect = document.querySelector<HTMLSelectElement>("#filter-class-type");
  const btnToday = document.querySelector<HTMLButtonElement>("#btn-today-classes");
  const classListContainer = document.querySelector<HTMLDivElement>("#class-list-container");

  const triggerFilter = () => {
    const date = dateInput?.value || "";
    const classTypeId = typeSelect?.value ? parseInt(typeSelect.value, 10) : undefined;
    loadClasses(date, classTypeId);
  };

  // 1. Khi thay đổi ngày
  if (dateInput) {
    dateInput.addEventListener("change", triggerFilter);
  }

  // 2. Khi thay đổi loại lớp
  if (typeSelect) {
    typeSelect.addEventListener("change", triggerFilter);
  }

  // 3. Nút chọn "Hôm nay"
  if (btnToday && dateInput) {
    btnToday.addEventListener("click", () => {
      dateInput.value = getTodayString();
      triggerFilter();
    });
  }

  // 4. Bắt sự kiện click nút "Đặt ngay" (Event delegation)
  if (classListContainer) {
    classListContainer.addEventListener("click", (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>(".btn-book-class");
      if (target && !target.disabled) {
        event.preventDefault();
        handleBookClassClick(target);
      }
    });
  }
}

/**
 * Render HTML View
 */
export function render(): string {
  return template;
}

/**
 * Khởi tạo dữ liệu và sự kiện khi mount vào DOM
 */
export async function init(): Promise<void> {
  const dateInput = document.querySelector<HTMLInputElement>("#filter-date");
  const today = getTodayString();

  // Đặt ngày mặc định là hôm nay
  if (dateInput) {
    dateInput.value = today;
  }

  attachEvents();

  // Tải đồng thời dropdown môn học và danh sách lớp hôm nay
  await Promise.all([loadClassTypes(), loadClasses(today)]);
}

// Re-export để thuận tiện
export { BookingService };
