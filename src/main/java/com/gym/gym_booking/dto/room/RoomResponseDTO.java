package com.gym.gym_booking.dto.room;

import com.gym.gym_booking.enums.RoomStatus;

public class RoomResponseDTO {

    private Long id;
    private String name;
    private String location;
    private Integer capacity;
    private RoomStatus status;

    public RoomResponseDTO(
            Long id,
            String name,
            String location,
            Integer capacity,
            RoomStatus status
    ) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.capacity = capacity;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getLocation() {
        return location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public RoomStatus getStatus() {
        return status;
    }
}