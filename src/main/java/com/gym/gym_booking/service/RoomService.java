package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.room.RoomRequestDTO;
import com.gym.gym_booking.dto.room.RoomResponseDTO;
import com.gym.gym_booking.dto.room.RoomStatusUpdateRequestDTO;
import com.gym.gym_booking.dto.room.RoomUpdateRequestDTO;
import com.gym.gym_booking.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoomService {

    Page<RoomResponseDTO> getRooms(
            RoomStatus status,
            Pageable pageable
    );

    RoomResponseDTO getRoomById(Long id);

    RoomResponseDTO createRoom(
            RoomRequestDTO request
    );

    RoomResponseDTO updateRoom(
            Long id,
            RoomUpdateRequestDTO request
    );

    RoomResponseDTO updateRoomStatus(
            Long id,
            RoomStatusUpdateRequestDTO request
    );
}