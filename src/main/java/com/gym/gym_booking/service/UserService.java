package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.user.ChangePasswordRequestDTO;
import com.gym.gym_booking.dto.user.UpdateProfileRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.dto.user.UserStatusUpdateRequestDTO;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponseDTO getMyProfile();

    UserResponseDTO updateMyProfile(
            UpdateProfileRequestDTO request
    );

    void changePassword(
            ChangePasswordRequestDTO request
    );
    Page<UserResponseDTO> getUsers(
            UserRole role,
            UserStatus status,
            String keyword,
            Pageable pageable
    );

    UserResponseDTO updateUserStatus(
            Long userId,
            UserStatusUpdateRequestDTO request
    );
}