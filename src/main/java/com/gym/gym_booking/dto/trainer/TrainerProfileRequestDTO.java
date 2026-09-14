package com.gym.gym_booking.dto.trainer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class TrainerProfileRequestDTO {

    @NotBlank(message = "Specialization is required")
    @Size(
            max = 100,
            message = "Specialization must not exceed 100 characters"
    )
    private String specialization;

    @NotNull(message = "Experience years is required")
    @Min(
            value = 0,
            message = "Experience years cannot be negative"
    )
    @Max(
            value = 50,
            message = "Experience years cannot exceed 50"
    )
    private Integer experienceYears;

    @NotNull(message = "Hourly fee is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Hourly fee cannot be negative"
    )
    private BigDecimal hourlyFee;

    @Size(
            max = 1000,
            message = "Bio must not exceed 1000 characters"
    )
    private String bio;

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getHourlyFee() {
        return hourlyFee;
    }

    public void setHourlyFee(BigDecimal hourlyFee) {
        this.hourlyFee = hourlyFee;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}