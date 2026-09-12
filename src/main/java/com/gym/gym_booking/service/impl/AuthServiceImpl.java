package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.auth.LoginRequestDTO;
import com.gym.gym_booking.dto.auth.LoginResponseDTO;
import com.gym.gym_booking.dto.auth.RegisterRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.entity.TrainerProfile;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.mapper.UserMapper;
import com.gym.gym_booking.repository.TrainerProfileRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.security.JwtService;
import com.gym.gym_booking.service.AuthService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.gym.gym_booking.dto.auth.RegisterTrainerRequestDTO;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthServiceImpl(
            UserRepository userRepository,
            TrainerProfileRepository trainerProfileRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Override
    public UserResponseDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone already exists");
        }

        User user = new User();

        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        user.setFullName(request.getFullName());
        user.setAddress(request.getAddress());
        user.setRole(UserRole.MEMBER);
        user.setStatus(UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        return UserMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponseDTO registerTrainer(
            RegisterTrainerRequestDTO request
    ) {

        String email = request.getEmail().trim();
        String phone = request.getPhone().trim();

        // Check email

        User emailUser = userRepository
                .findByEmail(email)
                .orElse(null);

        // Check phone
        User phoneUser = userRepository
                .findByPhone(phone)
                .orElse(null);

        // Email đã tồn tại
        if (emailUser != null) {

            // Chỉ cho TRAINER đã bị REJECTED đăng ký lại
            if (emailUser.getRole() != UserRole.TRAINER
                    || emailUser.getStatus() != UserStatus.REJECTED) {

                throw new RuntimeException(
                        "Email already exists"
                );
            }
        }

        // Phone đã tồn tại
        if (phoneUser != null) {

            // Nếu phone thuộc một user khác
            if (emailUser == null
                    || !phoneUser.getId().equals(emailUser.getId())) {

                throw new RuntimeException(
                        "Phone already exists"
                );
            }

            // Phone thuộc chính Trainer REJECTED
            if (phoneUser.getRole() != UserRole.TRAINER
                    || phoneUser.getStatus() != UserStatus.REJECTED) {

                throw new RuntimeException(
                        "Phone already exists"
                );
            }
        }

        // RE-REGISTER TRAINER REJECTED
        if (emailUser != null
                && emailUser.getRole() == UserRole.TRAINER
                && emailUser.getStatus() == UserStatus.REJECTED) {

            User user = emailUser;

            user.setEmail(email);
            user.setPhone(phone);

            user.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );

            user.setFullName(
                    request.getFullName().trim()
            );

            user.setAddress(
                    request.getAddress() != null
                            ? request.getAddress().trim()
                            : null
            );

            user.setStatus(UserStatus.PENDING);

            User savedUser = userRepository.save(user);

            TrainerProfile trainerProfile =
                    trainerProfileRepository
                            .findByUserId(savedUser.getId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Trainer profile not found"
                                    )
                            );

            trainerProfile.setSpecialization(
                    request.getSpecialization().trim()
            );

            trainerProfile.setExperienceYear(
                    request.getExperienceYears()
            );

            trainerProfile.setHourlyFee(
                    request.getHourlyFee()
            );

            trainerProfile.setBio(
                    request.getBio()
            );

            // Reset thông tin approval cũ
            trainerProfile.setApprovedAt(null);
            trainerProfile.setApprovedBy(null);

            trainerProfileRepository.save(trainerProfile);

            return UserMapper.toResponse(savedUser);
        }

        // CREATE NEW TRAINER
        User user = new User();

        user.setEmail(email);
        user.setPhone(phone);

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setFullName(
                request.getFullName().trim()
        );

        user.setAddress(
                request.getAddress() != null
                        ? request.getAddress().trim()
                        : null
        );

        user.setRole(UserRole.TRAINER);
        user.setStatus(UserStatus.PENDING);

        User savedUser = userRepository.save(user);

        // Create Trainer Profile
        TrainerProfile trainerProfile = new TrainerProfile();

        trainerProfile.setUser(savedUser);

        trainerProfile.setSpecialization(
                request.getSpecialization().trim()
        );

        trainerProfile.setExperienceYear(
                request.getExperienceYears()
        );

        trainerProfile.setHourlyFee(
                request.getHourlyFee()
        );

        trainerProfile.setBio(
                request.getBio()
        );

        trainerProfileRepository.save(trainerProfile);

        return UserMapper.toResponse(savedUser);
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {

        String username = request.getUsername().trim();

        User user = userRepository
                .findByPhoneOrEmail(username, username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid username or password"
                        ));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new RuntimeException("Account is locked");
        }

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                username,
                                request.getPassword()
                        )
                );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String accessToken =
                jwtService.generateAccessToken(userDetails);

        return new LoginResponseDTO(
                accessToken,
                "Bearer",
                3600L,
                UserMapper.toResponse(user)
        );
    }

    @Override
    public UserResponseDTO getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return UserMapper.toResponse(user);
    }

    @Override
    public void logout() {
        SecurityContextHolder.clearContext();
    }
}