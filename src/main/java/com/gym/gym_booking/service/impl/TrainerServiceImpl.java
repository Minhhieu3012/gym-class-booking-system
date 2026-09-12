package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.trainer.*;
import com.gym.gym_booking.entity.TrainerProfile;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.TrainerProfileRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.TrainerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TrainerServiceImpl implements TrainerService {

    private final TrainerProfileRepository trainerProfileRepository;
    private final UserRepository userRepository;

    public TrainerServiceImpl(
            TrainerProfileRepository trainerProfileRepository,
            UserRepository userRepository
    ) {
        this.trainerProfileRepository = trainerProfileRepository;
        this.userRepository = userRepository;
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

    private TrainerResponseDTO toResponse(
            TrainerProfile trainer
    ) {

        User user = trainer.getUser();

        return new TrainerResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                trainer.getSpecialization(),
                trainer.getExperienceYear(),
                trainer.getHourlyFee(),
                trainer.getBio(),
                user.getStatus() != null ? user.getStatus().name() : null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TrainerResponseDTO> getTrainers(
            UserStatus status,
            String specialization,
            String keyword,
            Pageable pageable
    ) {

        if (specialization != null) {
            specialization = specialization.trim();

            if (specialization.isEmpty()) {
                specialization = null;
            }
        }

        if (keyword != null) {
            keyword = keyword.trim();

            if (keyword.isEmpty()) {
                keyword = null;
            }
        }

        return trainerProfileRepository
                .searchTrainers(
                        status,
                        specialization,
                        keyword,
                        pageable
                )
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainerResponseDTO getTrainerById(
            Long id
    ) {

        TrainerProfile trainer =
                trainerProfileRepository
                        .findByUserId(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trainer not found"
                                )
                        );
        if (trainer.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Trainer not found");
        }

        return toResponse(trainer);

    }
    @Override
    @Transactional
    public TrainerResponseDTO updateProfile(
            TrainerProfileUpdateRequestDTO request
    ) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.TRAINER) {
            throw new RuntimeException(
                    "Only trainer can update trainer profile"
            );
        }

        TrainerProfile trainer =
                trainerProfileRepository
                        .findByUserId(currentUser.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trainer profile not found"
                                )
                        );

        if (request.getSpecialization() != null) {
            trainer.setSpecialization(
                    request.getSpecialization().trim()
            );
        }

        if (request.getExperienceYears() != null) {
            trainer.setExperienceYear(
                    request.getExperienceYears()
            );
        }

        if (request.getHourlyFee() != null) {
            trainer.setHourlyFee(
                    request.getHourlyFee()
            );
        }

        if (request.getBio() != null) {
            trainer.setBio(
                    request.getBio().trim()
            );
        }

        TrainerProfile saved =
                trainerProfileRepository.save(trainer);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public TrainerApprovalResponseDTO approveTrainer(
            Long trainerId
    ) {

        TrainerProfile trainer =
                trainerProfileRepository
                        .findByUserId(trainerId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trainer not found"
                                )
                        );

        User currentAdmin = getCurrentUser();

        if (currentAdmin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException(
                    "Only admin can approve trainer"
            );
        }

        User trainerUser = trainer.getUser();

        if (trainerUser.getStatus() == UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Trainer is already active"
            );
        }

        trainer.setApprovedBy(currentAdmin);
        trainer.setApprovedAt(LocalDateTime.now());

        trainerUser.setStatus(UserStatus.ACTIVE);

        userRepository.save(trainerUser);
        trainerProfileRepository.save(trainer);

        return new TrainerApprovalResponseDTO(
                trainerUser.getId(),
                trainerUser.getStatus(),
                currentAdmin.getId(),
                trainer.getApprovedAt()
        );
    }

    @Override
    @Transactional
    public void rejectTrainer(
            Long trainerId,
            RejectTrainerRequestDTO request
    ) {

        TrainerProfile trainer =
                trainerProfileRepository
                        .findByUserId(trainerId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trainer not found"
                                )
                        );

        User currentAdmin = getCurrentUser();

        if (currentAdmin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException(
                    "Only admin can reject trainer"
            );
        }

        User trainerUser = trainer.getUser();

        trainerUser.setStatus(UserStatus.REJECTED);

        userRepository.save(trainerUser);

        /*
         * request.getReason()
         *
         * Rejection reason is currently not persisted because
         * the ERD does not contain a rejection-reason field.
         * It can later be used by Notification module.
         */
    }
}