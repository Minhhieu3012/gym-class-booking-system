package com.gym.gym_booking.dto.packageDTO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PackageUpdateRequestDTO {

    @Size(max = 255)
    private String name;

    private String description;

    @DecimalMin(value = "0.0")
    private BigDecimal price;

    @Min(1)
    private Integer sessionCount;

    @Min(1)
    private Integer durationDays;

    private Boolean active;
}