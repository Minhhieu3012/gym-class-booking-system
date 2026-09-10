package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ClassType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassTypeRepository extends JpaRepository<ClassType, Long> {
}