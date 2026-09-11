package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.member_package.MemberPackageResponseDTO;
import com.gym.gym_booking.enums.MemberPackageStatus;
import com.gym.gym_booking.service.MemberPackageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/member-packages")
@PreAuthorize("hasRole('MEMBER')")
public class MemberPackageController {

    private final MemberPackageService memberPackageService;

    public MemberPackageController(
            MemberPackageService memberPackageService
    ) {
        this.memberPackageService = memberPackageService;
    }

    @GetMapping("/me")
    public ResponseEntity<Page<MemberPackageResponseDTO>> getMyPackages(

            @RequestParam(required = false)
            MemberPackageStatus status,

            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                memberPackageService.getMyPackages(
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/me/{id}")
    public ResponseEntity<MemberPackageResponseDTO> getMyPackageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                memberPackageService.getMyPackageById(id)
        );
    }
}