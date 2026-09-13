package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.member.MemberScheduleResponseDTO;
import com.gym.gym_booking.service.MemberScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/member/schedule")
public class MemberScheduleController {

    private final MemberScheduleService memberScheduleService;

    public MemberScheduleController(
            MemberScheduleService memberScheduleService
    ) {
        this.memberScheduleService = memberScheduleService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<MemberScheduleResponseDTO> getMySchedule() {

        return ResponseEntity.ok(
                memberScheduleService.getMySchedule()
        );
    }
}