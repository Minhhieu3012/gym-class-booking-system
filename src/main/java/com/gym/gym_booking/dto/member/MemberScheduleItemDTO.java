package com.gym.gym_booking.dto.member;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberScheduleItemDTO {

    private Long bookingId;

    /**
     * CLASS hoặc PT
     */
    private String type;

    private String title;

    private String classTypeName;

    private String trainerName;

    private String roomName;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String status;

    private String attendanceStatus;

    private String sessionNote;
}