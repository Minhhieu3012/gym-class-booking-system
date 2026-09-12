import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import loginTemplate from "./login.html?raw";
import "./login.css";


export function render(): string {
  return loginTemplate;
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#login-form");
  const submitBtn = document.querySelector<HTMLButtonElement>("#login-submit");
  const errorDiv = document.querySelector<HTMLDivElement>("#login-error");
  const togglePwBtn =
    document.querySelector<HTMLButtonElement>("#login-toggle-pw");
  const passwordInput =
    document.querySelector<HTMLInputElement>("#login-password");

    togglePwBtn?.addEventListener("click", () => {
    if (!passwordInput) return;
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    const icon = document.querySelector<SVGElement>("#pw-eye-icon");
    if (icon) {
      icon.innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });

  form?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!submitBtn || !errorDiv) return;

    const username = (
      document.querySelector<HTMLInputElement>("#login-username")?.value ?? ""
    ).trim();
    const password =
      document.querySelector<HTMLInputElement>("#login-password")?.value ?? "";

    errorDiv.textContent = "";

    if (!username || !password) {
      errorDiv.textContent = "Vui lòng nhập đầy đủ email/SĐT và mật khẩu.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    try {
      const loginRes = await authService.login({ username, password });

      // Redirect-back support: /login?redirect=/admin/dashboard
      const params = new URLSearchParams(window.location.search);
      let redirectTo = params.get("redirect");
      if (!redirectTo) {
        if (loginRes.user?.role === "ADMIN") {
          redirectTo = "/admin/dashboard";
        } else if (loginRes.user?.role === "TRAINER") {
          redirectTo = "/trainer/time-slots";
        } else {
          redirectTo = "/";
        }
      }
      navigate(redirectTo);
    } catch (error: unknown) {
      errorDiv.textContent = authService.extractErrorMessage(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "LOG IN";
    }
  });
}
