package com.gym.gym_booking.dto.member;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberScheduleResponseDTO {

    private List<MemberScheduleItemDTO> schedules;
}