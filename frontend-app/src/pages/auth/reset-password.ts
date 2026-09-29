import template from "./reset-password.html?raw";
import { showToast } from "../../utils/toast";
import "./reset-password.css";


export function render(): string {
  return template;
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#reset-form");
  const tokenInput = document.querySelector<HTMLInputElement>("#reset-token");
  const newPasswordInput = document.querySelector<HTMLInputElement>(
    "#reset-new-password",
  );
  const confirmPasswordInput = document.querySelector<HTMLInputElement>(
    "#reset-confirm-password",
  );
  const errorEl = document.querySelector<HTMLDivElement>("#reset-error");
  const submitBtn = document.querySelector<HTMLButtonElement>("#reset-submit");

  if (
    !form ||
    !tokenInput ||
    !newPasswordInput ||
    !confirmPasswordInput ||
    !errorEl ||
    !submitBtn
  ) {
    console.error("Reset password form elements not found");
    return;
  }

  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    const token = tokenInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!token || !newPassword || !confirmPassword) {
      errorEl.textContent = "Vui lòng điền đầy đủ các trường.";
      return;
    }

    if (newPassword !== confirmPassword) {
      errorEl.textContent = "Mật khẩu xác nhận không khớp.";
      return;
    }

    // Reset error
    errorEl.textContent = "";

    // Hiển thị thông báo tính năng đang phát triển
    showToast("Tính năng sẽ được hoàn thiện trong thời gian sắp tới", "info");
  });
}
