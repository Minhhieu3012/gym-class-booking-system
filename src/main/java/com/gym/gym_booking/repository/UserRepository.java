package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneOrEmail(String phone, String email);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);
}