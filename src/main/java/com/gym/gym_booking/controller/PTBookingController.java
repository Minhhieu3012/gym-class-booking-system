package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.attendance.AttendanceResponseDTO;
import com.gym.gym_booking.dto.attendance.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.entity.PTBooking;
import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.repository.PTBookingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/pt-bookings")
public class PTBookingController {

    private final PTBookingRepository ptBookingRepository;

    public PTBookingController(PTBookingRepository ptBookingRepository) {
        this.ptBookingRepository = ptBookingRepository;
    }

    @PatchMapping("/{id}/attendance")
    public ResponseEntity<AttendanceResponseDTO> markPTAttendance(
            @PathVariable Long id,
            @RequestBody AttendanceUpdateRequestDTO request
    ) {
        AttendanceStatus status = request.getAttendanceStatus() != null
                ? request.getAttendanceStatus()
                : AttendanceStatus.PRESENT;

        Optional<PTBooking> optionalBooking = ptBookingRepository.findById(id);
        if (optionalBooking.isPresent()) {
            PTBooking booking = optionalBooking.get();
            booking.setAttendanceStatus(status);
            ptBookingRepository.save(booking);
        }

        AttendanceResponseDTO response = AttendanceResponseDTO.builder()
                .bookingId(id)
                .bookingType("PT")
                .attendanceStatus(status)
                .message("Điểm danh buổi tập PT thành công")
                .build();

        return ResponseEntity.ok(response);
    }
}
