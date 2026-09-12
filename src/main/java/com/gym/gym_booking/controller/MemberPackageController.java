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
public class MemberPackageController {

    private final MemberPackageService memberPackageService;

    public MemberPackageController(
            MemberPackageService memberPackageService
    ) {
        this.memberPackageService = memberPackageService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
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
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<MemberPackageResponseDTO> getMyPackageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                memberPackageService.getMyPackageById(id)
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<MemberPackageResponseDTO>> getAllMemberPackages(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) MemberPackageStatus status,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(
                memberPackageService.getAllMemberPackages(memberId, status, pageable)
        );
    }

    @PatchMapping("/{id}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MemberPackageResponseDTO> adjustMemberPackage(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body
    ) {
        Integer sessionsAdjustment = null;
        if (body != null && body.containsKey("sessionsAdjustment") && body.get("sessionsAdjustment") != null) {
            sessionsAdjustment = Integer.valueOf(body.get("sessionsAdjustment").toString());
        }

        java.time.LocalDate newEndDate = null;
        if (body != null && body.containsKey("newEndDate") && body.get("newEndDate") != null && !body.get("newEndDate").toString().isBlank()) {
            newEndDate = java.time.LocalDate.parse(body.get("newEndDate").toString());
        }

        String reason = body != null && body.containsKey("reason") && body.get("reason") != null ? body.get("reason").toString() : "";

        return ResponseEntity.ok(
                memberPackageService.adjustMemberPackage(id, sessionsAdjustment, newEndDate, reason)
        );
    }
}