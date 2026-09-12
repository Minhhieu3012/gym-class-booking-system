import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { axiosInstance } from "../core/api";
import type {
  ChatMessageDTO,
  ConversationItem,
  SendMessagePayload,
  ChatErrorDTO,
} from "../models/chat";

/**
 * Service xử lý giao tiếp REST API và WebSocket STOMP cho chức năng Real-time Chat.
 */
export class ChatService {
  private stompClient: Client | null = null;
  private onMessageCallback: ((msg: ChatMessageDTO) => void) | null = null;
  private onErrorCallback: ((err: ChatErrorDTO) => void) | null = null;
  private onAckCallback: ((ack: any) => void) | null = null;

  // ==================== REST API ====================

  /**
   * Lấy danh sách các cuộc trò chuyện gần đây của người dùng hiện tại.
   *
   * @returns Danh sách hội thoại {@link ConversationItem}
   */
  public async getConversations(): Promise<ConversationItem[]> {
    const { data } = await axiosInstance.get<ConversationItem[]>("/chat/conversations");
    return data;
  }

  /**
   * Lấy lịch sử tin nhắn với một người dùng cụ thể (phân trang).
   *
   * @param userId - ID của đối tác trò chuyện
   * @param page - Số trang (bắt đầu từ 0)
   * @param size - Số tin nhắn mỗi trang
   * @returns Danh sách tin nhắn dạng phân trang
   */
  public async getMessages(
    userId: number,
    page: number = 0,
    size: number = 20,
  ): Promise<{ content: ChatMessageDTO[] }> {
    const { data } = await axiosInstance.get<{ content: ChatMessageDTO[] }>(
      `/chat/conversations/${userId}/messages`,
      {
        params: { page, size },
      },
    );
    return data;
  }

  /**
   * Đánh dấu một tin nhắn đã được đọc.
   *
   * @param messageId - ID của tin nhắn
   */
  public async markAsRead(messageId: number): Promise<void> {
    await axiosInstance.patch(`/chat/messages/${messageId}/read`);
  }

  // ==================== WEBSOCKET / STOMP ====================

  /**
   * Thiết lập các hàm callback để UI nhận dữ liệu từ WebSocket.
   *
   * @param onMsg - Callback khi nhận tin nhắn mới
   * @param onErr - Callback khi nhận thông báo lỗi
   * @param onAck - Callback khi nhận xác nhận tin nhắn
   */
  public setCallbacks(
    onMsg: (msg: ChatMessageDTO) => void,
    onErr: (err: ChatErrorDTO) => void,
    onAck: (ack: any) => void,
  ): void {
    this.onMessageCallback = onMsg;
    this.onErrorCallback = onErr;
    this.onAckCallback = onAck;
  }

  /**
   * Kết nối đến WebSocket STOMP endpoint qua SockJS fallback.
   */
  public connect(): void {
    // Đảm bảo ngắt kết nối cũ nếu đang tồn tại trước khi kết nối lại
    if (this.stompClient && this.stompClient.active) {
      return;
    }

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      "";

    const rawBaseUrl =
      (axiosInstance.defaults.baseURL as string | undefined) ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const baseUrl = rawBaseUrl.replace(/\/$/, "");
    const wsUrl = baseUrl ? `${baseUrl}/ws` : "/ws";

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.debug("[STOMP]", str);
        }
      },
      onConnect: () => {
        if (!this.stompClient) return;

        // Lắng nghe tin nhắn mới gửi đến
        this.stompClient.subscribe("/user/queue/messages", (message: IMessage) => {
          try {
            const data: ChatMessageDTO = JSON.parse(message.body);
            if (this.onMessageCallback) {
              this.onMessageCallback(data);
            }
          } catch (error) {
            console.error("Failed to parse incoming chat message JSON:", error);
          }
        });

        // Lắng nghe các lỗi xảy ra từ chat server
        this.stompClient.subscribe("/user/queue/errors", (message: IMessage) => {
          try {
            const errorData: ChatErrorDTO = JSON.parse(message.body);
            if (this.onErrorCallback) {
              this.onErrorCallback(errorData);
            }
          } catch (error) {
            console.error("Failed to parse chat error JSON:", error);
          }
        });

        // Lắng nghe xác nhận gửi tin nhắn thành công
        this.stompClient.subscribe("/user/queue/ack", (message: IMessage) => {
          try {
            const ackData = JSON.parse(message.body);
            if (this.onAckCallback) {
              this.onAckCallback(ackData);
            }
          } catch {
            if (this.onAckCallback) {
              this.onAckCallback(message.body);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP protocol error:", frame.headers["message"], frame.body);
      },
    });

    this.stompClient.activate();
  }

  /**
   * Ngắt kết nối STOMP client nếu đang hoạt động.
   */
  public disconnect(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  /**
   * Gửi một tin nhắn mới tới WebSocket server qua STOMP destination.
   *
   * @param payload - Dữ liệu tin nhắn cần gửi
   */
  public sendMessage(payload: SendMessagePayload): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("STOMP client is not connected. Unable to send message:", payload);
    }
  }

  /**
   * Kiểm tra xem WebSocket STOMP client hiện có đang kết nối hay không.
   */
  public isConnected(): boolean {
    return !!(this.stompClient && this.stompClient.connected);
  }
}

/**
 * Singleton instance của {@link ChatService} để sử dụng toàn ứng dụng.
 */
export const chatService = new ChatService();

export default chatService;
