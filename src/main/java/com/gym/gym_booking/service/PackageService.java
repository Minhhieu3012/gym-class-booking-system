package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.packageDTO.PackageRequestDTO;
import com.gym.gym_booking.dto.packageDTO.PackageResponseDTO;
import com.gym.gym_booking.dto.packageDTO.PackageUpdateRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PackageService {

    // Public
    Page<PackageResponseDTO> getPackages(Pageable pageable);

    PackageResponseDTO getPackageById(Long id);

    // Admin
    Page<PackageResponseDTO> getAllPackagesForAdmin(
            Boolean active,
            Pageable pageable
    );

    PackageResponseDTO getPackageByIdForAdmin(Long id);

    PackageResponseDTO createPackage(
            PackageRequestDTO request
    );

    PackageResponseDTO updatePackage(
            Long id,
            PackageUpdateRequestDTO request
    );
}