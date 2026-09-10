package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.user.ChangePasswordRequestDTO;
import com.gym.gym_booking.dto.user.UpdateProfileRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMyProfile() {

        return ResponseEntity.ok(
                userService.getMyProfile()
        );
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {

        return ResponseEntity.ok(
                userService.updateMyProfile(request)
        );
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO request
    ) {

        userService.changePassword(request);

        return ResponseEntity.noContent().build();
    }
}