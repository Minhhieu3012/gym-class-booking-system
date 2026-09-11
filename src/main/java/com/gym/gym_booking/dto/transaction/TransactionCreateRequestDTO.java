package com.gym.gym_booking.dto.transaction;

import com.gym.gym_booking.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransactionCreateRequestDTO {

    @NotNull
    private Long packageId;

    @NotNull
    private PaymentMethod paymentMethod;
}