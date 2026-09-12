package com.gym.gym_booking.dto.chat;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String imageUrl;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
}
