import template from "./progress-notes.html?raw";
import "./progress-notes.css";
import interactionService from "../../services/interaction.service";
import { initNotification } from "../../components/notification-popover";

// Khai báo kiểu Bootstrap toàn cục
declare const bootstrap: {
  Toast: new (el: Element, options?: unknown) => { show(): void; hide(): void };
};

interface SavedNoteItem {
  id: number;
  memberId: number;
  memberName: string;
  content: string;
  createdAt: string;
}

// Danh sách ghi chú đã lưu trong phiên làm việc
const sessionSavedNotes: SavedNoteItem[] = [];

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
  const toastEl = document.querySelector<HTMLElement>("#progress-note-toast");
  const msgEl = document.querySelector<HTMLElement>(
    "#progress-note-toast-message",
  );
  const iconEl = document.querySelector<HTMLElement>(
    "#progress-note-toast-icon",
  );

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
 * Cập nhật danh sách các ghi chú đã lưu gần đây trên giao diện
 */
function renderRecentNotes(): void {
  const container = document.querySelector<HTMLDivElement>("#recent-notes-list");
  const countBadge = document.querySelector<HTMLElement>("#recent-notes-count");
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${sessionSavedNotes.length} ghi chú`;
  }

  if (sessionSavedNotes.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-muted" id="recent-notes-empty">
        <p class="mb-0" style="font-size: 0.875rem;">Chưa có ghi chú nào được lưu trong phiên này.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sessionSavedNotes
    .map(
      (note) => `
      <div class="list-group-item p-3 border-bottom recent-note-item">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="fw-bold text-secondary-theme">
            <span>Hội viên:</span>
            <span class="text-primary-theme">${escapeHtml(note.memberName)}</span>
            <span class="badge bg-secondary ms-1 fs-8">#MB-${String(note.memberId).padStart(4, "0")}</span>
          </div>
          <small class="text-muted" style="font-size: 0.75rem;">${escapeHtml(note.createdAt)}</small>
        </div>
        <div class="text-secondary-theme text-break" style="font-size: 0.875rem; line-height: 1.5;">
          ${escapeHtml(note.content)}
        </div>
      </div>
    `,
    )
    .join("");
}

/**
 * Xử lý lưu ghi chú tiến độ
 */
async function handleSaveProgressNote(): Promise<void> {
  const memberSelect = document.querySelector<HTMLSelectElement>("#memberSelect");
  const noteContent = document.querySelector<HTMLTextAreaElement>("#noteContent");
  const saveBtn = document.querySelector<HTMLButtonElement>("#saveNoteBtn");

  const memberIdRaw = memberSelect?.value.trim() || "";
  const content = noteContent?.value.trim() || "";

  // 1. Validate nếu rỗng thì báo lỗi
  if (!memberIdRaw) {
    alert("Vui lòng chọn Hội viên cần ghi chú!");
    showToast("Vui lòng chọn Hội viên cần ghi chú!", false);
    memberSelect?.focus();
    return;
  }

  const memberId = Number(memberIdRaw);
  if (isNaN(memberId) || memberId <= 0) {
    alert("Mã hội viên không hợp lệ!");
    showToast("Mã hội viên không hợp lệ!", false);
    return;
  }

  if (!content) {
    alert("Vui lòng nhập nội dung ghi chú tiến độ / sức khỏe!");
    showToast("Vui lòng nhập nội dung ghi chú tiến độ / sức khỏe!", false);
    noteContent?.focus();
    return;
  }

  const selectedOption = memberSelect?.options[memberSelect.selectedIndex];
  const memberName = selectedOption ? selectedOption.text.split("(")[0].trim() : `Hội viên #${memberId}`;

  // 2. Gọi API tạo ghi chú và xử lý bằng try/catch
  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span>Đang lưu...</span>
      `;
    }

    // TODO(mock-pending-api): chờ BE hoàn thiện ProgressNoteController — xem api-contract.md mục 16
    await interactionService.createProgressNote({ memberId, content });

    // Hiển thị thông báo thành công
    alert("Lưu ghi chú thành công!");
    showToast("Lưu ghi chú thành công!", true);

    // Lưu vào danh sách tạm hiển thị trên UI
    sessionSavedNotes.unshift({
      id: Date.now(),
      memberId,
      memberName,
      content,
      createdAt: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
    renderRecentNotes();

    // Reset lại form
    const form = document.querySelector<HTMLFormElement>("#progressNoteForm");
    if (form) {
      form.reset();
    }
    if (memberSelect) {
      memberSelect.value = "";
    }
    if (noteContent) {
      noteContent.value = "";
    }
  } catch (error: unknown) {
    console.error("Lỗi khi lưu ghi chú tiến độ:", error);
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Không thể lưu ghi chú tiến độ. Vui lòng thử lại!";
    alert(`Lỗi: ${msg}`);
    showToast(msg, false);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Lưu ghi chú</span>
      `;
    }
  }
}

/**
 * Gắn các sự kiện DOM
 */
function attachEvents(): void {
  const saveBtn = document.querySelector<HTMLButtonElement>("#saveNoteBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      handleSaveProgressNote();
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
 * Khởi tạo dữ liệu và sự kiện khi mount view
 */
export async function init(): Promise<void> {
  initNotification();
  attachEvents();
  renderRecentNotes();
}
