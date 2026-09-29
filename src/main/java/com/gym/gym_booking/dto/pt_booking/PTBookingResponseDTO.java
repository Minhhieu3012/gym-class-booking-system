package com.gym.gym_booking.dto.pt_booking;

import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.PTBookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    private String memberName;

    private String memberAvatarUrl;

    private String memberPhone;

    private String memberEmail;

    private Long trainerId;

    private String trainerName;

    private Long trainerTimeSlotId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Long memberPackageId;
}