package com.gym.gym_booking.mapper;

import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.entity.User;

public class UserMapper {

    private UserMapper() {
    }

    public static UserResponseDTO toResponse(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getPhone(),
                user.getEmail(),
                user.getFullName(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus()
        );
    }
}