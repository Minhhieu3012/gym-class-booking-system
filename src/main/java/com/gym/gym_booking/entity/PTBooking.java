package com.gym.gym_booking.entity;

import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.PTBookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pt_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PTBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_note", nullable = false, length = 255)
    private String sessionNote;

    @Column(name = "health_note", columnDefinition = "TEXT")
    private String healthNote;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PTBookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus;

    @Column(name = "booked_at", nullable = false)
    private LocalDateTime bookedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_pt_booking_member")
    )
    private User member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "trainer_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_pt_booking_trainer")
    )
    private User trainer;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "trainer_time_slot_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_pt_booking_time_slot")
    )
    private TrainerTimeSlot trainerTimeSlot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_package_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_pt_booking_member_package")
    )
    private MemberPackage memberPackage;

    @PrePersist
    protected void onCreate() {
        if (bookedAt == null) {
            bookedAt = LocalDateTime.now();
        }
    }
}