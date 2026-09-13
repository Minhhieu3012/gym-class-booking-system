package com.gym.gym_booking.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberDashboardResponseDTO {

    private DashboardStatsDTO stats;

    private List<DashboardClassDTO> upcomingClasses;

    private List<DashboardTrainerDTO> trainers;
}