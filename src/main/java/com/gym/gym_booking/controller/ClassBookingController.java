package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.class_booking.ClassBookingCreateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingResponseDTO;
import com.gym.gym_booking.enums.ClassBookingStatus;
import com.gym.gym_booking.service.ClassBookingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/class-bookings")
@PreAuthorize("hasRole('MEMBER')")
public class ClassBookingController {

    private final ClassBookingService classBookingService;

    public ClassBookingController(
            ClassBookingService classBookingService
    ) {
        this.classBookingService = classBookingService;
    }

    // MEMBER - Create booking
    @PostMapping
    public ResponseEntity<ClassBookingResponseDTO> createBooking(
            @Valid @RequestBody ClassBookingCreateRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(classBookingService.createBooking(request));
    }

    // MEMBER - Get my bookings
    @GetMapping("/me")
    public ResponseEntity<Page<ClassBookingResponseDTO>> getMyBookings(
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
                classBookingService.getMyBookings(
                        status,
                        pageable
                )
        );
    }

    // MEMBER - Get my booking detail
    @GetMapping("/me/{id}")
    public ResponseEntity<ClassBookingResponseDTO> getMyBookingById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                classBookingService.getMyBookingById(id)
        );
    }

    // MEMBER - Cancel booking
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ClassBookingResponseDTO> cancelBooking(
            @PathVariable Long id,

            @RequestParam(required = false)
            String reason
    ) {

        return ResponseEntity.ok(
                classBookingService.cancelBooking(
                        id,
                        reason
                )
        );
    }
}