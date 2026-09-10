package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.gym_class.GymClassRequestDTO;
import com.gym.gym_booking.dto.gym_class.GymClassResponseDTO;
import com.gym.gym_booking.dto.gym_class.GymClassUpdateRequestDTO;
import com.gym.gym_booking.enums.GymClassStatus;
import com.gym.gym_booking.service.GymClassService;
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
@RequestMapping("/admin/classes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGymClassController {

    private final GymClassService gymClassService;

    public AdminGymClassController(
            GymClassService gymClassService
    ) {
        this.gymClassService = gymClassService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<Page<GymClassResponseDTO>> getClasses(

            @RequestParam(required = false)
            Long classTypeId,

            @RequestParam(required = false)
            Long trainerId,

            @RequestParam(required = false)
            Long roomId,

            @RequestParam(required = false)
            GymClassStatus status,

            @RequestParam(required = false)
            LocalDateTime from,

            @RequestParam(required = false)
            LocalDateTime to,

            @RequestParam(required = false)
            String keyword,

            @PageableDefault(
                    size = 10,
                    sort = "startTime",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                gymClassService.getAllClassesForAdmin(
                        classTypeId,
                        trainerId,
                        roomId,
                        status,
                        from,
                        to,
                        keyword,
                        pageable
                )
        );
    }


    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<GymClassResponseDTO> getClassById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                gymClassService.getClassByIdForAdmin(id)
        );
    }


    // CREATE
    @PostMapping
    public ResponseEntity<GymClassResponseDTO> createClass(
            @Valid
            @RequestBody
            GymClassRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        gymClassService.createClass(request)
                );
    }


    // UPDATE

    @PatchMapping("/{id}")
    public ResponseEntity<GymClassResponseDTO> updateClass(
            @PathVariable Long id,
            @Valid
            @RequestBody
            GymClassUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                gymClassService.updateClass(
                        id,
                        request
                )
        );
    }


    // CANCEL
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<GymClassResponseDTO> cancelClass(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                gymClassService.cancelClass(id)
        );
    }
    // RESTORE
    @PatchMapping("/{id}/restore")
    public ResponseEntity<GymClassResponseDTO> restoreClass(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                gymClassService.restoreClass(id)
        );
    }
}