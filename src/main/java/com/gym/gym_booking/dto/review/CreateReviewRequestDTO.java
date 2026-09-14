package com.gym.gym_booking.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequestDTO {
    private Long classBookingId;
    private Long ptBookingId;

    @NotNull(message = "Rating is required")
    @Min(1)
    @Max(5)
    private Integer rating;

    @NotBlank(message = "Comment cannot be blank")
    private String comment;
}
