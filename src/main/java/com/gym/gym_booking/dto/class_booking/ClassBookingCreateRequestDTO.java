package com.gym.gym_booking.dto.class_booking;

import jakarta.validation.constraints.NotNull;

public class ClassBookingCreateRequestDTO {

    @NotNull
    private Long gymClassId;

    private Long memberPackageId;

    public Long getGymClassId() {
        return gymClassId;
    }

    public void setGymClassId(Long gymClassId) {
        this.gymClassId = gymClassId;
    }

    public Long getMemberPackageId() {
        return memberPackageId;
    }

    public void setMemberPackageId(Long memberPackageId) {
        this.memberPackageId = memberPackageId;
    }
}