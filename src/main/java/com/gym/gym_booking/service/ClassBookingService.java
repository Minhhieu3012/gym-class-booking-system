package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingCreateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingResponseDTO;
import com.gym.gym_booking.enums.ClassBookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClassBookingService {

    ClassBookingResponseDTO createBooking(
            ClassBookingCreateRequestDTO request
    );

    Page<ClassBookingResponseDTO> getMyBookings(
            ClassBookingStatus status,
            Pageable pageable
    );

    ClassBookingResponseDTO getMyBookingById(
            Long id
    );

    Page<ClassBookingResponseDTO> getClassBookings(
            Long gymClassId,
            ClassBookingStatus status,
            Pageable pageable
    );

    ClassBookingResponseDTO getBookingById(
            Long id
    );

    ClassBookingResponseDTO cancelBooking(
            Long id,
            String reason
    );
    ClassBookingResponseDTO updateAttendance(
            Long id,
            AttendanceUpdateRequestDTO request
    );
}