package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.class_type.ClassTypeRequestDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeResponseDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeUpdateRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClassTypeService {

    // Public / Member
    Page<ClassTypeResponseDTO> getClassTypes(
            Pageable pageable
    );

    ClassTypeResponseDTO getClassTypeById(
            Long id
    );

    // Admin
    Page<ClassTypeResponseDTO> getAllClassTypesForAdmin(
            Boolean active,
            Pageable pageable
    );

    ClassTypeResponseDTO getClassTypeByIdForAdmin(
            Long id
    );

    ClassTypeResponseDTO createClassType(
            ClassTypeRequestDTO request
    );

    ClassTypeResponseDTO updateClassType(
            Long id,
            ClassTypeUpdateRequestDTO request
    );
}