package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.auth.LoginRequestDTO;
import com.gym.gym_booking.dto.auth.LoginResponseDTO;
import com.gym.gym_booking.dto.auth.RegisterRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request
    ) {
        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        return ResponseEntity.ok(
                authService.getCurrentUser()
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {

        authService.logout();

        return ResponseEntity.noContent().build();
    }
}