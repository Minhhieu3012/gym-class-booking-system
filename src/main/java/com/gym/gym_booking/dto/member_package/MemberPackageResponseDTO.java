package com.gym.gym_booking.dto.member_package;

import com.gym.gym_booking.enums.MemberPackageStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class MemberPackageResponseDTO {

    private Long id;

    private Long memberId;
    private String memberName;

    private Long packageId;
    private String packageName;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer sessionsRemaining;

    private MemberPackageStatus status;
}