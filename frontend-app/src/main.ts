import "./style.css";
import { initRouter, navigate } from "./core/router";
import { initNotification } from "./components/notification-popover";
import { showToast } from "./utils/toast";

// Ghi đè window.alert toàn cục bằng popup Toast hiện đại
window.alert = (message: unknown) => {
  const str = String(message ?? "");
  const isSuccess = /thành công|success|hoàn tất/i.test(str);
  const isWarning = /vui lòng|cảnh báo|chú ý/i.test(str);
  const type = isSuccess ? "success" : isWarning ? "warning" : "error";
  showToast(str, type);
};

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

// Global upcoming feature handler (Bắt tất cả các nút/link của tính năng chưa hoàn thiện trên web)
document.body.addEventListener("click", (event: MouseEvent) => {
  const upcomingTarget = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-upcoming], #btn-call-mock, #btn-video-mock, #btn-chat-info, #register-terms-link, .forgot-password-footer-link, a[href='#']:not([data-bs-toggle]):not([data-bs-target])",
  );
  if (upcomingTarget) {
    event.preventDefault();
    event.stopPropagation();
    showToast("Tính năng sẽ được hoàn thiện trong thời gian sắp tới", "info");
  }
});

// Global Logout Handler (Hỗ trợ nút đăng xuất trên cả Top Navbar và Mobile Bottom Navigation)
document.body.addEventListener("click", async (event: MouseEvent) => {
  const logoutBtn = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action='logout'], .btn-trainer-logout, #btn-trainer-logout, #btn-trainer-bottom-logout",
  );
  if (!logoutBtn) return;

  event.preventDefault();

  try {
    const { authService } = await import("./services/auth.service");
    await authService.logout();
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    const { clearAuthAndRedirect } = await import("./core/api");
    clearAuthAndRedirect();
  }
});

initRouter();

initNotification();
