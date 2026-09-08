package com.gym.gym_booking.dto.auth;

import com.gym.gym_booking.dto.user.UserResponseDTO;

public class LoginResponseDTO {

    private String accessToken;

    private String tokenType;

    private Long expiresIn;

    private UserResponseDTO user;

    public LoginResponseDTO() {
    }

    public LoginResponseDTO(
            String accessToken,
            String tokenType,
            Long expiresIn,
            UserResponseDTO user
    ) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }


    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserResponseDTO getUser() {
        return user;
    }

    public void setUser(UserResponseDTO user) {
        this.user = user;
    }
}