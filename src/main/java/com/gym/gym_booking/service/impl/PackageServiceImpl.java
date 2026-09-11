package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.packageDTO.PackageRequestDTO;
import com.gym.gym_booking.dto.packageDTO.PackageResponseDTO;
import com.gym.gym_booking.dto.packageDTO.PackageUpdateRequestDTO;
import com.gym.gym_booking.entity.Package;
import com.gym.gym_booking.repository.PackageRepository;
import com.gym.gym_booking.service.PackageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PackageServiceImpl implements PackageService {

    private final PackageRepository packageRepository;

    public PackageServiceImpl(PackageRepository packageRepository) {
        this.packageRepository = packageRepository;
    }

    private PackageResponseDTO toResponse(Package packageEntity) {
        return new PackageResponseDTO(
                packageEntity.getId(),
                packageEntity.getName(),
                packageEntity.getDescription(),
                packageEntity.getPrice(),
                packageEntity.getSessionCount(),
                packageEntity.getDurationDays(),
                packageEntity.getActive()
        );
    }

    // =========================
    // PUBLIC
    // =========================

    @Override
    @Transactional(readOnly = true)
    public Page<PackageResponseDTO> getPackages(Pageable pageable) {

        return packageRepository
                .findByActive(true, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PackageResponseDTO getPackageById(Long id) {

        Package packageEntity = packageRepository
                .findByIdAndActive(id, true)
                .orElseThrow(() ->
                        new RuntimeException("Package not found")
                );

        return toResponse(packageEntity);
    }

    // =========================
    // ADMIN
    // =========================

    @Override
    @Transactional(readOnly = true)
    public Page<PackageResponseDTO> getAllPackagesForAdmin(
            Boolean active,
            Pageable pageable
    ) {

        if (active != null) {
            return packageRepository
                    .findByActive(active, pageable)
                    .map(this::toResponse);
        }

        return packageRepository
                .findAll(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PackageResponseDTO getPackageByIdForAdmin(Long id) {

        Package packageEntity = packageRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Package not found")
                );

        return toResponse(packageEntity);
    }

    @Override
    @Transactional
    public PackageResponseDTO createPackage(
            PackageRequestDTO request
    ) {

        String name = request.getName().trim();

        if (packageRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException(
                    "Package name already exists"
            );
        }

        Package packageEntity = new Package();

        packageEntity.setName(name);

        packageEntity.setDescription(
                request.getDescription() != null
                        ? request.getDescription().trim()
                        : null
        );

        packageEntity.setPrice(request.getPrice());
        packageEntity.setSessionCount(request.getSessionCount());
        packageEntity.setDurationDays(request.getDurationDays());
        packageEntity.setActive(request.getActive());

        Package saved = packageRepository.save(packageEntity);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PackageResponseDTO updatePackage(
            Long id,
            PackageUpdateRequestDTO request
    ) {

        Package packageEntity = packageRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Package not found")
                );

        // Name
        if (request.getName() != null) {

            String name = request.getName().trim();

            if (name.isEmpty()) {
                throw new RuntimeException(
                        "Package name cannot be empty"
                );
            }

            if (!name.equalsIgnoreCase(packageEntity.getName())
                    && packageRepository.existsByNameIgnoreCase(name)) {

                throw new RuntimeException(
                        "Package name already exists"
                );
            }

            packageEntity.setName(name);
        }

        // Description
        if (request.getDescription() != null) {
            packageEntity.setDescription(
                    request.getDescription().trim()
            );
        }

        // Price
        if (request.getPrice() != null) {
            packageEntity.setPrice(request.getPrice());
        }

        // Total sessions
        if (request.getSessionCount() != null) {
            packageEntity.setSessionCount(
                    request.getSessionCount()
            );
        }

        // Duration
        if (request.getDurationDays() != null) {
            packageEntity.setDurationDays(
                    request.getDurationDays()
            );
        }

        // Active
        if (request.getActive() != null) {
            packageEntity.setActive(
                    request.getActive()
            );
        }

        Package saved = packageRepository.save(packageEntity);

        return toResponse(saved);
    }
}