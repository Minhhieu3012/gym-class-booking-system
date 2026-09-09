package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneOrEmail(String phone, String email);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    @Query("""
    SELECT u
    FROM User u
    WHERE (:role IS NULL OR u.role = :role)
      AND (:status IS NULL OR u.status = :status)
      AND (
            :keyword IS NULL
            OR :keyword = ''
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    """)
    Page<User> searchUsers(
            @Param("role") UserRole role,
            @Param("status") UserStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);
}