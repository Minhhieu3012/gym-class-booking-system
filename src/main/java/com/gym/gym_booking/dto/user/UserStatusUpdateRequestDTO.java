package com.gym.gym_booking.dto.user;

import com.gym.gym_booking.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public class UserStatusUpdateRequestDTO {

    @NotNull(message = "Status is required")
    private UserStatus status;

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }
}