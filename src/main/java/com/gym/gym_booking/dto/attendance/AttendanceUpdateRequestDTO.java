package com.gym.gym_booking.dto.attendance;

import com.gym.gym_booking.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceUpdateRequestDTO {
    private AttendanceStatus attendanceStatus;
}
