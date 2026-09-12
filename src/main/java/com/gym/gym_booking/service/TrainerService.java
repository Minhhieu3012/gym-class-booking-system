package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.trainer.*;
import com.gym.gym_booking.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TrainerService {

    Page<TrainerResponseDTO> getTrainers(
            UserStatus status,
            String specialization,
            String keyword,
            Pageable pageable
    );

    TrainerResponseDTO getTrainerById(
            Long id
    );

    TrainerResponseDTO updateProfile(
            TrainerProfileUpdateRequestDTO request
    );

    TrainerApprovalResponseDTO approveTrainer(
            Long trainerId
    );

    void rejectTrainer(
            Long trainerId,
            RejectTrainerRequestDTO request
    );
}