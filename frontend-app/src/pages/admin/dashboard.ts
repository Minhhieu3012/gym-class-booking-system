import template from "./dashboard.html?raw";
import "./dashboard.css";

export function render(): string {
  return template;
}

export function init(): void {
  // TODO(mock-pending-api): chờ BE hoàn thiện AnalyticsController — xem api-contract.md mục 23
  // Highlight active sidebar link
  const currentPath = window.location.pathname;
  const navLinks =
    document.querySelectorAll<HTMLAnchorElement>(".admin-nav-link");

  navLinks.forEach((link) => {
    // Exact match or active sub-route match
    if (link.getAttribute("href") === currentPath) {
      link.classList.remove("text-neutral");
      link.classList.add("text-secondary-theme", "bg-surface", "border-theme");
      // Optionally add a left border highlight to indicate active state
      link.style.borderLeft = "3px solid var(--color-secondary)";
    } else {
      link.classList.add("text-neutral");
      link.classList.remove(
        "text-secondary-theme",
        "bg-surface",
        "border-theme",
      );
      link.style.borderLeft = "3px solid transparent";
    }
  });
}
