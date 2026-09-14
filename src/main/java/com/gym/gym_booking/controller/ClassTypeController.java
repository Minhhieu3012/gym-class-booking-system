package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.class_type.ClassTypeResponseDTO;
import com.gym.gym_booking.service.ClassTypeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/class-types")
public class ClassTypeController {

    private final ClassTypeService classTypeService;

    public ClassTypeController(ClassTypeService classTypeService) {
        this.classTypeService = classTypeService;
    }

    @GetMapping
    public ResponseEntity<Page<ClassTypeResponseDTO>> getClassTypes(
            @PageableDefault(
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                classTypeService.getClassTypes(pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassTypeResponseDTO> getClassTypeById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                classTypeService.getClassTypeById(id)
        );
    }
}