import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import {
  getStoredUser,
} from "../core/api";
import { initNotification } from "./notification-popover";

import template from "./navbar.html?raw";
import "./navbar.css";

export type NavbarActiveItem =
  | "profile"
  | "member-class-list"
  | "member-pt-booking"
  | "member-packages"
  | "member-my-bookings"
  | "trainer-time-slots"
  | "trainer-pt-requests"
  | "trainer-attendance"
  | "trainer-progress-notes"
  | "trainer-chat";

export interface NavbarOptions {
  active?: NavbarActiveItem;
}

/**
 * Render shared navbar.
 *
 * Usage:
 * renderNavbar({ active: "profile" })
 */
export function renderNavbar(options: NavbarOptions = {}): string {
  return `
    <div
      id="shared-navbar"
      data-navbar-active="${options.active ?? ""}"
    >
      ${template}
    </div>
  `;
}

/**
 * Initialize shared navbar.
 */
export function initNavbar(): void {
  const user = getStoredUser();

  if (!user) {
    console.warn("Navbar: Không tìm thấy user trong session.");
    return;
  }

  const active =
    document
      .querySelector<HTMLElement>("#shared-navbar")
      ?.dataset.navbarActive ?? "";

  setupRole(user.role);
  setupUserProfile();
  setupChat(user.role);
  setupActiveMenu(active);
  setupLogout();

  // Notification
  initNotification();
}

/* ============================================================
   ROLE
   ============================================================ */

function setupRole(role?: string): void {
  const trainerMenu =
    document.querySelector<HTMLElement>(
      "#gym-navbar-trainer-menu",
    );

  const memberMenu =
    document.querySelector<HTMLElement>(
      "#gym-navbar-member-menu",
    );

  const trainerMobile =
    document.querySelector<HTMLElement>(
      "#gym-mobile-trainer-nav",
    );

  const memberMobile =
    document.querySelector<HTMLElement>(
      "#gym-mobile-member-nav",
    );

  const portalTag =
    document.querySelector<HTMLElement>(
      "#gym-navbar-portal-tag",
    );

  const roleBadge =
    document.querySelector<HTMLElement>(
      "#gym-navbar-role-badge",
    );

  const homeLink =
    document.querySelector<HTMLAnchorElement>(
      "#gym-navbar-home",
    );

  // Reset
  trainerMenu?.classList.add("d-none");
  memberMenu?.classList.add("d-none");

  trainerMobile?.classList.add("d-none");
  memberMobile?.classList.add("d-none");

  if (role === "TRAINER") {
    // -----------------------------
    // TRAINER
    // -----------------------------

    trainerMenu?.classList.remove("d-none");
    trainerMobile?.classList.remove("d-none");

    if (portalTag) {
      portalTag.textContent = "TRAINER PORTAL";
    }

    if (roleBadge) {
      roleBadge.textContent = "HUẤN LUYỆN VIÊN";
    }

    if (homeLink) {
      homeLink.href = "/trainer/time-slots.html";
    }

    return;
  }

  if (role === "MEMBER") {
    // -----------------------------
    // MEMBER
    // -----------------------------

    memberMenu?.classList.remove("d-none");
    memberMobile?.classList.remove("d-none");

    if (portalTag) {
      portalTag.textContent = "MEMBER PORTAL";
    }

    if (roleBadge) {
      roleBadge.textContent = "HỘI VIÊN";
    }

    if (homeLink) {
      homeLink.href = "/member/class-list.html";
    }

    return;
  }

  // -----------------------------
  // ADMIN
  // -----------------------------

  if (role === "ADMIN") {
    if (portalTag) {
      portalTag.textContent = "ADMIN PORTAL";
    }

    if (roleBadge) {
      roleBadge.textContent = "QUẢN TRỊ VIÊN";
    }

    if (homeLink) {
      homeLink.href = "/admin/dashboard.html";
    }
  }
}

/* ============================================================
   USER PROFILE
   ============================================================ */

async function setupUserProfile(): Promise<void> {
  const greeting =
    document.querySelector<HTMLElement>(
      "#gym-navbar-greeting",
    );

  const avatar =
    document.querySelector<HTMLElement>(
      "#gym-navbar-avatar",
    );

  try {
    const profile = await userService.getMyProfile();

    const firstName =
      profile.fullName?.trim().split(/\s+/)[0] ?? "Bạn";

    if (greeting) {
      greeting.textContent = `Hey ${firstName}`;
    }

    const avatarUrl =
      profile.avatarUrl ||
      "/src/assets/img/avatar-user-default.jpg";

    if (avatar) {
      avatar.innerHTML = `
        <img
          src="${avatarUrl}"
          alt="Avatar"
          class="w-100 h-100 object-fit-cover rounded-circle"
        />
      `;
    }
  } catch (error) {
    console.error(
      "Navbar: Không thể tải thông tin user.",
      error,
    );
  }
}

/* ============================================================
   CHAT
   ============================================================ */

function setupChat(role?: string): void {
  const chatLink =
    document.querySelector<HTMLAnchorElement>(
      "#gym-navbar-chat",
    );

  const trainerChat =
    document.querySelector<HTMLAnchorElement>(
      "#gym-navbar-trainer-chat",
    );

  if (role === "TRAINER") {
    if (chatLink) {
      chatLink.href = "/trainer/chat.html";
    }

    if (trainerChat) {
      trainerChat.href = "/trainer/chat.html";
    }

    return;
  }

  if (role === "MEMBER") {
    if (chatLink) {
      chatLink.href = "/member/chat.html";
    }
  }
}

/* ============================================================
   ACTIVE MENU
   ============================================================ */

function setupActiveMenu(active: string): void {
  if (!active) return;

  const items =
    document.querySelectorAll<HTMLElement>(
      `[data-nav="${active}"]`,
    );

  items.forEach((item) => {
    item.classList.add("active");
  });

  // Profile riêng
  if (active === "profile") {
    document
      .querySelector("#gym-navbar-profile")
      ?.classList.add("active");
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */

function setupLogout(): void {
  const logoutButtons =
    document.querySelectorAll<HTMLElement>(
      '[data-action="logout"]',
    );

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        button.setAttribute("disabled", "true");

        await authService.logout();
      } catch (error) {
        console.error(
          "Navbar: Lỗi đăng xuất.",
          error,
        );
      }
    });
  });
}