package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.Room;
import com.gym.gym_booking.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Page<Room> findByStatus(
            RoomStatus status,
            Pageable pageable
    );

    boolean existsByNameIgnoreCase(String name);
}