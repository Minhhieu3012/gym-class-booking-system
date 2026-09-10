package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.trainer.TrainerProfileRequestDTO;
import com.gym.gym_booking.dto.trainer.TrainerProfileUpdateRequestDTO;
import com.gym.gym_booking.dto.trainer.TrainerResponseDTO;
import com.gym.gym_booking.dto.trainer.RejectTrainerRequestDTO;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.service.TrainerService;
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
@RequestMapping("/trainers")
public class TrainerController {

    private final TrainerService trainerService;

    public TrainerController(
            TrainerService trainerService
    ) {
        this.trainerService = trainerService;
    }

    @GetMapping
    public ResponseEntity<Page<TrainerResponseDTO>> getTrainers(
//            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String keyword,
            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                trainerService.getTrainers(
//                        status,
                        specialization,
                        keyword,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainerResponseDTO> getTrainerById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                trainerService.getTrainerById(id)
        );
    }

    @PatchMapping("/profile")
    @PreAuthorize("hasRole('TRAINER')")
    public ResponseEntity<TrainerResponseDTO> updateProfile(
            @Valid @RequestBody TrainerProfileUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                trainerService.updateProfile(request)
        );
    }
}