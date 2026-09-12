package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.class_booking.AttendanceUpdateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingCreateRequestDTO;
import com.gym.gym_booking.dto.class_booking.ClassBookingResponseDTO;
import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.entity.MemberPackage;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.*;
import com.gym.gym_booking.repository.ClassBookingRepository;
import com.gym.gym_booking.repository.GymClassRepository;
import com.gym.gym_booking.repository.MemberPackageRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.ClassBookingService;
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
public class ClassBookingServiceImpl implements ClassBookingService {

    private final ClassBookingRepository classBookingRepository;
    private final GymClassRepository gymClassRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final UserRepository userRepository;

    public ClassBookingServiceImpl(
            ClassBookingRepository classBookingRepository,
            GymClassRepository gymClassRepository,
            MemberPackageRepository memberPackageRepository,
            UserRepository userRepository
    ) {
        this.classBookingRepository = classBookingRepository;
        this.gymClassRepository = gymClassRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // MEMBER - CREATE BOOKING
    // =========================================================

    @Override
    @Transactional
    public ClassBookingResponseDTO createBooking(
            ClassBookingCreateRequestDTO request
    ) {

        User member = getCurrentUser();

        validateMember(member);

        if (request == null || request.getGymClassId() == null) {
            throw new RuntimeException(
                    "Gym class ID is required"
            );
        }

        GymClass gymClass =
                gymClassRepository.findById(
                        request.getGymClassId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Gym class not found"
                        )
                );

        LocalDateTime now = LocalDateTime.now();

        /*
         * Không cho đặt lớp đã bắt đầu.
         */
        if (!gymClass.getStartTime().isAfter(now)) {
            throw new RuntimeException(
                    "Cannot book a class that has already started"
            );
        }

        /*
         * Chỉ SCHEDULED mới thực sự có thể booking.
         *
         * FULL không nên cho booking dù currentCount
         * có thể chưa đồng bộ.
         */
        if (gymClass.getStatus() != GymClassStatus.SCHEDULED) {
            throw new RuntimeException(
                    "Gym class is not available for booking"
            );
        }

        /*
         * Kiểm tra capacity.
         */
        if (gymClass.getCurrentCount() == null
                || gymClass.getMaxCapacity() == null) {

            throw new RuntimeException(
                    "Gym class capacity is invalid"
            );
        }

        if (gymClass.getCurrentCount()
                >= gymClass.getMaxCapacity()) {

            throw new RuntimeException(
                    "Gym class is full"
            );
        }

        /*
         * Không cho Member booking trùng.
         */
        boolean alreadyBooked =
                classBookingRepository
                        .existsByMemberIdAndGymClassIdAndStatus(
                                member.getId(),
                                gymClass.getId(),
                                ClassBookingStatus.CONFIRMED
                        );

        if (alreadyBooked) {
            throw new RuntimeException(
                    "Member has already booked this class"
            );
        }

        /*
         * Lấy MemberPackage.
         */
        MemberPackage memberPackage;

        if (request.getMemberPackageId() != null) {

            memberPackage =
                    memberPackageRepository.findById(
                            request.getMemberPackageId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Member package not found"
                            )
                    );

            validateMemberPackage(
                    memberPackage,
                    member
            );

        } else {

            memberPackage =
                    findEligibleMemberPackage(member);
        }

        /*
         * Trừ session.
         */
        if (memberPackage.getSessionsRemaining() <= 0) {
            throw new RuntimeException(
                    "Member package has no remaining sessions"
            );
        }

        memberPackage.setSessionsRemaining(
                memberPackage.getSessionsRemaining() - 1
        );

        memberPackageRepository.save(memberPackage);

        /*
         * Tăng current count.
         */
        gymClass.setCurrentCount(
                gymClass.getCurrentCount() + 1
        );

        /*
         * Nếu vừa đủ capacity → FULL.
         */
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

        gymClassRepository.save(gymClass);

        /*
         * Tạo ClassBooking.
         */
        ClassBooking booking =
                new ClassBooking();

        booking.setMember(member);
        booking.setMemberPackage(memberPackage);
        booking.setGymClass(gymClass);

        booking.setBookedAt(now);

        booking.setStatus(
                ClassBookingStatus.CONFIRMED
        );

        booking.setAttendanceStatus(
                AttendanceStatus.NOT_MARKED
        );

        ClassBooking savedBooking =
                classBookingRepository.save(booking);

        return mapToResponse(savedBooking);
    }

    // =========================================================
    // MEMBER - GET MY BOOKINGS
    // =========================================================

    @Override
    public Page<ClassBookingResponseDTO> getMyBookings(
            ClassBookingStatus status,
            Pageable pageable
    ) {

        User member = getCurrentUser();

        validateMember(member);

        Page<ClassBooking> bookings;

        if (status == null) {

            bookings =
                    classBookingRepository.findByMemberId(
                            member.getId(),
                            pageable
                    );

        } else {

            bookings =
                    classBookingRepository
                            .findByMemberIdAndStatus(
                                    member.getId(),
                                    status,
                                    pageable
                            );
        }

        return bookings.map(this::mapToResponse);
    }

    // =========================================================
    // MEMBER - GET MY BOOKING DETAIL
    // =========================================================

    @Override
    public ClassBookingResponseDTO getMyBookingById(
            Long id
    ) {

        if (id == null) {
            throw new RuntimeException(
                    "Booking ID is required"
            );
        }

        User member = getCurrentUser();

        validateMember(member);

        ClassBooking booking =
                findBookingById(id);

        /*
         * Member chỉ xem booking của chính mình.
         */
        if (!booking.getMember()
                .getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "You cannot access this booking"
            );
        }

        return mapToResponse(booking);
    }

    // =========================================================
    // TRAINER / ADMIN - GET BOOKINGS OF CLASS
    // =========================================================

    @Override
    public Page<ClassBookingResponseDTO> getClassBookings(
            Long gymClassId,
            ClassBookingStatus status,
            Pageable pageable
    ) {

        if (gymClassId == null) {
            throw new RuntimeException(
                    "Gym class ID is required"
            );
        }

        User currentUser = getCurrentUser();

        validateManagementUser(currentUser);

        GymClass gymClass =
                gymClassRepository.findById(gymClassId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Gym class not found"
                                )
                        );

        /*
         * TRAINER chỉ được xem booking
         * của class mình phụ trách.
         */
        validateTrainerOwnClass(
                currentUser,
                gymClass
        );

        Page<ClassBooking> bookings;

        if (status == null) {

            bookings =
                    classBookingRepository
                            .findByGymClassId(
                                    gymClassId,
                                    pageable
                            );

        } else {

            bookings =
                    classBookingRepository
                            .findByGymClassIdAndStatus(
                                    gymClassId,
                                    status,
                                    pageable
                            );
        }

        return bookings.map(this::mapToResponse);
    }

    // =========================================================
    // TRAINER / ADMIN - GET BOOKING DETAIL
    // =========================================================

    @Override
    public ClassBookingResponseDTO getBookingById(
            Long id
    ) {

        if (id == null) {
            throw new RuntimeException(
                    "Booking ID is required"
            );
        }

        User currentUser = getCurrentUser();

        validateManagementUser(currentUser);

        ClassBooking booking =
                findBookingById(id);

        /*
         * TRAINER chỉ được xem booking
         * thuộc class mình phụ trách.
         */
        validateTrainerOwnClass(
                currentUser,
                booking.getGymClass()
        );

        return mapToResponse(booking);
    }

    // =========================================================
    // MEMBER - CANCEL BOOKING
    // =========================================================

    @Override
    @Transactional
    public ClassBookingResponseDTO cancelBooking(
            Long id,
            String reason
    ) {

        if (id == null) {
            throw new RuntimeException(
                    "Booking ID is required"
            );
        }

        User member = getCurrentUser();

        validateMember(member);

        ClassBooking booking =
                findBookingById(id);

        /*
         * Chỉ Member sở hữu booking mới được cancel.
         */
        if (!booking.getMember()
                .getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "You cannot cancel this booking"
            );
        }

        /*
         * Chỉ CONFIRMED mới được cancel.
         */
        if (booking.getStatus()
                != ClassBookingStatus.CONFIRMED) {

            throw new RuntimeException(
                    "Only CONFIRMED booking can be cancelled"
            );
        }

        GymClass gymClass =
                booking.getGymClass();

        LocalDateTime now =
                LocalDateTime.now();

        /*
         * Không cho cancel sau khi class bắt đầu.
         */
        if (!gymClass.getStartTime().isAfter(now)) {
            throw new RuntimeException(
                    "Cannot cancel a booking after class has started"
            );
        }

        /*
         * Không cho cancel class đã COMPLETED/CANCELLED.
         */
        if (gymClass.getStatus() == GymClassStatus.CANCELLED
                || gymClass.getStatus() == GymClassStatus.COMPLETED) {

            throw new RuntimeException(
                    "Cannot cancel booking of this class"
            );
        }

        /*
         * Validate reason.
         */
        String cancellationReason = null;

        if (reason != null) {

            cancellationReason = reason.trim();

            if (cancellationReason.length() > 1000) {
                throw new RuntimeException(
                        "Cancellation reason cannot exceed 1000 characters"
                );
            }

            if (cancellationReason.isEmpty()) {
                cancellationReason = null;
            }
        }

        MemberPackage memberPackage =
                booking.getMemberPackage();

        /*
         * Hoàn lại session.
         */
        memberPackage.setSessionsRemaining(
                memberPackage.getSessionsRemaining() + 1
        );

        memberPackageRepository.save(memberPackage);

        /*
         * Giảm current count.
         */
        if (gymClass.getCurrentCount() == null
                || gymClass.getCurrentCount() <= 0) {

            throw new RuntimeException(
                    "Gym class current count is invalid"
            );
        }

        gymClass.setCurrentCount(
                gymClass.getCurrentCount() - 1
        );

        /*
         * Nếu class đang FULL và vừa có chỗ trống
         * → SCHEDULED.
         */
        if (gymClass.getStatus()
                == GymClassStatus.FULL) {

            gymClass.setStatus(
                    GymClassStatus.SCHEDULED
            );
        }

        gymClassRepository.save(gymClass);

        /*
         * Update booking.
         */
        booking.setStatus(
                ClassBookingStatus.CANCELLED
        );

        booking.setAttendanceStatus(
                AttendanceStatus.NOT_MARKED
        );

        booking.setCancelledAt(now);

        booking.setCancellationReason(
                cancellationReason
        );

        return mapToResponse(
                classBookingRepository.save(booking)
        );
    }

    // =========================================================
    // TRAINER / ADMIN - UPDATE ATTENDANCE
    // =========================================================

    @Override
    @Transactional
    public ClassBookingResponseDTO updateAttendance(
            Long id,
            AttendanceUpdateRequestDTO request
    ) {

        if (id == null) {
            throw new RuntimeException(
                    "Booking ID is required"
            );
        }

        if (request == null
                || request.getAttendanceStatus() == null) {

            throw new RuntimeException(
                    "Attendance status is required"
            );
        }

        User currentUser = getCurrentUser();

        validateManagementUser(currentUser);

        ClassBooking booking =
                findBookingById(id);

        GymClass gymClass =
                booking.getGymClass();

        /*
         * TRAINER chỉ được điểm danh
         * class mình phụ trách.
         */
        validateTrainerOwnClass(
                currentUser,
                gymClass
        );

        /*
         * Chỉ CONFIRMED booking mới được điểm danh.
         */
        if (booking.getStatus()
                != ClassBookingStatus.CONFIRMED) {

            throw new RuntimeException(
                    "Only CONFIRMED booking can be marked attendance"
            );
        }

        /*
         * Class phải đã bắt đầu.
         *
         * Trainer không thể điểm danh một member
         * trước giờ học.
         */
        if (gymClass.getStartTime()
                .isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cannot mark attendance before class starts"
            );
        }

        AttendanceStatus attendanceStatus =
                request.getAttendanceStatus();

        /*
         * Không cho reset về NOT_MARKED.
         */
        if (attendanceStatus
                == AttendanceStatus.NOT_MARKED) {

            throw new RuntimeException(
                    "Attendance status must be PRESENT or ABSENT"
            );
        }

        /*
         * Update attendance.
         */
        booking.setAttendanceStatus(
                attendanceStatus
        );

        /*
         * Đồng bộ BookingStatus.
         */
        if (attendanceStatus
                == AttendanceStatus.PRESENT) {

            booking.setStatus(
                    ClassBookingStatus.COMPLETED
            );

        } else if (attendanceStatus
                == AttendanceStatus.ABSENT) {

            booking.setStatus(
                    ClassBookingStatus.NO_SHOW
            );
        }

        return mapToResponse(
                classBookingRepository.save(booking)
        );
    }

    // =========================================================
    // MEMBER PACKAGE
    // =========================================================

    private MemberPackage findEligibleMemberPackage(
            User member
    ) {

        LocalDate today =
                LocalDate.now();

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

        if (memberPackage == null) {
            throw new RuntimeException(
                    "Member package is required"
            );
        }

        /*
         * Package phải thuộc current Member.
         */
        if (memberPackage.getMember() == null
                || !memberPackage.getMember()
                .getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "Member package does not belong to current member"
            );
        }

        /*
         * Package phải ACTIVE.
         */
        if (memberPackage.getStatus()
                != MemberPackageStatus.ACTIVE) {

            throw new RuntimeException(
                    "Member package is not active"
            );
        }

        LocalDate today =
                LocalDate.now();

        /*
         * Chưa đến ngày bắt đầu.
         */
        if (memberPackage.getStartDate()
                .isAfter(today)) {

            throw new RuntimeException(
                    "Member package has not started"
            );
        }

        /*
         * Đã hết hạn.
         */
        if (memberPackage.getEndDate()
                .isBefore(today)) {

            throw new RuntimeException(
                    "Member package has expired"
            );
        }

        /*
         * Không còn session.
         */
        if (memberPackage.getSessionsRemaining() == null
                || memberPackage.getSessionsRemaining() <= 0) {

            throw new RuntimeException(
                    "Member package has no remaining sessions"
            );
        }
    }

    // =========================================================
    // AUTHORIZATION
    // =========================================================

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

        /*
         * Nếu UserStatus có ACTIVE,
         * Member phải ACTIVE mới booking.
         */
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "Member account is not active"
            );
        }
    }

    private void validateManagementUser(User user) {

        if (user == null) {
            throw new RuntimeException(
                    "Current user not found"
            );
        }

        if (user.getRole() != UserRole.TRAINER
                && user.getRole() != UserRole.ADMIN) {

            throw new RuntimeException(
                    "Only TRAINER or ADMIN can perform this action"
            );
        }

        /*
         * Trainer/Admin phải ACTIVE.
         */
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException(
                    "User account is not active"
            );
        }
    }

    private void validateTrainerOwnClass(
            User currentUser,
            GymClass gymClass
    ) {

        /*
         * ADMIN được xem tất cả.
         */
        if (currentUser.getRole()
                == UserRole.ADMIN) {

            return;
        }

        /*
         * TRAINER chỉ được xem class của mình.
         */
        if (currentUser.getRole()
                == UserRole.TRAINER) {

            if (gymClass.getTrainer() == null
                    || !gymClass.getTrainer()
                    .getId()
                    .equals(currentUser.getId())) {

                throw new RuntimeException(
                        "Trainer can only access bookings of their own classes"
                );
            }

            return;
        }

        throw new RuntimeException(
                "You do not have permission to access this class"
        );
    }

    // =========================================================
    // COMMON
    // =========================================================

    private ClassBooking findBookingById(
            Long id
    ) {

        return classBookingRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Class booking not found"
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

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Current user not found"
                        )
                );
    }

    private ClassBookingResponseDTO mapToResponse(
            ClassBooking booking
    ) {

        return ClassBookingResponseDTO.builder()
                .id(booking.getId())
                .bookedAt(booking.getBookedAt())
                .cancelledAt(booking.getCancelledAt())
                .cancellationReason(
                        booking.getCancellationReason()
                )
                .attendanceStatus(
                        booking.getAttendanceStatus()
                )
                .status(
                        booking.getStatus()
                )
                .memberId(
                        booking.getMember().getId()
                )
                .memberPackageId(
                        booking.getMemberPackage().getId()
                )
                .gymClassId(
                        booking.getGymClass().getId()
                )
                .build();
    }
}