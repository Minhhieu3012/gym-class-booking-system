/**
 * Data Transfer Object cho tin nhắn trò chuyện giữa Member và Trainer.
 */
export interface ChatMessageDTO {
  /** ID duy nhất của tin nhắn */
  id: number;
  /** ID của người gửi tin nhắn */
  senderId: number;
  /** ID của người nhận tin nhắn */
  receiverId: number;
  /** Nội dung tin nhắn dạng văn bản (có thể null nếu chỉ gửi ảnh) */
  content: string | null;
  /** Đường dẫn URL hình ảnh đính kèm (có thể null nếu chỉ gửi văn bản) */
  imageUrl: string | null;
  /** Thời gian gửi tin nhắn (định dạng ISO 8601) */
  sentAt: string;
  /** Thời gian tin nhắn được đánh dấu là đã đọc (định dạng ISO 8601, null nếu chưa đọc) */
  readAt: string | null;
}

/**
 * Thông tin chi tiết một cuộc hội thoại trong danh sách tin nhắn gần đây.
 */
export interface ConversationItem {
  /** ID của đối tác trong cuộc trò chuyện */
  userId: number;
  /** Họ tên đầy đủ của đối tác */
  fullName: string;
  /** URL ảnh đại diện của đối tác (null nếu chưa có) */
  avatarUrl: string | null;
  /** Vai trò của đối tác */
  role: "MEMBER" | "TRAINER";
  /** Nội dung tin nhắn gần nhất trong cuộc trò chuyện */
  lastMessage: string | null;
  /** Số lượng tin nhắn chưa đọc */
  unreadCount: number;
  /** Thời gian gửi tin nhắn gần nhất (định dạng ISO 8601, null nếu chưa có) */
  lastMessageAt: string | null;
}

/**
 * Dữ liệu payload gửi tin nhắn mới qua WebSocket hoặc REST API.
 */
export interface SendMessagePayload {
  /** ID của người nhận tin nhắn */
  receiverId: number;
  /** Nội dung tin nhắn (có thể null nếu chỉ gửi hình ảnh) */
  content: string | null;
  /** URL hình ảnh đính kèm (có thể null nếu chỉ gửi văn bản) */
  imageUrl: string | null;
}

/**
 * Data Transfer Object cho phản hồi lỗi trong hệ thống Chat.
 */
export interface ChatErrorDTO {
  /** Mã định danh lỗi (ví dụ: 'UNAUTHORIZED', 'USER_NOT_FOUND', v.v.) */
  code: string;
  /** Thông báo lỗi chi tiết */
  message: string;
  /** Thời điểm xảy ra lỗi (định dạng ISO 8601) */
  timestamp: string;
}
