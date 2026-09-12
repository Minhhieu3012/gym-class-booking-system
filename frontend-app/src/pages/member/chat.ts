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

// Lưu trữ lịch sử tin nhắn theo userId đối tác
const messageHistoryMap: Record<number, ChatMessageDTO[]> = {};

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

// ==================== DỮ LIỆU MẪU CAO CẤP (FALLBACK / DEMO DATA) ====================

function getDemoConversations(isTrainerRole: boolean): ConversationItem[] {
  const now = Date.now();
  if (isTrainerRole) {
    return [
      {
        userId: 101,
        fullName: "Nguyễn Văn Hùng",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        role: "MEMBER",
        lastMessage: "Chào huấn luyện viên, hôm nay mình muốn tập trung vào bài Deadlift và Squat ạ!",
        unreadCount: 1,
        lastMessageAt: new Date(now - 5 * 60 * 1000).toISOString(),
      },
      {
        userId: 102,
        fullName: "Trần Thị Mai",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        role: "MEMBER",
        lastMessage: "Em vừa nộp nhật ký dinh dưỡng rồi anh nhé 🥗",
        unreadCount: 0,
        lastMessageAt: new Date(now - 45 * 60 * 1000).toISOString(),
      },
      {
        userId: 103,
        fullName: "Lê Quốc Bảo",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        role: "MEMBER",
        lastMessage: "Thầy xem giúp em bài tập ngực hôm qua form chuẩn chưa?",
        unreadCount: 0,
        lastMessageAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      },
      {
        userId: 104,
        fullName: "Phạm Thảo Vy",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        role: "MEMBER",
        lastMessage: "Tuần sau em xin dời lịch tập sang thứ 4 được không ạ?",
        unreadCount: 2,
        lastMessageAt: new Date(now - 24 * 3600 * 1000).toISOString(),
      },
    ];
  } else {
    return [
      {
        userId: 201,
        fullName: "HLV Minh Tuấn",
        avatarUrl:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&auto=format&fit=crop&q=80",
        role: "TRAINER",
        lastMessage: "Chào bạn! Hôm nay bạn có dự định tập các bài Cardio hay cơ lưng xô không?",
        unreadCount: 1,
        lastMessageAt: new Date(now - 5 * 60 * 1000).toISOString(),
      },
      {
        userId: 202,
        fullName: "HLV Sarah Đỗ",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        role: "TRAINER",
        lastMessage: "Bạn nhớ khởi động kỹ 10 phút trước khi vào lớp nhé 🧘",
        unreadCount: 0,
        lastMessageAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      },
      {
        userId: 203,
        fullName: "HLV David Nguyễn",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        role: "TRAINER",
        lastMessage: "Thực đơn dinh dưỡng tuần này mình đã cập nhật trong app rồi.",
        unreadCount: 0,
        lastMessageAt: new Date(now - 12 * 3600 * 1000).toISOString(),
      },
    ];
  }
}

function getInitialDemoMessages(partnerId: number, myId: number): ChatMessageDTO[] {
  const now = Date.now();
  if (partnerId === 101 || partnerId === 201) {
    return [
      {
        id: 1,
        senderId: partnerId,
        receiverId: myId,
        content: "Chào bạn! Hôm nay bạn có dự định tập các bài Cardio hay cơ lưng xô không?",
        imageUrl: null,
        sentAt: new Date(now - 30 * 60 * 1000).toISOString(),
        readAt: new Date(now - 29 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        senderId: myId,
        receiverId: partnerId,
        content: "Chào huấn luyện viên, hôm nay mình muốn tập trung vào bài Deadlift và Squat ạ!",
        imageUrl: null,
        sentAt: new Date(now - 25 * 60 * 1000).toISOString(),
        readAt: new Date(now - 24 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        senderId: partnerId,
        receiverId: myId,
        content: "Bạn xem kỹ lại tư thế đặt chân và siết cơ bụng trong ảnh mẫu này trước khi vào bài nhé:",
        imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
        sentAt: new Date(now - 15 * 60 * 1000).toISOString(),
        readAt: new Date(now - 14 * 60 * 1000).toISOString(),
      },
    ];
  } else if (partnerId === 102 || partnerId === 202) {
    return [
      {
        id: 11,
        senderId: partnerId,
        receiverId: myId,
        content: "Chào bạn, hôm nay tiến độ bài tập giãn cơ của bạn thế nào rồi?",
        imageUrl: null,
        sentAt: new Date(now - 60 * 60 * 1000).toISOString(),
        readAt: new Date(now - 55 * 60 * 1000).toISOString(),
      },
      {
        id: 12,
        senderId: myId,
        receiverId: partnerId,
        content: "Mình cảm thấy rất khỏe và đỡ mỏi lưng hơn nhiều rồi ạ!",
        imageUrl: null,
        sentAt: new Date(now - 45 * 60 * 1000).toISOString(),
        readAt: new Date(now - 44 * 60 * 1000).toISOString(),
      },
    ];
  }

  return [
    {
      id: 21,
      senderId: partnerId,
      receiverId: myId,
      content: "Xin chào! Rất vui được đồng hành cùng bạn trong lộ trình tập luyện tại Pulse Gym!",
      imageUrl: null,
      sentAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      readAt: new Date(now - 2 * 3600 * 1000).toISOString(),
    },
  ];
}

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
        <p class="mb-1 fw-medium text-light">Không tìm thấy cuộc trò chuyện</p>
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
          <h2 class="h6 fw-semibold mb-0 text-light text-truncate">${escapeHtml(
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
    messageHistoryMap[userId] = getInitialDemoMessages(userId, currentUserId || 1);
  }

  // Thử tải tin nhắn từ backend
  try {
    const res = await chatService.getMessages(userId, 0, 50);
    if (res && res.content && res.content.length > 0) {
      messageHistoryMap[userId] = res.content;
    }
  } catch (err) {
    // Backend offline / 404: Dùng tin nhắn trong messageHistoryMap
    console.debug("[Chat] Sử dụng lịch sử tin nhắn nội bộ cho user:", userId);
  }

  const messages = messageHistoryMap[userId] || [];

  if (messages.length === 0) {
    messageArea.innerHTML += `
      <div class="chat-placeholder my-auto text-center text-muted py-5">
        <i class="bi bi-chat-heart fs-1 text-danger mb-2 d-block"></i>
        <h3 class="h6 text-light fw-bold">Chưa có tin nhắn nào</h3>
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
  const previewDataUrl = previewImg?.src || "";

  if (!content && !file && !previewDataUrl) {
    return;
  }

  // Khóa nút gửi tạm thời
  if (btnSend) {
    btnSend.disabled = true;
  }

  let finalImageUrl: string | null = null;

  try {
    // 1. Upload ảnh nếu có file
    if (file) {
      try {
        const uploadRes = await UploadService.uploadFile(file);
        finalImageUrl = uploadRes.imageUrl;
      } catch (uploadErr) {
        console.warn("Upload ảnh thất bại, fallback sang base64 data URL:", uploadErr);
        finalImageUrl = previewDataUrl;
      }
    } else if (previewDataUrl && !previewDataUrl.endsWith("/")) {
      finalImageUrl = previewDataUrl;
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
      activePartner.lastMessage = content || "[Hình ảnh]";
      activePartner.lastMessageAt = newMsg.sentAt;

      // Đưa đối tác này lên đầu danh sách
      const idx = conversations.findIndex((c) => c.userId === activeReceiverId);
      if (idx > 0) {
        conversations.splice(idx, 1);
        conversations.unshift(activePartner);
      }
      renderConversations(conversations);
    }

    // 4. Reset input và preview
    if (chatInput) chatInput.value = "";
    if (fileInput) fileInput.value = "";
    if (previewContainer) previewContainer.classList.add("d-none");
    if (previewImg) previewImg.src = "";

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

  // Tránh trùng tin nhắn
  if (!messageHistoryMap[partnerId].some((m) => m.id === msg.id)) {
    messageHistoryMap[partnerId].push(msg);
  }

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

function onErrorReceived(err: ChatErrorDTO): void {
  console.debug("[Chat Error Received]", err);
}

function onAckReceived(ack: any): void {
  console.debug("[Chat Ack Received]", ack);
}

// ==================== KHỞI TẠO (INIT) ====================

/**
 * Thiết lập các sự kiện giao diện và khởi tạo dịch vụ Chat.
 */
export async function init(): Promise<void> {
  currentUserId = resolveCurrentUserId();
  const isTrainer = isTrainerRoute();

  // Cập nhật nhãn vai trò
  const roleLabel = document.getElementById("chat-role-label");
  if (roleLabel) {
    roleLabel.textContent = isTrainer ? "HLV Trưởng Hub" : "Học Viên Hub";
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
    console.debug("[WebSocket] Kết nối chưa sẵn sàng, kích hoạt fallback mode.");
  }

  // Tải danh sách hội thoại từ API, nếu lỗi thì dùng Demo Data cao cấp
  try {
    const data = await chatService.getConversations();
    if (data && data.length > 0) {
      conversations = data;
    } else {
      conversations = getDemoConversations(isTrainer);
    }
  } catch (error) {
    conversations = getDemoConversations(isTrainer);
  }

  // Render danh sách hội thoại
  renderConversations(conversations);

  // Tự động chọn cuộc hội thoại đầu tiên để sẵn sàng chat ngay lập tức!
  if (conversations.length > 0) {
    await selectConversation(conversations[0].userId);
  }

  // Thiết lập sự kiện Form gửi tin nhắn
  const chatForm = document.getElementById("chat-form");
  const btnSend = document.getElementById("btn-send");

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSendMessage();
    });
  }

  if (btnSend) {
    btnSend.addEventListener("click", (e) => {
      e.preventDefault();
      handleSendMessage();
    });
  }

  // Sự kiện nút Quay lại trên Mobile
  const btnBack = document.getElementById("btn-back");
  const appContainer = document.getElementById("chat-app-container");
  if (btnBack && appContainer) {
    btnBack.addEventListener("click", () => {
      appContainer.classList.remove("chat-active");
      activeReceiverId = null;
      activePartner = null;
      document
        .querySelectorAll(".conversation-item")
        .forEach((el) => el.classList.remove("active"));
    });
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
    btnAttach.addEventListener("click", () => {
      fileInput.click();
    });
  }

  if (fileInput && previewContainer && previewImg) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Vui lòng chỉ chọn tệp định dạng hình ảnh.");
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = (e.target?.result as string) || "";
          previewContainer.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemovePreview && fileInput && previewContainer && previewImg) {
    btnRemovePreview.addEventListener("click", () => {
      fileInput.value = "";
      previewImg.src = "";
      previewContainer.classList.add("d-none");
    });
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
    chip.addEventListener("click", (e) => {
      const prompt = (e.currentTarget as HTMLElement).dataset.prompt;
      if (prompt) {
        handleSendMessage(prompt);
      }
    });
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
