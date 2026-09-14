package com.gym.gym_booking.dto.pt_booking;

import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.PTBookingStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PTBookingResponseDTO {

    private Long id;

    private String sessionNote;

    private String healthNote;

    private String rejectReason;

    private PTBookingStatus status;

    private AttendanceStatus attendanceStatus;

    private LocalDateTime bookedAt;

    private LocalDateTime cancelledAt;

    private Long memberId;

    private Long trainerId;

    private Long trainerTimeSlotId;

    private Long memberPackageId;
}