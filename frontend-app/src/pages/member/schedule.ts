import { apiClient } from "../../core/api";
import { renderNavbar, initNavbar } from "../../components/navbar";
import template from "./schedule.html?raw";
import "./schedule.css";

import type {
  MemberScheduleItem,
  MemberScheduleResponse,
  ScheduleType,
} from "../../models/schedule";

export function render(): string {
  return `
    ${renderNavbar({ active: "member-schedule" })}
    ${template}
  `;
}

let schedules: MemberScheduleItem[] = [];
let currentFilter: "ALL" | ScheduleType = "ALL";

export function init(): void {
  initNavbar();
  setupFilters();
  setupRetry();
  setupReload();
  loadSchedule();
}

/* =========================
   LOAD
========================= */

async function loadSchedule(): Promise<void> {
  showLoading();

  try {
    const { data } = await apiClient.get<MemberScheduleResponse>(
      "/member/schedule"
    );

    schedules = data.schedules ?? [];
    renderSchedule();
  } catch (error) {
    console.error("Failed to load member schedule:", error);
    showError();
  }
}

/* =========================
   RENDER
========================= */

function renderSchedule(): void {
  const loading = document.querySelector("#schedule-loading");
  const error = document.querySelector("#schedule-error");
  const empty = document.querySelector("#schedule-empty");
  const content = document.querySelector("#schedule-content");
  const list = document.querySelector<HTMLDivElement>("#schedule-list");

  if (!loading || !error || !empty || !content || !list) {
    return;
  }

  loading.classList.add("d-none");
  error.classList.add("d-none");

  const filtered =
    currentFilter === "ALL"
      ? schedules
      : schedules.filter(item => item.type === currentFilter);

  if (filtered.length === 0) {
    content.classList.add("d-none");
    empty.classList.remove("d-none");
    return;
  }

  empty.classList.add("d-none");
  content.classList.remove("d-none");

  list.innerHTML = filtered.map(renderScheduleItem).join("");
}

/* =========================
   ITEM
========================= */

function renderScheduleItem(item: MemberScheduleItem): string {
  const date = new Date(item.startTime);
  const isValidDate = !Number.isNaN(date.getTime());

  const day = isValidDate
    ? String(date.getDate()).padStart(2, "0")
    : "—";

  const monthNames = [
    "THG 1", "THG 2", "THG 3", "THG 4", "THG 5", "THG 6",
    "THG 7", "THG 8", "THG 9", "THG 10", "THG 11", "THG 12"
  ];
  const month = isValidDate ? monthNames[date.getMonth()] : "—";

  const dateText = formatDate(item.startTime);
  const timeText = `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`;

  const isClass = item.type === "CLASS";
  const typeLabel = isClass ? "LỚP HỌC NHÓM" : "HUẤN LUYỆN 1-1";
  const typeBadgeClass = isClass ? "type-badge-class" : "type-badge-pt";

  const statusClass = `schedule-status-${item.status
    ?.toLowerCase()
    ?.replaceAll("_", "-") ?? "default"}`;

  const trainer = item.trainerName
    ? `
      <div class="schedule-meta-row">
        <i class="bi bi-person text-danger"></i>
        <span>HLV: <strong>${escapeHtml(item.trainerName)}</strong></span>
      </div>
    `
    : "";

  const room = item.roomName
    ? `
      <div class="schedule-meta-row">
        <i class="bi bi-geo-alt text-danger"></i>
        <span>Phòng: <strong>${escapeHtml(item.roomName)}</strong></span>
      </div>
    `
    : "";

  const classType = item.classTypeName
    ? `
      <div class="schedule-meta-row">
        <i class="bi bi-tag text-secondary"></i>
        <span>Môn tập: <strong>${escapeHtml(item.classTypeName)}</strong></span>
      </div>
    `
    : "";

  const note = item.sessionNote
    ? `
      <div class="schedule-note">
        <i class="bi bi-chat-left-text me-1 text-primary"></i> Ghi chú: ${escapeHtml(item.sessionNote)}
      </div>
    `
    : "";

  const attendanceBadge = item.attendanceStatus
    ? `
      <span class="schedule-attendance-badge attendance-${item.attendanceStatus.toLowerCase()}">
        ${formatAttendance(item.attendanceStatus)}
      </span>
    `
    : "";

  return `
    <article class="schedule-item card-theme">
      <div class="schedule-date-box">
        <div class="schedule-date-day">${day}</div>
        <div class="schedule-date-month">${month}</div>
      </div>

      <div class="schedule-item-content">
        <div class="schedule-item-top">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="schedule-type-badge ${typeBadgeClass}">
              <i class="bi ${isClass ? 'bi-people' : 'bi-person-badge'} me-1"></i>
              ${typeLabel}
            </span>
            ${attendanceBadge}
          </div>

          <span class="schedule-status ${statusClass}">
            ${formatStatus(item.status)}
          </span>
        </div>

        <h3 class="schedule-item-title">
          ${escapeHtml(item.title)}
        </h3>

        <div class="schedule-meta">
          <div class="schedule-meta-row">
            <i class="bi bi-clock text-danger"></i>
            <span class="fw-semibold text-danger">${timeText}</span>
            <span class="text-neutral mx-1">•</span>
            <span class="text-neutral">${dateText}</span>
          </div>

          ${classType}
          ${trainer}
          ${room}
        </div>

        ${note}
      </div>
    </article>
  `;
}

/* =========================
   FILTER & CONTROLS
========================= */

function setupFilters(): void {
  const container = document.querySelector("#schedule-filters");
  if (!container) return;

  container
    .querySelectorAll<HTMLButtonElement>(".schedule-filter")
    .forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        if (filter !== "ALL" && filter !== "CLASS" && filter !== "PT") {
          return;
        }

        currentFilter = filter;

        container
          .querySelectorAll(".schedule-filter")
          .forEach(item => item.classList.remove("active"));

        button.classList.add("active");
        renderSchedule();
      });
    });
}

function setupRetry(): void {
  const button = document.querySelector<HTMLButtonElement>("#schedule-retry");
  button?.addEventListener("click", loadSchedule);
}

function setupReload(): void {
  const reloadBtn = document.querySelector<HTMLButtonElement>("#schedule-reload");
  reloadBtn?.addEventListener("click", () => {
    loadSchedule();
  });
}

/* =========================
   STATES
========================= */

function showLoading(): void {
  const loading = document.querySelector("#schedule-loading");
  const error = document.querySelector("#schedule-error");
  const empty = document.querySelector("#schedule-empty");
  const content = document.querySelector("#schedule-content");

  loading?.classList.remove("d-none");
  error?.classList.add("d-none");
  empty?.classList.add("d-none");
  content?.classList.add("d-none");
}

function showError(): void {
  const loading = document.querySelector("#schedule-loading");
  const error = document.querySelector("#schedule-error");
  const empty = document.querySelector("#schedule-empty");
  const content = document.querySelector("#schedule-content");

  loading?.classList.add("d-none");
  error?.classList.remove("d-none");
  empty?.classList.add("d-none");
  content?.classList.add("d-none");
}

/* =========================
   FORMATTERS
========================= */

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const days = [
    "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
  ];
  const dayName = days[date.getDay()];
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${dayName}, ${d}/${m}/${y}`;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatStatus(status?: string): string {
  if (!status) return "—";
  switch (status.toUpperCase()) {
    case "CONFIRMED":
    case "BOOKED":
      return "ĐÃ XÁC NHẬN";
    case "COMPLETED":
      return "ĐÃ HOÀN THÀNH";
    case "CANCELLED":
      return "ĐÃ HỦY";
    case "PENDING":
      return "CHỜ XÁC NHẬN";
    case "REJECTED":
      return "BỊ TỪ CHỐI";
    case "NO_SHOW":
      return "VẮNG MẶT";
    default:
      return status.replaceAll("_", " ");
  }
}

function formatAttendance(status: string): string {
  switch (status.toUpperCase()) {
    case "ATTENDED":
    case "PRESENT":
      return "Đã tham gia";
    case "ABSENT":
      return "Vắng mặt";
    case "LATE":
      return "Đến muộn";
    case "NOT_YET":
      return "Chưa điểm danh";
    default:
      return status;
  }
}

/* =========================
   HELPERS
========================= */

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}