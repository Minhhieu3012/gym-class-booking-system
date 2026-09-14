package com.gym.gym_booking.entity;

import com.gym.gym_booking.enums.GymClassStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "gym_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GymClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    @Column(name = "current_count", nullable = false)
    private Integer currentCount;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GymClassStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "class_type_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_gym_class_class_type")
    )
    private ClassType classType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "trainer_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_gym_class_trainer")
    )
    private User trainer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "room_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_gym_class_room")
    )
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "created_by",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_gym_class_created_by")
    )
    private User createdBy;
}