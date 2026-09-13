package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.dashboard.DashboardClassDTO;
import com.gym.gym_booking.dto.dashboard.DashboardStatsDTO;
import com.gym.gym_booking.dto.dashboard.DashboardTrainerDTO;
import com.gym.gym_booking.dto.dashboard.MemberDashboardResponseDTO;
import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.entity.TrainerProfile;
import com.gym.gym_booking.enums.GymClassStatus;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.GymClassRepository;
import com.gym.gym_booking.repository.TrainerProfileRepository;
import com.gym.gym_booking.service.MemberDashboardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MemberDashboardServiceImpl
        implements MemberDashboardService {

    private final GymClassRepository gymClassRepository;
    private final TrainerProfileRepository trainerProfileRepository;

    public MemberDashboardServiceImpl(
            GymClassRepository gymClassRepository,
            TrainerProfileRepository trainerProfileRepository
    ) {
        this.gymClassRepository = gymClassRepository;
        this.trainerProfileRepository = trainerProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public MemberDashboardResponseDTO getDashboard() {

        LocalDateTime now = LocalDateTime.now();

        List<GymClassStatus> availableStatuses = List.of(
                GymClassStatus.SCHEDULED,
                GymClassStatus.FULL
        );

        /*
         * =========================
         * UPCOMING CLASSES
         * =========================
         */

        Page<GymClass> upcomingClassPage =
                gymClassRepository
                        .findByStatusInAndStartTimeAfterOrderByStartTimeAsc(
                                availableStatuses,
                                now,
                                PageRequest.of(0, 6)
                        );

        List<DashboardClassDTO> upcomingClasses =
                upcomingClassPage
                        .getContent()
                        .stream()
                        .map(this::toClassDTO)
                        .toList();

        long upcomingClassCount =
                gymClassRepository
                        .countByStatusInAndStartTimeAfter(
                                availableStatuses,
                                now
                        );

        /*
         * =========================
         * ACTIVE TRAINERS
         * =========================
         */

        long activeTrainerCount =
                trainerProfileRepository
                        .countByUser_Status(UserStatus.ACTIVE);

        /*
         * =========================
         * TRAINERS
         * =========================
         */

        Page<TrainerProfile> trainerPage =
                trainerProfileRepository
                        .searchTrainers(
                                UserStatus.ACTIVE,
                                null,
                                null,
                                PageRequest.of(0, 6)
                        );

        List<DashboardTrainerDTO> trainers =
                trainerPage
                        .getContent()
                        .stream()
                        .map(this::toTrainerDTO)
                        .toList();

        /*
         * =========================
         * STATS
         * =========================
         */

        DashboardStatsDTO stats =
                new DashboardStatsDTO(
                        upcomingClassCount,
                        activeTrainerCount
                );

        /*
         * =========================
         * RESPONSE
         * =========================
         */

        return new MemberDashboardResponseDTO(
                stats,
                upcomingClasses,
                trainers
        );
    }

    private DashboardClassDTO toClassDTO(
            GymClass gymClass
    ) {

        return new DashboardClassDTO(
                gymClass.getId(),
                gymClass.getTitle(),
                gymClass.getClassType().getName(),
                gymClass.getTrainer().getFullName(),
                gymClass.getRoom().getName(),
                gymClass.getStartTime(),
                gymClass.getEndTime(),
                gymClass.getCurrentCount(),
                gymClass.getMaxCapacity(),
                gymClass.getStatus()
        );
    }

    private DashboardTrainerDTO toTrainerDTO(
            TrainerProfile trainer
    ) {

        return new DashboardTrainerDTO(
                trainer.getUser().getId(),
                trainer.getUser().getFullName(),
                trainer.getUser().getAvatarUrl(),
                trainer.getSpecialization(),
                trainer.getExperienceYear(),
                trainer.getHourlyFee(),
                trainer.getBio()
        );
    }
}