package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.attendance.AttendanceResponseDTO;
import com.gym.gym_booking.dto.attendance.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.repository.ClassBookingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/class-bookings")
public class ClassBookingController {

    private final ClassBookingRepository classBookingRepository;

    public ClassBookingController(ClassBookingRepository classBookingRepository) {
        this.classBookingRepository = classBookingRepository;
    }

    @PatchMapping("/{id}/attendance")
    public ResponseEntity<AttendanceResponseDTO> markClassAttendance(
            @PathVariable Long id,
            @RequestBody AttendanceUpdateRequestDTO request
    ) {
        AttendanceStatus status = request.getAttendanceStatus() != null
                ? request.getAttendanceStatus()
                : AttendanceStatus.PRESENT;

        Optional<ClassBooking> optionalBooking = classBookingRepository.findById(id);
        if (optionalBooking.isPresent()) {
            ClassBooking booking = optionalBooking.get();
            booking.setAttendanceStatus(status);
            classBookingRepository.save(booking);
        }

        AttendanceResponseDTO response = AttendanceResponseDTO.builder()
                .bookingId(id)
                .bookingType("CLASS")
                .attendanceStatus(status)
                .message("Điểm danh lớp học thành công")
                .build();

        return ResponseEntity.ok(response);
    }
}
