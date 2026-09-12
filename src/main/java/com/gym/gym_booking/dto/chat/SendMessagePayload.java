package com.gym.gym_booking.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessagePayload {
    @NotNull(message = "receiverId is required")
    private Long receiverId;
    private String content;
    private String imageUrl;
}
