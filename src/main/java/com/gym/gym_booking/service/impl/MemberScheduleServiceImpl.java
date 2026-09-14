package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.member.MemberScheduleItemDTO;
import com.gym.gym_booking.dto.member.MemberScheduleResponseDTO;
import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.entity.PTBooking;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.repository.ClassBookingRepository;
import com.gym.gym_booking.repository.PTBookingRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.MemberScheduleService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MemberScheduleServiceImpl
        implements MemberScheduleService {

    private final ClassBookingRepository classBookingRepository;
    private final PTBookingRepository ptBookingRepository;
    private final UserRepository userRepository;

    public MemberScheduleServiceImpl(
            ClassBookingRepository classBookingRepository,
            PTBookingRepository ptBookingRepository,
            UserRepository userRepository
    ) {
        this.classBookingRepository = classBookingRepository;
        this.ptBookingRepository = ptBookingRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public MemberScheduleResponseDTO getMySchedule() {

        User member = getCurrentUser();

        List<MemberScheduleItemDTO> schedules =
                new ArrayList<>();

        /*
         * =========================
         * CLASS BOOKINGS
         * =========================
         */

        List<ClassBooking> classBookings =
                classBookingRepository
                        .findByMemberIdOrderByGymClassStartTimeAsc(
                                member.getId()
                        );

        for (ClassBooking booking : classBookings) {

            if (booking.getGymClass() == null) {
                continue;
            }

            var gymClass = booking.getGymClass();

            MemberScheduleItemDTO item =
                    new MemberScheduleItemDTO();

            item.setBookingId(booking.getId());
            item.setType("CLASS");
            item.setTitle(gymClass.getTitle());

            if (gymClass.getClassType() != null) {
                item.setClassTypeName(
                        gymClass.getClassType().getName()
                );
            }

            if (gymClass.getTrainer() != null) {
                item.setTrainerName(
                        gymClass.getTrainer().getFullName()
                );
            }

            if (gymClass.getRoom() != null) {
                item.setRoomName(
                        gymClass.getRoom().getName()
                );
            }

            item.setStartTime(gymClass.getStartTime());
            item.setEndTime(gymClass.getEndTime());

            item.setStatus(
                    booking.getStatus() != null
                            ? booking.getStatus().name()
                            : null
            );

            item.setAttendanceStatus(
                    booking.getAttendanceStatus() != null
                            ? booking.getAttendanceStatus().name()
                            : null
            );

            item.setSessionNote(null);

            schedules.add(item);
        }


        /*
         * =========================
         * PT BOOKINGS
         * =========================
         */

        List<PTBooking> ptBookings =
                ptBookingRepository
                        .findByMemberIdOrderByTrainerTimeSlotStartTimeAsc(
                                member.getId()
                        );

        for (PTBooking booking : ptBookings) {

            if (booking.getTrainerTimeSlot() == null) {
                continue;
            }

            var timeSlot =
                    booking.getTrainerTimeSlot();

            MemberScheduleItemDTO item =
                    new MemberScheduleItemDTO();

            item.setBookingId(booking.getId());
            item.setType("PT");
            item.setTitle("Personal Training");

            if (timeSlot.getTrainer() != null) {
                item.setTrainerName(
                        timeSlot.getTrainer().getFullName()
                );
            }

            item.setStartTime(
                    timeSlot.getStartTime()
            );

            item.setEndTime(
                    timeSlot.getEndTime()
            );

            item.setStatus(
                    booking.getStatus() != null
                            ? booking.getStatus().name()
                            : null
            );

            item.setAttendanceStatus(
                    booking.getAttendanceStatus() != null
                            ? booking.getAttendanceStatus().name()
                            : null
            );

            item.setSessionNote(
                    booking.getSessionNote()
            );

            schedules.add(item);
        }


        /*
         * =========================
         * SORT
         * =========================
         */

        schedules.sort(
                Comparator.comparing(
                        MemberScheduleItemDTO::getStartTime,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()
                        )
                )
        );

        return new MemberScheduleResponseDTO(
                schedules
        );
    }


    /*
     * =========================
     * CURRENT USER
     * =========================
     */

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

        String username =
                authentication.getName();

        return userRepository
                .findByPhoneOrEmail(username, username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Current user not found"
                        )
                );
    }
}