package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.class_type.ClassTypeRequestDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeResponseDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeUpdateRequestDTO;
import com.gym.gym_booking.service.ClassTypeService;
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
@RequestMapping("/admin/class-types")
@PreAuthorize("hasRole('ADMIN')")
public class AdminClassTypeController {

    private final ClassTypeService classTypeService;

    public AdminClassTypeController(
            ClassTypeService classTypeService
    ) {
        this.classTypeService = classTypeService;
    }

    @GetMapping
    public ResponseEntity<Page<ClassTypeResponseDTO>> getClassTypes(
            @RequestParam(required = false) Boolean active,
            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                classTypeService.getAllClassTypesForAdmin(
                        active,
                        pageable
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassTypeResponseDTO> getClassTypeById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                classTypeService.getClassTypeByIdForAdmin(id)
        );
    }

    @PostMapping
    public ResponseEntity<ClassTypeResponseDTO> createClassType(
            @Valid @RequestBody ClassTypeRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        classTypeService.createClassType(request)
                );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ClassTypeResponseDTO> updateClassType(
            @PathVariable Long id,
            @Valid @RequestBody ClassTypeUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                classTypeService.updateClassType(
                        id,
                        request
                )
        );
    }
}