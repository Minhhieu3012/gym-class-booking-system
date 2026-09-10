package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ClassType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClassTypeRepository
        extends JpaRepository<ClassType, Long> {

    Page<ClassType> findByActive(
            Boolean active,
            Pageable pageable
    );
    Optional<ClassType> findByIdAndActive(
            Long id,
            Boolean active
    );

    boolean existsByNameIgnoreCase(String name);
}