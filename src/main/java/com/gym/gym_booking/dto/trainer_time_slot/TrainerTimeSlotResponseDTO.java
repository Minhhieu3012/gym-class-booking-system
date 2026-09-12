package com.gym.gym_booking.dto.trainer_time_slot;

import com.gym.gym_booking.enums.TimeSlotStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TrainerTimeSlotResponseDTO {

    private Long id;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private TimeSlotStatus status;

    private Long trainerId;
}