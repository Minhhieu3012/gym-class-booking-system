import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import template from "./change-password.html?raw";

export function render(): string {
  return template;
}

// Helper: toggle password visibility
function wireTogglePw(btnId: string, inputId: string, iconId: string): void {
  const btn = document.querySelector<HTMLButtonElement>(`#${btnId}`);
  const input = document.querySelector<HTMLInputElement>(`#${inputId}`);
  const icon = document.querySelector<SVGElement>(`#${iconId}`);
  btn?.addEventListener("click", () => {
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    if (icon) {
      icon.innerHTML = show
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });
}

// Controller
export function init(): void {
  // ── Wire toggle buttons ────────────────────────────────────────
  wireTogglePw("toggle-current-pw", "current-password", "eye-current");
  wireTogglePw("toggle-new-pw", "new-password", "eye-new");
  wireTogglePw("toggle-confirm-pw", "confirm-password", "eye-confirm");

  // ── Password strength indicator ────────────────────────────────
  const newPwInput = document.querySelector<HTMLInputElement>("#new-password");
  const confirmPwInput = document.querySelector<HTMLInputElement>("#confirm-password");
  const strengthLabel = document.querySelector<HTMLSpanElement>("#new-pw-strength-label");
  const pwMatchLabel = document.querySelector<HTMLSpanElement>("#pw-match-label");
  const lengthCount = document.querySelector<HTMLSpanElement>("#pw-length-count");

  newPwInput?.addEventListener("input", () => {
    const val = newPwInput.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const colors = [
      "var(--color-border)",
      "#ef4444",
      "#f59e0b",
      "var(--color-tertiary)",
      "var(--color-tertiary)",
    ];
    const labels = ["", "WEAK", "FAIR", "GOOD", "STRENGTH: OPTIMAL"];

    for (let i = 1; i <= 4; i++) {
      const bar = document.querySelector<HTMLDivElement>(`#npw-bar-${i}`);
      if (bar) bar.style.backgroundColor = i <= score ? colors[score] : "var(--color-border)";
    }
    if (strengthLabel) strengthLabel.textContent = val ? labels[score] : "";
    if (lengthCount) lengthCount.textContent = String(val.length);

    // Realtime match hint
    if (confirmPwInput?.value && pwMatchLabel) {
      const match = confirmPwInput.value === val;
      pwMatchLabel.textContent = match ? "✓ Keys Match" : "✗ Mismatch";
      pwMatchLabel.style.color = match ? "var(--color-tertiary)" : "var(--color-primary)";
    }
  });

  confirmPwInput?.addEventListener("input", () => {
    if (!pwMatchLabel || !newPwInput) return;
    if (confirmPwInput.value === "") {
      pwMatchLabel.textContent = "";
      return;
    }
    const match = confirmPwInput.value === newPwInput.value;
    pwMatchLabel.textContent = match ? "✓ Keys Match" : "✗ Mismatch";
    pwMatchLabel.style.color = match ? "var(--color-tertiary)" : "var(--color-primary)";
  });

  // ── Form submit ────────────────────────────────────────────────
  const form = document.querySelector<HTMLFormElement>("#password-form");
  const passwordError = document.querySelector<HTMLDivElement>("#password-error");
  const saveBtn = document.querySelector<HTMLButtonElement>("#btn-save-password");

  form?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!saveBtn || !passwordError) return;

    const currentPassword =
      document.querySelector<HTMLInputElement>("#current-password")?.value ?? "";
    const newPassword =
      document.querySelector<HTMLInputElement>("#new-password")?.value ?? "";
    const confirmPassword =
      document.querySelector<HTMLInputElement>("#confirm-password")?.value ?? "";

    passwordError.textContent = "";

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError.textContent = "Vui lòng điền đầy đủ tất cả các trường mật khẩu.";
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError.textContent = "Mật khẩu mới và xác nhận mật khẩu không khớp.";
      return;
    }

    if (newPassword.length < 8) {
      passwordError.textContent = "Mật khẩu mới phải có ít nhất 8 ký tự.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Đang cập nhật...";

    try {
      await userService.changePassword({ currentPassword, newPassword });
      alert("Đổi mật khẩu thành công! Phiên đăng nhập trên các thiết bị khác đã bị vô hiệu hóa.");
      navigate("/profile");
    } catch (error: unknown) {
      const msg = authService.extractErrorMessage(error);
      passwordError.textContent = msg.includes("INVALID_CURRENT_PASSWORD")
        ? "Mật khẩu hiện tại không đúng. Vui lòng thử lại."
        : msg;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "SAVE NEW PASSWORD ⚡";
    }
  });
}
