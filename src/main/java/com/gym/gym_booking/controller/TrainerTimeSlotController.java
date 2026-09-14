package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotRequestDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotResponseDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotUpdateRequestDTO;
import com.gym.gym_booking.enums.TimeSlotStatus;
import com.gym.gym_booking.service.TrainerTimeSlotService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/trainers")
public class TrainerTimeSlotController {

    private final TrainerTimeSlotService trainerTimeSlotService;

    public TrainerTimeSlotController(
            TrainerTimeSlotService trainerTimeSlotService
    ) {
        this.trainerTimeSlotService = trainerTimeSlotService;
    }

    @GetMapping("/{trainerId}/time-slots")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER', 'ADMIN')")
    public ResponseEntity<Page<TrainerTimeSlotResponseDTO>>
    getTrainerTimeSlots(
            @PathVariable Long trainerId,

            @RequestParam(required = false)
            TimeSlotStatus status,

            @RequestParam(required = false)
            LocalDateTime from,

            @RequestParam(required = false)
            LocalDateTime to,

            @PageableDefault(
                    size = 10,
                    sort = "startTime",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                trainerTimeSlotService.getTrainerTimeSlots(
                        trainerId,
                        status,
                        from,
                        to,
                        pageable
                )
        );
    }

    @PostMapping("/time-slots")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerTimeSlotResponseDTO>
    createTimeSlot(
            @Valid @RequestBody
            TrainerTimeSlotRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        trainerTimeSlotService.createTimeSlot(
                                request
                        )
                );
    }

    @PatchMapping("/time-slots/{id}")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerTimeSlotResponseDTO>
    updateTimeSlot(
            @PathVariable Long id,

            @Valid @RequestBody
            TrainerTimeSlotUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                trainerTimeSlotService.updateTimeSlot(
                        id,
                        request
                )
        );
    }

    @PatchMapping("/time-slots/{id}/deactivate")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerTimeSlotResponseDTO>
    deactivateTimeSlot(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                trainerTimeSlotService.deactivateTimeSlot(id)
        );
    }
    @PatchMapping("/time-slots/{id}/activate")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerTimeSlotResponseDTO>
    activateTimeSlot(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                trainerTimeSlotService.activateTimeSlot(id)
        );
    }
}