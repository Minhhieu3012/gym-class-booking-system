package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.PTBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PTBookingRepository extends JpaRepository<PTBooking, Long> {
}