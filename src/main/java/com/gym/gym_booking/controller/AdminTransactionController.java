package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.transaction.TransactionResponseDTO;
import com.gym.gym_booking.enums.TransactionStatus;
import com.gym.gym_booking.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/transactions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTransactionController {

    private final PaymentService paymentService;

    public AdminTransactionController(
            PaymentService paymentService
    ) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<Page<TransactionResponseDTO>>
    getTransactions(
            @RequestParam(required = false)
            Long memberId,

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
                paymentService.getAllTransactions(
                        memberId,
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO>
    getTransactionById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                paymentService.getTransactionById(id)
        );
    }
    @PostMapping("/{id}/mock-payment")
    public ResponseEntity<TransactionResponseDTO>
    mockPayment(
            @PathVariable Long id,
            @RequestParam TransactionStatus status
    ) {

        return ResponseEntity.ok(
                paymentService.mockPayment(id, status)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TransactionResponseDTO>
    updateTransactionStatus(
            @PathVariable Long id,
            @RequestBody(required = false)
            java.util.Map<String, Object> body,
            @RequestParam(required = false)
            TransactionStatus status
    ) {
        TransactionStatus newStatus = status;
        if (newStatus == null && body != null && body.containsKey("status") && body.get("status") != null) {
            newStatus = TransactionStatus.valueOf(body.get("status").toString().toUpperCase());
        }
        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái không được để trống");
        }
        return ResponseEntity.ok(
                paymentService.mockPayment(id, newStatus)
        );
    }
}