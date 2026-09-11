package com.gym.gym_booking.dto.transaction;

import com.gym.gym_booking.enums.PaymentMethod;
import com.gym.gym_booking.enums.TransactionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDTO {

    private Long id;

    private BigDecimal amount;

    private TransactionStatus status;

    private String transactionCode;

    private PaymentMethod paymentMethod;

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    private Long memberId;

    private Long packageId;

    private Long memberPackageId;
}