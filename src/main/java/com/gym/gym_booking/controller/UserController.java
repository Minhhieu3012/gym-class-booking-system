package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.user.ChangePasswordRequestDTO;
import com.gym.gym_booking.dto.user.UpdateProfileRequestDTO;
import com.gym.gym_booking.dto.user.UserResponseDTO;
import com.gym.gym_booking.dto.user.UserStatusUpdateRequestDTO;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponseDTO>> getUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                userService.getUsers(
                        role,
                        status,
                        keyword,
                        pageable
                )
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                userService.updateUserStatus(
                        id,
                        request
                )
        );
    }
}