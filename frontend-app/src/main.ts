import "./style.css";
import { initRouter, navigate } from "./core/router";
import { initNotification } from "./components/notification-popover";

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

// Initialize notification popover (nếu header đã có sẵn trong DOM ban đầu)
initNotification();

