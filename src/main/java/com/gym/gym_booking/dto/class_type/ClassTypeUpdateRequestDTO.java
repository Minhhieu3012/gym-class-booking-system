package com.gym.gym_booking.dto.class_type;

import jakarta.validation.constraints.Size;

public class ClassTypeUpdateRequestDTO {

    @Size(
            max = 255,
            message = "Class type name must not exceed 255 characters"
    )
    private String name;

    private String description;

    private Boolean active;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}