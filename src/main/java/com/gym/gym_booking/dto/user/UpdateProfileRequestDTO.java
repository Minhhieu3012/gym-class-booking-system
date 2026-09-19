package com.gym.gym_booking.dto.user;

public class UpdateProfileRequestDTO {

    private String fullName;

    private String phone;

    private String address;

    private String avatarUrl;

    public UpdateProfileRequestDTO() {
    }

    public UpdateProfileRequestDTO(
            String fullName,
            String phone,
            String address,
            String avatarUrl
    ) {
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.avatarUrl = avatarUrl;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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
}