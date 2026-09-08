package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GymClassRepository extends JpaRepository<GymClass, Long> {
}