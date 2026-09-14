package com.gym.gym_booking.dto.dashboard;

import com.gym.gym_booking.enums.GymClassStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardClassDTO {

    private Long id;

    private String title;

    private String classTypeName;

    private String trainerName;

    private String roomName;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer currentCount;

    private Integer maxCapacity;

    private GymClassStatus status;
}