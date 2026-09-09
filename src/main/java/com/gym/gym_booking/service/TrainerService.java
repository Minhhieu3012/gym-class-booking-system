package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.trainer.RejectTrainerRequestDTO;
import com.gym.gym_booking.dto.trainer.TrainerApprovalResponseDTO;
import com.gym.gym_booking.dto.trainer.TrainerProfileRequestDTO;
import com.gym.gym_booking.dto.trainer.TrainerResponseDTO;
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

    TrainerResponseDTO createProfile(
            TrainerProfileRequestDTO request
    );

    TrainerResponseDTO updateProfile(
            TrainerProfileRequestDTO request
    );

    TrainerApprovalResponseDTO approveTrainer(
            Long trainerId
    );

    void rejectTrainer(
            Long trainerId,
            RejectTrainerRequestDTO request
    );
}