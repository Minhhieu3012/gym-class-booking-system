package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.dashboard.MemberDashboardResponseDTO;
import com.gym.gym_booking.service.MemberDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/member/dashboard")
public class MemberDashboardController {

    private final MemberDashboardService memberDashboardService;

    public MemberDashboardController(
            MemberDashboardService memberDashboardService
    ) {
        this.memberDashboardService = memberDashboardService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<MemberDashboardResponseDTO> getDashboard() {

        return ResponseEntity.ok(
                memberDashboardService.getDashboard()
        );
    }
}