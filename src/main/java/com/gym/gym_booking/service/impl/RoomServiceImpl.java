package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.room.RoomRequestDTO;
import com.gym.gym_booking.dto.room.RoomResponseDTO;
import com.gym.gym_booking.dto.room.RoomStatusUpdateRequestDTO;
import com.gym.gym_booking.dto.room.RoomUpdateRequestDTO;
import com.gym.gym_booking.entity.Room;
import com.gym.gym_booking.enums.RoomStatus;
import com.gym.gym_booking.repository.RoomRepository;
import com.gym.gym_booking.service.RoomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    public RoomServiceImpl(
            RoomRepository roomRepository
    ) {
        this.roomRepository = roomRepository;
    }

    private RoomResponseDTO toResponse(Room room) {

        return new RoomResponseDTO(
                room.getId(),
                room.getName(),
                room.getLocation(),
                room.getCapacity(),
                room.getStatus()
        );
    }

    // GET ALL ROOMS

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponseDTO> getRooms(
            RoomStatus status,
            Pageable pageable
    ) {

        Page<Room> rooms;

        if (status != null) {
            rooms = roomRepository.findByStatus(
                    status,
                    pageable
            );
        } else {
            rooms = roomRepository.findAll(pageable);
        }

        return rooms.map(this::toResponse);
    }

    // GET ROOM BY ID
    @Override
    @Transactional(readOnly = true)
    public RoomResponseDTO getRoomById(Long id) {

        Room room = roomRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Room not found"
                        )
                );

        return toResponse(room);
    }

    // CREATE ROOM
    @Override
    @Transactional
    public RoomResponseDTO createRoom(
            RoomRequestDTO request
    ) {

        String name = request.getName().trim();

        if (roomRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException(
                    "Room name already exists"
            );
        }

        Room room = new Room();

        room.setName(name);

        room.setLocation(
                request.getLocation() != null
                        ? request.getLocation().trim()
                        : null
        );

        room.setCapacity(
                request.getCapacity()
        );

        room.setStatus(
                request.getStatus()
        );

        Room savedRoom =
                roomRepository.save(room);

        return toResponse(savedRoom);
    }

    // UPDATE ROOM
    @Override
    @Transactional
    public RoomResponseDTO updateRoom(
            Long id,
            RoomUpdateRequestDTO request
    ) {

        Room room = roomRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Room not found"
                        )
                );

        // Update name
        if (request.getName() != null) {

            String name =
                    request.getName().trim();

            if (name.isEmpty()) {
                throw new RuntimeException(
                        "Room name cannot be empty"
                );
            }

            if (!name.equalsIgnoreCase(room.getName())
                    && roomRepository.existsByNameIgnoreCase(name)) {

                throw new RuntimeException(
                        "Room name already exists"
                );
            }

            room.setName(name);
        }

        // Update location
        if (request.getLocation() != null) {

            room.setLocation(
                    request.getLocation().trim()
            );
        }

        // Update capacity
        if (request.getCapacity() != null) {

            room.setCapacity(
                    request.getCapacity()
            );
        }

        Room savedRoom =
                roomRepository.save(room);

        return toResponse(savedRoom);
    }

    // UPDATE STATUS
    @Override
    @Transactional
    public RoomResponseDTO updateRoomStatus(
            Long id,
            RoomStatusUpdateRequestDTO request
    ) {

        Room room = roomRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Room not found"
                        )
                );

        room.setStatus(
                request.getStatus()
        );

        Room savedRoom =
                roomRepository.save(room);

        return toResponse(savedRoom);
    }
}