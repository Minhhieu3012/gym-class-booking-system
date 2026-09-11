package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.member_package.MemberPackageResponseDTO;
import com.gym.gym_booking.enums.MemberPackageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MemberPackageService {

    // MEMBER
    Page<MemberPackageResponseDTO> getMyPackages(
            MemberPackageStatus status,
            Pageable pageable
    );

    MemberPackageResponseDTO getMyPackageById(Long id);

    // ADMIN
    Page<MemberPackageResponseDTO> getAllMemberPackages(
            Long memberId,
            MemberPackageStatus status,
            Pageable pageable
    );

    MemberPackageResponseDTO getMemberPackageById(Long id);
    void expireMemberPackages();
}