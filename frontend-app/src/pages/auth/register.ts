import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import template from "./register.html?raw";
import "./register.css";

export function render(): string {
  return template;
}

function getInput(id: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(id);
}

function setFieldError(
  input: HTMLInputElement | null,
  errorElement: HTMLElement | null,
  message: string,
): void {
  if (errorElement) {
    errorElement.textContent = message;
  }

  if (input) {
    input.classList.toggle("register-input-invalid", !!message);
    input.classList.toggle("register-input-valid", !message && !!input.value.trim());
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password)
  );
}

function getPasswordStrength(password: string): {
  width: string;
  label: string;
  color: string;
} {
  if (!password) {
    return {
      width: "0%",
      label: "",
      color: "var(--color-border)",
    };
  }

  let score = 0;

  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  const levels: Record<
    number,
    {
      width: string;
      label: string;
      color: string;
    }
  > = {
    0: {
      width: "0%",
      label: "",
      color: "var(--color-border)",
    },
    1: {
      width: "25%",
      label: "WEAK",
      color: "#ef4444",
    },
    2: {
      width: "50%",
      label: "FAIR",
      color: "#f59e0b",
    },
    3: {
      width: "75%",
      label: "GOOD",
      color: "var(--color-tertiary)",
    },
    4: {
      width: "100%",
      label: "STRONG",
      color: "var(--color-tertiary)",
    },
  };

  return levels[Math.min(score, 4)];
}

function setEmailStatus(email: string): void {
  const status = document.querySelector<HTMLElement>(
    "#register-email-status",
  );

  const statusIcon = document.querySelector<HTMLElement>(
    "#register-email-status-icon",
  );

  if (!status || !statusIcon) return;

  if (!email) {
    status.textContent = "";
    status.className =
      "register-label-status text-neutral fw-bold d-flex align-items-center gap-1";
    statusIcon.innerHTML = "";
    statusIcon.className =
      "register-input-status-icon input-group-text bg-surface border-theme text-neutral";
    return;
  }

  if (isValidEmail(email)) {
    status.innerHTML = `
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Valid
    `;

    status.className =
      "register-label-status register-email-valid fw-bold d-flex align-items-center gap-1";

    statusIcon.innerHTML = `
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    `;

    statusIcon.className =
      "register-input-status-icon input-group-text bg-surface border-theme register-email-valid";
  } else {
    status.innerHTML = `
      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Invalid
    `;

    status.className =
      "register-label-status register-email-invalid fw-bold d-flex align-items-center gap-1";

    statusIcon.innerHTML = `
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    `;

    statusIcon.className =
      "register-input-status-icon input-group-text bg-surface border-theme register-email-invalid";
  }
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("#register-form");

  const submitBtn =
    document.querySelector<HTMLButtonElement>("#register-submit");

  const submitText =
    document.querySelector<HTMLElement>("#register-submit-text");

  const errorDiv =
    document.querySelector<HTMLElement>("#register-error");

  const fullNameInput = getInput("#register-fullname");
  const emailInput = getInput("#register-email");
  const phoneInput = getInput("#register-phone");
  const addressInput = getInput("#register-address");
  const passwordInput = getInput("#register-password");

  const termsInput =
    document.querySelector<HTMLInputElement>("#register-terms");

  const togglePwBtn =
    document.querySelector<HTMLButtonElement>("#register-toggle-pw");

  const pwBar =
    document.querySelector<HTMLElement>("#register-pw-bar");

  const pwStrength =
    document.querySelector<HTMLElement>("#register-pw-strength");

  const fullnameError =
    document.querySelector<HTMLElement>("#register-fullname-error");

  const emailError =
    document.querySelector<HTMLElement>("#register-email-error");

  const phoneError =
    document.querySelector<HTMLElement>("#register-phone-error");

  const addressError =
    document.querySelector<HTMLElement>("#register-address-error");

  const passwordError =
    document.querySelector<HTMLElement>("#register-password-error");

  if (!form || !submitBtn || !errorDiv) {
    return;
  }

  /* ============================================================
     Show / hide password
  ============================================================ */

  togglePwBtn?.addEventListener("click", () => {
    if (!passwordInput) return;

    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";

    togglePwBtn.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password",
    );

    const icon = document.querySelector<SVGElement>(
      "#register-pw-eye-icon",
    );

    if (!icon) return;

    icon.innerHTML = isHidden
      ? `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `
      : `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
  });

  /* ============================================================
     Password strength
  ============================================================ */

  passwordInput?.addEventListener("input", () => {
    const value = passwordInput.value;

    const level = getPasswordStrength(value);

    if (pwBar) {
      pwBar.style.width = level.width;
      pwBar.style.backgroundColor = level.color;
    }

    if (pwStrength) {
      pwStrength.textContent = level.label;
    }

    if (value.length > 0) {
      setFieldError(
        passwordInput,
        passwordError,
        isStrongPassword(value)
          ? ""
          : "Password does not meet the required format.",
      );
    } else {
      setFieldError(passwordInput, passwordError, "");
    }
  });

  /* ============================================================
     Email validation
  ============================================================ */

  emailInput?.addEventListener("input", () => {
    const email = emailInput.value.trim();

    setEmailStatus(email);

    if (!email) {
      setFieldError(
        emailInput,
        emailError,
        "Email is required.",
      );
      return;
    }

    setFieldError(
      emailInput,
      emailError,
      isValidEmail(email)
        ? ""
        : "Please enter a valid email address.",
    );
  });

  /* ============================================================
     Full name
  ============================================================ */

  fullNameInput?.addEventListener("blur", () => {
    const value = fullNameInput.value.trim();

    setFieldError(
      fullNameInput,
      fullnameError,
      value ? "" : "Full name is required.",
    );
  });

  /* ============================================================
     Phone
  ============================================================ */

  phoneInput?.addEventListener("input", () => {
    const value = phoneInput.value.trim();

    if (!value) {
      setFieldError(
        phoneInput,
        phoneError,
        "Phone number is required.",
      );
      return;
    }

    setFieldError(
      phoneInput,
      phoneError,
      value.length < 8
        ? "Please enter a valid phone number."
        : "",
    );
  });

  /* ============================================================
     Address
  ============================================================ */

  addressInput?.addEventListener("blur", () => {
    const value = addressInput.value.trim();

    setFieldError(
      addressInput,
      addressError,
      value ? "" : "Address is required.",
    );
  });

  /* ============================================================
     Terms
  ============================================================ */

  termsInput?.addEventListener("change", () => {
    if (termsInput.checked) {
      errorDiv.textContent = "";
    }
  });

  /* ============================================================
     Submit
  ============================================================ */

  form.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    errorDiv.textContent = "";

    const fullName = fullNameInput?.value.trim() ?? "";
    const email = emailInput?.value.trim() ?? "";
    const phone = phoneInput?.value.trim() ?? "";
    const address = addressInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    const termsChecked = termsInput?.checked ?? false;

    let hasError = false;

    // Full name
    if (!fullName) {
      setFieldError(
        fullNameInput,
        fullnameError,
        "Full name is required.",
      );
      hasError = true;
    } else {
      setFieldError(fullNameInput, fullnameError, "");
    }

    // Email
    if (!email) {
      setFieldError(
        emailInput,
        emailError,
        "Email is required.",
      );
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError(
        emailInput,
        emailError,
        "Please enter a valid email address.",
      );
      hasError = true;
    } else {
      setFieldError(emailInput, emailError, "");
    }

    setEmailStatus(email);

    // Phone
    if (!phone) {
      setFieldError(
        phoneInput,
        phoneError,
        "Phone number is required.",
      );
      hasError = true;
    } else if (phone.length < 8) {
      setFieldError(
        phoneInput,
        phoneError,
        "Please enter a valid phone number.",
      );
      hasError = true;
    } else {
      setFieldError(phoneInput, phoneError, "");
    }

    // Address
    if (!address) {
      setFieldError(
        addressInput,
        addressError,
        "Address is required.",
      );
      hasError = true;
    } else {
      setFieldError(addressInput, addressError, "");
    }

    // Password
    if (!password) {
      setFieldError(
        passwordInput,
        passwordError,
        "Password is required.",
      );
      hasError = true;
    } else if (!isStrongPassword(password)) {
      setFieldError(
        passwordInput,
        passwordError,
        "Password must contain uppercase, lowercase, number and special character.",
      );
      hasError = true;
    } else {
      setFieldError(passwordInput, passwordError, "");
    }

    // Terms
    if (!termsChecked) {
      errorDiv.textContent =
        "You must agree to the Membership Terms to continue.";
      hasError = true;
    }

    if (hasError) {
      return;
    }

    submitBtn.disabled = true;

    if (submitText) {
      submitText.textContent = "CREATING ACCOUNT...";
    }

    try {
      await authService.registerMember({
        fullName,
        phone,
        email,
        password,
        address,
      });

      alert(
        "Member account created successfully! Please log in.",
      );

      navigate("/login");
    } catch (error: unknown) {
      console.error("Lỗi đăng ký hội viên:", error);
      const msg = authService.extractErrorMessage(error);
      alert(msg);
      errorDiv.textContent = msg;
    } finally {
      submitBtn.disabled = false;

      if (submitText) {
        submitText.textContent = "CREATE MEMBER ACCOUNT";
      }
    }
  });
}