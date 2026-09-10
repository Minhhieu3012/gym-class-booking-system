package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.trainer.RejectTrainerRequestDTO;
import com.gym.gym_booking.dto.trainer.TrainerApprovalResponseDTO;
import com.gym.gym_booking.service.TrainerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/trainers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTrainerController {

    private final TrainerService trainerService;

    public AdminTrainerController(
            TrainerService trainerService
    ) {
        this.trainerService = trainerService;
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<TrainerApprovalResponseDTO> approveTrainer(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                trainerService.approveTrainer(id)
        );
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Void> rejectTrainer(
            @PathVariable Long id,
            @Valid @RequestBody RejectTrainerRequestDTO request
    ) {

        trainerService.rejectTrainer(
                id,
                request
        );

        return ResponseEntity.ok().build();
    }
}