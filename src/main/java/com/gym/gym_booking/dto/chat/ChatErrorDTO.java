package com.gym.gym_booking.dto.chat;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatErrorDTO {
    private String code;
    private String message;
    private LocalDateTime timestamp;
}
