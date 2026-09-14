package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.gym_class.GymClassResponseDTO;
import com.gym.gym_booking.enums.GymClassStatus;
import com.gym.gym_booking.service.GymClassService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/classes")
public class GymClassController {

    private final GymClassService gymClassService;

    public GymClassController(
            GymClassService gymClassService
    ) {
        this.gymClassService = gymClassService;
    }

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
                gymClassService.getClasses(
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


    @GetMapping("/{id}")
    public ResponseEntity<GymClassResponseDTO> getClassById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                gymClassService.getClassById(id)
        );
    }
}