package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.room.RoomRequestDTO;
import com.gym.gym_booking.dto.room.RoomResponseDTO;
import com.gym.gym_booking.dto.room.RoomStatusUpdateRequestDTO;
import com.gym.gym_booking.dto.room.RoomUpdateRequestDTO;
import com.gym.gym_booking.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/rooms")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    private final RoomService roomService;

    public AdminRoomController(
            RoomService roomService
    ) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<RoomResponseDTO> createRoom(
            @Valid @RequestBody RoomRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        roomService.createRoom(request)
                );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RoomResponseDTO> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                roomService.updateRoom(
                        id,
                        request
                )
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RoomResponseDTO> updateRoomStatus(
            @PathVariable Long id,
            @Valid @RequestBody RoomStatusUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                roomService.updateRoomStatus(
                        id,
                        request
                )
        );
    }
}