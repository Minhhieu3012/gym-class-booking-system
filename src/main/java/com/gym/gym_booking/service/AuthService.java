package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.auth.LoginRequestDTO;
import com.gym.gym_booking.dto.auth.LoginResponseDTO;
import com.gym.gym_booking.dto.auth.RegisterRequestDTO;
import com.gym.gym_booking.dto.auth.RegisterTrainerRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;

public interface AuthService {

    UserResponseDTO register(RegisterRequestDTO request);

    UserResponseDTO registerTrainer(RegisterTrainerRequestDTO request);

    LoginResponseDTO login(LoginRequestDTO request);

    UserResponseDTO getCurrentUser();

    void logout();
}