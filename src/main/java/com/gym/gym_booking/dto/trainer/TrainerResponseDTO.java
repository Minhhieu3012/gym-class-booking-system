package com.gym.gym_booking.dto.trainer;

import java.math.BigDecimal;

public class TrainerResponseDTO {

    private Long id;
    private String fullName;
    private String specialization;
    private Integer experienceYears;
    private BigDecimal hourlyFee;
    private String bio;

    public TrainerResponseDTO() {
    }

    public TrainerResponseDTO(
            Long id,
            String fullName,
            String specialization,
            Integer experienceYears,
            BigDecimal hourlyFee,
            String bio
    ) {
        this.id = id;
        this.fullName = fullName;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.hourlyFee = hourlyFee;
        this.bio = bio;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public BigDecimal getHourlyFee() {
        return hourlyFee;
    }

    public String getBio() {
        return bio;
    }
}