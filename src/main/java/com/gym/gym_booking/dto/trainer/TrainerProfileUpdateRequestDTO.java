package com.gym.gym_booking.dto.trainer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class TrainerProfileUpdateRequestDTO {

    @Size(max = 255, message = "Specialization must not exceed 255 characters")
    private String specialization;

    @Min(value = 0, message = "Experience years must be at least 0")
    @Max(value = 50, message = "Experience years must not exceed 50")
    private Integer experienceYears;

    @DecimalMin(value = "0.0", inclusive = true, message = "Hourly fee must be greater than or equal to 0")
    private BigDecimal hourlyFee;

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
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