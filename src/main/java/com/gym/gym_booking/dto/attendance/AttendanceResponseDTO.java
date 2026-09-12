package com.gym.gym_booking.dto.attendance;

import com.gym.gym_booking.enums.AttendanceStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceResponseDTO {
    private Long bookingId;
    private String bookingType;
    private AttendanceStatus attendanceStatus;
    private String message;
}
