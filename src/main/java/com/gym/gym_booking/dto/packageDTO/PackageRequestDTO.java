package com.gym.gym_booking.dto.packageDTO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PackageRequestDTO {

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal price;

    @NotNull
    @Min(1)
    private Integer sessionCount;

    @NotNull
    @Min(1)
    private Integer durationDays;

    @NotNull
    private Boolean active;
}