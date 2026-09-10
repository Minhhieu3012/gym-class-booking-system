package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.TrainerTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainerTimeSlotRepository extends JpaRepository<TrainerTimeSlot, Long> {
}