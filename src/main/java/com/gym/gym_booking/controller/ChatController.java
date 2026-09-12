package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.chat.ChatErrorDTO;
import com.gym.gym_booking.dto.chat.ChatMessageDTO;
import com.gym.gym_booking.dto.chat.ConversationItem;
import com.gym.gym_booking.dto.chat.SendMessagePayload;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, UserRepository userRepository) {
        this.chatService = chatService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }
        String username = auth.getName();
        return userRepository.findByEmail(username)
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy người dùng hiện tại"));
    }

    // ==================== REST ENDPOINTS ====================

    @GetMapping("/chat/conversations")
    public ResponseEntity<List<ConversationItem>> getConversations() {
        User currentUser = getAuthenticatedUser();
        List<ConversationItem> list = chatService.getConversations(currentUser);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/chat/conversations/{userId}/messages")
    public ResponseEntity<Page<ChatMessageDTO>> getMessages(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User currentUser = getAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessageDTO> result = chatService.getMessages(currentUser, userId, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/chat/messages")
    public ResponseEntity<ChatMessageDTO> sendMessage(@Valid @RequestBody SendMessagePayload payload) {
        User currentUser = getAuthenticatedUser();
        ChatMessageDTO result = chatService.sendMessage(currentUser, payload);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(result);
    }

    @PatchMapping("/chat/messages/{messageId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        User currentUser = getAuthenticatedUser();
        chatService.markAsRead(messageId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ==================== WEBSOCKET STOMP MESSAGE MAPPING ====================

    @MessageMapping("/chat.sendMessage")
    public void handleSendMessage(@Payload @Valid SendMessagePayload payload, Principal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Chưa đăng nhập qua WebSocket");
        }

        String username = principal.getName();
        User sender = userRepository.findByEmail(username)
                .or(() -> userRepository.findByPhone(username))
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy người gửi"));

        chatService.sendMessage(sender, payload);
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public ChatErrorDTO handleMessageException(Exception ex) {
        return ChatErrorDTO.builder()
                .code("403_FORBIDDEN")
                .message(ex.getMessage() != null ? ex.getMessage() : "Yêu cầu chat không hợp lệ")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
