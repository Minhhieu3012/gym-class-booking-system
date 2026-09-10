package com.gym.gym_booking.dto.class_type;

public class ClassTypeResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Boolean active;

    public ClassTypeResponseDTO(
            Long id,
            String name,
            String description,
            Boolean active
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getActive() {
        return active;
    }
}