package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.packageDTO.PackageResponseDTO;
import com.gym.gym_booking.service.PackageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/packages")
public class PackageController {

    private final PackageService packageService;

    public PackageController(PackageService packageService) {
        this.packageService = packageService;
    }

    @GetMapping
    public ResponseEntity<Page<PackageResponseDTO>> getPackages(
            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                packageService.getPackages(pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackageResponseDTO> getPackageById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                packageService.getPackageById(id)
        );
    }
}