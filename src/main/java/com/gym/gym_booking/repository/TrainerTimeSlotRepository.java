package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.TrainerTimeSlot;
import com.gym.gym_booking.enums.TimeSlotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface TrainerTimeSlotRepository
        extends JpaRepository<TrainerTimeSlot, Long>,
        JpaSpecificationExecutor<TrainerTimeSlot> {

    Page<TrainerTimeSlot> findByTrainerId(
            Long trainerId,
            Pageable pageable
    );

    Page<TrainerTimeSlot> findByTrainerIdAndStatus(
            Long trainerId,
            TimeSlotStatus status,
            Pageable pageable
    );

//    @Query("""
//        SELECT t
//        FROM TrainerTimeSlot t
//        WHERE t.trainer.id = :trainerId
//          AND (:status IS NULL OR t.status = :status)
//          AND (:from IS NULL OR t.startTime >= :from)
//          AND (:to IS NULL OR t.endTime <= :to)
//        """)
//    Page<TrainerTimeSlot> searchTimeSlots(
//            @Param("trainerId") Long trainerId,
//            @Param("status") TimeSlotStatus status,
//            @Param("from") LocalDateTime from,
//            @Param("to") LocalDateTime to,
//            Pageable pageable
//    );

    @Query("""
        SELECT COUNT(t) > 0
        FROM TrainerTimeSlot t
        WHERE t.trainer.id = :trainerId
          AND t.status <> com.gym.gym_booking.enums.TimeSlotStatus.INACTIVE
          AND t.startTime < :endTime
          AND t.endTime > :startTime
        """)
    boolean existsOverlappingSlot(
            @Param("trainerId") Long trainerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("""
        SELECT COUNT(t) > 0
        FROM TrainerTimeSlot t
        WHERE t.id <> :slotId
          AND t.trainer.id = :trainerId
          AND t.status <> com.gym.gym_booking.enums.TimeSlotStatus.INACTIVE
          AND t.startTime < :endTime
          AND t.endTime > :startTime
        """)
    boolean existsOverlappingSlotForUpdate(
            @Param("slotId") Long slotId,
            @Param("trainerId") Long trainerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}