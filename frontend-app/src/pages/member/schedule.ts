import { apiClient } from "../../core/api";
import template from "./schedule.html?raw";
import "./schedule.css";

import type {
  MemberScheduleItem,
  MemberScheduleResponse,
  ScheduleType,
} from "../../models/schedule";

export function render(): string {
  return template;
}

let schedules: MemberScheduleItem[] = [];
let currentFilter: "ALL" | ScheduleType = "ALL";

export function init(): void {
  setupAvatar();
  setupFilters();
  setupRetry();
  loadSchedule();
}


/* =========================
   LOAD
========================= */

async function loadSchedule(): Promise<void> {

  showLoading();

  try {

    const { data } =
      await apiClient.get<MemberScheduleResponse>(
        "/member/schedule"
      );

    schedules = data.schedules ?? [];

    renderSchedule();

  } catch (error) {

    console.error(
      "Failed to load member schedule:",
      error
    );

    showError();
  }
}


/* =========================
   RENDER
========================= */

function renderSchedule(): void {

  const loading =
    document.querySelector("#schedule-loading");

  const error =
    document.querySelector("#schedule-error");

  const empty =
    document.querySelector("#schedule-empty");

  const content =
    document.querySelector("#schedule-content");

  const list =
    document.querySelector<HTMLDivElement>(
      "#schedule-list"
    );

  if (!loading || !error || !empty || !content || !list) {
    return;
  }

  loading.classList.add("d-none");
  error.classList.add("d-none");


  const filtered =
    currentFilter === "ALL"
      ? schedules
      : schedules.filter(
          item => item.type === currentFilter
        );


  if (filtered.length === 0) {

    content.classList.add("d-none");
    empty.classList.remove("d-none");

    return;
  }


  empty.classList.add("d-none");
  content.classList.remove("d-none");

  list.innerHTML =
    filtered
      .map(renderScheduleItem)
      .join("");
}


/* =========================
   ITEM
========================= */

function renderScheduleItem(
  item: MemberScheduleItem
): string {

  const date =
    new Date(item.startTime);

  const day =
    date.toLocaleDateString(
      "en-US",
      {
        day: "2-digit",
      }
    );

  const month =
    date.toLocaleDateString(
      "en-US",
      {
        month: "short",
      }
    ).toUpperCase();

  const dateText =
    formatDate(item.startTime);

  const timeText =
    `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`;

  const typeLabel =
    item.type === "CLASS"
      ? "GYM CLASS"
      : "PERSONAL TRAINING";

  const statusClass =
    `schedule-status-${item.status
      .toLowerCase()
      .replaceAll("_", "-")}`;

  const trainer =
    item.trainerName
      ? `
        <div class="schedule-meta-row">
          <span>◎</span>
          <span>
            ${escapeHtml(item.trainerName)}
          </span>
        </div>
      `
      : "";

  const room =
    item.roomName
      ? `
        <div class="schedule-meta-row">
          <span>⌂</span>
          <span>
            ${escapeHtml(item.roomName)}
          </span>
        </div>
      `
      : "";

  const note =
    item.sessionNote
      ? `
        <div class="schedule-note">
          ${escapeHtml(item.sessionNote)}
        </div>
      `
      : "";

  const classType =
    item.classTypeName
      ? `
        <span>
          ${escapeHtml(item.classTypeName)}
        </span>
      `
      : "";


  return `
    <article class="schedule-item">

      <div class="schedule-date">

        <div class="schedule-date-day">
          ${day}
        </div>

        <div class="schedule-date-month">
          ${month}
        </div>

      </div>


      <div class="schedule-item-content">

        <div class="schedule-item-top">

          <div class="schedule-type text-tertiary">
            ${typeLabel}
          </div>

          <span
            class="schedule-status ${statusClass}"
          >
            ${formatStatus(item.status)}
          </span>

        </div>


        <div class="schedule-item-title">
          ${escapeHtml(item.title)}
        </div>


        <div class="schedule-meta">

          <div class="schedule-meta-row">
            <span>◷</span>
            <span>
              ${dateText} · ${timeText}
            </span>
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
   FILTER
========================= */

function setupFilters(): void {

  const container =
    document.querySelector("#schedule-filters");

  if (!container) {
    return;
  }

  container
    .querySelectorAll<HTMLButtonElement>(
      ".schedule-filter"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const filter =
            button.dataset.filter;

          if (
            filter !== "ALL" &&
            filter !== "CLASS" &&
            filter !== "PT"
          ) {
            return;
          }

          currentFilter = filter;

          container
            .querySelectorAll(".schedule-filter")
            .forEach(
              item =>
                item.classList.remove("active")
            );

          button.classList.add("active");

          renderSchedule();
        }
      );

    });
}


/* =========================
   RETRY
========================= */

function setupRetry(): void {

  const button =
    document.querySelector<HTMLButtonElement>(
      "#schedule-retry"
    );

  button?.addEventListener(
    "click",
    loadSchedule
  );
}


/* =========================
   AVATAR
========================= */

function setupAvatar(): void {

  const avatar =
    document.querySelector<HTMLAnchorElement>(
      "#schedule-avatar"
    );

  if (!avatar) {
    return;
  }

  const raw =
    localStorage.getItem("user");

  if (!raw) {
    return;
  }

  try {

    const user =
      JSON.parse(raw);

    avatar.textContent =
      getInitials(
        user.fullName || "Member"
      );

  } catch (error) {

    console.error(
      "Failed to load schedule avatar:",
      error
    );

  }
}


/* =========================
   STATES
========================= */

function showLoading(): void {

  document
    .querySelector("#schedule-loading")
    ?.classList.remove("d-none");

  document
    .querySelector("#schedule-error")
    ?.classList.add("d-none");

  document
    .querySelector("#schedule-empty")
    ?.classList.add("d-none");

  document
    .querySelector("#schedule-content")
    ?.classList.add("d-none");
}


function showError(): void {

  document
    .querySelector("#schedule-loading")
    ?.classList.add("d-none");

  document
    .querySelector("#schedule-empty")
    ?.classList.add("d-none");

  document
    .querySelector("#schedule-content")
    ?.classList.add("d-none");

  document
    .querySelector("#schedule-error")
    ?.classList.remove("d-none");
}


/* =========================
   FORMAT
========================= */

function formatDate(
  value: string
): string {

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
}


function formatTime(
  value: string
): string {

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function formatStatus(
  status: string
): string {

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, char =>
      char.toUpperCase()
    );
}


/* =========================
   HELPERS
========================= */

function getInitials(
  name: string
): string {

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(
      part =>
        part.charAt(0).toUpperCase()
    )
    .join("");
}


function escapeHtml(
  value: string | null | undefined
): string {

  if (!value) {
    return "";
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}