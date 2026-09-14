package com.gym.gym_booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrainerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "specialization", length = 255)
    private String specialization;

    @Column(name = "experience_year")
    private Integer experienceYear;

    @Column(name = "hourly_fee", precision = 12, scale = 2)
    private BigDecimal hourlyFee;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_trainer_profile_user")
    )
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "approved_by",
            foreignKey = @ForeignKey(name = "fk_trainer_profile_approved_by")
    )
    private User approvedBy;
}