export type ChatUserRole = "MEMBER" | "TRAINER";

export interface ChatMessageDTO {
  id: number;
  senderId: number;
  receiverId: number;
  content: string | null;
  imageUrl: string | null;
  sentAt: string;
  readAt: string | null;
}

export interface ConversationItem {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  role: ChatUserRole;
  lastMessage: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface SendMessagePayload {
  receiverId: number;
  content: string | null;
  imageUrl?: string | null;
}

export interface ChatErrorDTO {
  code: string;
  message: string;
  timestamp: string;
}

export interface ChatMessageQueryParams {
  page?: number;
  size?: number;
}
