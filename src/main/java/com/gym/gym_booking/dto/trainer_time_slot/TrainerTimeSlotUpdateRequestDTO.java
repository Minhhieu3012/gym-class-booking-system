package com.gym.gym_booking.dto.trainer_time_slot;

import jakarta.validation.constraints.Future;

import java.time.LocalDateTime;

public class TrainerTimeSlotUpdateRequestDTO {

    @Future
    private LocalDateTime startTime;

    @Future
    private LocalDateTime endTime;

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}