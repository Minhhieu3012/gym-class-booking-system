package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.gym_class.GymClassRequestDTO;
import com.gym.gym_booking.dto.gym_class.GymClassResponseDTO;
import com.gym.gym_booking.dto.gym_class.GymClassUpdateRequestDTO;
import com.gym.gym_booking.enums.GymClassStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface GymClassService {

    // PUBLIC / MEMBER
    Page<GymClassResponseDTO> getClasses(
            Long classTypeId,
            Long trainerId,
            Long roomId,
            GymClassStatus status,
            LocalDateTime from,
            LocalDateTime to,
            String keyword,
            Pageable pageable
    );

    GymClassResponseDTO getClassById(Long id);


    // ADMIN

    Page<GymClassResponseDTO> getAllClassesForAdmin(
            Long classTypeId,
            Long trainerId,
            Long roomId,
            GymClassStatus status,
            LocalDateTime from,
            LocalDateTime to,
            String keyword,
            Pageable pageable
    );

    GymClassResponseDTO getClassByIdForAdmin(Long id);

    GymClassResponseDTO createClass(
            GymClassRequestDTO request
    );

    GymClassResponseDTO updateClass(
            Long id,
            GymClassUpdateRequestDTO request
    );

    GymClassResponseDTO cancelClass(Long id);
    GymClassResponseDTO restoreClass(Long id);
}