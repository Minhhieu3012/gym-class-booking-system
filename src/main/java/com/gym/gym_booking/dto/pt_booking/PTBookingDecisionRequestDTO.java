package com.gym.gym_booking.dto.pt_booking;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PTBookingDecisionRequestDTO {

    @Size(max = 1000)
    private String rejectReason;
}