// import { apiClient, clearAuthAndRedirect } from "../../core/api";
// import { authService } from "../../services/auth.service";
import { apiClient } from "../../core/api";
import {
  renderNavbar,
  initNavbar,
} from "../../components/navbar";
import template from "./landing.html?raw";
import "./landing.css";
import type {
  DashboardClass,
  DashboardStats,
  DashboardTrainer,
  MemberDashboardResponse,
} from "../../models/dashboard";

export function render(): string {
  return template;
}


// export function init(): void {
//
//   setupLogout();
//
//   loadDashboard();
// }
// export function init(): void {
//
//   setupNavbar();
//
//   setupLogout();
//
//   loadDashboard();
// }
export function init(): void {

  const navbar =
    document.querySelector<HTMLDivElement>(
      "#shared-navbar"
    );

  if (navbar) {

    navbar.innerHTML =
      renderNavbar();

    initNavbar();

  }

  loadDashboard();
}

/*
 * =========================
 * LOGOUT
 * =========================
 */
/*
 * =========================
 * NAVBAR
 * =========================
 */
//
// function setupNavbar(): void {
//
//   const avatarToggle =
//     document.querySelector<HTMLButtonElement>(
//       "#nav-avatar"
//     );
//
//   const accountDropdown =
//     document.querySelector<HTMLDivElement>(
//       "#profile-account-dropdown"
//     );
//
//   if (!avatarToggle || !accountDropdown) {
//     return;
//   }
//
//
//   /*
//    * Set greeting
//    */
//
//   const storedUser =
//     localStorage.getItem("user");
//
//   if (storedUser) {
//
//     try {
//
//       const user =
//         JSON.parse(storedUser);
//
//       const greeting =
//         document.querySelector<HTMLElement>(
//           "#nav-greeting"
//         );
//
//       if (greeting && user.fullName) {
//
//         const firstName =
//           user.fullName
//             .trim()
//             .split(/\s+/)[0];
//
//         greeting.textContent =
//           `Hey ${firstName}`;
//
//       }
//
//
//       /*
//        * Avatar
//        */
//
//       const avatar =
//         document.querySelector<HTMLElement>(
//           "#nav-avatar"
//         );
//
//       if (avatar) {
//
//         avatar.textContent =
//           getInitials(user.fullName || "Member");
//
//       }
//
//     } catch (error) {
//
//       console.error(
//         "Failed to load navbar user:",
//         error
//       );
//
//     }
//
//   }
//
//
//   /*
//    * Toggle dropdown
//    */
//
//   avatarToggle.addEventListener(
//     "click",
//     (event) => {
//
//       event.stopPropagation();
//
//       const isOpen =
//         accountDropdown.classList.contains("show");
//
//       closeAccountDropdown();
//
//       if (!isOpen) {
//
//         accountDropdown.classList.add("show");
//
//         avatarToggle.setAttribute(
//           "aria-expanded",
//           "true"
//         );
//
//       }
//
//     }
//   );
//
//
//   /*
//    * Close when clicking outside
//    */
//
//   document.addEventListener(
//     "click",
//     (event) => {
//
//       const target =
//         event.target as Node;
//
//       if (
//         !accountDropdown.contains(target) &&
//         !avatarToggle.contains(target)
//       ) {
//
//         closeAccountDropdown();
//
//       }
//
//     }
//   );
//
// }
//
//
// function closeAccountDropdown(): void {
//
//   const dropdown =
//     document.querySelector<HTMLDivElement>(
//       "#profile-account-dropdown"
//     );
//
//   const button =
//     document.querySelector<HTMLButtonElement>(
//       "#nav-avatar"
//     );
//
//   dropdown?.classList.remove("show");
//
//   button?.setAttribute(
//     "aria-expanded",
//     "false"
//   );
//
// }
// function setupLogout(): void {
//
//   const logoutButton =
//     document.querySelector<HTMLButtonElement>("#nav-logout");
//
//   if (!logoutButton) {
//     return;
//   }
//
//   logoutButton.addEventListener("click", async () => {
//
//     logoutButton.disabled = true;
//     logoutButton.textContent = "LOGGING OUT...";
//
//     try {
//       await authService.logout();
//
//     } catch {
//       /*
//        * authService.logout() already clears
//        * localStorage in finally.
//        *
//        * This is only a fallback.
//        */
//       clearAuthAndRedirect();
//     }
//   });
// }


/*
 * =========================
 * LOAD DASHBOARD
 * =========================
 */

async function loadDashboard(): Promise<void> {

  try {

    const { data } =
      await apiClient.get<MemberDashboardResponse>(
        "/member/dashboard"
      );

    renderStats(data.stats);

    renderClasses(data.upcomingClasses);

    renderTrainers(data.trainers);

  } catch (error) {

    console.error(
      "Failed to load member dashboard:",
      error
    );

    showClassesError();

    showTrainersError();
  }
}


/*
 * =========================
 * STATS
 * =========================
 */

function renderStats(
  stats: DashboardStats
): void {

  const container =
    document.querySelector<HTMLDivElement>(
      "#dashboard-stats"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="col-6">
      <div class="landing-stat-value text-white fw-bold">
        ${stats.upcomingClasses}
      </div>

      <div class="landing-stat-label text-tertiary">
        UPCOMING<br />CLASSES
      </div>
    </div>

    <div class="col-6">
      <div class="landing-stat-value text-white fw-bold">
        ${stats.activeTrainers}
      </div>

      <div class="landing-stat-label text-tertiary">
        ACTIVE<br />COACHES
      </div>
    </div>
  `;
}


/*
 * =========================
 * CLASSES
 * =========================
 */

function renderClasses(
  classes: DashboardClass[]
): void {

  const loading =
    document.querySelector<HTMLDivElement>(
      "#classes-loading"
    );

  const empty =
    document.querySelector<HTMLDivElement>(
      "#classes-empty"
    );

  const list =
    document.querySelector<HTMLDivElement>(
      "#class-list"
    );

  const error =
    document.querySelector<HTMLDivElement>(
      "#classes-error"
    );

  if (!loading || !empty || !list || !error) {
    return;
  }

  loading.classList.add("d-none");
  error.classList.add("d-none");

  if (!classes || classes.length === 0) {

    empty.classList.remove("d-none");
    list.classList.add("d-none");

    return;
  }

  empty.classList.add("d-none");
  list.classList.remove("d-none");

  list.innerHTML = classes
    .map(renderClassCard)
    .join("");
}


function renderClassCard(
  gymClass: DashboardClass
): string {

  const start =
    formatDateTime(gymClass.startTime);

  const end =
    formatTime(gymClass.endTime);

  const remaining =
    Math.max(
      gymClass.maxCapacity -
      gymClass.currentCount,
      0
    );

  const isFull =
    gymClass.status === "FULL" ||
    remaining === 0;

  const statusText =
    isFull
      ? "FULL"
      : `${remaining} SPOTS LEFT`;

  const statusClass =
    isFull
      ? "text-secondary-theme"
      : "text-primary-theme";

  return `
    <article class="landing-class-card card-theme p-3 flex-shrink-0">

      <div class="d-flex justify-content-between align-items-start mb-3">

        <span class="badge-theme landing-badge-small px-2 py-1">
          ${escapeHtml(gymClass.classTypeName)}
        </span>

        <span class="landing-badge-small ${statusClass}">
          ${statusText}
        </span>

      </div>


      <h3 class="landing-class-title text-primary-theme fw-bold mb-2">
        ${escapeHtml(gymClass.title)}
      </h3>


      <p class="landing-class-desc text-secondary-theme mb-3">
        Train with
        ${escapeHtml(gymClass.trainerName)}
        in
        ${escapeHtml(gymClass.roomName)}.
      </p>


      <div class="d-flex flex-column gap-2">

        <div class="d-flex align-items-center gap-2">
          <span class="landing-class-meta-text text-secondary-theme">
            ◷
          </span>

          <span class="landing-class-meta-text text-secondary-theme">
            ${start} – ${end}
          </span>
        </div>


        <div class="d-flex align-items-center gap-2">
          <span class="landing-class-meta-text text-secondary-theme">
            ◉
          </span>

          <span class="landing-class-meta-text text-secondary-theme">
            ${gymClass.currentCount}/${gymClass.maxCapacity}
          </span>
        </div>

      </div>

    </article>
  `;
}


/*
 * =========================
 * TRAINERS
 * =========================
 */

function renderTrainers(
  trainers: DashboardTrainer[]
): void {

  const loading =
    document.querySelector<HTMLDivElement>(
      "#trainers-loading"
    );

  const empty =
    document.querySelector<HTMLDivElement>(
      "#trainers-empty"
    );

  const list =
    document.querySelector<HTMLDivElement>(
      "#trainer-list"
    );

  const error =
    document.querySelector<HTMLDivElement>(
      "#trainers-error"
    );

  if (!loading || !empty || !list || !error) {
    return;
  }

  loading.classList.add("d-none");
  error.classList.add("d-none");

  if (!trainers || trainers.length === 0) {

    empty.classList.remove("d-none");
    list.classList.add("d-none");

    return;
  }

  empty.classList.add("d-none");
  list.classList.remove("d-none");

  list.innerHTML = trainers
    .map(renderTrainerCard)
    .join("");
}


function renderTrainerCard(
  trainer: DashboardTrainer
): string {

  const avatar =
    trainer.avatarUrl
      ? `
        <img
          src="${escapeHtml(trainer.avatarUrl)}"
          alt="${escapeHtml(trainer.fullName)}"
          class="landing-trainer-avatar rounded-circle object-fit-cover"
        />
      `
      : `
        <div
          class="landing-trainer-avatar rounded-circle card-theme d-flex align-items-center justify-content-center text-primary-theme fw-bold"
        >
          ${getInitials(trainer.fullName)}
        </div>
      `;

  return `
    <article class="card-theme p-3">

      <div class="d-flex align-items-center gap-3">

        ${avatar}

        <div class="flex-grow-1 min-width-0">

          <div class="landing-trainer-name text-primary-theme fw-semibold">
            ${escapeHtml(trainer.fullName)}
          </div>

          <div class="landing-trainer-role text-secondary-theme">
            ${escapeHtml(
              trainer.specialization || "Professional Trainer"
            )}
          </div>

          <div class="landing-trainer-exp text-tertiary mt-1">
            ${trainer.experienceYear} years experience
          </div>

        </div>

        <div class="landing-trainer-badge badge-theme px-2 py-1">
          COACH
        </div>

      </div>

    </article>
  `;
}


/*
 * =========================
 * ERROR STATES
 * =========================
 */

function showClassesError(): void {

  document
    .querySelector("#classes-loading")
    ?.classList.add("d-none");

  document
    .querySelector("#class-list")
    ?.classList.add("d-none");

  document
    .querySelector("#classes-empty")
    ?.classList.add("d-none");

  document
    .querySelector("#classes-error")
    ?.classList.remove("d-none");
}


function showTrainersError(): void {

  document
    .querySelector("#trainers-loading")
    ?.classList.add("d-none");

  document
    .querySelector("#trainer-list")
    ?.classList.add("d-none");

  document
    .querySelector("#trainers-empty")
    ?.classList.add("d-none");

  document
    .querySelector("#trainers-error")
    ?.classList.remove("d-none");
}


/*
 * =========================
 * DATE / TIME
 * =========================
 */

function formatDateTime(
  value: string
): string {

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function formatTime(
  value: string
): string {

  const date = new Date(value);

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


/*
 * =========================
 * HELPERS
 * =========================
 */

function getInitials(
  name: string
): string {

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(
      part => part.charAt(0).toUpperCase()
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
