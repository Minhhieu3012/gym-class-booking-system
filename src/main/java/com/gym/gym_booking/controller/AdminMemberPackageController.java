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
@RequestMapping("/admin/member-packages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberPackageController {

    private final MemberPackageService memberPackageService;

    public AdminMemberPackageController(
            MemberPackageService memberPackageService
    ) {
        this.memberPackageService = memberPackageService;
    }

    @GetMapping
    public ResponseEntity<Page<MemberPackageResponseDTO>>
    getMemberPackages(

            @RequestParam(required = false)
            Long memberId,

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
                memberPackageService.getAllMemberPackages(
                        memberId,
                        status,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberPackageResponseDTO>
    getMemberPackageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                memberPackageService.getMemberPackageById(id)
        );
    }
}