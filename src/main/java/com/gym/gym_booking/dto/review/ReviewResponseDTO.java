package com.gym.gym_booking.dto.review;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private Long classBookingId;
    private Long ptBookingId;
    private String message;
}
