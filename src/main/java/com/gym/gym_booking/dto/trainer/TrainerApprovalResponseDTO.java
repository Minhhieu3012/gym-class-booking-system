package com.gym.gym_booking.dto.trainer;

import com.gym.gym_booking.enums.UserStatus;

import java.time.LocalDateTime;

public class TrainerApprovalResponseDTO {

    private Long id;
    private UserStatus status;
    private Long approvedBy;
    private LocalDateTime approvedAt;

    public TrainerApprovalResponseDTO(
            Long id,
            UserStatus status,
            Long approvedBy,
            LocalDateTime approvedAt
    ) {
        this.id = id;
        this.status = status;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
    }

    public Long getId() {
        return id;
    }

    public UserStatus getStatus() {
        return status;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }
}