package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingResponseDTO;
import com.gym.gym_booking.enums.ClassBookingStatus;
import com.gym.gym_booking.service.ClassBookingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/class-bookings")
public class ClassBookingManagementController {

    private final ClassBookingService classBookingService;

    public ClassBookingManagementController(
            ClassBookingService classBookingService
    ) {
        this.classBookingService = classBookingService;
    }

    // TRAINER / ADMIN - Get bookings of a class
    @GetMapping("/classes/{gymClassId}")
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ResponseEntity<Page<ClassBookingResponseDTO>> getClassBookings(
            @PathVariable Long gymClassId,

            @RequestParam(required = false)
            ClassBookingStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "bookedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                classBookingService.getClassBookings(
                        gymClassId,
                        status,
                        pageable
                )
        );
    }

    // TRAINER / ADMIN - Get booking detail
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ResponseEntity<ClassBookingResponseDTO> getBookingById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                classBookingService.getBookingById(id)
        );
    }

    // TRAINER / ADMIN - Update attendance
    @PatchMapping("/{id}/attendance")
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ResponseEntity<ClassBookingResponseDTO> updateAttendance(
            @PathVariable Long id,

            @Valid @RequestBody AttendanceUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                classBookingService.updateAttendance(
                        id,
                        request
                )
        );
    }
}