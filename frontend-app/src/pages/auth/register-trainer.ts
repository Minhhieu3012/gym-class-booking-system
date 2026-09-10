import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import template from "./register-trainer.html?raw";

export function render(): string {
  return template;
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#trainer-form");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#trainer-submit");
  const errorDiv = document.querySelector<HTMLDivElement>("#trainer-error");
  const togglePwBtn =
    document.querySelector<HTMLButtonElement>("#trainer-toggle-pw");
  const passwordInput =
    document.querySelector<HTMLInputElement>("#trainer-password");
  const pwStrength = document.querySelector<HTMLSpanElement>(
    "#trainer-pw-strength",
  );
  const bioInput = document.querySelector<HTMLTextAreaElement>("#trainer-bio");
  const bioCount =
    document.querySelector<HTMLSpanElement>("#trainer-bio-count");

    togglePwBtn?.addEventListener("click", () => {
    if (!passwordInput) return;
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    const icon = document.querySelector<SVGElement>("#trainer-pw-eye-icon");
    if (icon) {
      icon.innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });

  // Password strength indicator — 4 segment bars
  passwordInput?.addEventListener("input", () => {
    const val = passwordInput.value;
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
    const labels = ["", "WEAK", "FAIR", "GOOD", "OPTIMAL STRENGTH"];

    for (let i = 1; i <= 4; i++) {
      const bar = document.querySelector<HTMLDivElement>(
        `#trainer-pw-bar-${i}`,
      );
      if (bar) {
        bar.style.backgroundColor =
          i <= score ? colors[score] : "var(--color-border)";
      }
    }
    if (pwStrength) {
      pwStrength.textContent = val.length > 0 ? labels[score] : "";
    }
  });

  // Bio character counter
  bioInput?.addEventListener("input", () => {
    if (bioCount) {
      bioCount.textContent = `${bioInput.value.length} / 500`;
    }
  });

  form?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!submitBtn || !errorDiv) return;

    const fullName = (
      document.querySelector<HTMLInputElement>("#trainer-fullname")?.value ?? ""
    ).trim();
    const email = (
      document.querySelector<HTMLInputElement>("#trainer-email")?.value ?? ""
    ).trim();
    const phone = (
      document.querySelector<HTMLInputElement>("#trainer-phone")?.value ?? ""
    ).trim();
    const password =
      document.querySelector<HTMLInputElement>("#trainer-password")?.value ??
      "";
    const specialization = (
      document.querySelector<HTMLInputElement>("#trainer-specialization")
        ?.value ?? ""
    ).trim();
    const experienceYears = Number(
      document.querySelector<HTMLInputElement>("#trainer-experience")?.value ??
        "0",
    );
    const hourlyFee = Number(
      document.querySelector<HTMLInputElement>("#trainer-hourly-fee")?.value ??
        "0",
    );
    const bio = (
      document.querySelector<HTMLTextAreaElement>("#trainer-bio")?.value ?? ""
    ).trim();
    const certifyChecked =
      document.querySelector<HTMLInputElement>("#trainer-certify")?.checked ??
      false;

    errorDiv.textContent = "";

    if (!fullName || !email || !phone || !password || !specialization || !bio) {
      errorDiv.textContent = "Vui lòng điền đầy đủ tất cả các trường.";
      return;
    }

    if (experienceYears < 0 || hourlyFee < 0) {
      errorDiv.textContent = "Số năm kinh nghiệm và mức phí không được âm.";
      return;
    }

    if (!certifyChecked) {
      errorDiv.textContent =
        "Bạn cần xác nhận tính chính xác của thông tin trước khi nộp hồ sơ.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi hồ sơ...";

    try {
      await authService.registerTrainer({
        fullName,
        phone,
        email,
        password,
        specialization,
        experienceYears,
        hourlyFee,
        bio,
      });
      alert(
        "Hồ sơ của bạn đã được gửi thành công. Vui lòng chờ Admin phê duyệt.",
      );
      navigate("/");
    } catch (error: unknown) {
      errorDiv.textContent = authService.extractErrorMessage(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "SUBMIT APPLICATION ⚡";
    }
  });
}
