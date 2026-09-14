package com.gym.gym_booking.dto.class_booking;

import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.ClassBookingStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ClassBookingResponseDTO {

    private Long id;

    private LocalDateTime bookedAt;

    private LocalDateTime cancelledAt;

    private String cancellationReason;

    private AttendanceStatus attendanceStatus;

    private ClassBookingStatus status;

    private Long memberId;

    private Long memberPackageId;

    private Long gymClassId;
}