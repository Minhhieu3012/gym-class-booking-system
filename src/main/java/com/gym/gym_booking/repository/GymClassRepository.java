package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.enums.GymClassStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GymClassRepository
        extends JpaRepository<GymClass, Long>,
        JpaSpecificationExecutor<GymClass> {

    /*
     * CHECK TRAINER OVERLAP
     * Hai khoảng thời gian bị overlap khi:
             existing.start < new.end
             AND
             existing.end > new.start
     * CANCELLED không được tính là trùng lịch.
     */
    @Query("""
        SELECT COUNT(g) > 0
        FROM GymClass g
        WHERE g.trainer.id = :trainerId
          AND g.status <> :cancelledStatus
          AND g.startTime < :endTime
          AND g.endTime > :startTime
    """)
    boolean existsTrainerTimeOverlap(
            @Param("trainerId") Long trainerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") GymClassStatus cancelledStatus
    );


    /*
     * CHECK ROOM OVERLAP
     */
    @Query("""
        SELECT COUNT(g) > 0
        FROM GymClass g
        WHERE g.room.id = :roomId
          AND g.status <> :cancelledStatus
          AND g.startTime < :endTime
          AND g.endTime > :startTime
    """)
    boolean existsRoomTimeOverlap(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") GymClassStatus cancelledStatus
    );


    /*
     * CHECK TRAINER OVERLAP
     * WHEN UPDATE
     * Loại chính class hiện tại ra khỏi query.
     */
    @Query("""
        SELECT COUNT(g) > 0
        FROM GymClass g
        WHERE g.trainer.id = :trainerId
          AND g.id <> :classId
          AND g.status <> :cancelledStatus
          AND g.startTime < :endTime
          AND g.endTime > :startTime
    """)
    boolean existsTrainerTimeOverlapForUpdate(
            @Param("trainerId") Long trainerId,
            @Param("classId") Long classId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") GymClassStatus cancelledStatus
    );


    /*
     * CHECK ROOM OVERLAP
     * WHEN UPDATE
     */
    @Query("""
        SELECT COUNT(g) > 0
        FROM GymClass g
        WHERE g.room.id = :roomId
          AND g.id <> :classId
          AND g.status <> :cancelledStatus
          AND g.startTime < :endTime
          AND g.endTime > :startTime
    """)
    boolean existsRoomTimeOverlapForUpdate(
            @Param("roomId") Long roomId,
            @Param("classId") Long classId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") GymClassStatus cancelledStatus
    );
    Page<GymClass> findByStatusInAndStartTimeAfterOrderByStartTimeAsc(
            java.util.Collection<GymClassStatus> statuses,
            LocalDateTime startTime,
            Pageable pageable
    );

    long countByStatusInAndStartTimeAfter(
            java.util.Collection<GymClassStatus> statuses,
            LocalDateTime startTime
    );
}