package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.TrainerProfile;
import com.gym.gym_booking.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TrainerProfileRepository
        extends JpaRepository<TrainerProfile, Long> {

    Optional<TrainerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("""
    SELECT t
    FROM TrainerProfile t
    JOIN t.user u
    WHERE u.status = :status
      AND (
            :specialization IS NULL
            OR :specialization = ''
            OR LOWER(t.specialization)
                LIKE LOWER(CONCAT('%', :specialization, '%'))
          )
      AND (
            :keyword IS NULL
            OR :keyword = ''
            OR LOWER(u.fullName)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    """)
    Page<TrainerProfile> searchTrainers(
            @Param("status") UserStatus status,
            @Param("specialization") String specialization,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}