import template from "./forgot-password.html?raw";
import { showToast } from "../../utils/toast";
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

  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      errorEl.textContent = "Vui lòng nhập địa chỉ email.";
      errorEl.style.display = "block";
      successEl.style.display = "none";
      return;
    }

    // Reset error state
    errorEl.style.display = "none";
    errorEl.textContent = "";
    successEl.style.display = "none";
    successEl.textContent = "";

    // Hiển thị thông báo tính năng đang phát triển
    showToast("Tính năng sẽ được hoàn thiện trong thời gian sắp tới", "info");
  });

  const helpLink = document.querySelector<HTMLAnchorElement>(
    ".forgot-password-footer-link[href='#']",
  );
  helpLink?.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Tính năng sẽ được hoàn thiện trong thời gian sắp tới", "info");
  });
}

