import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import template from "./register.html?raw";

export function render(): string {
  return template;
}

// Controller — toàn bộ logic xử lý sự kiện
export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#register-form");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#register-submit");
  const errorDiv = document.querySelector<HTMLDivElement>("#register-error");
  const togglePwBtn = document.querySelector<HTMLButtonElement>(
    "#register-toggle-pw",
  );
  const passwordInput =
    document.querySelector<HTMLInputElement>("#register-password");
  const pwBar = document.querySelector<HTMLDivElement>("#register-pw-bar");
  const pwStrength = document.querySelector<HTMLSpanElement>(
    "#register-pw-strength",
  );

  // Toggle show/hide password
  togglePwBtn?.addEventListener("click", () => {
    if (!passwordInput) return;
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    const icon = document.querySelector<SVGElement>("#register-pw-eye-icon");
    if (icon) {
      icon.innerHTML = isHidden
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  });

  // Password strength indicator
  passwordInput?.addEventListener("input", () => {
    const val = passwordInput.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels: Record<
      number,
      { width: string; label: string; color: string }
    > = {
      0: { width: "0%", label: "", color: "var(--color-border)" },
      1: { width: "25%", label: "WEAK", color: "#ef4444" },
      2: { width: "50%", label: "FAIR", color: "#f59e0b" },
      3: { width: "75%", label: "GOOD", color: "var(--color-tertiary)" },
      4: { width: "100%", label: "STRONG", color: "var(--color-tertiary)" },
    };

    const level = levels[score];
    if (pwBar) {
      pwBar.style.width = level.width;
      pwBar.style.backgroundColor = level.color;
    }
    if (pwStrength) {
      pwStrength.textContent = level.label;
    }
  });

  form?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!submitBtn || !errorDiv) return;

    const fullName = (
      document.querySelector<HTMLInputElement>("#register-fullname")?.value ??
      ""
    ).trim();
    const email = (
      document.querySelector<HTMLInputElement>("#register-email")?.value ?? ""
    ).trim();
    const phone = (
      document.querySelector<HTMLInputElement>("#register-phone")?.value ?? ""
    ).trim();
    const password =
      document.querySelector<HTMLInputElement>("#register-password")?.value ??
      "";
    const termsChecked =
      document.querySelector<HTMLInputElement>("#register-terms")?.checked ??
      false;

    errorDiv.textContent = "";

    if (!fullName || !email || !phone || !password) {
      errorDiv.textContent = "Vui lòng điền đầy đủ tất cả các trường.";
      return;
    }

    if (!termsChecked) {
      errorDiv.textContent =
        "Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    try {
      await authService.registerMember({ fullName, phone, email, password });
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error: unknown) {
      errorDiv.textContent = authService.extractErrorMessage(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "CREATE MEMBER ACCOUNT ⚡";
    }
  });
}
