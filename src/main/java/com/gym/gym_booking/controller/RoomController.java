package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.room.RoomResponseDTO;
import com.gym.gym_booking.enums.RoomStatus;
import com.gym.gym_booking.service.RoomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(
            RoomService roomService
    ) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<Page<RoomResponseDTO>> getRooms(
            @RequestParam(required = false)
            RoomStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                roomService.getRooms(
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponseDTO> getRoomById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                roomService.getRoomById(id)
        );
    }
}