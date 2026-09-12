package com.gym.gym_booking.dto.pt_booking;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PTBookingCancelRequestDTO {

    @Size(max = 1000)
    private String reason;
}