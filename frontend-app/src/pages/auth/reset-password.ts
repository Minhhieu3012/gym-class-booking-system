import template from "./reset-password.html?raw";
import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";

// ── render ────────────────────────────────────────────────────────────────────
export function render(): string {
  return template;
}

// ── init ──────────────────────────────────────────────────────────────────────
export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#reset-form");
  const tokenInput = document.querySelector<HTMLInputElement>("#reset-token");
  const newPasswordInput = document.querySelector<HTMLInputElement>("#reset-new-password");
  const confirmPasswordInput = document.querySelector<HTMLInputElement>("#reset-confirm-password");
  const errorEl = document.querySelector<HTMLDivElement>("#reset-error");
  const submitBtn = document.querySelector<HTMLButtonElement>("#reset-submit");

  if (!form || !tokenInput || !newPasswordInput || !confirmPasswordInput || !errorEl || !submitBtn) {
    console.error("Reset password form elements not found");
    return;
  }

  form.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const token = tokenInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // ── Validation ──
    if (!token || !newPassword || !confirmPassword) {
      errorEl.textContent = "Vui lòng điền đầy đủ các trường.";
      return;
    }

    if (newPassword !== confirmPassword) {
      errorEl.textContent = "Mật khẩu xác nhận không khớp.";
      return;
    }

    // Reset error & update button state
    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style="width: 1rem; height: 1rem;"></span>
      Processing...
    `;

    try {
      await authService.resetPassword({ token, newPassword });
      
      // Success
      alert("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
      navigate("/login");
      
    } catch (error: unknown) {
      // Error
      errorEl.textContent = authService.extractErrorMessage(error);
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.textContent = "SAVE NEW PASSWORD";
    }
  });
}
