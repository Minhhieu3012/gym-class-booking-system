package com.gym.gym_booking.entity;

import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.ClassBookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booked_at", nullable = false)
    private LocalDateTime bookedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClassBookingStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_class_booking_member")
    )
    private User member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_package_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_class_booking_member_package")
    )
    private MemberPackage memberPackage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "gym_class_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_class_booking_gym_class")
    )
    private GymClass gymClass;

    @PrePersist
    protected void onCreate() {
        if (bookedAt == null) {
            bookedAt = LocalDateTime.now();
        }
    }
}