package com.gym.gym_booking.entity;

import com.gym.gym_booking.enums.MemberPackageStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "member_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "sessions_remaining", nullable = false)
    private Integer sessionsRemaining;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberPackageStatus status;

    @Column(name = "priority_order")
    private Integer priorityOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "member_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_member_package_member")
    )
    private User member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "package_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_member_package_package")
    )
    private Package packageEntity; //Phải đặt packageEntity vì package trùng với keyword java
}