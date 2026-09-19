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
 * Hiển thị thông báo Toast popup hiện đại thay thế alert
 */
export function showToast(
  message: string,
  typeOrOptions: ToastType | ToastOptions = "info",
  durationMs = 4000,
): void {
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
      ${message}
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

export default showToast;
