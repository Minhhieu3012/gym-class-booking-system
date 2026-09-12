import template from "./pt-booking.html?raw";
import "./pt-booking.css";
import { bookingService, BookingService } from "../../services/booking.service";
import { trainerService } from "../../services/trainer.service";
import type { TrainerTimeSlot } from "../../models/booking";
import type { Trainer } from "../../models/trainer";
import { navigate } from "../../core/router";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

// ==========================================
// STATE QUẢN LÝ ĐẶT LỊCH PT
// ==========================================
let selectedTrainerId: number | null = null;
let selectedTrainerName = "";
let selectedTimeSlotId: number | null = null;
let selectedTimeSlotText = "";

/**
 * Định dạng thời gian hiển thị cho time slot
 */
function formatSlotTime(startStr: string, endStr: string): { time: string; date: string } {
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

    return {
      time: `${startH}:${startM} - ${endH}:${endM}`,
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
 * Hiển thị Toast thông báo
 */
function showToastMessage(message: string, isSuccess = true): void {
  const toastEl = document.querySelector<HTMLElement>("#pt-toast");
  const msgEl = document.querySelector<HTMLElement>("#pt-toast-message");
  const iconEl = document.querySelector<HTMLElement>("#pt-toast-icon");

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
 * Cập nhật Step Indicator trên UI
 */
function updateStepIndicator(step: 1 | 2 | 3): void {
  const stepNav1 = document.querySelector<HTMLElement>("#step-nav-1");
  const stepNav2 = document.querySelector<HTMLElement>("#step-nav-2");
  const stepNav3 = document.querySelector<HTMLElement>("#step-nav-3");

  if (!stepNav1 || !stepNav2 || !stepNav3) return;

  stepNav1.classList.remove("active", "completed");
  stepNav2.classList.remove("active", "completed");
  stepNav3.classList.remove("active", "completed");

  if (step === 1) {
    stepNav1.classList.add("active");
  } else if (step === 2) {
    stepNav1.classList.add("completed");
    stepNav2.classList.add("active");
  } else if (step === 3) {
    stepNav1.classList.add("completed");
    stepNav2.classList.add("completed");
    stepNav3.classList.add("active");
  }
}

/**
 * STEP 1: Tải danh sách huấn luyện viên
 * GET /trainers
 */
export async function loadTrainers(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#trainer-list-container");
  if (!container) return;

  try {
    const response = await trainerService.getTrainers({ size: 30 });
    const trainers: Trainer[] = Array.isArray(response)
      ? response
      : (response?.content ?? []);

    if (trainers.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">Hiện tại chưa có huấn luyện viên nào sẵn sàng nhận lịch đặt.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = trainers
      .map((t) => {
        const initial = (t.fullName || "T").charAt(0).toUpperCase();
        const spec = t.specialization || "Thể hình & Thể lực";
        const exp = t.experienceYears ? `${t.experienceYears} năm kinh nghiệm` : "HLV Chuyên nghiệp";
        const bio = t.bio || "Tận tâm đồng hành, xây dựng lộ trình tập luyện khoa học và phù hợp với từng cá nhân.";

        return `
          <div class="col-12 col-md-6 col-lg-4">
            <div 
              class="trainer-card shadow-theme-sm" 
              data-trainer-id="${t.id}"
              data-trainer-name="${escapeHtml(t.fullName)}"
            >
              <div class="trainer-selected-check">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="trainer-avatar-box">
                  ${
                    t.avatarUrl
                      ? `<img src="${escapeHtml(t.avatarUrl)}" alt="${escapeHtml(t.fullName)}" />`
                      : initial
                  }
                </div>
                <div>
                  <h3 class="trainer-name mb-1">${escapeHtml(t.fullName)}</h3>
                  <span class="trainer-spec-badge">${escapeHtml(spec)}</span>
                </div>
              </div>

              <div class="trainer-experience mb-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span class="ms-1">${escapeHtml(exp)}</span>
              </div>

              <p class="trainer-bio text-neutral">${escapeHtml(bio)}</p>

              <button 
                type="button" 
                class="btn-brand-outline w-100 justify-content-center btn-select-trainer mt-auto py-2"
              >
                <span>Chọn HLV này</span>
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải danh sách huấn luyện viên:", error);
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger text-center">
          Không thể tải danh sách huấn luyện viên lúc này. Vui lòng thử lại sau!
        </div>
      </div>
    `;
  }
}

/**
 * STEP 2: Tải các khung giờ trống của huấn luyện viên
 * GET /trainers/{trainerId}/time-slots
 * LƯU Ý QUAN TRỌNG: Chỉ render time slot có status == 'AVAILABLE' và startTime trong tương lai
 */
export async function loadTimeSlots(trainerId: number): Promise<void> {
  const step2Section = document.querySelector<HTMLElement>("#timeslot-container");
  const loadingEl = document.querySelector<HTMLElement>("#timeslot-loading");
  const wrapper = document.querySelector<HTMLElement>("#timeslot-buttons-wrapper");
  const emptyMsg = document.querySelector<HTMLElement>("#timeslot-empty-message");
  const subtitle = document.querySelector<HTMLElement>("#timeslot-subtitle");
  const step3Section = document.querySelector<HTMLElement>("#booking-form-container");

  if (!step2Section || !wrapper || !emptyMsg) return;

  // Hiển thị Step 2, ẩn Step 3 khi đổi Trainer
  step2Section.classList.remove("d-none");
  if (step3Section) step3Section.classList.add("d-none");
  selectedTimeSlotId = null;
  selectedTimeSlotText = "";

  if (subtitle) {
    subtitle.innerHTML = `Các khung giờ khả dụng sắp tới của Huấn luyện viên: <strong class="text-secondary-theme">${escapeHtml(selectedTrainerName)}</strong>`;
  }

  if (loadingEl) loadingEl.classList.remove("d-none");
  wrapper.innerHTML = "";
  emptyMsg.classList.add("d-none");

  updateStepIndicator(2);

  // Cuộn mượt tới Step 2
  step2Section.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const slotsResponse = await bookingService.getTrainerTimeSlots(trainerId);
    const allSlots: TrainerTimeSlot[] = Array.isArray(slotsResponse)
      ? slotsResponse
      : ((slotsResponse as unknown as { content?: TrainerTimeSlot[] })?.content ?? []);

    if (loadingEl) loadingEl.classList.add("d-none");

    const now = new Date();

    // Lọc: Chỉ render các time slot có status == 'AVAILABLE' và startTime trong tương lai
    const availableFutureSlots = allSlots.filter((slot) => {
      const isAvailable = slot.status === "AVAILABLE";
      const isFuture = new Date(slot.startTime).getTime() > now.getTime();
      return isAvailable && isFuture;
    });

    if (availableFutureSlots.length === 0) {
      emptyMsg.classList.remove("d-none");
      return;
    }

    // Render danh sách các nút bấm khung giờ
    wrapper.innerHTML = availableFutureSlots
      .map((slot) => {
        const timeData = formatSlotTime(slot.startTime, slot.endTime);
        return `
          <button 
            type="button" 
            class="timeslot-btn" 
            data-slot-id="${slot.id}"
            data-slot-time="${escapeHtml(timeData.time)}"
            data-slot-date="${escapeHtml(timeData.date)}"
          >
            <span class="slot-time-text">${escapeHtml(timeData.time)}</span>
            <span class="slot-date-text">${escapeHtml(timeData.date)}</span>
          </button>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải khung giờ tập của HLV:", error);
    if (loadingEl) loadingEl.classList.add("d-none");
    emptyMsg.textContent = "Không thể tải khung giờ trống lúc này. Vui lòng thử lại sau.";
    emptyMsg.classList.remove("d-none");
  }
}

/**
 * STEP 3: Mở form thông tin bổ sung và xác nhận
 */
function activateStep3(): void {
  const step3Section = document.querySelector<HTMLElement>("#booking-form-container");
  const summaryTrainer = document.querySelector<HTMLElement>("#summary-trainer-name");
  const summaryTime = document.querySelector<HTMLElement>("#summary-timeslot-time");

  if (!step3Section) return;

  step3Section.classList.remove("d-none");
  if (summaryTrainer) summaryTrainer.textContent = selectedTrainerName;
  if (summaryTime) summaryTime.textContent = selectedTimeSlotText;

  updateStepIndicator(3);

  // Cuộn mượt tới Step 3
  step3Section.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Xử lý bấm nút "Gửi yêu cầu PT"
 */
async function handleSubmitPTBooking(): Promise<void> {
  const submitBtn = document.querySelector<HTMLButtonElement>("#btn-submit-pt");
  const sessionNoteInput = document.querySelector<HTMLTextAreaElement>("#session-note");
  const healthNoteInput = document.querySelector<HTMLTextAreaElement>("#health-note");

  if (!submitBtn) return;

  // Validate cơ bản
  if (!selectedTrainerId) {
    showToastMessage("Vui lòng chọn Huấn luyện viên ở Bước 1 trước khi gửi yêu cầu!", false);
    return;
  }

  if (!selectedTimeSlotId) {
    showToastMessage("Vui lòng chọn Khung giờ tập ở Bước 2 trước khi gửi yêu cầu!", false);
    return;
  }

  const sessionNote = sessionNoteInput?.value.trim() || "";
  const healthNote = healthNoteInput?.value.trim() || "";

  if (!sessionNote) {
    showToastMessage("Vui lòng nhập mục tiêu buổi tập của bạn!", false);
    sessionNoteInput?.focus();
    return;
  }

  // Khóa nút & hiển thị spinner
  const originalHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span class="ms-1">Đang gửi yêu cầu...</span>
  `;

  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện PTBookingController — xem api-contract.md mục 10
    // Gọi API bookPT - KHÔNG truyền memberPackageId để Backend tự động xử lý gói tập phù hợp
    await bookingService.bookPT({
      trainerId: selectedTrainerId,
      timeSlotId: selectedTimeSlotId,
      sessionNote,
      healthNote: healthNote || undefined,
    });

    // Thông báo thành công theo đúng yêu cầu
    showToastMessage("Gửi yêu cầu thành công, đang chờ Trainer duyệt!", true);

    // Reset form
    if (sessionNoteInput) sessionNoteInput.value = "";
    if (healthNoteInput) healthNoteInput.value = "";

    // Chuyển hướng sau 2 giây về trang lịch lớp hoặc quản lý gói tập
    setTimeout(() => {
      navigate("/member/classes");
    }, 1800);
  } catch (error: unknown) {
    console.error("Lỗi khi gửi yêu cầu PT:", error);
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage =
      err.response?.data?.message ||
      "Không thể gửi yêu cầu đặt lịch! Có thể bạn chưa có gói tập hợp lệ, bị trùng lịch hoặc khung giờ đã được đặt trước.";
    showToastMessage(errorMessage, false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

/**
 * Gắn các sự kiện trên trang
 */
function attachEvents(): void {
  // 1. Sự kiện chọn Trainer ở Step 1
  const trainerContainer = document.querySelector<HTMLDivElement>("#trainer-list-container");
  if (trainerContainer) {
    trainerContainer.addEventListener("click", (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(".trainer-card");
      if (!target) return;

      const trainerIdRaw = target.getAttribute("data-trainer-id");
      const trainerName = target.getAttribute("data-trainer-name") || "Huấn luyện viên";

      if (!trainerIdRaw) return;

      const trainerId = parseInt(trainerIdRaw, 10);
      if (isNaN(trainerId)) return;

      selectedTrainerId = trainerId;
      selectedTrainerName = trainerName;

      // Cập nhật class active cho card được chọn
      document.querySelectorAll(".trainer-card").forEach((c) => {
        c.classList.remove("selected-trainer-card");
        const btn = c.querySelector(".btn-select-trainer");
        if (btn) btn.textContent = "Chọn HLV này";
      });

      target.classList.add("selected-trainer-card");
      const activeBtn = target.querySelector(".btn-select-trainer");
      if (activeBtn) activeBtn.textContent = "✓ Đang chọn HLV này";

      // Tải các khung giờ của HLV này
      loadTimeSlots(trainerId);
    });
  }

  // 2. Sự kiện chọn Time Slot ở Step 2
  const timeslotWrapper = document.querySelector<HTMLElement>("#timeslot-buttons-wrapper");
  if (timeslotWrapper) {
    timeslotWrapper.addEventListener("click", (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeslot-btn");
      if (!target) return;

      const slotIdRaw = target.getAttribute("data-slot-id");
      const slotTime = target.getAttribute("data-slot-time") || "";
      const slotDate = target.getAttribute("data-slot-date") || "";

      if (!slotIdRaw) return;

      const slotId = parseInt(slotIdRaw, 10);
      if (isNaN(slotId)) return;

      selectedTimeSlotId = slotId;
      selectedTimeSlotText = `${slotTime} (${slotDate})`;

      // Đổi màu nút đang chọn
      document.querySelectorAll(".timeslot-btn").forEach((b) => {
        b.classList.remove("selected-timeslot-btn");
      });
      target.classList.add("selected-timeslot-btn");

      // Kích hoạt Step 3
      activateStep3();
    });
  }

  // 3. Sự kiện bấm nút "Gửi yêu cầu PT" ở Step 3
  const submitBtn = document.querySelector<HTMLButtonElement>("#btn-submit-pt");
  if (submitBtn) {
    submitBtn.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      handleSubmitPTBooking();
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
  // Reset state
  selectedTrainerId = null;
  selectedTrainerName = "";
  selectedTimeSlotId = null;
  selectedTimeSlotText = "";

  updateStepIndicator(1);
  attachEvents();
  await loadTrainers();
}

// Re-export service để tương thích
export { BookingService };
