import { authService } from "../../services/auth.service";
import { navigate } from "../../core/router";
import template from "./register-trainer.html?raw";
import "./register-trainer.css";

export function render(): string {
  return template;
}

interface FeedbackModalOptions {
  type: "success" | "error";
  title: string;
  message: string;
  details?: string[];
  primaryBtnText?: string;
  secondaryBtnText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
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

  // Modal elements
  const modalOverlay = document.querySelector<HTMLDivElement>(
    "#trainer-modal-overlay",
  );
  const modalCloseIcon = document.querySelector<HTMLButtonElement>(
    "#trainer-modal-close-icon",
  );
  const modalIconWrapper = document.querySelector<HTMLDivElement>(
    "#trainer-modal-icon-wrapper",
  );
  const modalTitle = document.querySelector<HTMLHeadingElement>(
    "#trainer-modal-title",
  );
  const modalMessage = document.querySelector<HTMLParagraphElement>(
    "#trainer-modal-message",
  );
  const modalDetailsBox = document.querySelector<HTMLDivElement>(
    "#trainer-modal-details-box",
  );
  const modalDetailsList = document.querySelector<HTMLUListElement>(
    "#trainer-modal-details-list",
  );
  const modalPrimaryBtn = document.querySelector<HTMLButtonElement>(
    "#trainer-modal-btn-primary",
  );
  const modalSecondaryBtn = document.querySelector<HTMLButtonElement>(
    "#trainer-modal-btn-secondary",
  );
  const modalCard = modalOverlay?.querySelector<HTMLDivElement>(
    ".trainer-modal-card",
  );

  let activePrimaryHandler: (() => void) | null = null;
  let activeSecondaryHandler: (() => void) | null = null;

  function closeModal(): void {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("show");
    modalOverlay.setAttribute("aria-hidden", "true");
  }

  function showFeedbackModal(opts: FeedbackModalOptions): void {
    if (
      !modalOverlay ||
      !modalCard ||
      !modalTitle ||
      !modalMessage ||
      !modalIconWrapper ||
      !modalPrimaryBtn
    ) {
      return;
    }

    modalCard.classList.remove("is-success", "is-error");
    modalCard.classList.add(
      opts.type === "success" ? "is-success" : "is-error",
    );

    if (opts.type === "success") {
      modalIconWrapper.innerHTML = `
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      `;
    } else {
      modalIconWrapper.innerHTML = `
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      `;
    }

    modalTitle.textContent = opts.title;
    modalMessage.textContent = opts.message;

    // Details box
    if (
      opts.details &&
      opts.details.length > 0 &&
      modalDetailsBox &&
      modalDetailsList
    ) {
      modalDetailsList.innerHTML = opts.details
        .map((item) => `<li>${item}</li>`)
        .join("");
      modalDetailsBox.classList.remove("d-none");
    } else if (modalDetailsBox) {
      modalDetailsBox.classList.add("d-none");
    }

    // Primary button
    modalPrimaryBtn.textContent =
      opts.primaryBtnText ||
      (opts.type === "success" ? "Về Trang Chủ" : "Đã hiểu, tôi sẽ sửa lại");
    activePrimaryHandler = opts.onPrimaryClick || null;

    // Secondary button
    if (opts.secondaryBtnText && modalSecondaryBtn) {
      modalSecondaryBtn.textContent = opts.secondaryBtnText;
      modalSecondaryBtn.classList.remove("d-none");
      activeSecondaryHandler = opts.onSecondaryClick || null;
    } else if (modalSecondaryBtn) {
      modalSecondaryBtn.classList.add("d-none");
      activeSecondaryHandler = null;
    }

    modalOverlay.classList.add("show");
    modalOverlay.setAttribute("aria-hidden", "false");
  }

  // Modal button events
  modalPrimaryBtn?.addEventListener("click", () => {
    closeModal();
    if (activePrimaryHandler) {
      activePrimaryHandler();
    }
  });

  modalSecondaryBtn?.addEventListener("click", () => {
    closeModal();
    if (activeSecondaryHandler) {
      activeSecondaryHandler();
    }
  });

  modalCloseIcon?.addEventListener("click", closeModal);

  modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay?.classList.contains("show")) {
      closeModal();
    }
  });

  // Toggle Password
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

  // Password strength indicator aligned with backend validation
  // Backend rule: >= 6 chars, [a-z], [A-Z], [0-9], [@$!%*?&]
  passwordInput?.addEventListener("input", () => {
    const val = passwordInput.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[@$!%*?&]/.test(val)) score++;

    const colors = [
      "var(--color-border)",
      "#ef4444",
      "#f59e0b",
      "#0284c7",
      "#00857a",
    ];
    const labels = [
      "",
      "YẾU (CẦN THÊM ĐIỀU KIỆN)",
      "TRUNG BÌNH",
      "KHÁ TỐT",
      "HỢP LỆ (TỐI ƯU)",
    ];

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
      pwStrength.style.color = colors[score];
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
    if (!submitBtn) return;

    const fullNameInput =
      document.querySelector<HTMLInputElement>("#trainer-fullname");
    const emailInput =
      document.querySelector<HTMLInputElement>("#trainer-email");
    const phoneInput =
      document.querySelector<HTMLInputElement>("#trainer-phone");
    const passInput =
      document.querySelector<HTMLInputElement>("#trainer-password");
    const specInput = document.querySelector<HTMLInputElement>(
      "#trainer-specialization",
    );
    const expInput =
      document.querySelector<HTMLInputElement>("#trainer-experience");
    const feeInput =
      document.querySelector<HTMLInputElement>("#trainer-hourly-fee");
    const bioField =
      document.querySelector<HTMLTextAreaElement>("#trainer-bio");
    const certifyCheckbox =
      document.querySelector<HTMLInputElement>("#trainer-certify");

    const fullName = (fullNameInput?.value ?? "").trim();
    const email = (emailInput?.value ?? "").trim();
    const phone = (phoneInput?.value ?? "").trim();
    const password = passInput?.value ?? "";
    const specialization = (specInput?.value ?? "").trim();
    const experienceYears = Number(expInput?.value ?? "0");
    const hourlyFee = Number(feeInput?.value ?? "0");
    const bio = (bioField?.value ?? "").trim();
    const certifyChecked = certifyCheckbox?.checked ?? false;

    if (errorDiv) errorDiv.textContent = "";

    // Client-side validation
    const missingFields: string[] = [];
    if (!fullName) missingFields.push("Họ và tên");
    if (!email) missingFields.push("Email");
    if (!phone) missingFields.push("Số điện thoại");
    if (!password) missingFields.push("Mật khẩu");
    if (!specialization) missingFields.push("Chuyên môn huấn luyện");
    if (!bio) missingFields.push("Giới thiệu bản thân (Bio)");

    if (missingFields.length > 0) {
      showFeedbackModal({
        type: "error",
        title: "Thiếu thông tin bắt buộc",
        message: "Vui lòng nhập đầy đủ các trường thông tin sau:",
        details: missingFields.map((f) => `Chưa điền: ${f}`),
        primaryBtnText: "Đã hiểu, tôi sẽ điền bổ sung",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFeedbackModal({
        type: "error",
        title: "Email chưa hợp lệ",
        message:
          "Địa chỉ email không đúng định dạng. Vui lòng nhập email hợp lệ (ví dụ: trainer@example.com).",
        primaryBtnText: "Sửa lại email",
        onPrimaryClick: () => emailInput?.focus(),
      });
      return;
    }

    const vnPhoneRegex = /^0\d{9,10}$/;
    if (!vnPhoneRegex.test(phone)) {
      showFeedbackModal({
        type: "error",
        title: "Số điện thoại chưa hợp lệ",
        message: "Hệ thống yêu cầu số điện thoại di động Việt Nam hợp lệ.",
        details: [
          "Phải bắt đầu bằng số 0 (ví dụ: 0912345678, 0987654321)",
          "Bao gồm chính xác 10 hoặc 11 chữ số",
          "Không chứa ký tự đặc biệt hoặc khoảng trắng",
        ],
        primaryBtnText: "Sửa lại số điện thoại",
        onPrimaryClick: () => phoneInput?.focus(),
      });
      return;
    }

    const pwRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,100}$/;
    if (!pwRegex.test(password)) {
      showFeedbackModal({
        type: "error",
        title: "Mật khẩu chưa đáp ứng tiêu chuẩn",
        message:
          "Để bảo vệ tài khoản huấn luyện viên, mật khẩu cần thỏa mãn các tiêu chí sau:",
        details: [
          "Độ dài từ 6 đến 100 ký tự",
          "Chứa ít nhất 1 chữ in hoa (A-Z)",
          "Chứa ít nhất 1 chữ in thường (a-z)",
          "Chứa ít nhất 1 chữ số (0-9)",
          "Chứa ít nhất 1 ký tự đặc biệt (@, $, !, %, *, ?, &)",
        ],
        primaryBtnText: "Đặt lại mật khẩu",
        onPrimaryClick: () => passInput?.focus(),
      });
      return;
    }

    if (experienceYears < 0 || hourlyFee < 0) {
      showFeedbackModal({
        type: "error",
        title: "Giá trị không hợp lệ",
        message: "Số năm kinh nghiệm và mức phí theo giờ không được là số âm.",
        primaryBtnText: "Kiểm tra lại",
      });
      return;
    }

    if (!certifyChecked) {
      showFeedbackModal({
        type: "error",
        title: "Xác nhận cam kết",
        message:
          "Vui lòng tích vào ô cam kết tính chính xác và trung thực của hồ sơ trước khi nộp.",
        primaryBtnText: "Tôi hiểu rồi",
        onPrimaryClick: () => certifyCheckbox?.focus(),
      });
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

      showFeedbackModal({
        type: "success",
        title: "Nộp Hồ Sơ Thành Công! 🎉",
        message:
          "Hồ sơ Huấn Luyện Viên của bạn đã được gửi thành công đến Ban Quản Trị GYM HUB.",
        details: [
          "⏳ Trạng thái: Chờ duyệt (PENDING ADMIN REVIEW)",
          "⏱️ Thời gian phản hồi dự kiến: 24 – 48 giờ",
          "📧 Sau khi duyệt, thông báo kích hoạt sẽ được gửi tới email của bạn.",
        ],
        primaryBtnText: "Về Trang Chủ",
        secondaryBtnText: "Đến Trang Đăng Nhập",
        onPrimaryClick: () => navigate("/"),
        onSecondaryClick: () => navigate("/login"),
      });
    } catch (error: unknown) {
      console.error("Lỗi đăng ký HLV:", error);
      const errorDetails = authService.extractErrorDetails(error);

      showFeedbackModal({
        type: "error",
        title: errorDetails.title,
        message: errorDetails.message,
        details:
          errorDetails.details.length > 0
            ? errorDetails.details
            : undefined,
        primaryBtnText: "Đã hiểu, tôi sẽ sửa lại",
      });

      if (errorDiv) {
        errorDiv.textContent = authService.extractErrorMessage(error);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "SUBMIT APPLICATION ⚡";
    }
  });
}

