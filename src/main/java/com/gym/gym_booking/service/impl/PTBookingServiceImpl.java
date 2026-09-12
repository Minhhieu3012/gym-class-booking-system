package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.dto.pt_booking.*;
import com.gym.gym_booking.entity.MemberPackage;
import com.gym.gym_booking.entity.PTBooking;
import com.gym.gym_booking.entity.TrainerTimeSlot;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.AttendanceStatus;
import com.gym.gym_booking.enums.MemberPackageStatus;
import com.gym.gym_booking.enums.PTBookingStatus;
import com.gym.gym_booking.enums.TimeSlotStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.MemberPackageRepository;
import com.gym.gym_booking.repository.PTBookingRepository;
import com.gym.gym_booking.repository.TrainerTimeSlotRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.PTBookingService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PTBookingServiceImpl implements PTBookingService {

    private final PTBookingRepository ptBookingRepository;
    private final TrainerTimeSlotRepository trainerTimeSlotRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final UserRepository userRepository;

    public PTBookingServiceImpl(
            PTBookingRepository ptBookingRepository,
            TrainerTimeSlotRepository trainerTimeSlotRepository,
            MemberPackageRepository memberPackageRepository,
            UserRepository userRepository
    ) {
        this.ptBookingRepository = ptBookingRepository;
        this.trainerTimeSlotRepository = trainerTimeSlotRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public PTBookingResponseDTO createBooking(
            PTBookingCreateRequestDTO request
    ) {
        User member = getCurrentUser();
        validateMember(member);

        if (request == null || request.getTrainerTimeSlotId() == null) {
            throw new RuntimeException("Trainer time slot ID is required");
        }

        if (request.getSessionNote() == null
                || request.getSessionNote().trim().isEmpty()) {
            throw new RuntimeException("Session note is required");
        }

        TrainerTimeSlot slot = trainerTimeSlotRepository
                .findById(request.getTrainerTimeSlotId())
                .orElseThrow(() ->
                        new RuntimeException("Trainer time slot not found")
                );

        if (slot.getStatus() != TimeSlotStatus.AVAILABLE) {
            throw new RuntimeException(
                    "Trainer time slot is not available"
            );
        }

        if (slot.getTrainer() == null) {
            throw new RuntimeException("Trainer not found");
        }

        User trainer = slot.getTrainer();

        if (trainer.getRole() != UserRole.TRAINER
                || trainer.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Trainer is not available"
            );
        }

        if (!slot.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Cannot book a time slot that has already started"
            );
        }

        boolean alreadyBooked =
                ptBookingRepository
                        .existsByTrainerTimeSlotIdAndStatus(
                                slot.getId(),
                                PTBookingStatus.PENDING
                        )
                        || ptBookingRepository
                        .existsByTrainerTimeSlotIdAndStatus(
                                slot.getId(),
                                PTBookingStatus.CONFIRMED
                        );

        if (alreadyBooked) {
            throw new RuntimeException(
                    "This time slot has already been booked"
            );
        }

        MemberPackage memberPackage;

        if (request.getMemberPackageId() != null) {

            memberPackage = memberPackageRepository
                    .findById(request.getMemberPackageId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Member package not found"
                            )
                    );

            validateMemberPackage(memberPackage, member);

        } else {
            memberPackage = findEligibleMemberPackage(member);
        }

        memberPackage.setSessionsRemaining(
                memberPackage.getSessionsRemaining() - 1
        );

        memberPackageRepository.save(memberPackage);

        PTBooking booking = new PTBooking();

        booking.setMember(member);
        booking.setTrainer(trainer);
        booking.setTrainerTimeSlot(slot);
        booking.setMemberPackage(memberPackage);

        booking.setSessionNote(
                request.getSessionNote().trim()
        );

        if (request.getHealthNote() != null) {
            booking.setHealthNote(
                    request.getHealthNote().trim()
            );
        }

        booking.setStatus(PTBookingStatus.PENDING);
        booking.setAttendanceStatus(
                AttendanceStatus.NOT_MARKED
        );

        slot.setStatus(TimeSlotStatus.BOOKED);
        trainerTimeSlotRepository.save(slot);

        return mapToResponse(
                ptBookingRepository.save(booking)
        );
    }

    @Override
    public Page<PTBookingResponseDTO> getMyBookings(
            PTBookingStatus status,
            Pageable pageable
    ) {
        User member = getCurrentUser();
        validateMember(member);

        Page<PTBooking> bookings;

        if (status == null) {
            bookings = ptBookingRepository
                    .findByMemberId(member.getId(), pageable);
        } else {
            bookings = ptBookingRepository
                    .findByMemberIdAndStatus(
                            member.getId(),
                            status,
                            pageable
                    );
        }

        return bookings.map(this::mapToResponse);
    }

    @Override
    public PTBookingResponseDTO getMyBookingById(Long id) {

        User member = getCurrentUser();
        validateMember(member);

        PTBooking booking = findBookingById(id);

        if (!booking.getMember().getId().equals(member.getId())) {
            throw new RuntimeException(
                    "You cannot access this booking"
            );
        }

        return mapToResponse(booking);
    }

    @Override
    public Page<PTBookingResponseDTO> getTrainerBookings(
            PTBookingStatus status,
            Pageable pageable
    ) {
        User trainer = getCurrentUser();
        validateTrainer(trainer);

        Page<PTBooking> bookings;

        if (status == null) {
            bookings = ptBookingRepository
                    .findByTrainerId(trainer.getId(), pageable);
        } else {
            bookings = ptBookingRepository
                    .findByTrainerIdAndStatus(
                            trainer.getId(),
                            status,
                            pageable
                    );
        }

        return bookings.map(this::mapToResponse);
    }

    @Override
    public PTBookingResponseDTO getBookingById(Long id) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.TRAINER
                && currentUser.getRole() != UserRole.ADMIN) {
            throw new RuntimeException(
                    "Only TRAINER or ADMIN can access this booking"
            );
        }

        PTBooking booking = findBookingById(id);

        if (currentUser.getRole() == UserRole.TRAINER
                && !booking.getTrainer().getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "Trainer can only access their own bookings"
            );
        }

        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public PTBookingResponseDTO approveBooking(Long id) {

        User trainer = getCurrentUser();
        validateTrainer(trainer);

        PTBooking booking = findBookingById(id);

        if (!booking.getTrainer().getId()
                .equals(trainer.getId())) {

            throw new RuntimeException(
                    "Trainer can only approve their own bookings"
            );
        }

        if (booking.getStatus() != PTBookingStatus.PENDING) {
            throw new RuntimeException(
                    "Only PENDING booking can be approved"
            );
        }

        if (!booking.getTrainerTimeSlot().getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cannot approve a booking whose time slot has started"
            );
        }

        booking.setStatus(PTBookingStatus.CONFIRMED);
        booking.setRejectReason(null);

        return mapToResponse(
                ptBookingRepository.save(booking)
        );
    }

    @Override
    @Transactional
    public PTBookingResponseDTO rejectBooking(
            Long id,
            PTBookingDecisionRequestDTO request
    ) {
        User trainer = getCurrentUser();
        validateTrainer(trainer);

        PTBooking booking = findBookingById(id);

        if (!booking.getTrainer().getId()
                .equals(trainer.getId())) {

            throw new RuntimeException(
                    "Trainer can only reject their own bookings"
            );
        }

        if (booking.getStatus() != PTBookingStatus.PENDING) {
            throw new RuntimeException(
                    "Only PENDING booking can be rejected"
            );
        }

        String reason = null;

        if (request != null
                && request.getRejectReason() != null) {

            reason = request.getRejectReason().trim();
        }

        if (reason == null || reason.isEmpty()) {
            throw new RuntimeException(
                    "Reject reason is required"
            );
        }

        booking.setRejectReason(reason);
        booking.setStatus(PTBookingStatus.REJECTED);

        restoreMemberPackage(booking);
        releaseTimeSlot(booking);

        return mapToResponse(
                ptBookingRepository.save(booking)
        );
    }

    @Override
    @Transactional
    public PTBookingResponseDTO cancelBooking(
            Long id,
            PTBookingCancelRequestDTO request
    ) {
        User member = getCurrentUser();
        validateMember(member);

        PTBooking booking = findBookingById(id);

        if (!booking.getMember().getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "You cannot cancel this booking"
            );
        }

        if (booking.getStatus() != PTBookingStatus.PENDING
                && booking.getStatus() != PTBookingStatus.CONFIRMED) {

            throw new RuntimeException(
                    "Only PENDING or CONFIRMED booking can be cancelled"
            );
        }

        if (!booking.getTrainerTimeSlot().getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cannot cancel a booking after its time slot has started"
            );
        }

        String reason = null;

        if (request != null
                && request.getReason() != null) {

            reason = request.getReason().trim();

            if (reason.length() > 1000) {
                throw new RuntimeException(
                        "Cancellation reason cannot exceed 1000 characters"
                );
            }
        }

        booking.setStatus(PTBookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        restoreMemberPackage(booking);
        releaseTimeSlot(booking);

        return mapToResponse(
                ptBookingRepository.save(booking)
        );
    }

    @Override
    @Transactional
    public PTBookingResponseDTO updateAttendance(
            Long id,
            AttendanceUpdateRequestDTO request
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.TRAINER
                && currentUser.getRole() != UserRole.ADMIN) {

            throw new RuntimeException(
                    "Only TRAINER or ADMIN can mark attendance"
            );
        }

        if (request == null
                || request.getAttendanceStatus() == null) {

            throw new RuntimeException(
                    "Attendance status is required"
            );
        }

        PTBooking booking = findBookingById(id);

        if (currentUser.getRole() == UserRole.TRAINER
                && !booking.getTrainer().getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "Trainer can only mark their own bookings"
            );
        }

        if (booking.getStatus() != PTBookingStatus.CONFIRMED) {
            throw new RuntimeException(
                    "Only CONFIRMED booking can be marked attendance"
            );
        }

        if (booking.getTrainerTimeSlot()
                .getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cannot mark attendance before the session starts"
            );
        }

        AttendanceStatus attendanceStatus =
                request.getAttendanceStatus();

        if (attendanceStatus == AttendanceStatus.NOT_MARKED) {
            throw new RuntimeException(
                    "Attendance must be PRESENT or ABSENT"
            );
        }

        booking.setAttendanceStatus(attendanceStatus);

        if (attendanceStatus == AttendanceStatus.PRESENT) {
            booking.setStatus(PTBookingStatus.COMPLETED);
        } else {
            booking.setStatus(PTBookingStatus.NO_SHOW);
        }

        return mapToResponse(
                ptBookingRepository.save(booking)
        );
    }

    private MemberPackage findEligibleMemberPackage(
            User member
    ) {
        LocalDate today = LocalDate.now();

        List<MemberPackage> packages =
                memberPackageRepository
                        .findByMemberIdAndStatusAndSessionsRemainingGreaterThanAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateAsc(
                                member.getId(),
                                MemberPackageStatus.ACTIVE,
                                0,
                                today,
                                today
                        );

        if (packages.isEmpty()) {
            throw new RuntimeException(
                    "No eligible member package available"
            );
        }

        return packages.get(0);
    }

    private void validateMemberPackage(
            MemberPackage memberPackage,
            User member
    ) {
        if (!memberPackage.getMember().getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "Member package does not belong to current member"
            );
        }

        if (memberPackage.getStatus()
                != MemberPackageStatus.ACTIVE) {

            throw new RuntimeException(
                    "Member package is not active"
            );
        }

        LocalDate today = LocalDate.now();

        if (memberPackage.getStartDate().isAfter(today)
                || memberPackage.getEndDate().isBefore(today)) {

            throw new RuntimeException(
                    "Member package is not valid today"
            );
        }

        if (memberPackage.getSessionsRemaining() == null
                || memberPackage.getSessionsRemaining() <= 0) {

            throw new RuntimeException(
                    "Member package has no remaining sessions"
            );
        }
    }

    private void restoreMemberPackage(
            PTBooking booking
    ) {
        MemberPackage memberPackage =
                booking.getMemberPackage();

        memberPackage.setSessionsRemaining(
                memberPackage.getSessionsRemaining() + 1
        );

        memberPackageRepository.save(memberPackage);
    }

    private void releaseTimeSlot(
            PTBooking booking
    ) {
        TrainerTimeSlot slot =
                booking.getTrainerTimeSlot();

        slot.setStatus(TimeSlotStatus.AVAILABLE);

        trainerTimeSlotRepository.save(slot);
    }

    private void validateMember(User user) {

        if (user == null) {
            throw new RuntimeException(
                    "Current user not found"
            );
        }

        if (user.getRole() != UserRole.MEMBER) {
            throw new RuntimeException(
                    "Only MEMBER can perform this action"
            );
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Member account is not active"
            );
        }
    }

    private void validateTrainer(User user) {

        if (user == null) {
            throw new RuntimeException(
                    "Current user not found"
            );
        }

        if (user.getRole() != UserRole.TRAINER) {
            throw new RuntimeException(
                    "Only TRAINER can perform this action"
            );
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Trainer account is not active"
            );
        }
    }

    private PTBooking findBookingById(Long id) {

        if (id == null) {
            throw new RuntimeException(
                    "Booking ID is required"
            );
        }

        return ptBookingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "PT booking not found"
                        )
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

    private PTBookingResponseDTO mapToResponse(
            PTBooking booking
    ) {
        return PTBookingResponseDTO.builder()
                .id(booking.getId())
                .sessionNote(booking.getSessionNote())
                .healthNote(booking.getHealthNote())
                .rejectReason(booking.getRejectReason())
                .status(booking.getStatus())
                .attendanceStatus(
                        booking.getAttendanceStatus()
                )
                .bookedAt(booking.getBookedAt())
                .cancelledAt(booking.getCancelledAt())
                .memberId(
                        booking.getMember().getId()
                )
                .trainerId(
                        booking.getTrainer().getId()
                )
                .trainerTimeSlotId(
                        booking.getTrainerTimeSlot().getId()
                )
                .memberPackageId(
                        booking.getMemberPackage().getId()
                )
                .build();
    }
}