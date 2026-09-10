package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ClassBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassBookingRepository extends JpaRepository<ClassBooking, Long> {
}