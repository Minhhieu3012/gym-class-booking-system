package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.Transaction;
import com.gym.gym_booking.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionCode(String transactionCode);

    boolean existsByTransactionCode(String transactionCode);

    Page<Transaction> findByMemberId(
            Long memberId,
            Pageable pageable
    );

    Page<Transaction> findByMemberIdAndStatus(
            Long memberId,
            TransactionStatus status,
            Pageable pageable
    );
    Page<Transaction> findByStatus(
            TransactionStatus status,
            Pageable pageable
    );
}