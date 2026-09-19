import interactionService from "../services/interaction.service";
import type { NotificationItem } from "../services/interaction.service";
import { isAuthenticated } from "../core/api";

/**
 * Format thời gian thông báo
 */
function formatTime(isoString?: string): string {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Escape HTML để tránh render nội dung HTML trực tiếp từ API
 */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Cập nhật badge unread trên chuông
 */
function updateNotificationBadge(
  bellBtn: HTMLElement,
  count: number,
): void {
  let badge = bellBtn.querySelector<HTMLElement>(".notification-badge");

  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");

      badge.className =
        "notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger";

      bellBtn.appendChild(badge);
    }

    badge.textContent = count > 99 ? "99+" : String(count);
    badge.setAttribute(
      "aria-label",
      `${count} thông báo chưa đọc`,
    );

    badge.style.display = "inline-block";
  } else if (badge) {
    badge.style.display = "none";
  }
}

/**
 * Lấy số lượng notification chưa đọc
 */
async function loadUnreadCount(
  bellBtn: HTMLElement,
): Promise<number> {
  if (!isAuthenticated()) {
    updateNotificationBadge(bellBtn, 0);
    return 0;
  }

  try {
    const res = await interactionService.getUnreadNotificationCount();

    let count = 0;

    if (typeof res === "number") {
      count = res;
    } else if (res && typeof res.count === "number") {
      count = res.count;
    } else if (res && typeof res.unreadCount === "number") {
      count = res.unreadCount;
    } else if (res && typeof res.data === "number") {
      count = res.data;
    }

    updateNotificationBadge(bellBtn, count);

    return count;
  } catch (error) {
    console.error(
      "Lỗi khi lấy số lượng thông báo chưa đọc:",
      error,
    );

    updateNotificationBadge(bellBtn, 0);

    return 0;
  }
}

/**
 * Render notification dropdown
 */
function renderNotificationDropdown(
  dropdown: HTMLElement,
  notifications: NotificationItem[],
  bellBtn: HTMLElement,
): void {
  const hasNotifications =
    Array.isArray(notifications) && notifications.length > 0;

  dropdown.innerHTML = `
    <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
      <span class="fw-bold text-dark">
        Thông báo
      </span>

      <button
        type="button"
        id="mark-all-read-btn"
        class="btn btn-sm btn-link text-decoration-none p-0"
        style="font-size: 0.8rem;"
      >
        Đánh dấu tất cả đã đọc
      </button>
    </div>

    <div
      class="notification-list list-group list-group-flush"
      style="max-height: 380px; overflow-y: auto;"
    >

      ${
        hasNotifications
          ? notifications
              .map((item) => {
                const isRead =
                  item.read ?? item.isRead ?? false;

                const itemClass = isRead
                  ? "text-muted opacity-75"
                  : "fw-bold bg-light-subtle";

                const badgeClass = isRead
                  ? "bg-secondary"
                  : "bg-danger";

                return `
                  <div
                    class="notification-item list-group-item list-group-item-action p-3 border-bottom ${itemClass}"
                    data-id="${escapeHtml(item.id)}"
                    data-read="${isRead}"
                    style="cursor: pointer;"
                  >

                    <div
                      class="d-flex justify-content-between align-items-start mb-1"
                    >

                      <span
                        class="badge ${badgeClass} me-2"
                        style="font-size: 0.68rem;"
                      >
                        ${escapeHtml(item.type || "NOTIFICATION")}
                      </span>

                      <small
                        class="text-muted"
                        style="font-size: 0.72rem;"
                      >
                        ${escapeHtml(formatTime(item.createdAt))}
                      </small>

                    </div>

                    <div
                      class="notification-content text-break"
                      style="
                        font-size: 0.875rem;
                        line-height: 1.4;
                      "
                    >
                      ${escapeHtml(item.content)}
                    </div>

                  </div>
                `;
              })
              .join("")
          : `
            <div class="p-4 text-center text-muted">

              <i
                class="bi bi-bell-slash fs-4 d-block mb-2"
              ></i>

              <p
                class="mb-0"
                style="font-size: 0.875rem;"
              >
                Không có thông báo nào
              </p>

            </div>
          `
      }

    </div>
  `;

  /**
   * Mark all as read
   */
  const markAllBtn =
    dropdown.querySelector<HTMLButtonElement>(
      "#mark-all-read-btn",
    );

  markAllBtn?.addEventListener("click", async (event) => {
    event.stopPropagation();

    try {
      await interactionService.markAllNotificationsAsRead();

      updateNotificationBadge(bellBtn, 0);

      const items =
        dropdown.querySelectorAll<HTMLElement>(
          ".notification-item",
        );

      items.forEach((item) => {
        item.classList.remove(
          "fw-bold",
          "bg-light-subtle",
        );

        item.classList.add(
          "text-muted",
          "opacity-75",
        );

        item.dataset.read = "true";

        const badge =
          item.querySelector<HTMLElement>(".badge");

        if (badge) {
          badge.classList.remove("bg-danger");
          badge.classList.add("bg-secondary");
        }
      });
    } catch (error) {
      console.error(
        "Lỗi khi đánh dấu tất cả thông báo:",
        error,
      );
    }
  });

  /**
   * Mark từng notification as read
   */
  const items =
    dropdown.querySelectorAll<HTMLElement>(
      ".notification-item",
    );

  items.forEach((item) => {
    item.addEventListener("click", async () => {
      const idStr = item.dataset.id;
      const isRead = item.dataset.read === "true";

      if (!idStr || isRead) {
        return;
      }

      const id = Number(idStr);

      if (Number.isNaN(id)) {
        return;
      }

      try {
        await interactionService.markNotificationAsRead(id);

        item.classList.remove(
          "fw-bold",
          "bg-light-subtle",
        );

        item.classList.add(
          "text-muted",
          "opacity-75",
        );

        item.dataset.read = "true";

        const badge =
          item.querySelector<HTMLElement>(".badge");

        if (badge) {
          badge.classList.remove("bg-danger");
          badge.classList.add("bg-secondary");
        }

        /**
         * Lấy lại unread count từ API
         * chính xác hơn việc tự -1
         */
        await loadUnreadCount(bellBtn);
      } catch (error) {
        console.error(
          `Lỗi khi đánh dấu notification #${id}:`,
          error,
        );
      }
    });
  });
}

/**
 * Khởi tạo notification navbar
 */
export function initNotification(): void {
  // Hỗ trợ cả shared navbar (gym-navbar-notification) và admin navbar (notification-bell)
  const bellBtn =
    document.getElementById("gym-navbar-notification") ||
    document.getElementById("notification-bell");

  // Hỗ trợ cả shared navbar dropdown và admin dropdown
  const dropdown =
    document.getElementById("gym-navbar-notification-dropdown") ||
    document.getElementById("notification-dropdown");

  if (!bellBtn || !dropdown) {
    return;
  }

  if (!isAuthenticated()) {
    updateNotificationBadge(bellBtn, 0);
    return;
  }

  /**
   * Không init trùng cùng một navbar
   */
  if (
    bellBtn.dataset.notificationInitialized === "true"
  ) {
    loadUnreadCount(bellBtn);
    return;
  }

  bellBtn.dataset.notificationInitialized = "true";

  /**
   * Ban đầu đóng dropdown
   */
  dropdown.classList.remove("show");

  /**
   * Load unread count
   */
  void loadUnreadCount(bellBtn);

  /**
   * Click chuông
   */
  bellBtn.addEventListener("click", async (event) => {
    event.stopPropagation();

    const isOpen =
      dropdown.classList.contains("show");

    if (isOpen) {
      dropdown.classList.remove("show");
      return;
    }

    dropdown.classList.add("show");

    dropdown.innerHTML = `
      <div class="p-4 text-center text-muted">
        <div
          class="spinner-border spinner-border-sm text-danger me-2"
          role="status"
        ></div>

        <span style="font-size: 0.875rem;">
          Đang tải thông báo...
        </span>
      </div>
    `;

    try {
      const res =
        await interactionService.getMyNotifications({
          size: 10,
        });

      const notifications: NotificationItem[] =
        Array.isArray(res)
          ? res
          : (res?.content ?? []);

      renderNotificationDropdown(
        dropdown,
        notifications,
        bellBtn,
      );
    } catch (error) {
      console.error(
        "Lỗi khi tải danh sách thông báo:",
        error,
      );

      dropdown.innerHTML = `
        <div
          class="p-4 text-center text-danger"
          style="font-size: 0.875rem;"
        >
          Không thể tải danh sách thông báo.
          <br />
          Vui lòng thử lại!
        </div>
      `;
    }
  });

  /**
   * Click bên ngoài → đóng dropdown
   */
  document.addEventListener("click", (event) => {
    const target = event.target as Node;

    if (
      !bellBtn.contains(target) &&
      !dropdown.contains(target)
    ) {
      dropdown.classList.remove("show");
    }
  });
}