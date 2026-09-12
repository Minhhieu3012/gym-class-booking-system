package com.gym.gym_booking.dto.trainer;

import java.math.BigDecimal;

public class TrainerResponseDTO {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String specialization;
    private Integer experienceYears;
    private BigDecimal hourlyFee;
    private String bio;
    private String status;

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

    public TrainerResponseDTO(
            Long id,
            String fullName,
            String email,
            String phone,
            String specialization,
            Integer experienceYears,
            BigDecimal hourlyFee,
            String bio,
            String status
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.specialization = specialization;
        this.experienceYears = experienceYears;
        this.hourlyFee = hourlyFee;
        this.bio = bio;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}