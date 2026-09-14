package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.chat.ChatMessageDTO;
import com.gym.gym_booking.dto.chat.ConversationItem;
import com.gym.gym_booking.dto.chat.SendMessagePayload;
import com.gym.gym_booking.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ChatService {
    List<ConversationItem> getConversations(User currentUser);
    Page<ChatMessageDTO> getMessages(User currentUser, Long partnerId, Pageable pageable);
    ChatMessageDTO sendMessage(User sender, SendMessagePayload payload);
    void markAsRead(Long messageId, User currentUser);
    boolean isChatAllowed(User user1, User user2);
}
