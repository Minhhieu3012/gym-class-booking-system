package com.gym.gym_booking.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardTrainerDTO {

    private Long id;

    private String fullName;

    private String avatarUrl;

    private String specialization;

    private Integer experienceYear;

    private BigDecimal hourlyFee;

    private String bio;
}