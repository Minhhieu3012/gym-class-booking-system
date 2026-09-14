package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.packageDTO.PackageRequestDTO;
import com.gym.gym_booking.dto.packageDTO.PackageResponseDTO;
import com.gym.gym_booking.dto.packageDTO.PackageUpdateRequestDTO;
import com.gym.gym_booking.service.PackageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/packages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPackageController {

    private final PackageService packageService;

    public AdminPackageController(PackageService packageService) {
        this.packageService = packageService;
    }

    @GetMapping
    public ResponseEntity<Page<PackageResponseDTO>> getPackages(
            @RequestParam(required = false) Boolean active,

            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                packageService.getAllPackagesForAdmin(
                        active,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackageResponseDTO> getPackageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                packageService.getPackageByIdForAdmin(id)
        );
    }

    @PostMapping
    public ResponseEntity<PackageResponseDTO> createPackage(
            @Valid @RequestBody PackageRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(packageService.createPackage(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PackageResponseDTO> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody PackageUpdateRequestDTO request
    ) {

        return ResponseEntity.ok(
                packageService.updatePackage(id, request)
        );
    }
}