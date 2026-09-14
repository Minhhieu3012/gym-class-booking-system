package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.transaction.TransactionCreateRequestDTO;
import com.gym.gym_booking.dto.transaction.TransactionResponseDTO;
import com.gym.gym_booking.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {

    TransactionResponseDTO createTransaction(
            TransactionCreateRequestDTO request
    );

    TransactionResponseDTO mockPayment(
            Long transactionId,
            TransactionStatus status
    );

    Page<TransactionResponseDTO> getMyTransactions(
            TransactionStatus status,
            Pageable pageable
    );

    TransactionResponseDTO getMyTransactionById(Long id);

    Page<TransactionResponseDTO> getAllTransactions(
            Long memberId,
            TransactionStatus status,
            Pageable pageable
    );

    TransactionResponseDTO getTransactionById(Long id);
}