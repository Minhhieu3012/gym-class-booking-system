package com.gym.gym_booking.dto.class_booking;

import com.gym.gym_booking.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceUpdateRequestDTO {

    @NotNull
    private AttendanceStatus attendanceStatus;
}