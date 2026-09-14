//package com.gym.gym_booking.controller;
//
//import com.gym.gym_booking.dto.attendance.AttendanceResponseDTO;
//import com.gym.gym_booking.dto.attendance.AttendanceUpdateRequestDTO;
//import com.gym.gym_booking.entity.PTBooking;
//import com.gym.gym_booking.enums.AttendanceStatus;
//import com.gym.gym_booking.repository.PTBookingRepository;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Optional;
//
//@RestController
//@RequestMapping("/pt-bookings")
//public class PTBookingController {
//
//    private final PTBookingRepository ptBookingRepository;
//
//    public PTBookingController(PTBookingRepository ptBookingRepository) {
//        this.ptBookingRepository = ptBookingRepository;
//    }
//
//    @PatchMapping("/{id}/attendance")
//    public ResponseEntity<AttendanceResponseDTO> markPTAttendance(
//            @PathVariable Long id,
//            @RequestBody AttendanceUpdateRequestDTO request
//    ) {
//        AttendanceStatus status = request.getAttendanceStatus() != null
//                ? request.getAttendanceStatus()
//                : AttendanceStatus.PRESENT;
//
//        Optional<PTBooking> optionalBooking = ptBookingRepository.findById(id);
//        if (optionalBooking.isPresent()) {
//            PTBooking booking = optionalBooking.get();
//            booking.setAttendanceStatus(status);
//            ptBookingRepository.save(booking);
//        }
//
//        AttendanceResponseDTO response = AttendanceResponseDTO.builder()
//                .bookingId(id)
//                .bookingType("PT")
//                .attendanceStatus(status)
//                .message("Điểm danh buổi tập PT thành công")
//                .build();
//
//        return ResponseEntity.ok(response);
//    }
//}
package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.dto.pt_booking.*;
import com.gym.gym_booking.enums.PTBookingStatus;
import com.gym.gym_booking.service.PTBookingService;
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
@RequestMapping("/pt-bookings")
public class PTBookingController {

    private final PTBookingService ptBookingService;

    public PTBookingController(
            PTBookingService ptBookingService
    ) {
        this.ptBookingService = ptBookingService;
    }

    // =========================
    // MEMBER
    // =========================

    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<PTBookingResponseDTO> createBooking(
            @Valid @RequestBody PTBookingCreateRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ptBookingService.createBooking(request)
                );
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<Page<PTBookingResponseDTO>> getMyBookings(
            @RequestParam(required = false)
            PTBookingStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "bookedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                ptBookingService.getMyBookings(
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/me/{id}")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<PTBookingResponseDTO> getMyBookingById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ptBookingService.getMyBookingById(id)
        );
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<PTBookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            @Valid @RequestBody(required = false)
            PTBookingCancelRequestDTO request
    ) {
        return ResponseEntity.ok(
                ptBookingService.cancelBooking(
                        id,
                        request
                )
        );
    }

    // =========================
    // TRAINER
    // =========================

    @GetMapping("/trainer/me")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<Page<PTBookingResponseDTO>> getTrainerBookings(
            @RequestParam(required = false)
            PTBookingStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "bookedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                ptBookingService.getTrainerBookings(
                        status,
                        pageable
                )
        );
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<PTBookingResponseDTO> approveBooking(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ptBookingService.approveBooking(id)
        );
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<PTBookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody
            PTBookingDecisionRequestDTO request
    ) {
        return ResponseEntity.ok(
                ptBookingService.rejectBooking(
                        id,
                        request
                )
        );
    }

    // =========================
    // TRAINER / ADMIN
    // =========================

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ResponseEntity<PTBookingResponseDTO> getBookingById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ptBookingService.getBookingById(id)
        );
    }

    @PatchMapping("/{id}/attendance")
    @PreAuthorize("hasAnyRole('TRAINER', 'ADMIN')")
    public ResponseEntity<PTBookingResponseDTO> markPTAttendance(
            @PathVariable Long id,
            @Valid @RequestBody
            AttendanceUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                ptBookingService.updateAttendance(
                        id,
                        request
                )
        );
    }
}