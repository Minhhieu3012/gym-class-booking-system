package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.user.ChangePasswordRequestDTO;
import com.gym.gym_booking.dto.user.UpdateProfileRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;

public interface UserService {

    UserResponseDTO getMyProfile();

    UserResponseDTO updateMyProfile(
            UpdateProfileRequestDTO request
    );

    void changePassword(
            ChangePasswordRequestDTO request
    );
}