package com.gym.gym_booking.dto.user;

import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;

public class UserResponseDTO {

    private Long id;
    private String phone;
    private String email;
    private String fullName;
    private String address;
    private String avatarUrl;
    private UserRole role;
    private UserStatus status;

    public UserResponseDTO() {
    }

    public UserResponseDTO(
            Long id,
            String phone,
            String email,
            String fullName,
            String address,
            String avatarUrl,
            UserRole role,
            UserStatus status
    ) {
        this.id = id;
        this.phone = phone;
        this.email = email;
        this.fullName = fullName;
        this.address = address;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }
}