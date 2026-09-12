package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotRequestDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotResponseDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotUpdateRequestDTO;
import com.gym.gym_booking.enums.TimeSlotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface TrainerTimeSlotService {

    Page<TrainerTimeSlotResponseDTO> getTrainerTimeSlots(
            Long trainerId,
            TimeSlotStatus status,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );

    TrainerTimeSlotResponseDTO createTimeSlot(
            TrainerTimeSlotRequestDTO request
    );

    TrainerTimeSlotResponseDTO updateTimeSlot(
            Long id,
            TrainerTimeSlotUpdateRequestDTO request
    );

    TrainerTimeSlotResponseDTO deactivateTimeSlot(
            Long id
    );
    public TrainerTimeSlotResponseDTO activateTimeSlot(Long id);
}