package com.gym.gym_booking.dto.chat;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationItem {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private String role;
    private String lastMessage;
    private int unreadCount;
    private LocalDateTime lastMessageAt;
}
