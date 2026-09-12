package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.PTBooking;
import com.gym.gym_booking.enums.PTBookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PTBookingRepository extends JpaRepository<PTBooking, Long> {

    List<PTBooking> findByMemberIdAndStatus(Long memberId, PTBookingStatus status);

    List<PTBooking> findByTrainerIdAndStatus(Long trainerId, PTBookingStatus status);

    boolean existsByMemberIdAndTrainerIdAndStatus(Long memberId, Long trainerId, PTBookingStatus status);
}