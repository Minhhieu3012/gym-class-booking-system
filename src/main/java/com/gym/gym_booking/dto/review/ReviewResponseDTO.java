package com.gym.gym_booking.dto.review;

import java.time.LocalDateTime;

public class ReviewResponseDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private Long classBookingId;
    private Long ptBookingId;
    private String message;

    private String memberName;
    private String memberEmail;
    private String targetType; // "CLASS" or "PT"
    private String targetName; // e.g. "Yoga Hatha" or "HLV Nguyen Van Phuc"

    public ReviewResponseDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Boolean getHidden() {
        return hidden;
    }

    public Boolean getIsHidden() {
        return hidden;
    }

    public void setHidden(Boolean hidden) {
        this.hidden = hidden;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getClassBookingId() {
        return classBookingId;
    }

    public void setClassBookingId(Long classBookingId) {
        this.classBookingId = classBookingId;
    }

    public Long getPtBookingId() {
        return ptBookingId;
    }

    public void setPtBookingId(Long ptBookingId) {
        this.ptBookingId = ptBookingId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }
}
