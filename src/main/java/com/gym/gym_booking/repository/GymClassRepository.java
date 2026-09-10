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
//    @Query("""
//    SELECT g
//    FROM GymClass g
//    JOIN g.classType ct
//    JOIN g.trainer t
//    JOIN g.room r
//    WHERE (:classTypeId IS NULL OR ct.id = :classTypeId)
//      AND (:trainerId IS NULL OR t.id = :trainerId)
//      AND (:roomId IS NULL OR r.id = :roomId)
//      AND (:status IS NULL OR g.status = :status)
//      AND (CAST(:from AS java.time.LocalDateTime) IS NULL
//           OR g.startTime >= :from)
//      AND (CAST(:to AS java.time.LocalDateTime) IS NULL
//           OR g.endTime <= :to)
//      AND (
//            :keyword IS NULL
//            OR :keyword = ''
//            OR LOWER(g.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
//          )
//    """)
//    Page<GymClass> searchClasses(
//            @Param("classTypeId") Long classTypeId,
//            @Param("trainerId") Long trainerId,
//            @Param("roomId") Long roomId,
//            @Param("status") GymClassStatus status,
//            @Param("from") LocalDateTime from,
//            @Param("to") LocalDateTime to,
//            @Param("keyword") String keyword,
//            Pageable pageable
//    );
//    @Query("""
//    SELECT g
//    FROM GymClass g
//    JOIN g.classType ct
//    JOIN g.trainer t
//    JOIN g.room r
//    WHERE g.status IN (
//        com.gym.gym_booking.enums.GymClassStatus.SCHEDULED,
//        com.gym.gym_booking.enums.GymClassStatus.FULL
//    )
//      AND (:classTypeId IS NULL OR ct.id = :classTypeId)
//      AND (:trainerId IS NULL OR t.id = :trainerId)
//      AND (:roomId IS NULL OR r.id = :roomId)
//      AND (:status IS NULL OR g.status = :status)
//      AND (:from IS NULL OR g.startTime >= :from)
//      AND (:to IS NULL OR g.endTime <= :to)
//      AND (
//            :keyword IS NULL
//            OR :keyword = ''
//            OR LOWER(g.title)
//                LIKE LOWER(CONCAT('%', :keyword, '%'))
//          )
//    """)
//    Page<GymClass> searchPublicClasses(
//            @Param("classTypeId") Long classTypeId,
//            @Param("trainerId") Long trainerId,
//            @Param("roomId") Long roomId,
//            @Param("status") GymClassStatus status,
//            @Param("from") LocalDateTime from,
//            @Param("to") LocalDateTime to,
//            @Param("keyword") String keyword,
//            Pageable pageable
//    );

    /*
     * =========================
     * PUBLIC LIST
     * =========================
     *
     * Public chỉ nên thấy những class:
     * - không CANCELLED
     * - không COMPLETED
     *
     * Phần filter cụ thể có thể xử lý bằng Specification
     * hoặc query riêng khi làm API search.
     */
}