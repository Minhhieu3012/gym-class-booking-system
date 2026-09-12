package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.MemberPackage;
import com.gym.gym_booking.enums.MemberPackageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MemberPackageRepository
        extends JpaRepository<MemberPackage, Long> {

    Page<MemberPackage> findByMemberId(
            Long memberId,
            Pageable pageable
    );

    Page<MemberPackage> findByMemberIdAndStatus(
            Long memberId,
            MemberPackageStatus status,
            Pageable pageable
    );

    Optional<MemberPackage> findByIdAndMemberId(
            Long id,
            Long memberId
    );

    Page<MemberPackage> findByStatus(
            MemberPackageStatus status,
            Pageable pageable
    );
    List<MemberPackage> findByStatusAndEndDateBefore(
            MemberPackageStatus status,
            LocalDate date
    );
    List<MemberPackage>
    findByMemberIdAndStatusAndSessionsRemainingGreaterThanAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateAsc(
            Long memberId,
            MemberPackageStatus status,
            Integer sessionsRemaining,
            LocalDate startDate,
            LocalDate endDate
    );
}