package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.Package;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PackageRepository extends JpaRepository<Package, Long> {

    Page<Package> findByActive(Boolean active, Pageable pageable);

    Optional<Package> findByIdAndActive(Long id, Boolean active);

    boolean existsByNameIgnoreCase(String name);
}