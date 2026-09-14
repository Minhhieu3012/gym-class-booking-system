package com.gym.gym_booking.dto.room;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class RoomUpdateRequestDTO {

    @Size(max = 255, message = "Room name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
}