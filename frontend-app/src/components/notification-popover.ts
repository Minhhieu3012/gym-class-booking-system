import interactionService from "../services/interaction.service";
import type { NotificationItem } from "../services/interaction.service";

/**
 * Định dạng thời gian hiển thị tương đối hoặc ngày tháng
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
 * Cập nhật hoặc hiển thị badge số lượng thông báo chưa đọc trên quả chuông
 */
function updateNotificationBadge(bellBtn: HTMLElement, count: number): void {
  let badge =
    bellBtn.querySelector<HTMLElement>("#notification-badge") ||
    bellBtn.querySelector<HTMLElement>(".notification-badge");

  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.id = "notification-badge";
      badge.className =
        "position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge";
      badge.setAttribute("aria-label", `${count} unread notifications`);
      bellBtn.classList.add("position-relative");
      bellBtn.appendChild(badge);
    }
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.style.display = "inline-block";
  } else if (badge) {
    badge.style.display = "none";
    badge.textContent = "0";
  }
}

/**
 * Lấy số lượng thông báo chưa đọc từ API và cập nhật badge
 */
async function loadUnreadCount(bellBtn: HTMLElement): Promise<number> {
  try {
    // TODO(mock-pending-api): chờ BE hoàn thiện NotificationController — xem api-contract.md mục 17
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
    console.error("Lỗi khi lấy số lượng thông báo chưa đọc:", error);
    return 0;
  }
}

/**
 * Render danh sách thông báo vào thẻ div #notification-dropdown và gắn các sự kiện liên quan
 */
function renderNotificationDropdown(
  dropdown: HTMLElement,
  notifications: NotificationItem[],
  bellBtn: HTMLElement,
): void {
  const hasNotifications = notifications && notifications.length > 0;

  // Dùng chuỗi HTML (Template literals) để render dropdown
  dropdown.innerHTML = `
    <div class="p-2 border-bottom d-flex justify-content-between align-items-center bg-light">
      <span class="fw-bold text-dark fs-6 mb-0">Thông báo</span>
      <button 
        id="mark-all-read-btn" 
        class="btn btn-sm btn-link text-decoration-none p-0 text-primary"
        style="font-size: 0.825rem;"
      >
        Mark all as read
      </button>
    </div>
    <div class="notification-list list-group list-group-flush" style="max-height: 380px; overflow-y: auto;">
      ${
        hasNotifications
          ? notifications
              .map((item) => {
                const isRead = item.read ?? item.isRead ?? false;
                // Item chưa đọc sẽ in đậm (fw-bold), đã đọc thì làm mờ (text-muted opacity-75)
                const itemClass = isRead
                  ? "text-muted opacity-75"
                  : "fw-bold bg-light-subtle";
                const timeStr = formatTime(item.createdAt);

                return `
                  <div 
                    class="notification-item list-group-item list-group-item-action p-3 border-bottom ${itemClass}"
                    data-id="${item.id}"
                    data-read="${isRead}"
                    style="cursor: pointer; transition: background-color 0.2s, opacity 0.2s;"
                  >
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <span class="badge ${isRead ? "bg-secondary" : "bg-primary"} me-2" style="font-size: 0.7rem;">
                        ${item.type || "NOTIFICATION"}
                      </span>
                      <small class="text-muted" style="font-size: 0.75rem;">${timeStr}</small>
                    </div>
                    <div class="notification-content text-break" style="font-size: 0.875rem; line-height: 1.4;">
                      ${item.content}
                    </div>
                  </div>
                `;
              })
              .join("")
          : `
            <div class="p-4 text-center text-muted">
              <i class="bi bi-bell-slash fs-4 d-block mb-2"></i>
              <p class="mb-0" style="font-size: 0.875rem;">Không có thông báo nào</p>
            </div>
          `
      }
    </div>
  `;

  // 1. Đánh dấu đã đọc tất cả: Gắn sự kiện cho nút #mark-all-read-btn
  const markAllBtn = dropdown.querySelector<HTMLButtonElement>("#mark-all-read-btn");
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async (event: MouseEvent) => {
      event.stopPropagation();
      try {
        await interactionService.markAllNotificationsAsRead();

        // Ẩn badge số lượng trên quả chuông
        updateNotificationBadge(bellBtn, 0);

        // Làm mờ tất cả các item (bỏ class in đậm)
        const items = dropdown.querySelectorAll<HTMLElement>(".notification-item");
        items.forEach((item) => {
          item.classList.remove("fw-bold", "bg-light-subtle");
          item.classList.add("text-muted", "opacity-75");
          item.setAttribute("data-read", "true");

          const badgeEl = item.querySelector(".badge");
          if (badgeEl) {
            badgeEl.classList.remove("bg-primary");
            badgeEl.classList.add("bg-secondary");
          }
        });
      } catch (error) {
        console.error("Lỗi khi đánh dấu tất cả thông báo là đã đọc:", error);
      }
    });
  }

  // 2. Đánh dấu đã đọc một thông báo: Gắn sự kiện click cho từng notification-item
  const itemEls = dropdown.querySelectorAll<HTMLElement>(".notification-item");
  itemEls.forEach((itemEl) => {
    itemEl.addEventListener("click", async () => {
      const idStr = itemEl.getAttribute("data-id");
      const isRead = itemEl.getAttribute("data-read") === "true";

      // Nếu đã đọc rồi thì không cần gọi lại API
      if (!idStr || isRead) return;

      const id = Number(idStr);
      try {
        await interactionService.markNotificationAsRead(id);

        // Làm mờ item đó (bỏ class CSS in đậm)
        itemEl.classList.remove("fw-bold", "bg-light-subtle");
        itemEl.classList.add("text-muted", "opacity-75");
        itemEl.setAttribute("data-read", "true");

        const badgeEl = itemEl.querySelector(".badge");
        if (badgeEl) {
          badgeEl.classList.remove("bg-primary");
          badgeEl.classList.add("bg-secondary");
        }

        // Cập nhật lại số lượng badge trên quả chuông
        const currentBadge = bellBtn.querySelector<HTMLElement>("#notification-badge");
        if (currentBadge && currentBadge.textContent) {
          const currentCount = parseInt(currentBadge.textContent, 10);
          if (!isNaN(currentCount) && currentCount > 1) {
            updateNotificationBadge(bellBtn, currentCount - 1);
          } else {
            updateNotificationBadge(bellBtn, 0);
          }
        }
      } catch (error) {
        console.error(`Lỗi khi đánh dấu đã đọc thông báo #${id}:`, error);
      }
    });
  });
}

/**
 * Khởi tạo logic Popover / Dropdown thông báo
 * Gắn sự kiện vào #notification-bell và render danh sách vào #notification-dropdown
 */
export function initNotification(): void {
  const bellBtn = document.getElementById("notification-bell") as HTMLElement | null;
  const dropdown = document.getElementById("notification-dropdown") as HTMLElement | null;

  if (!bellBtn || !dropdown) {
    return;
  }

  // Tránh gắn lặp event listener nếu đã khởi tạo trên cùng DOM element
  if (bellBtn.dataset.notificationInitialized === "true") {
    loadUnreadCount(bellBtn);
    return;
  }
  bellBtn.dataset.notificationInitialized = "true";

  // 1. Lấy số lượng chưa đọc khi khởi tạo
  loadUnreadCount(bellBtn);

  // 2. Bắt sự kiện click quả chuông để lấy danh sách và hiển thị dropdown
  bellBtn.addEventListener("click", async (event: MouseEvent) => {
    event.stopPropagation();

    // Toggle hiển thị dropdown nếu không phụ thuộc hoàn toàn vào data-bs-toggle của Bootstrap
    if (!bellBtn.hasAttribute("data-bs-toggle")) {
      dropdown.classList.toggle("show");
    }

    // Hiển thị trạng thái loading tạm thời
    dropdown.innerHTML = `
      <div class="p-3 text-center text-muted">
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span style="font-size: 0.875rem;">Đang tải thông báo...</span>
      </div>
    `;

    try {
      // TODO(mock-pending-api): chờ BE hoàn thiện NotificationController — xem api-contract.md mục 17
      // Gọi API lấy tối đa 10 thông báo mới nhất
      const res = await interactionService.getMyNotifications({ size: 10 });
      const notifications: NotificationItem[] = Array.isArray(res)
        ? res
        : (res?.content ?? []);

      // Render danh sách vào #notification-dropdown
      renderNotificationDropdown(dropdown, notifications, bellBtn);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thông báo:", error);
      dropdown.innerHTML = `
        <div class="p-3 text-center text-danger" style="font-size: 0.875rem;">
          Không thể tải danh sách thông báo. Vui lòng thử lại!
        </div>
      `;
    }
  });

  // Đóng dropdown khi click ra ngoài (đối với trường hợp không dùng thuộc tính data-bs của Bootstrap)
  document.addEventListener("click", (event: MouseEvent) => {
    if (
      !bellBtn.contains(event.target as Node) &&
      !dropdown.contains(event.target as Node)
    ) {
      if (!bellBtn.hasAttribute("data-bs-toggle")) {
        dropdown.classList.remove("show");
      }
    }
  });
}
