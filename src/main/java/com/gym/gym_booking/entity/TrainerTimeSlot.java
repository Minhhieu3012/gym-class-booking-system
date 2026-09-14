package com.gym.gym_booking.entity;

import com.gym.gym_booking.enums.TimeSlotStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trainer_time_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrainerTimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TimeSlotStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "trainer_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_time_slot_trainer")
    )
    private User trainer;
}