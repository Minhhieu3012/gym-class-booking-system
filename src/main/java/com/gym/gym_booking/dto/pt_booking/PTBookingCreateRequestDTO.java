package com.gym.gym_booking.dto.pt_booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PTBookingCreateRequestDTO {

    @NotNull
    private Long trainerTimeSlotId;

    private Long memberPackageId;

    @NotBlank
    @Size(max = 255)
    private String sessionNote;

    @Size(max = 2000)
    private String healthNote;
}