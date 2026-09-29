export type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

/**
 * Lấy hoặc tạo container chứa các popup toast toàn cục
 */
function getOrCreateToastContainer(): HTMLElement {
  let container = document.getElementById("global-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "global-toast-container";
    container.className = "gym-toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "999999";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Trả về icon SVG phù hợp với từng loại toast
 */
function getToastIcon(type: ToastType): string {
  switch (type) {
    case "success":
      return `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
    case "error":
      return `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      `;
    case "warning":
      return `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
    case "info":
    default:
      return `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      `;
  }
}

/**
 * Bảng dịch và hàm chuyển đổi các thông báo lỗi / chuỗi tiếng Anh từ Backend sang tiếng Việt thân thiện
 */
export function translateErrorMessage(message: unknown): string {
  if (!message || typeof message !== "string") {
    return "Đã xảy ra lỗi. Vui lòng thử lại!";
  }

  const trimmed = message.trim();

  const directMap: Record<string, string> = {
    // Auth & User
    "Bad credentials": "Tên đăng nhập hoặc mật khẩu không chính xác.",
    "User not found": "Không tìm thấy thông tin tài khoản người dùng.",
    "Username is already taken!": "Tên đăng nhập đã được sử dụng.",
    "Username is already taken": "Tên đăng nhập đã được sử dụng.",
    "Email already exists": "Địa chỉ email này đã được sử dụng.",
    "Email is already in use!": "Địa chỉ email này đã được sử dụng.",
    "Phone already exists": "Số điện thoại này đã được sử dụng.",
    "Account is locked": "Tài khoản hiện đang bị tạm khóa. Vui lòng liên hệ Admin.",
    "Account is disabled": "Tài khoản của bạn đã bị vô hiệu hóa.",
    "Old password does not match": "Mật khẩu cũ không chính xác.",
    "Token is invalid or expired": "Mã xác thực không hợp lệ hoặc đã hết hạn.",
    "Unauthorized": "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.",
    "Unauthorized: User is not authenticated": "Vui lòng đăng nhập để thực hiện thao tác này.",
    "Access denied": "Bạn không có quyền thực hiện thao tác này.",
    "Access denied: You can only update your own notifications": "Bạn chỉ có thể cập nhật thông báo của chính mình.",

    // Group Classes (Lớp học nhóm)
    "Gym class ID is required": "Vui lòng chọn lớp học hợp lệ.",
    "Gym class not found": "Không tìm thấy thông tin lớp học.",
    "Class not found": "Không tìm thấy thông tin lớp học.",
    "Cannot book a class that has already started": "Không thể đặt lớp học đã bắt đầu hoặc đã qua giờ.",
    "Gym class is not available for booking": "Lớp học hiện không khả dụng để đặt chỗ.",
    "Gym class capacity is invalid": "Sĩ số lớp học không hợp lệ.",
    "Gym class is full": "Lớp học đã đủ số lượng học viên, không thể nhận thêm.",
    "Class is full": "Lớp học đã đủ số lượng học viên.",
    "Member has already booked this class": "Bạn đã đặt chỗ cho lớp học này rồi.",
    "Already booked this class": "Bạn đã đặt chỗ cho lớp học này rồi.",
    "Cannot cancel booking less than 24 hours before class start": "Chỉ được phép hủy lịch trước giờ bắt đầu lớp học ít nhất 24 tiếng.",
    "Booking not found": "Không tìm thấy thông tin đặt chỗ.",
    "Class booking not found": "Không tìm thấy thông tin lượt đặt lớp học.",

    // PT Booking & Time Slots (Huấn luyện viên cá nhân & Khung giờ)
    "Trainer time slot ID is required": "Vui lòng chọn khung giờ tập luyện.",
    "Session note is required": "Vui lòng nhập mục tiêu / ghi chú buổi tập.",
    "Trainer time slot not found": "Không tìm thấy thông tin khung giờ tập.",
    "Trainer time slot is not available": "Khung giờ này hiện không còn khả dụng hoặc đã được đặt.",
    "Time slot is not available": "Khung giờ này hiện không còn khả dụng hoặc đã được đặt.",
    "Trainer not found": "Không tìm thấy thông tin Huấn luyện viên.",
    "Trainer is not available": "Huấn luyện viên hiện không thể nhận lịch vào thời điểm này.",
    "Cannot book a time slot that has already started": "Không thể đặt khung giờ đã bắt đầu hoặc đã qua giờ.",
    "This time slot has already been booked": "Khung giờ này đã có học viên khác đặt.",
    "Time slot has already been booked": "Khung giờ này đã được đặt.",
    "Cannot create time slot in the past": "Không thể tạo khung giờ cho thời gian trong quá khứ.",
    "Start time must be before end time": "Giờ bắt đầu phải trước giờ kết thúc.",
    "Overlapping time slot": "Khung giờ này bị trùng lặp với lịch dạy khác.",
    "Cannot cancel time slot with booked status": "Không thể hủy khung giờ đã có học viên đặt lịch.",
    "Cannot cancel PT booking less than 24 hours before session": "Chỉ được phép hủy lịch PT trước giờ hẹn ít nhất 24 tiếng.",
    "PT booking not found": "Không tìm thấy thông tin lịch hẹn PT.",

    // Member Package & Payments
    "Member package not found": "Không tìm thấy thông tin gói tập của bạn.",
    "Member package has no remaining sessions": "Gói tập của bạn đã hết số buổi tập. Vui lòng mua hoặc gia hạn thêm gói mới.",
    "No active membership found": "Bạn chưa có gói hội viên còn hiệu lực. Vui lòng mua gói tập để tiếp tục đặt lịch.",
    "Package expired": "Gói tập của bạn đã hết hạn sử dụng.",
    "Package not found": "Không tìm thấy thông tin gói tập.",
    "Transaction not found": "Không tìm thấy thông tin giao dịch.",

    // Generic / HTTP
    "Network Error": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
    "Request failed with status code 500": "Lỗi hệ thống máy chủ (500). Vui lòng thử lại sau.",
    "Request failed with status code 404": "Không tìm thấy dữ liệu yêu cầu (404).",
    "Request failed with status code 403": "Bạn không có quyền thực hiện thao tác này (403).",
    "Request failed with status code 400": "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
    "Request failed with status code 401": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    "An unexpected error occurred": "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.",
    "Internal server error": "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
  };

  if (directMap[trimmed]) {
    return directMap[trimmed];
  }

  // Khớp theo cụm từ (fuzzy matching)
  const lower = trimmed.toLowerCase();

  if (lower.includes("already booked")) {
    return "Bạn đã đặt lịch này rồi.";
  }
  if (lower.includes("class is full") || lower.includes("class is already full") || lower.includes("gym class is full")) {
    return "Lớp học đã đủ số lượng học viên.";
  }
  if (lower.includes("already started")) {
    return "Không thể đặt lịch đã bắt đầu hoặc đã qua giờ.";
  }
  if (lower.includes("no remaining sessions") || lower.includes("out of sessions")) {
    return "Gói tập của bạn đã hết số buổi tập. Vui lòng mua gói mới.";
  }
  if (lower.includes("slot is not available") || lower.includes("slot not available")) {
    return "Khung giờ này không khả dụng hoặc đã được đặt.";
  }
  if (lower.includes("bad credentials")) {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }
  if (lower.includes("session note is required")) {
    return "Vui lòng nhập mục tiêu / ghi chú buổi tập.";
  }
  if (lower.includes("phone already exists")) {
    return "Số điện thoại đã tồn tại trong hệ thống.";
  }
  if (lower.includes("email already exists") || lower.includes("email is already in use")) {
    return "Email đã tồn tại trong hệ thống.";
  }
  if (lower.includes("username already exists") || lower.includes("username is already taken")) {
    return "Tên đăng nhập đã được sử dụng.";
  }
  if (lower.includes("less than 24 hours") || lower.includes("cancel booking less than")) {
    return "Chỉ được phép hủy lịch trước giờ hẹn ít nhất 24 tiếng.";
  }
  if (lower.includes("overlapping") || lower.includes("duplicate slot")) {
    return "Khung giờ này bị trùng lặp với lịch khác của bạn.";
  }
  if (lower.includes("start time must be before end time")) {
    return "Giờ bắt đầu phải trước giờ kết thúc.";
  }
  if (lower.includes("network error") || lower.includes("failed to fetch")) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.";
  }
  if (lower.includes("unauthorized") || lower.includes("not authenticated")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (lower.includes("access denied") || lower.includes("forbidden")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  return trimmed;
}

/**
 * Hiển thị thông báo Toast popup hiện đại thay thế alert
 */
export function showToast(
  message: string,
  typeOrOptions: ToastType | ToastOptions = "info",
  durationMs = 4000,
): void {
  const translatedMessage = translateErrorMessage(message);
  let type: ToastType = "info";
  let duration = durationMs;

  if (typeof typeOrOptions === "string") {
    type = typeOrOptions;
  } else if (typeof typeOrOptions === "object" && typeOrOptions !== null) {
    if (typeOrOptions.type) type = typeOrOptions.type;
    if (typeOrOptions.duration) duration = typeOrOptions.duration;
  }

  const container = getOrCreateToastContainer();

  const toast = document.createElement("div");
  toast.className = `gym-toast gym-toast-${type} shadow-lg`;
  toast.style.pointerEvents = "auto";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  toast.innerHTML = `
    <div class="gym-toast-icon-box">
      ${getToastIcon(type)}
    </div>
    <div class="gym-toast-body text-break">
      ${translatedMessage}
    </div>
    <button type="button" class="gym-toast-close" aria-label="Đóng thông báo">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation vào
  requestAnimationFrame(() => {
    toast.classList.add("gym-toast-visible");
  });

  let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

  const dismiss = () => {
    if (dismissTimeout) clearTimeout(dismissTimeout);
    toast.classList.remove("gym-toast-visible");
    toast.classList.add("gym-toast-hiding");
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true },
    );
    // Fallback remove sau 300ms nếu transitionend không kích hoạt
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 350);
  };

  const closeBtn = toast.querySelector<HTMLButtonElement>(".gym-toast-close");
  closeBtn?.addEventListener("click", dismiss);

  if (duration > 0) {
    dismissTimeout = setTimeout(dismiss, duration);
  }
}

/**
 * Hiển thị pop-up thông báo khi người dùng tương tác với tính năng đang phát triển / chưa hoàn thiện
 */
export function showUpcomingFeatureToast(): void {
  showToast("Tính năng sẽ được hoàn thiện trong thời gian sắp tới", "info");
}

export default showToast;

