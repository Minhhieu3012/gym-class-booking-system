package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.enums.ClassBookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassBookingRepository
        extends JpaRepository<ClassBooking, Long> {

    Page<ClassBooking> findByMemberId(
            Long memberId,
            Pageable pageable
    );

    Page<ClassBooking> findByMemberIdAndStatus(
            Long memberId,
            ClassBookingStatus status,
            Pageable pageable
    );

    Page<ClassBooking> findByGymClassId(
            Long gymClassId,
            Pageable pageable
    );

    Page<ClassBooking> findByGymClassIdAndStatus(
            Long gymClassId,
            ClassBookingStatus status,
            Pageable pageable
    );

    boolean existsByMemberIdAndGymClassIdAndStatus(
            Long memberId,
            Long gymClassId,
            ClassBookingStatus status
    );
}