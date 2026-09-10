package com.gym.gym_booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_review_class_booking",
                        columnNames = "class_booking_id"
                ),
                @UniqueConstraint(
                        name = "uk_review_pt_booking",
                        columnNames = "pt_booking_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private Boolean hidden;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_member")
    )
    private User member;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "class_booking_id",
            unique = true,
            foreignKey = @ForeignKey(name = "fk_review_class_booking")
    )
    private ClassBooking classBooking;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "pt_booking_id",
            unique = true,
            foreignKey = @ForeignKey(name = "fk_review_pt_booking")
    )
    private PTBooking ptBooking;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}