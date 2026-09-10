package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.user.ChangePasswordRequestDTO;
import com.gym.gym_booking.dto.user.UpdateProfileRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.mapper.UserMapper;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @Override
    public UserResponseDTO getMyProfile() {

        User user = getCurrentUser();

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponseDTO updateMyProfile(
            UpdateProfileRequestDTO request
    ) {

        User user = getCurrentUser();

        if (!user.getPhone().equals(request.getPhone())
                && userRepository.existsByPhone(request.getPhone())) {

            throw new RuntimeException("Phone already exists");
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());

        User savedUser = userRepository.save(user);

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public void changePassword(
            ChangePasswordRequestDTO request
    ) {

        User user = getCurrentUser();

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword()
        )) {
            throw new RuntimeException(
                    "Current password is incorrect"
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);
    }
}