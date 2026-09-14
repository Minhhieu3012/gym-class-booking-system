package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.pt_booking.PTBookingCancelRequestDTO;
import com.gym.gym_booking.dto.pt_booking.PTBookingCreateRequestDTO;
import com.gym.gym_booking.dto.pt_booking.PTBookingDecisionRequestDTO;
import com.gym.gym_booking.dto.pt_booking.PTBookingResponseDTO;
import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.enums.PTBookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PTBookingService {

    PTBookingResponseDTO createBooking(
            PTBookingCreateRequestDTO request
    );

    Page<PTBookingResponseDTO> getMyBookings(
            PTBookingStatus status,
            Pageable pageable
    );

    PTBookingResponseDTO getMyBookingById(Long id);

    Page<PTBookingResponseDTO> getTrainerBookings(
            PTBookingStatus status,
            Pageable pageable
    );

    PTBookingResponseDTO getBookingById(Long id);

    PTBookingResponseDTO approveBooking(Long id);

    PTBookingResponseDTO rejectBooking(
            Long id,
            PTBookingDecisionRequestDTO request
    );

    PTBookingResponseDTO cancelBooking(
            Long id,
            PTBookingCancelRequestDTO request
    );

    PTBookingResponseDTO updateAttendance(
            Long id,
            AttendanceUpdateRequestDTO request
    );
}