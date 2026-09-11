package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.transaction.TransactionCreateRequestDTO;
import com.gym.gym_booking.dto.transaction.TransactionResponseDTO;
import com.gym.gym_booking.enums.TransactionStatus;
import com.gym.gym_booking.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
@PreAuthorize("hasRole('MEMBER')")
public class TransactionController {

    private final PaymentService paymentService;

    public TransactionController(
            PaymentService paymentService
    ) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDTO>
    createTransaction(
            @Valid @RequestBody
            TransactionCreateRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        paymentService.createTransaction(request)
                );
    }

    @GetMapping("/me")
    public ResponseEntity<Page<TransactionResponseDTO>>
    getMyTransactions(
            @RequestParam(required = false)
            TransactionStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                paymentService.getMyTransactions(
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/me/{id}")
    public ResponseEntity<TransactionResponseDTO>
    getMyTransactionById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                paymentService.getMyTransactionById(id)
        );
    }
}