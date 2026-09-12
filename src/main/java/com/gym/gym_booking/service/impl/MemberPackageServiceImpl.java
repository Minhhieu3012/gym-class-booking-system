package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.member_package.MemberPackageResponseDTO;
import com.gym.gym_booking.entity.MemberPackage;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.MemberPackageStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.repository.MemberPackageRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.MemberPackageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MemberPackageServiceImpl
        implements MemberPackageService {

    private final MemberPackageRepository memberPackageRepository;
    private final UserRepository userRepository;

    public MemberPackageServiceImpl(
            MemberPackageRepository memberPackageRepository,
            UserRepository userRepository
    ) {
        this.memberPackageRepository = memberPackageRepository;
        this.userRepository = userRepository;
    }

    // CURRENT USER
    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException("Unauthorized");
        }

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }


    // =====================================================
    // MAPPER
    // =====================================================

    private MemberPackageResponseDTO toResponse(
            MemberPackage memberPackage
    ) {

        User member = memberPackage.getMember();

        return new MemberPackageResponseDTO(
                memberPackage.getId(),

                member.getId(),
                member.getFullName(),

                memberPackage.getPackageEntity().getId(),
                memberPackage.getPackageEntity().getName(),

                memberPackage.getStartDate(),
                memberPackage.getEndDate(),

                memberPackage.getSessionsRemaining(),

                memberPackage.getStatus()
        );
    }

    // =====================================================
    // MEMBER
    // =====================================================

    @Override
    @Transactional
    public Page<MemberPackageResponseDTO> getMyPackages(
            MemberPackageStatus status,
            Pageable pageable
    ) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.MEMBER) {
            throw new RuntimeException(
                    "Only member can access own packages"
            );
        }

        Page<MemberPackage> packages;

        if (status != null) {

            packages =
                    memberPackageRepository
                            .findByMemberIdAndStatus(
                                    currentUser.getId(),
                                    status,
                                    pageable
                            );

        } else {

            packages =
                    memberPackageRepository
                            .findByMemberId(
                                    currentUser.getId(),
                                    pageable
                            );
        }

        return packages.map(this::toResponse);
    }

    @Override
    @Transactional
    public MemberPackageResponseDTO getMyPackageById(
            Long id
    ) {

        if (id == null || id <= 0) {
            throw new RuntimeException(
                    "Invalid member package ID"
            );
        }

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.MEMBER) {
            throw new RuntimeException(
                    "Only member can access own packages"
            );
        }

        MemberPackage memberPackage =
                memberPackageRepository
                        .findByIdAndMemberId(
                                id,
                                currentUser.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Member package not found"
                                ));

        return toResponse(memberPackage);
    }

    // =====================================================
    // ADMIN
    // =====================================================

    @Override
    @Transactional
    public Page<MemberPackageResponseDTO> getAllMemberPackages(
            Long memberId,
            MemberPackageStatus status,
            Pageable pageable
    ) {

        if (memberId != null && memberId <= 0) {
            throw new RuntimeException(
                    "Invalid member ID"
            );
        }

        Page<MemberPackage> packages;

        if (memberId != null && status != null) {

            packages =
                    memberPackageRepository
                            .findByMemberIdAndStatus(
                                    memberId,
                                    status,
                                    pageable
                            );

        } else if (memberId != null) {

            packages =
                    memberPackageRepository
                            .findByMemberId(
                                    memberId,
                                    pageable
                            );

        } else if (status != null) {

            packages =
                    memberPackageRepository
                            .findByStatus(
                                    status,
                                    pageable
                            );

        } else {

            packages =
                    memberPackageRepository
                            .findAll(pageable);
        }

        return packages.map(this::toResponse);
    }

    @Override
    @Transactional
    public MemberPackageResponseDTO getMemberPackageById(
            Long id
    ) {

        if (id == null || id <= 0) {
            throw new RuntimeException(
                    "Invalid member package ID"
            );
        }

        MemberPackage memberPackage =
                memberPackageRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Member package not found"
                                ));

        return toResponse(memberPackage);
    }
    @Override
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireMemberPackages() {

        LocalDate today = LocalDate.now();

        List<MemberPackage> expiredPackages =
                memberPackageRepository
                        .findByStatusAndEndDateBefore(
                                MemberPackageStatus.ACTIVE,
                                today
                        );

        expiredPackages.forEach(memberPackage ->
                memberPackage.setStatus(
                        MemberPackageStatus.EXPIRED
                )
        );

        if (!expiredPackages.isEmpty()) {
            memberPackageRepository.saveAll(expiredPackages);
        }
    }

    @Override
    @Transactional
    public MemberPackageResponseDTO adjustMemberPackage(
            Long id,
            Integer sessionsAdjustment,
            LocalDate newEndDate,
            String reason
    ) {
        MemberPackage memberPackage = memberPackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gói tập hội viên không tồn tại với ID: " + id));

        if (sessionsAdjustment != null) {
            int current = memberPackage.getSessionsRemaining() != null ? memberPackage.getSessionsRemaining() : 0;
            int updated = Math.max(0, current + sessionsAdjustment);
            memberPackage.setSessionsRemaining(updated);
        }

        if (newEndDate != null) {
            memberPackage.setEndDate(newEndDate);
        }

        // Cập nhật trạng thái
        boolean hasSessions = memberPackage.getSessionsRemaining() != null && memberPackage.getSessionsRemaining() > 0;
        if (memberPackage.getEndDate() != null && !memberPackage.getEndDate().isBefore(LocalDate.now()) && hasSessions) {
            memberPackage.setStatus(MemberPackageStatus.ACTIVE);
        } else if (memberPackage.getEndDate() != null && memberPackage.getEndDate().isBefore(LocalDate.now())) {
            memberPackage.setStatus(MemberPackageStatus.EXPIRED);
        }

        MemberPackage saved = memberPackageRepository.save(memberPackage);
        return toResponse(saved);
    }
}