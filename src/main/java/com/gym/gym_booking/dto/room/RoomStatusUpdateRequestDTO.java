package com.gym.gym_booking.dto.room;

import com.gym.gym_booking.enums.RoomStatus;
import jakarta.validation.constraints.NotNull;

public class RoomStatusUpdateRequestDTO {

    @NotNull(message = "Status is required")
    private RoomStatus status;

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }
}