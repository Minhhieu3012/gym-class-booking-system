import "./style.css";
import { initRouter, navigate } from "./core/router";

// Global SPA link handler
document.body.addEventListener("click", (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest<HTMLAnchorElement>(
    "a[data-link]",
  );
  if (!target) return;

  event.preventDefault();
  const href = target.getAttribute("href");
  if (href) {
    navigate(href);
  }
});

// Initialize router
initRouter();
