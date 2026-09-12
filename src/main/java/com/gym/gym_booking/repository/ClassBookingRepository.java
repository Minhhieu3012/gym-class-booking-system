package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.enums.ClassBookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@Repository
public interface ClassBookingRepository extends JpaRepository<ClassBooking, Long> {

    @Query("SELECT cb FROM ClassBooking cb WHERE cb.member.id = :memberId AND cb.status = :status")
    List<ClassBooking> findByMemberIdAndStatus(
            @Param("memberId") Long memberId,
            @Param("status") ClassBookingStatus status
    );

    @Query("SELECT cb FROM ClassBooking cb WHERE cb.gymClass.trainer.id = :trainerId AND cb.status = :status")
    List<ClassBooking> findByTrainerIdAndStatus(
            @Param("trainerId") Long trainerId,
            @Param("status") ClassBookingStatus status
    );

    @Query("SELECT COUNT(cb) > 0 FROM ClassBooking cb WHERE cb.member.id = :memberId AND cb.gymClass.trainer.id = :trainerId AND cb.status = :status")
    boolean existsActiveBookingBetween(
            @Param("memberId") Long memberId,
            @Param("trainerId") Long trainerId,
            @Param("status") ClassBookingStatus status
    );
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