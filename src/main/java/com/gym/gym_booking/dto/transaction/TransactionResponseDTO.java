package com.gym.gym_booking.dto.transaction;

import com.gym.gym_booking.enums.PaymentMethod;
import com.gym.gym_booking.enums.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponseDTO {

    private Long id;
    private BigDecimal amount;
    private TransactionStatus status;
    private String transactionCode;
    private PaymentMethod paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private Long packageId;
    private String packageName;
    private Long memberPackageId;

    public TransactionResponseDTO() {}

    public TransactionResponseDTO(
            Long id,
            BigDecimal amount,
            TransactionStatus status,
            String transactionCode,
            PaymentMethod paymentMethod,
            LocalDateTime createdAt,
            LocalDateTime completedAt,
            Long memberId,
            String memberName,
            String memberEmail,
            Long packageId,
            String packageName,
            Long memberPackageId
    ) {
        this.id = id;
        this.amount = amount;
        this.status = status;
        this.transactionCode = transactionCode;
        this.paymentMethod = paymentMethod;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberEmail = memberEmail;
        this.packageId = packageId;
        this.packageName = packageName;
        this.memberPackageId = memberPackageId;
    }

    public static TransactionResponseDTOBuilder builder() {
        return new TransactionResponseDTOBuilder();
    }

    public static class TransactionResponseDTOBuilder {
        private Long id;
        private BigDecimal amount;
        private TransactionStatus status;
        private String transactionCode;
        private PaymentMethod paymentMethod;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
        private Long memberId;
        private String memberName;
        private String memberEmail;
        private Long packageId;
        private String packageName;
        private Long memberPackageId;

        TransactionResponseDTOBuilder() {}

        public TransactionResponseDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TransactionResponseDTOBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public TransactionResponseDTOBuilder status(TransactionStatus status) {
            this.status = status;
            return this;
        }

        public TransactionResponseDTOBuilder transactionCode(String transactionCode) {
            this.transactionCode = transactionCode;
            return this;
        }

        public TransactionResponseDTOBuilder paymentMethod(PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public TransactionResponseDTOBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TransactionResponseDTOBuilder completedAt(LocalDateTime completedAt) {
            this.completedAt = completedAt;
            return this;
        }

        public TransactionResponseDTOBuilder memberId(Long memberId) {
            this.memberId = memberId;
            return this;
        }

        public TransactionResponseDTOBuilder memberName(String memberName) {
            this.memberName = memberName;
            return this;
        }

        public TransactionResponseDTOBuilder memberEmail(String memberEmail) {
            this.memberEmail = memberEmail;
            return this;
        }

        public TransactionResponseDTOBuilder packageId(Long packageId) {
            this.packageId = packageId;
            return this;
        }

        public TransactionResponseDTOBuilder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        public TransactionResponseDTOBuilder memberPackageId(Long memberPackageId) {
            this.memberPackageId = memberPackageId;
            return this;
        }

        public TransactionResponseDTO build() {
            return new TransactionResponseDTO(
                    id, amount, status, transactionCode, paymentMethod,
                    createdAt, completedAt, memberId, memberName, memberEmail,
                    packageId, packageName, memberPackageId
            );
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getMemberEmail() {
        return memberEmail;
    }

    public void setMemberEmail(String memberEmail) {
        this.memberEmail = memberEmail;
    }

    public Long getPackageId() {
        return packageId;
    }

    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public Long getMemberPackageId() {
        return memberPackageId;
    }

    public void setMemberPackageId(Long memberPackageId) {
        this.memberPackageId = memberPackageId;
    }
}