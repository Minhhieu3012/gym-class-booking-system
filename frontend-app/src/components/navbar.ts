import { authService } from "../services/auth.service";
import { clearAuthAndRedirect } from "../core/api";

import template from "./navbar.html?raw";

import "./navbar.css";


/*
 * =========================================================
 * RENDER
 * =========================================================
 */

export function renderNavbar(): string {
  return template;
}


/*
 * =========================================================
 * INIT
 * =========================================================
 */

export function initNavbar(): void {

  setupNavbarUser();

  setupAccountDropdown();

  setupLogout();

}


/*
 * =========================================================
 * USER INFO
 * =========================================================
 */

function setupNavbarUser(): void {

  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return;
  }


  try {

    const user =
      JSON.parse(storedUser);


    /*
     * -----------------------------------------
     * GREETING
     * -----------------------------------------
     */

    const greeting =
      document.querySelector<HTMLElement>(
        "#nav-greeting"
      );

    if (
      greeting &&
      user.fullName
    ) {

      const firstName =
        user.fullName
          .trim()
          .split(/\s+/)[0];

      greeting.textContent =
        `Hey ${firstName}`;

    }


    /*
     * -----------------------------------------
     * AVATAR
     * -----------------------------------------
     */

    const avatar =
      document.querySelector<HTMLButtonElement>(
        "#nav-avatar"
      );

    if (avatar) {

      avatar.textContent =
        getInitials(
          user.fullName || "Member"
        );

    }

  } catch (error) {

    console.error(
      "Failed to load navbar user:",
      error
    );

  }

}

/*
 * =========================================================
 * ACCOUNT DROPDOWN
 * =========================================================
 */

function setupAccountDropdown(): void {

  const avatar =
    document.querySelector<HTMLButtonElement>(
      "#nav-avatar"
    );

  const dropdown =
    document.querySelector<HTMLDivElement>(
      "#profile-account-dropdown"
    );


  /*
   * Elements not found
   */

  if (!avatar || !dropdown) {

    console.error(
      "[Navbar] Account dropdown elements not found.",
      {
        avatar,
        dropdown
      }
    );

    return;
  }


  /*
   * Initial state
   */

  dropdown.classList.remove("show");

  dropdown.setAttribute(
    "aria-hidden",
    "true"
  );

  avatar.setAttribute(
    "aria-expanded",
    "false"
  );


  /*
   * =======================================================
   * AVATAR CLICK
   * =======================================================
   */

  avatar.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      event.stopPropagation();


      const isOpen =
        dropdown.classList.contains("show");


      if (isOpen) {

        closeAccountDropdown(
          avatar,
          dropdown
        );

      } else {

        openAccountDropdown(
          avatar,
          dropdown
        );

      }

    }
  );


  /*
   * =======================================================
   * DROPDOWN CLICK
   * =======================================================
   */

  dropdown.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

    }
  );


  /*
   * =======================================================
   * CLICK OUTSIDE
   * =======================================================
   */

  document.addEventListener(
    "click",
    (event) => {

      const target =
        event.target as Node;


      if (
        !avatar.contains(target) &&
        !dropdown.contains(target)
      ) {

        closeAccountDropdown(
          avatar,
          dropdown
        );

      }

    }
  );


  /*
   * =======================================================
   * ESC
   * =======================================================
   */

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {

        closeAccountDropdown(
          avatar,
          dropdown
        );

      }

    }
  );

}


/*
 * =========================================================
 * OPEN
 * =========================================================
 */

function openAccountDropdown(
  avatar: HTMLButtonElement,
  dropdown: HTMLDivElement
): void {

  dropdown.classList.add("show");

  dropdown.setAttribute(
    "aria-hidden",
    "false"
  );

  avatar.setAttribute(
    "aria-expanded",
    "true"
  );

}


/*
 * =========================================================
 * CLOSE
 * =========================================================
 */

function closeAccountDropdown(
  avatar: HTMLButtonElement,
  dropdown: HTMLDivElement
): void {

  dropdown.classList.remove("show");

  dropdown.setAttribute(
    "aria-hidden",
    "true"
  );

  avatar.setAttribute(
    "aria-expanded",
    "false"
  );

}

/*
 * =========================================================
 * LOGOUT
 * =========================================================
 */

function setupLogout(): void {

  const logoutButton =
    document.querySelector<HTMLButtonElement>(
      "#nav-logout"
    );


  if (!logoutButton) {

    console.warn(
      "Logout button not found."
    );

    return;
  }


  logoutButton.addEventListener(
    "click",
    async () => {

      logoutButton.disabled = true;

      logoutButton.innerHTML = `
        <span
          class="spinner-border spinner-border-sm"
          aria-hidden="true"
        ></span>

        <span>
          Logging out...
        </span>
      `;


      try {

        await authService.logout();

      } catch (error) {

        console.error(
          "Logout failed:",
          error
        );

        clearAuthAndRedirect();

      }

    }
  );

}


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getInitials(
  name: string
): string {

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(
      part =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");

}