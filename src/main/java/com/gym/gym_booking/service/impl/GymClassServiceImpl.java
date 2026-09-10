package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.gym_class.GymClassRequestDTO;
import com.gym.gym_booking.dto.gym_class.GymClassResponseDTO;
import com.gym.gym_booking.dto.gym_class.GymClassUpdateRequestDTO;
import com.gym.gym_booking.entity.ClassType;
import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.entity.Room;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.GymClassStatus;
import com.gym.gym_booking.enums.RoomStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.ClassTypeRepository;
import com.gym.gym_booking.repository.GymClassRepository;
import com.gym.gym_booking.repository.RoomRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.GymClassService;
import com.gym.gym_booking.specification.GymClassSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class GymClassServiceImpl implements GymClassService {

    private final GymClassRepository gymClassRepository;
    private final ClassTypeRepository classTypeRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public GymClassServiceImpl(
            GymClassRepository gymClassRepository,
            ClassTypeRepository classTypeRepository,
            UserRepository userRepository,
            RoomRepository roomRepository
    ) {
        this.gymClassRepository = gymClassRepository;
        this.classTypeRepository = classTypeRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    
    // GET CURRENT USER
    

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }


    
    // TO RESPONSE
    

    private GymClassResponseDTO toResponse(
            GymClass gymClass
    ) {

        return new GymClassResponseDTO(
                gymClass.getId(),
                gymClass.getTitle(),
                gymClass.getMaxCapacity(),
                gymClass.getCurrentCount(),
                gymClass.getStartTime(),
                gymClass.getEndTime(),
                gymClass.getStatus(),

                gymClass.getClassType().getId(),
                gymClass.getClassType().getName(),

                gymClass.getTrainer().getId(),
                gymClass.getTrainer().getFullName(),

                gymClass.getRoom().getId(),
                gymClass.getRoom().getName()
        );
    }


    
    // PUBLIC GET ALL
    

    @Override
    @Transactional(readOnly = true)
    public Page<GymClassResponseDTO> getClasses(
            Long classTypeId,
            Long trainerId,
            Long roomId,
            GymClassStatus status,
            LocalDateTime from,
            LocalDateTime to,
            String keyword,
            Pageable pageable
    ) {

        if (keyword != null) {
            keyword = keyword.trim();

            if (keyword.isEmpty()) {
                keyword = null;
            }
        }

        Specification<GymClass> specification =
                Specification.allOf(
                        GymClassSpecification.hasPublicStatus(),
                        GymClassSpecification.hasClassType(classTypeId),
                        GymClassSpecification.hasTrainer(trainerId),
                        GymClassSpecification.hasRoom(roomId),
                        GymClassSpecification.hasStatus(status),
                        GymClassSpecification.startTimeFrom(from),
                        GymClassSpecification.endTimeTo(to),
                        GymClassSpecification.titleContains(keyword)
                );

        return gymClassRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }


    
    // PUBLIC GET BY ID


    @Override
    @Transactional(readOnly = true)
    public GymClassResponseDTO getClassById(Long id) {
        GymClass gymClass = gymClassRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Class not found"));

        if (gymClass.getStatus() != GymClassStatus.SCHEDULED
                && gymClass.getStatus() != GymClassStatus.FULL) {
            throw new RuntimeException("Class not found");
        }

        return toResponse(gymClass);
    }


    
    // ADMIN GET ALL
    

    @Override
    @Transactional(readOnly = true)
    public Page<GymClassResponseDTO> getAllClassesForAdmin(
            Long classTypeId,
            Long trainerId,
            Long roomId,
            GymClassStatus status,
            LocalDateTime from,
            LocalDateTime to,
            String keyword,
            Pageable pageable
    ) {

        if (keyword != null) {
            keyword = keyword.trim();

            if (keyword.isEmpty()) {
                keyword = null;
            }
        }

        Specification<GymClass> specification =
                Specification.allOf(
                        GymClassSpecification.hasClassType(classTypeId),
                        GymClassSpecification.hasTrainer(trainerId),
                        GymClassSpecification.hasRoom(roomId),
                        GymClassSpecification.hasStatus(status),
                        GymClassSpecification.startTimeFrom(from),
                        GymClassSpecification.endTimeTo(to),
                        GymClassSpecification.titleContains(keyword)
                );

        return gymClassRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }


    
    // ADMIN GET BY ID
    

    @Override
    @Transactional(readOnly = true)
    public GymClassResponseDTO getClassByIdForAdmin(
            Long id
    ) {

        GymClass gymClass =
                gymClassRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class not found"
                                )
                        );

        return toResponse(gymClass);
    }


    
    // CREATE
    

    @Override
    @Transactional
    public GymClassResponseDTO createClass(
            GymClassRequestDTO request
    ) {

        // Validate time

        if (!request.getStartTime()
                .isBefore(request.getEndTime())) {

            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }

        if (!request.getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Class must be scheduled in the future"
            );
        }


        // Get ClassType
        ClassType classType =
                classTypeRepository
                        .findById(request.getClassTypeId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class type not found"
                                )
                        );

        if (!Boolean.TRUE.equals(
                classType.getActive()
        )) {

            throw new RuntimeException(
                    "Class type is inactive"
            );
        }


        // Get Trainer
        User trainer =
                userRepository
                        .findById(request.getTrainerId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trainer not found"
                                )
                        );

        if (trainer.getRole()
                != UserRole.TRAINER) {

            throw new RuntimeException(
                    "User is not a trainer"
            );
        }

        if (trainer.getStatus()
                != UserStatus.ACTIVE) {

            throw new RuntimeException(
                    "Trainer is not active"
            );
        }


        // Get Room
        Room room =
                roomRepository
                        .findById(request.getRoomId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Room not found"
                                )
                        );

        if (room.getStatus()
                != RoomStatus.ACTIVE) {

            throw new RuntimeException(
                    "Room is inactive"
            );
        }


        // Capacity
        if (request.getMaxCapacity()
                > room.getCapacity()) {

            throw new RuntimeException(
                    "Max capacity exceeds room capacity"
            );
        }


        // Trainer overlap
        boolean trainerOverlap =
                gymClassRepository
                        .existsTrainerTimeOverlap(
                                trainer.getId(),
                                request.getStartTime(),
                                request.getEndTime(),
                                GymClassStatus.CANCELLED
                        );

        if (trainerOverlap) {

            throw new RuntimeException(
                    "Trainer already has another class at this time"
            );
        }


        // Room overlap
        boolean roomOverlap =
                gymClassRepository
                        .existsRoomTimeOverlap(
                                room.getId(),
                                request.getStartTime(),
                                request.getEndTime(),
                                GymClassStatus.CANCELLED
                        );

        if (roomOverlap) {

            throw new RuntimeException(
                    "Room is already occupied at this time"
            );
        }


        // Current Admin
        User currentAdmin = getCurrentUser();

        if (currentAdmin.getRole()
                != UserRole.ADMIN) {

            throw new RuntimeException(
                    "Only admin can create gym class"
            );
        }


        // Create GymClass
        GymClass gymClass = new GymClass();

        gymClass.setTitle(
                request.getTitle().trim()
        );

        gymClass.setMaxCapacity(
                request.getMaxCapacity()
        );

        gymClass.setCurrentCount(0);

        gymClass.setStartTime(
                request.getStartTime()
        );

        gymClass.setEndTime(
                request.getEndTime()
        );

        gymClass.setStatus(
                GymClassStatus.SCHEDULED
        );

        gymClass.setClassType(classType);
        gymClass.setTrainer(trainer);
        gymClass.setRoom(room);
        gymClass.setCreatedBy(currentAdmin);

        GymClass saved =
                gymClassRepository.save(gymClass);

        return toResponse(saved);
    }


    
    // UPDATE
    

    @Override
    @Transactional
    public GymClassResponseDTO updateClass(
            Long id,
            GymClassUpdateRequestDTO request
    ) {

        GymClass gymClass =
                gymClassRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class not found"
                                )
                        );

        if (gymClass.getStatus()
                == GymClassStatus.CANCELLED) {

            throw new RuntimeException(
                    "Cancelled class cannot be updated"
            );
        }

        if (gymClass.getStatus()
                == GymClassStatus.COMPLETED) {

            throw new RuntimeException(
                    "Completed class cannot be updated"
            );
        }


        // Current values
        ClassType classType =
                gymClass.getClassType();

        User trainer =
                gymClass.getTrainer();

        Room room =
                gymClass.getRoom();

        String title =
                gymClass.getTitle();

        Integer maxCapacity =
                gymClass.getMaxCapacity();

        LocalDateTime startTime =
                gymClass.getStartTime();

        LocalDateTime endTime =
                gymClass.getEndTime();


        // Class type
        if (request.getClassTypeId() != null) {

            classType =
                    classTypeRepository
                            .findById(
                                    request.getClassTypeId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Class type not found"
                                    )
                            );

            if (!Boolean.TRUE.equals(
                    classType.getActive()
            )) {

                throw new RuntimeException(
                        "Class type is inactive"
                );
            }
        }


        // Trainer
        if (request.getTrainerId() != null) {

            trainer =
                    userRepository
                            .findById(
                                    request.getTrainerId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Trainer not found"
                                    )
                            );

            if (trainer.getRole()
                    != UserRole.TRAINER) {

                throw new RuntimeException(
                        "User is not a trainer"
                );
            }

            if (trainer.getStatus()
                    != UserStatus.ACTIVE) {

                throw new RuntimeException(
                        "Trainer is not active"
                );
            }
        }


        // Room
        if (request.getRoomId() != null) {

            room =
                    roomRepository
                            .findById(
                                    request.getRoomId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Room not found"
                                    )
                            );

            if (room.getStatus()
                    != RoomStatus.ACTIVE) {

                throw new RuntimeException(
                        "Room is inactive"
                );
            }
        }


        // Title
        if (request.getTitle() != null) {

            String newTitle =
                    request.getTitle().trim();

            if (newTitle.isEmpty()) {

                throw new RuntimeException(
                        "Title cannot be empty"
                );
            }

            title = newTitle;
        }


        // Capacity
        if (request.getMaxCapacity() != null) {

            maxCapacity =
                    request.getMaxCapacity();
        }

        if (maxCapacity < gymClass.getCurrentCount()) {

            throw new RuntimeException(
                    "Max capacity cannot be less than current bookings"
            );
        }

        if (maxCapacity > room.getCapacity()) {

            throw new RuntimeException(
                    "Max capacity exceeds room capacity"
            );
        }


        // Time
        if (request.getStartTime() != null) {

            startTime =
                    request.getStartTime();
        }

        if (request.getEndTime() != null) {

            endTime =
                    request.getEndTime();
        }

        if (!startTime.isBefore(endTime)) {

            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }

        if (!startTime.isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Class must be scheduled in the future"
            );
        }

        // Check trainer overlap
        boolean trainerOverlap =
                gymClassRepository
                        .existsTrainerTimeOverlapForUpdate(
                                trainer.getId(),
                                id,
                                startTime,
                                endTime,
                                GymClassStatus.CANCELLED
                        );

        if (trainerOverlap) {

            throw new RuntimeException(
                    "Trainer already has another class at this time"
            );
        }


        // Check room overlap
        boolean roomOverlap =
                gymClassRepository
                        .existsRoomTimeOverlapForUpdate(
                                room.getId(),
                                id,
                                startTime,
                                endTime,
                                GymClassStatus.CANCELLED
                        );

        if (roomOverlap) {

            throw new RuntimeException(
                    "Room is already occupied at this time"
            );
        }


        // Apply changes
        gymClass.setClassType(classType);
        gymClass.setTrainer(trainer);
        gymClass.setRoom(room);
        gymClass.setTitle(title);
        gymClass.setMaxCapacity(maxCapacity);
        gymClass.setStartTime(startTime);
        gymClass.setEndTime(endTime);

        // Update status according to capacity
        if (gymClass.getCurrentCount()
                >= gymClass.getMaxCapacity()) {

            gymClass.setStatus(
                    GymClassStatus.FULL
            );

        } else {

            gymClass.setStatus(
                    GymClassStatus.SCHEDULED
            );
        }

        GymClass saved =
                gymClassRepository.save(gymClass);

        return toResponse(saved);
    }


    
    // CANCEL
    @Override
    @Transactional
    public GymClassResponseDTO cancelClass(
            Long id
    ) {

        GymClass gymClass =
                gymClassRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class not found"
                                )
                        );

        if (gymClass.getStatus()
                == GymClassStatus.CANCELLED) {

            throw new RuntimeException(
                    "Class is already cancelled"
            );
        }

        if (gymClass.getStatus()
                == GymClassStatus.COMPLETED) {

            throw new RuntimeException(
                    "Completed class cannot be cancelled"
            );
        }

        gymClass.setStatus(
                GymClassStatus.CANCELLED
        );

        GymClass saved =
                gymClassRepository.save(gymClass);

        return toResponse(saved);
    }

    // RESTORE
    @Override
    @Transactional
    public GymClassResponseDTO restoreClass(
            Long id
    ) {

        GymClass gymClass =
                gymClassRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class not found"
                                )
                        );


        // Must be CANCELLED
        if (gymClass.getStatus()
                != GymClassStatus.CANCELLED) {

            throw new RuntimeException(
                    "Only cancelled class can be restored"
            );
        }


        // Class must still be in the future
        if (!gymClass.getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cannot restore a class that has already started"
            );
        }


        // Check Trainer
        User trainer =
                gymClass.getTrainer();

        if (trainer.getRole()
                != UserRole.TRAINER) {

            throw new RuntimeException(
                    "User is not a trainer"
            );
        }

        if (trainer.getStatus()
                != UserStatus.ACTIVE) {

            throw new RuntimeException(
                    "Trainer is not active"
            );
        }


        // Check Room
        Room room =
                gymClass.getRoom();

        if (room.getStatus()
                != RoomStatus.ACTIVE) {

            throw new RuntimeException(
                    "Room is inactive"
            );
        }


        // Check ClassType
        ClassType classType =
                gymClass.getClassType();

        if (!Boolean.TRUE.equals(
                classType.getActive()
        )) {

            throw new RuntimeException(
                    "Class type is inactive"
            );
        }


        // Check Trainer overlap
        boolean trainerOverlap =
                gymClassRepository
                        .existsTrainerTimeOverlapForUpdate(
                                trainer.getId(),
                                gymClass.getId(),
                                gymClass.getStartTime(),
                                gymClass.getEndTime(),
                                GymClassStatus.CANCELLED
                        );

        if (trainerOverlap) {

            throw new RuntimeException(
                    "Trainer already has another class at this time"
            );
        }


        // Check Room overlap
        boolean roomOverlap =
                gymClassRepository
                        .existsRoomTimeOverlapForUpdate(
                                room.getId(),
                                gymClass.getId(),
                                gymClass.getStartTime(),
                                gymClass.getEndTime(),
                                GymClassStatus.CANCELLED
                        );

        if (roomOverlap) {

            throw new RuntimeException(
                    "Room is already occupied at this time"
            );
        }


        // Restore status according to capacity
        if (gymClass.getCurrentCount()
                >= gymClass.getMaxCapacity()) {

            gymClass.setStatus(
                    GymClassStatus.FULL
            );

        } else {

            gymClass.setStatus(
                    GymClassStatus.SCHEDULED
            );
        }


        GymClass saved =
                gymClassRepository.save(gymClass);

        return toResponse(saved);
    }
}