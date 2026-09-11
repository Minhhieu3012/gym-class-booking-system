package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.transaction.TransactionCreateRequestDTO;
import com.gym.gym_booking.dto.transaction.TransactionResponseDTO;
import com.gym.gym_booking.entity.MemberPackage;
import com.gym.gym_booking.entity.Package;
import com.gym.gym_booking.entity.Transaction;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.MemberPackageStatus;
import com.gym.gym_booking.enums.TransactionStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.repository.MemberPackageRepository;
import com.gym.gym_booking.repository.PackageRepository;
import com.gym.gym_booking.repository.TransactionRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.PaymentService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final TransactionRepository transactionRepository;
    private final PackageRepository packageRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final UserRepository userRepository;

    public PaymentServiceImpl(
            TransactionRepository transactionRepository,
            PackageRepository packageRepository,
            MemberPackageRepository memberPackageRepository,
            UserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.packageRepository = packageRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public TransactionResponseDTO createTransaction(
            TransactionCreateRequestDTO request
    ) {

        User member = getCurrentUser();

        if (member.getRole() != UserRole.MEMBER) {
            throw new RuntimeException(
                    "Only MEMBER can purchase packages"
            );
        }

        Package packageEntity = packageRepository
                .findByIdAndActive(request.getPackageId(), true)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Package not found or inactive"
                        )
                );

        Transaction transaction = new Transaction();

        transaction.setAmount(packageEntity.getPrice());
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setTransactionCode(generateTransactionCode());
        transaction.setPaymentMethod(request.getPaymentMethod());

        transaction.setMember(member);
        transaction.setPackageEntity(packageEntity);

        // Chưa thanh toán nên chưa có MemberPackage
        transaction.setMemberPackage(null);

        Transaction saved =
                transactionRepository.save(transaction);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransactionResponseDTO mockPayment(
            Long transactionId,
            TransactionStatus status
    ) {

        Transaction transaction =
                transactionRepository.findById(transactionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Transaction not found"
                                )
                        );

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new RuntimeException(
                    "Only PENDING transaction can be paid"
            );
        }

        if (status == TransactionStatus.PENDING) {
            throw new RuntimeException(
                    "Payment result must be SUCCESS or FAILED"
            );
        }

        if (status == TransactionStatus.FAILED) {

            transaction.setStatus(
                    TransactionStatus.FAILED
            );

            transaction.setCompletedAt(
                    LocalDateTime.now()
            );

            return mapToResponse(
                    transactionRepository.save(transaction)
            );
        }

        /*
         * SUCCESS
         */

        Package packageEntity =
                transaction.getPackageEntity();

        LocalDate startDate = LocalDate.now();

        LocalDate endDate =
                startDate.plusDays(
                        packageEntity.getDurationDays()
                );

        MemberPackage memberPackage =
                new MemberPackage();

        memberPackage.setStartDate(startDate);
        memberPackage.setEndDate(endDate);

        memberPackage.setSessionsRemaining(
                packageEntity.getSessionCount()
        );

        memberPackage.setStatus(
                MemberPackageStatus.ACTIVE
        );

        memberPackage.setMember(
                transaction.getMember()
        );

        memberPackage.setPackageEntity(
                packageEntity
        );

        MemberPackage savedMemberPackage =
                memberPackageRepository.save(memberPackage);

        transaction.setMemberPackage(
                savedMemberPackage
        );

        transaction.setStatus(
                TransactionStatus.SUCCESS
        );

        transaction.setCompletedAt(
                LocalDateTime.now()
        );

        Transaction savedTransaction =
                transactionRepository.save(transaction);

        return mapToResponse(savedTransaction);
    }

    @Override
    public Page<TransactionResponseDTO> getMyTransactions(
            TransactionStatus status,
            Pageable pageable
    ) {

        User member = getCurrentUser();

        Page<Transaction> transactions;

        if (status == null) {

            transactions =
                    transactionRepository.findByMemberId(
                            member.getId(),
                            pageable
                    );

        } else {

            transactions =
                    transactionRepository.findByMemberIdAndStatus(
                            member.getId(),
                            status,
                            pageable
                    );
        }

        return transactions.map(
                this::mapToResponse
        );
    }

    @Override
    public TransactionResponseDTO getMyTransactionById(
            Long id
    ) {

        User member = getCurrentUser();

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Transaction not found"
                                )
                        );

        if (!transaction.getMember()
                .getId()
                .equals(member.getId())) {

            throw new RuntimeException(
                    "You cannot access this transaction"
            );
        }

        return mapToResponse(transaction);
    }

    @Override
    public Page<TransactionResponseDTO> getAllTransactions(
            Long memberId,
            TransactionStatus status,
            Pageable pageable
    ) {

        Page<Transaction> transactions;

        if (memberId != null && status != null) {

            transactions =
                    transactionRepository.findByMemberIdAndStatus(
                            memberId,
                            status,
                            pageable
                    );

        } else if (memberId != null) {

            transactions =
                    transactionRepository.findByMemberId(
                            memberId,
                            pageable
                    );

        } else if (status != null) {

            transactions =
                    transactionRepository.findByStatus(
                            status,
                            pageable
                    );

        } else {

            transactions =
                    transactionRepository.findAll(
                            pageable
                    );
        }

        return transactions.map(
                this::mapToResponse
        );
    }

    @Override
    public TransactionResponseDTO getTransactionById(
            Long id
    ) {

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Transaction not found"
                                )
                        );

        return mapToResponse(transaction);
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

    private String generateTransactionCode() {

        return "TXN-" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 20)
                        .toUpperCase();
    }

    private TransactionResponseDTO mapToResponse(
            Transaction transaction
    ) {

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .transactionCode(
                        transaction.getTransactionCode()
                )
                .paymentMethod(
                        transaction.getPaymentMethod()
                )
                .createdAt(
                        transaction.getCreatedAt()
                )
                .completedAt(
                        transaction.getCompletedAt()
                )
                .memberId(
                        transaction.getMember().getId()
                )
                .packageId(
                        transaction.getPackageEntity().getId()
                )
                .memberPackageId(
                        transaction.getMemberPackage() != null
                                ? transaction.getMemberPackage().getId()
                                : null
                )
                .build();
    }
}