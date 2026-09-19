import template from "./chat.html?raw";
import "./chat.css";
import { chatService } from "../../services/chat.service";
import { UploadService } from "../../services/upload.service";
import type {
  ChatMessageDTO,
  ConversationItem,
  ChatErrorDTO,
} from "../../models/chat";
import { getStoredUser } from "../../core/api";
import { showToast } from "../../utils/toast";

/**
 * Trả về nội dung template HTML cho Router render vào #app.
 */
export function render(): string {
  const match = template.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (match) {
    return match[1].replace(/<script[\s\S]*?<\/script>/gi, "");
  }
  return template;
}

// ==================== STATE MANAGEMENT ====================

let currentUserId: number | null = null;
let activeReceiverId: number | null = null;
let activePartner: ConversationItem | null = null;
let conversations: ConversationItem[] = [];
let currentFilter: "all" | "unread" | "recent" = "all";
let searchQuery: string = "";
let isSending: boolean = false;

// Lưu trữ lịch sử tin nhắn theo userId đối tác
const messageHistoryMap: Record<number, ChatMessageDTO[]> = {};

const DEFAULT_AVATAR = "/src/assets/img/avatar-user-default.jpg";

// ==================== HELPER FUNCTIONS ====================

function isTrainerRoute(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.pathname.includes("/trainer") ||
      document.body.classList.contains("trainer-theme"))
  );
}

function resolveCurrentUserId(): number {
  const user = getStoredUser();
  if (user && typeof user.id === "number") {
    return user.id;
  }

  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const candidateId = Number(payload.userId || payload.id || payload.sub);
        if (!isNaN(candidateId) && candidateId > 0) {
          return candidateId;
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback ID theo role
  return isTrainerRoute() ? 99 : 1;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function escapeHtml(text: string | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom(): void {
  const messageArea = document.getElementById("message-area");
  if (messageArea) {
    messageArea.scrollTop = messageArea.scrollHeight;
    requestAnimationFrame(() => {
      messageArea.scrollTop = messageArea.scrollHeight;
    });
    setTimeout(() => {
      messageArea.scrollTop = messageArea.scrollHeight;
    }, 60);
  }
}

function playNotificationSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Ignore audio context autoplay restriction
  }
}

// ==================== DOM RENDERING ====================

/**
 * Lọc và render danh sách hội thoại bên cột trái.
 */
function renderConversations(list: ConversationItem[]): void {
  const container = document.getElementById("conversation-list");
  if (!container) return;

  // Lọc theo bộ lọc & tìm kiếm
  let filtered = [...list];

  if (currentFilter === "unread") {
    filtered = filtered.filter((c) => c.unreadCount > 0);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="conversation-empty p-4 text-center text-muted">
        <i class="bi bi-chat-dots fs-1 mb-2 d-block opacity-40"></i>
        <p class="mb-1 fw-medium text-secondary-theme">Không tìm thấy cuộc trò chuyện</p>
        <small class="text-secondary">Thử tìm kiếm với từ khóa khác</small>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  filtered.forEach((conv) => {
    const item = document.createElement("div");
    const isActive = activeReceiverId === conv.userId;
    item.className = `conversation-item d-flex align-items-center gap-3 ${
      isActive ? "active" : ""
    }`;
    item.setAttribute("role", "button");
    item.dataset.userId = String(conv.userId);

    const avatarSrc = conv.avatarUrl || DEFAULT_AVATAR;
    const timeFormatted = formatTime(conv.lastMessageAt);
    const unreadBadgeHtml =
      conv.unreadCount > 0
        ? `<span class="badge rounded-pill unread-badge ms-2">${conv.unreadCount}</span>`
        : "";

    item.innerHTML = `
      <div class="avatar-container position-relative">
        <img
          src="${escapeHtml(avatarSrc)}"
          alt="${escapeHtml(conv.fullName)}"
          class="rounded-circle avatar-img"
          loading="lazy"
        />
        <span class="status-pulse-dot position-absolute bottom-0 end-0"></span>
      </div>
      <div class="conversation-info flex-grow-1 overflow-hidden">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <h2 class="h6 fw-semibold mb-0 text-truncate text-secondary-theme">${escapeHtml(
            conv.fullName
          )}</h2>
          <span class="message-time small text-muted">${escapeHtml(
            timeFormatted
          )}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <p class="last-message small mb-0 text-truncate">
            ${escapeHtml(conv.lastMessage || "Bắt đầu cuộc trò chuyện mới")}
          </p>
          ${unreadBadgeHtml}
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      selectConversation(conv.userId);
    });

    container.appendChild(item);
  });
}

/**
 * Render một bong bóng tin nhắn vào message-area.
 */
function renderMessage(msg: ChatMessageDTO): void {
  const messageArea = document.getElementById("message-area");
  if (!messageArea) return;

  const isOutgoing = msg.senderId === currentUserId;
  const timeFormatted = formatTime(msg.sentAt);

  const wrapper = document.createElement("div");
  wrapper.className = isOutgoing
    ? "chat-bubble-wrapper bubble-outgoing d-flex align-items-end justify-content-end gap-2"
    : "chat-bubble-wrapper bubble-incoming d-flex align-items-end gap-2";

  let innerHtml = "";

  // Nếu là tin nhắn nhận từ người khác, hiển thị avatar mini
  if (!isOutgoing) {
    const avatarSrc = activePartner?.avatarUrl || DEFAULT_AVATAR;
    innerHtml += `
      <img
        src="${escapeHtml(avatarSrc)}"
        alt="Avatar"
        class="rounded-circle avatar-mini shadow-sm"
        loading="lazy"
      />
    `;
  }

  // Nội dung ảnh đính kèm nếu có
  const imageHtml = msg.imageUrl
    ? `
      <div class="bubble-image-container mb-1">
        <img
          src="${escapeHtml(msg.imageUrl)}"
          alt="Ảnh đính kèm"
          class="chat-bubble-image rounded"
          onclick="window.__openChatLightbox && window.__openChatLightbox('${escapeHtml(
            msg.imageUrl
          )}')"
        />
      </div>
    `
    : "";

  // Nội dung chữ nếu có
  const textHtml = msg.content
    ? `<div class="bubble-text">${escapeHtml(msg.content)}</div>`
    : "";

  // Trạng thái đã gửi / đã xem
  const checkmarkHtml = isOutgoing
    ? `<i class="bi bi-check2-all text-white ms-1 opacity-75"></i>`
    : "";

  innerHtml += `
    <div class="bubble-content ${isOutgoing ? "text-end" : ""}">
      <div class="bubble-body">
        ${imageHtml}
        ${textHtml}
      </div>
      <span class="bubble-time small">
        ${escapeHtml(timeFormatted)} ${checkmarkHtml}
      </span>
    </div>
  `;

  wrapper.innerHTML = innerHtml;
  messageArea.appendChild(wrapper);
}

/**
 * Hiển thị chỉ báo đang soạn tin nhắn (Typing Indicator).
 */
function renderTypingIndicator(name: string): HTMLElement | null {
  const messageArea = document.getElementById("message-area");
  if (!messageArea) return null;

  removeTypingIndicator();

  const indicator = document.createElement("div");
  indicator.id = "chat-typing-indicator";
  indicator.className = "chat-bubble-wrapper bubble-incoming d-flex align-items-center gap-2";
  indicator.innerHTML = `
    <img
      src="${escapeHtml(activePartner?.avatarUrl || DEFAULT_AVATAR)}"
      alt="Avatar"
      class="rounded-circle avatar-mini"
    />
    <div class="typing-indicator-wrapper">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <span class="small text-muted">${escapeHtml(name)} đang soạn tin...</span>
    </div>
  `;
  messageArea.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

/**
 * Gỡ bỏ chỉ báo đang soạn tin nhắn.
 */
function removeTypingIndicator(): void {
  const existing = document.getElementById("chat-typing-indicator");
  if (existing) {
    existing.remove();
  }
}

/**
 * Chọn một cuộc trò chuyện, tải tin nhắn và cập nhật giao diện.
 */
export async function selectConversation(userId: number): Promise<void> {
  activeReceiverId = userId;
  activePartner = conversations.find((c) => c.userId === userId) || null;

  // Cập nhật class active trong danh sách
  document.querySelectorAll(".conversation-item").forEach((el) => {
    if ((el as HTMLElement).dataset.userId === String(userId)) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });

  // Chuyển sang màn hình chat trên Mobile
  const appContainer = document.getElementById("chat-app-container");
  if (appContainer) {
    appContainer.classList.add("chat-active");
  }

  // Cập nhật Header Chat Box
  const avatarEl = document.getElementById(
    "chat-header-avatar"
  ) as HTMLImageElement | null;
  const nameEl = document.getElementById("chat-header-name");
  const statusEl = document.getElementById("chat-header-status");
  const badgeEl = document.getElementById("chat-header-badge");

  if (activePartner) {
    if (avatarEl) avatarEl.src = activePartner.avatarUrl || DEFAULT_AVATAR;
    if (nameEl) nameEl.textContent = activePartner.fullName;
    if (statusEl) statusEl.textContent = "Đang hoạt động";
    if (badgeEl) {
      badgeEl.textContent =
        activePartner.role === "TRAINER" ? "HLV Thể Hình" : "Học Viên VIP";
    }
  }

  // Render Date divider
  const messageArea = document.getElementById("message-area");
  if (!messageArea) return;

  messageArea.innerHTML = `
    <div class="chat-date-divider text-center my-2">
      <span class="badge">Hôm nay</span>
    </div>
  `;

  // Kiểm tra nếu đã có tin nhắn trong cache store
  if (!messageHistoryMap[userId]) {
    messageHistoryMap[userId] = [];
  }

  // Tải tin nhắn thực tế từ backend API
  try {
    const res = await chatService.getMessages(userId, 0, 50);
    if (res && res.content) {
      messageHistoryMap[userId] = res.content;
    }
  } catch (err) {
    console.warn("Could not fetch messages for user:", userId, err);
  }

  const messages = messageHistoryMap[userId] || [];

  if (messages.length === 0) {
    messageArea.innerHTML += `
      <div class="chat-placeholder my-auto text-center text-muted py-5">
        <i class="bi bi-chat-heart fs-1 text-danger mb-2 d-block"></i>
        <h3 class="h6 text-dark fw-bold">Chưa có tin nhắn nào</h3>
        <p class="small text-muted mb-0">Hãy gửi tin nhắn đầu tiên để bắt đầu buổi trao đổi!</p>
      </div>
    `;
  } else {
    // Sắp xếp tăng dần theo thời gian
    messages.sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );

    messages.forEach((msg) => renderMessage(msg));
  }

  // Đánh dấu đã đọc trên UI state
  if (activePartner) {
    activePartner.unreadCount = 0;
    renderConversations(conversations);
  }

  scrollToBottom();
}

// ==================== GỬI TIN NHẮN & PHẢN HỒI TỰ ĐỘNG ====================

/**
 * Xử lý sự kiện gửi tin nhắn văn bản và hình ảnh.
 */
async function handleSendMessage(customContent?: string): Promise<void> {
  if (isSending) return;

  // Nếu chưa chọn đối tác, tự động chọn người đầu tiên
  if (!activeReceiverId && conversations.length > 0) {
    await selectConversation(conversations[0].userId);
  }

  if (!activeReceiverId) {
    return;
  }

  const chatInput = document.getElementById(
    "chat-input"
  ) as HTMLInputElement | null;
  const fileInput = document.getElementById(
    "file-input"
  ) as HTMLInputElement | null;
  const btnSend = document.getElementById(
    "btn-send"
  ) as HTMLButtonElement | null;
  const previewContainer = document.getElementById("image-preview-container");
  const previewImg = document.getElementById(
    "preview-img"
  ) as HTMLImageElement | null;

  const content = (customContent !== undefined ? customContent : chatInput?.value || "").trim();
  const file = fileInput?.files?.[0] || null;

  // Kiểm tra ảnh thực tế đính kèm: chỉ nhận nếu previewContainer đang hiển thị và có data URL thật
  const isPreviewVisible = !!(previewContainer && !previewContainer.classList.contains("d-none"));
  const rawPreviewSrc = previewImg?.getAttribute("src") || "";
  const hasValidAttachedImage = isPreviewVisible && previewImg?.dataset.attached === "true" && rawPreviewSrc.startsWith("data:image/");

  if (!content && !file && !hasValidAttachedImage) {
    return;
  }

  isSending = true;

  // Khóa nút gửi tạm thời
  if (btnSend) {
    btnSend.disabled = true;
  }

  let finalImageUrl: string | null = null;

  try {
    // 1. Upload ảnh nếu có file thật được chọn
    if (file) {
      try {
        const uploadRes = await UploadService.uploadFile(file);
        finalImageUrl = uploadRes.imageUrl;
      } catch (uploadErr) {
        console.warn("Upload ảnh thất bại, fallback sang base64 data URL:", uploadErr);
        finalImageUrl = hasValidAttachedImage ? rawPreviewSrc : null;
      }
    } else if (hasValidAttachedImage) {
      finalImageUrl = rawPreviewSrc;
    }

    // 2. Tạo tin nhắn DTO gửi đi (Optimistic UI Update)
    const newMsg: ChatMessageDTO = {
      id: Date.now(),
      senderId: currentUserId || 1,
      receiverId: activeReceiverId,
      content: content || null,
      imageUrl: finalImageUrl,
      sentAt: new Date().toISOString(),
      readAt: null,
    };

    // Xóa placeholder nếu có
    const placeholder = document.querySelector(".chat-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    // Lưu vào store và render ngay lên màn hình
    if (!messageHistoryMap[activeReceiverId]) {
      messageHistoryMap[activeReceiverId] = [];
    }
    messageHistoryMap[activeReceiverId].push(newMsg);
    renderMessage(newMsg);
    scrollToBottom();

    // 3. Cập nhật preview danh sách hội thoại bên trái
    if (activePartner) {
      activePartner.lastMessage = content || (finalImageUrl ? "[Hình ảnh]" : "");
      activePartner.lastMessageAt = newMsg.sentAt;

      // Đưa đối tác này lên đầu danh sách
      const idx = conversations.findIndex((c) => c.userId === activeReceiverId);
      if (idx > 0) {
        conversations.splice(idx, 1);
        conversations.unshift(activePartner);
      }
      renderConversations(conversations);
    }

    // 4. Reset input và preview ảnh hoàn toàn
    if (chatInput) chatInput.value = "";
    if (fileInput) fileInput.value = "";
    if (previewContainer) previewContainer.classList.add("d-none");
    if (previewImg) {
      previewImg.removeAttribute("src");
      delete previewImg.dataset.attached;
    }

    // 5. Thử gửi qua STOMP WebSocket nếu đã kết nối
    if (chatService.isConnected()) {
      chatService.sendMessage({
        receiverId: activeReceiverId,
        content: content || null,
        imageUrl: finalImageUrl,
      });
    } else {
      // 6. Mô phỏng phản hồi tự động nếu WebSocket offline (Offline Interactive Demo)
      simulatePartnerReply(content, activeReceiverId);
    }

    if (chatInput) chatInput.focus();
  } catch (error: any) {
    console.error("Lỗi khi gửi tin nhắn:", error);
  } finally {
    isSending = false;
    if (btnSend) {
      btnSend.disabled = false;
    }
  }
}

/**
 * Mô phỏng phản hồi thông minh từ đối tác trò chuyện khi không có WebSocket server.
 */
function simulatePartnerReply(userContent: string, partnerId: number): void {
  const partner = conversations.find((c) => c.userId === partnerId);
  const partnerName = partner?.fullName || "Huấn luyện viên";

  // Hiển thị typing indicator sau 400ms
  setTimeout(() => {
    if (activeReceiverId === partnerId) {
      renderTypingIndicator(partnerName);
    }
  }, 400);

  // Gửi tin nhắn trả lời sau 1.3s - 1.8s
  setTimeout(() => {
    removeTypingIndicator();

    const lower = userContent.toLowerCase();
    let replyText = "Tuyệt vời! Tôi đã ghi nhận phản hồi của bạn. Chúng ta sẽ áp dụng vào buổi tập sắp tới nhé! 💪";

    if (lower.includes("deadlift") || lower.includes("squat") || lower.includes("tập")) {
      replyText = "Form Deadlift & Squat rất quan trọng! Bạn nhớ gồng chặt cơ core, siết cơ mông và giữ thẳng trục cột sống nhé. Hôm nay mình sẽ chỉnh kỹ từng rep cho bạn! 🔥";
    } else if (lower.includes("dinh dưỡng") || lower.includes("ăn") || lower.includes("thực đơn")) {
      replyText = "Hôm nay sau buổi tập, bạn nên nạp ngay 1 muỗng Whey hoặc 150g ức gà + 1 củ khoai lang để cơ bắp phục hồi tối đa nhé 🥗";
    } else if (lower.includes("giờ") || lower.includes("lịch") || lower.includes("17:00") || lower.includes("hẹn")) {
      replyText = "Đã chốt lịch hẹn nhé! Tôi sẽ chuẩn bị sẵn phòng tập và dụng cụ đón bạn lúc giờ đã hẹn. Nhớ mang theo bình nước và khăn tập nhé! ⏱️";
    } else if (lower.includes("form") || lower.includes("ảnh") || lower.includes("xem")) {
      replyText = "Góc đặt chân và độ mở gối của bạn như thế là khá chuẩn rồi đấy! Chỉ cần hạ tạ chậm lại 2 giây nữa là hoàn hảo! 👏";
    }

    const replyMsg: ChatMessageDTO = {
      id: Date.now() + 1,
      senderId: partnerId,
      receiverId: currentUserId || 1,
      content: replyText,
      imageUrl: null,
      sentAt: new Date().toISOString(),
      readAt: null,
    };

    if (!messageHistoryMap[partnerId]) {
      messageHistoryMap[partnerId] = [];
    }
    messageHistoryMap[partnerId].push(replyMsg);

    if (activeReceiverId === partnerId) {
      renderMessage(replyMsg);
      scrollToBottom();
      playNotificationSound();
    }

    // Cập nhật danh sách hội thoại
    if (partner) {
      partner.lastMessage = replyText;
      partner.lastMessageAt = replyMsg.sentAt;
      if (activeReceiverId !== partnerId) {
        partner.unreadCount = (partner.unreadCount || 0) + 1;
      }
      renderConversations(conversations);
    }
  }, 1400);
}

// ==================== REAL-TIME CALLBACKS ====================

function onMessageReceived(msg: ChatMessageDTO): void {
  const isForActiveConversation =
    (msg.senderId === activeReceiverId && msg.receiverId === currentUserId) ||
    (msg.senderId === currentUserId && msg.receiverId === activeReceiverId);

  const partnerId =
    msg.senderId === currentUserId ? msg.receiverId : msg.senderId;

  if (!messageHistoryMap[partnerId]) {
    messageHistoryMap[partnerId] = [];
  }

  // 1. Nếu đây là tin nhắn do chính mình gửi được STOMP WebSocket server echo về
  if (msg.senderId === currentUserId) {
    // Tìm tin nhắn lạc quan (optimistic) vừa render trên giao diện
    const optimisticMsg = messageHistoryMap[partnerId].find(
      (m) =>
        m.senderId === currentUserId &&
        m.content === msg.content &&
        (m.imageUrl || null) === (msg.imageUrl || null) &&
        Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 15000
    );

    if (optimisticMsg) {
      // Đã render trên màn hình rồi, chỉ cập nhật lại ID thực từ Database
      optimisticMsg.id = msg.id;
      optimisticMsg.sentAt = msg.sentAt;
      return;
    }

    // Nếu không tìm thấy (ví dụ gửi từ tab/thiết bị khác), kiểm tra ID để tránh trùng
    if (messageHistoryMap[partnerId].some((m) => m.id === msg.id)) {
      return;
    }

    messageHistoryMap[partnerId].push(msg);
    if (isForActiveConversation) {
      renderMessage(msg);
      scrollToBottom();
    }
    return;
  }

  // 2. Nếu là tin nhắn từ đối tác gửi tới
  if (messageHistoryMap[partnerId].some((m) => m.id === msg.id)) {
    return;
  }
  messageHistoryMap[partnerId].push(msg);

  if (isForActiveConversation) {
    const placeholder = document.querySelector(".chat-placeholder");
    if (placeholder) {
      placeholder.remove();
    }
    renderMessage(msg);
    scrollToBottom();
    playNotificationSound();

    if (msg.receiverId === currentUserId) {
      chatService.markAsRead(msg.id).catch(() => {});
    }
  }

  // Cập nhật danh sách hội thoại
  const existingConv = conversations.find((c) => c.userId === partnerId);
  if (existingConv) {
    existingConv.lastMessage = msg.content || (msg.imageUrl ? "[Hình ảnh]" : "");
    existingConv.lastMessageAt = msg.sentAt;
    if (msg.senderId !== currentUserId && activeReceiverId !== msg.senderId) {
      existingConv.unreadCount = (existingConv.unreadCount || 0) + 1;
    }
    renderConversations(conversations);
  }
}

function onErrorReceived(_err: ChatErrorDTO): void {
  // Lỗi từ WebSocket chat server
}

function onAckReceived(_ack: any): void {
  // Xác nhận tin nhắn từ WebSocket server
}

// ==================== KHỞI TẠO (INIT) ====================

/**
 * Thiết lập các sự kiện giao diện và khởi tạo dịch vụ Chat.
 */
export async function init(): Promise<void> {
  currentUserId = resolveCurrentUserId();
  const isTrainer = isTrainerRoute();
  const user = getStoredUser();
  const isMember = user?.role === "MEMBER";

  // Cập nhật điều hướng & tiêu đề theo vai trò (Member vs Trainer)
  const homeLink = document.getElementById(
    "chat-nav-home-link"
  ) as HTMLAnchorElement | null;
  const backBtn = document.getElementById(
    "chat-sidebar-back-btn"
  ) as HTMLAnchorElement | null;
  const portalTag = document.getElementById("chat-portal-tag");
  const trainerNav = document.getElementById("chat-trainer-nav");
  const memberNav = document.getElementById("chat-member-nav");

  if (isMember) {
    if (homeLink) homeLink.href = "/member/class-list.html";
    if (backBtn) {
      backBtn.href = "/member/class-list.html";
      backBtn.title = "Quay lại Lớp học";
    }
    if (portalTag) portalTag.textContent = "MEMBER PORTAL";
    if (trainerNav) {
      trainerNav.classList.add("d-none");
      trainerNav.classList.remove("d-lg-flex");
    }
    if (memberNav) {
      memberNav.classList.remove("d-none");
      memberNav.classList.add("d-lg-flex");
    }
  } else {
    if (homeLink) homeLink.href = "/trainer/time-slots.html";
    if (backBtn) {
      backBtn.href = "/trainer/time-slots.html";
      backBtn.title = "Quay lại Lịch dạy Huấn Luyện Viên";
    }
    if (portalTag) portalTag.textContent = "TRAINER PORTAL";
    if (trainerNav) {
      trainerNav.classList.remove("d-none");
      trainerNav.classList.add("d-lg-flex");
    }
    if (memberNav) {
      memberNav.classList.add("d-none");
      memberNav.classList.remove("d-lg-flex");
    }
  }

  // Cập nhật nhãn vai trò
  const roleLabel = document.getElementById("chat-role-label");
  if (roleLabel) {
    roleLabel.textContent = isMember
      ? "Hội Viên Gym Hub"
      : isTrainer
      ? "HLV Trưởng Hub"
      : "Gym Hub Realtime";
  }

  // Cố gắng kết nối STOMP WebSocket
  try {
    chatService.setCallbacks(
      onMessageReceived,
      onErrorReceived,
      onAckReceived
    );
    chatService.connect();
  } catch (err) {
    // WebSocket chưa sẵn sàng, kích hoạt fallback mode
  }

  // Tải danh sách hội thoại thực tế từ API Database
  try {
    const data = await chatService.getConversations();
    conversations = Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Could not fetch conversations:", error);
    conversations = [];
  }

  // Render danh sách hội thoại
  renderConversations(conversations);

  // Trên Desktop/Tablet (>= 768px): Tự động chọn cuộc hội thoại đầu tiên nếu có
  // Trên Mobile (< 768px): Giữ danh sách liên hệ chiếm toàn màn hình, chỉ mở chat khi người dùng chọn liên hệ
  if (conversations.length > 0) {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      await selectConversation(conversations[0].userId);
    }
  } else {
    // Nếu chưa có cuộc hội thoại nào, hiển thị empty state
    const messageArea = document.getElementById("message-area");
    if (messageArea) {
      messageArea.innerHTML = `
        <div class="chat-placeholder my-auto text-center text-muted py-5">
          <i class="bi bi-chat-heart fs-1 text-secondary mb-2 d-block"></i>
          <h3 class="h6 text-dark fw-bold">Chưa có cuộc trò chuyện nào</h3>
          <p class="small text-muted mb-0">Hãy kết nối và nhắn tin cùng Huấn luyện viên hoặc Hội viên!</p>
        </div>
      `;
    }
  }

  // Thiết lập sự kiện Form gửi tin nhắn (dùng onsubmit duy nhất để tránh gửi lặp 2 lần)
  const chatForm = document.getElementById("chat-form") as HTMLFormElement | null;
  if (chatForm) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      handleSendMessage();
    };
  }

  // Sự kiện nút Quay lại trên Mobile
  const btnBack = document.getElementById("btn-back");
  const appContainer = document.getElementById("chat-app-container");
  if (btnBack && appContainer) {
    btnBack.onclick = () => {
      appContainer.classList.remove("chat-active");
      activeReceiverId = null;
      activePartner = null;
      document
        .querySelectorAll(".conversation-item")
        .forEach((el) => el.classList.remove("active"));
    };
  }

  // Sự kiện đính kèm file ảnh
  const btnAttach = document.getElementById("btn-attach");
  const fileInput = document.getElementById(
    "file-input"
  ) as HTMLInputElement | null;
  const previewContainer = document.getElementById("image-preview-container");
  const previewImg = document.getElementById(
    "preview-img"
  ) as HTMLImageElement | null;
  const btnRemovePreview = document.getElementById("btn-remove-preview");

  if (btnAttach && fileInput) {
    btnAttach.onclick = () => {
      fileInput.click();
    };
  }

  if (fileInput && previewContainer && previewImg) {
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          showToast("Vui lòng chỉ chọn tệp định dạng hình ảnh.", "warning");
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = (e.target?.result as string) || "";
          previewImg.setAttribute("src", dataUrl);
          previewImg.dataset.attached = "true";
          previewContainer.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (btnRemovePreview && fileInput && previewContainer && previewImg) {
    btnRemovePreview.onclick = () => {
      fileInput.value = "";
      previewImg.removeAttribute("src");
      delete previewImg.dataset.attached;
      previewContainer.classList.add("d-none");
    };
  }

  // Sự kiện Quick Filter chips ("Tất cả", "Chưa đọc", "Gần đây")
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".btn-filter")
        .forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget as HTMLElement;
      target.classList.add("active");
      currentFilter = (target.dataset.filter as any) || "all";
      renderConversations(conversations);
    });
  });

  // Sự kiện tìm kiếm hội thoại
  const searchInput = document.getElementById(
    "search-input"
  ) as HTMLInputElement | null;
  const btnClearSearch = document.getElementById("btn-clear-search");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value || "";
      if (btnClearSearch) {
        if (searchQuery) {
          btnClearSearch.classList.remove("d-none");
        } else {
          btnClearSearch.classList.add("d-none");
        }
      }
      renderConversations(conversations);
    });
  }

  if (btnClearSearch && searchInput) {
    btnClearSearch.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      btnClearSearch.classList.add("d-none");
      renderConversations(conversations);
    });
  }

  // Sự kiện Quick Prompts Chips (Gợi ý tin nhắn nhanh)
  document.querySelectorAll(".btn-chip").forEach((chip) => {
    (chip as HTMLElement).onclick = (e) => {
      const prompt = (e.currentTarget as HTMLElement).dataset.prompt;
      if (prompt) {
        handleSendMessage(prompt);
      }
    };
  });

  // Sự kiện Emoji Popover
  const btnEmoji = document.getElementById("btn-emoji");
  const emojiPopover = document.getElementById("emoji-picker-popover");
  const chatInputEl = document.getElementById(
    "chat-input"
  ) as HTMLInputElement | null;

  if (btnEmoji && emojiPopover) {
    btnEmoji.addEventListener("click", (e) => {
      e.stopPropagation();
      emojiPopover.classList.toggle("d-none");
    });

    document.addEventListener("click", (e) => {
      if (!emojiPopover.contains(e.target as Node) && e.target !== btnEmoji) {
        emojiPopover.classList.add("d-none");
      }
    });

    document.querySelectorAll(".emoji-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const emoji = (e.currentTarget as HTMLElement).dataset.emoji || "";
        if (chatInputEl) {
          chatInputEl.value += emoji;
          chatInputEl.focus();
        }
        emojiPopover.classList.add("d-none");
      });
    });
  }

  // Lightbox phóng to ảnh
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById(
    "lightbox-img"
  ) as HTMLImageElement | null;
  const btnCloseLightbox = document.getElementById("btn-close-lightbox");

  (window as any).__openChatLightbox = (src: string) => {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.classList.remove("d-none");
    }
  };

  if (btnCloseLightbox && lightbox) {
    btnCloseLightbox.addEventListener("click", () => {
      lightbox.classList.add("d-none");
    });
    lightbox.querySelector(".lightbox-overlay")?.addEventListener("click", () => {
      lightbox.classList.add("d-none");
    });
  }
}

// Tự động khởi chạy nếu truy cập file chat.html độc lập (không qua SPA router)
if (
  typeof document !== "undefined" &&
  document.querySelector("#chat-app-container") &&
  !document.querySelector("#app")
) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
}
