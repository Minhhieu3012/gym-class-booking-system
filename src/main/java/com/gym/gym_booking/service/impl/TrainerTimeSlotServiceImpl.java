package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotRequestDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotResponseDTO;
import com.gym.gym_booking.dto.trainer_time_slot.TrainerTimeSlotUpdateRequestDTO;
import com.gym.gym_booking.entity.TrainerTimeSlot;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.TimeSlotStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.TrainerTimeSlotRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.TrainerTimeSlotService;
import com.gym.gym_booking.specification.TrainerTimeSlotSpecification;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TrainerTimeSlotServiceImpl
        implements TrainerTimeSlotService {

    private final TrainerTimeSlotRepository trainerTimeSlotRepository;
    private final UserRepository userRepository;

    public TrainerTimeSlotServiceImpl(
            TrainerTimeSlotRepository trainerTimeSlotRepository,
            UserRepository userRepository
    ) {
        this.trainerTimeSlotRepository = trainerTimeSlotRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Page<TrainerTimeSlotResponseDTO> getTrainerTimeSlots(
            Long trainerId,
            TimeSlotStatus status,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    ) {

        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() ->
                        new RuntimeException("Trainer not found")
                );

        if (trainer.getRole() != UserRole.TRAINER) {
            throw new RuntimeException(
                    "User is not a trainer"
            );
        }

        User currentUser = getCurrentUser();

        /*
         * TRAINER chỉ được xem time slot của chính mình.
         */
        if (currentUser.getRole() == UserRole.TRAINER
                && !currentUser.getId().equals(trainerId)) {

            throw new RuntimeException(
                    "Trainer can only view their own time slots"
            );
        }

        /*
         * MEMBER chỉ được xem AVAILABLE.
         */
        if (currentUser.getRole() == UserRole.MEMBER) {
            status = TimeSlotStatus.AVAILABLE;
        }

//        Page<TrainerTimeSlot> slots =
//                trainerTimeSlotRepository.searchTimeSlots(
//                        trainerId,
//                        status,
//                        from,
//                        to,
//                        pageable
//                );
        Specification<TrainerTimeSlot> specification =
                Specification
                        .where(
                                TrainerTimeSlotSpecification.hasTrainer(
                                        trainerId
                                )
                        )
                        .and(
                                TrainerTimeSlotSpecification.hasStatus(
                                        status
                                )
                        )
                        .and(
                                TrainerTimeSlotSpecification.startTimeFrom(
                                        from
                                )
                        )
                        .and(
                                TrainerTimeSlotSpecification.endTimeTo(
                                        to
                                )
                        );

        Page<TrainerTimeSlot> slots =
                trainerTimeSlotRepository.findAll(
                        specification,
                        pageable
                );

        return slots.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public TrainerTimeSlotResponseDTO createTimeSlot(
            TrainerTimeSlotRequestDTO request
    ) {

        User trainer = getCurrentUser();

        validateTrainer(trainer);

        validateTime(
                request.getStartTime(),
                request.getEndTime()
        );

        if (!request.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Start time must be in the future"
            );
        }

        boolean overlap =
                trainerTimeSlotRepository.existsOverlappingSlot(
                        trainer.getId(),
                        request.getStartTime(),
                        request.getEndTime()
                );

        if (overlap) {
            throw new RuntimeException(
                    "Time slot overlaps with another slot"
            );
        }

        TrainerTimeSlot slot =
                new TrainerTimeSlot();

        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setStatus(TimeSlotStatus.AVAILABLE);
        slot.setTrainer(trainer);

        return mapToResponse(
                trainerTimeSlotRepository.save(slot)
        );
    }

    @Override
    @Transactional
    public TrainerTimeSlotResponseDTO updateTimeSlot(
            Long id,
            TrainerTimeSlotUpdateRequestDTO request
    ) {

        User trainer = getCurrentUser();

        validateTrainer(trainer);

        TrainerTimeSlot slot =
                trainerTimeSlotRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Time slot not found"
                                )
                        );

        if (!slot.getTrainer().getId()
                .equals(trainer.getId())) {

            throw new RuntimeException(
                    "You cannot update this time slot"
            );
        }

        if (slot.getStatus() == TimeSlotStatus.BOOKED) {
            throw new RuntimeException(
                    "Booked time slot cannot be updated"
            );
        }

        if (slot.getStatus() == TimeSlotStatus.INACTIVE) {
            throw new RuntimeException(
                    "Inactive time slot cannot be updated"
            );
        }

        LocalDateTime startTime =
                request.getStartTime() != null
                        ? request.getStartTime()
                        : slot.getStartTime();

        LocalDateTime endTime =
                request.getEndTime() != null
                        ? request.getEndTime()
                        : slot.getEndTime();

        validateTime(startTime, endTime);

        if (!startTime.isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Start time must be in the future"
            );
        }

        boolean overlap =
                trainerTimeSlotRepository
                        .existsOverlappingSlotForUpdate(
                                slot.getId(),
                                trainer.getId(),
                                startTime,
                                endTime
                        );

        if (overlap) {
            throw new RuntimeException(
                    "Time slot overlaps with another slot"
            );
        }

        slot.setStartTime(startTime);
        slot.setEndTime(endTime);

        return mapToResponse(
                trainerTimeSlotRepository.save(slot)
        );
    }

    @Override
    @Transactional
    public TrainerTimeSlotResponseDTO deactivateTimeSlot(
            Long id
    ) {

        User trainer = getCurrentUser();

        validateTrainer(trainer);

        TrainerTimeSlot slot =
                trainerTimeSlotRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Time slot not found"
                                )
                        );

        if (!slot.getTrainer().getId()
                .equals(trainer.getId())) {

            throw new RuntimeException(
                    "You cannot deactivate this time slot"
            );
        }

        if (slot.getStatus() == TimeSlotStatus.BOOKED) {
            throw new RuntimeException(
                    "Booked time slot cannot be deactivated"
            );
        }

        if (slot.getStatus() == TimeSlotStatus.INACTIVE) {
            throw new RuntimeException(
                    "Time slot is already inactive"
            );
        }

        slot.setStatus(TimeSlotStatus.INACTIVE);

        return mapToResponse(
                trainerTimeSlotRepository.save(slot)
        );
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Current user not found"
                        )
                );
    }

    private void validateTrainer(User trainer) {

        if (trainer.getRole() != UserRole.TRAINER) {
            throw new RuntimeException(
                    "Only TRAINER can manage time slots"
            );
        }

        if (trainer.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Trainer account is not active"
            );
        }
    }

    private void validateTime(
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {

        if (startTime == null || endTime == null) {
            throw new RuntimeException(
                    "Start time and end time are required"
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }
    }

    private TrainerTimeSlotResponseDTO mapToResponse(
            TrainerTimeSlot slot
    ) {

        return TrainerTimeSlotResponseDTO.builder()
                .id(slot.getId())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status(slot.getStatus())
                .trainerId(slot.getTrainer().getId())
                .build();
    }
    @Override
    @Transactional
    public TrainerTimeSlotResponseDTO activateTimeSlot(Long id) {

        User trainer = getCurrentUser();

        validateTrainer(trainer);

        TrainerTimeSlot slot =
                trainerTimeSlotRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Time slot not found"
                                )
                        );

        if (!slot.getTrainer().getId()
                .equals(trainer.getId())) {

            throw new RuntimeException(
                    "You cannot activate this time slot"
            );
        }

        if (slot.getStatus() != TimeSlotStatus.INACTIVE) {
            throw new RuntimeException(
                    "Only INACTIVE time slot can be activated"
            );
        }

        if (!slot.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Cannot activate a time slot in the past"
            );
        }

        boolean overlap =
                trainerTimeSlotRepository.existsOverlappingSlot(
                        trainer.getId(),
                        slot.getStartTime(),
                        slot.getEndTime()
                );

        if (overlap) {
            throw new RuntimeException(
                    "Time slot overlaps with another active slot"
            );
        }

        slot.setStatus(TimeSlotStatus.AVAILABLE);

        return mapToResponse(
                trainerTimeSlotRepository.save(slot)
        );
    }
}