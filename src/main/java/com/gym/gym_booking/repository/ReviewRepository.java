package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("""
        SELECT r FROM Review r
        LEFT JOIN FETCH r.member m
        WHERE (:rating IS NULL OR r.rating = :rating)
          AND (:hidden IS NULL OR r.hidden = :hidden)
        ORDER BY r.createdAt DESC
    """)
    Page<Review> findAllFiltered(
        @Param("rating") Integer rating,
        @Param("hidden") Boolean hidden,
        Pageable pageable
    );
}