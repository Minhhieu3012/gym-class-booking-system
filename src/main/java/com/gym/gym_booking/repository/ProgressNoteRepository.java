package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ProgressNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProgressNoteRepository extends JpaRepository<ProgressNote, Long> {
}