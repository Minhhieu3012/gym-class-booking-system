import template from "./forgot-password.html?raw";
import { authService } from "../../services/auth.service";
import "./forgot-password.css";

export function render(): string {
  return template;
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#forgot-form");
  const emailInput = document.querySelector<HTMLInputElement>("#forgot-email");
  const errorEl = document.querySelector<HTMLDivElement>("#forgot-error");
  const successEl = document.querySelector<HTMLDivElement>("#forgot-success");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#btn-forgot-submit");

  if (!form || !emailInput || !errorEl || !successEl || !submitBtn) {
    console.error("Forgot password form elements not found");
    return;
  }

  form.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      errorEl.textContent = "Vui lòng nhập địa chỉ email.";
      errorEl.style.display = "block";
      successEl.style.display = "none";
      return;
    }

    // Reset messages and show loading state
    errorEl.style.display = "none";
    errorEl.textContent = "";
    successEl.style.display = "none";
    successEl.textContent = "";

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style="width: 1rem; height: 1rem;"></span>
      SENDING...
    `;

    try {
      const response = await authService.forgotPassword({ email });

      // Show success
      successEl.textContent =
        response.message ||
        "Đã gửi hướng dẫn khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.";
      successEl.style.display = "block";

      // Optionally clear input
      emailInput.value = "";
    } catch (error: unknown) {
      // Show error
      errorEl.textContent = authService.extractErrorMessage(error);
      errorEl.style.display = "block";
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        SEND RESET LINK
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
    }
  });
}
