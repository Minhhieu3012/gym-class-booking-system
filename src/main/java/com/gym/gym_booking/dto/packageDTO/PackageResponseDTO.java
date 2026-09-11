package com.gym.gym_booking.dto.packageDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PackageResponseDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer sessionCount;
    private Integer durationDays;
    private Boolean active;
}