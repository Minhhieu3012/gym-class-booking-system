package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.MemberPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberPackageRepository extends JpaRepository<MemberPackage, Long> {
}