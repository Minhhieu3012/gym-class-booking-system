package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.class_type.ClassTypeRequestDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeResponseDTO;
import com.gym.gym_booking.dto.class_type.ClassTypeUpdateRequestDTO;
import com.gym.gym_booking.entity.ClassType;
import com.gym.gym_booking.repository.ClassTypeRepository;
import com.gym.gym_booking.service.ClassTypeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClassTypeServiceImpl implements ClassTypeService {

    private final ClassTypeRepository classTypeRepository;

    public ClassTypeServiceImpl(
            ClassTypeRepository classTypeRepository
    ) {
        this.classTypeRepository = classTypeRepository;
    }

    private ClassTypeResponseDTO toResponse(
            ClassType classType
    ) {

        return new ClassTypeResponseDTO(
                classType.getId(),
                classType.getName(),
                classType.getDescription(),
                classType.getActive()
        );
    }


    // GET ALL - PUBLIC / MEMBER
    @Override
    @Transactional(readOnly = true)
    public Page<ClassTypeResponseDTO> getClassTypes(
            Pageable pageable
    ) {
        return classTypeRepository
                .findByActive(true, pageable)
                .map(this::toResponse);
    }

    
    // GET BY ID


    @Override
    @Transactional(readOnly = true)
    public ClassTypeResponseDTO getClassTypeById(Long id) {

        ClassType classType =
                classTypeRepository
                        .findByIdAndActive(id, true)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class type not found"
                                )
                        );

        return toResponse(classType);
    }

//    Admin get all
    @Override
    @Transactional(readOnly = true)
    public Page<ClassTypeResponseDTO> getAllClassTypesForAdmin(
            Boolean active,
            Pageable pageable
    ) {
        if (active != null) {
            return classTypeRepository
                    .findByActive(active, pageable)
                    .map(this::toResponse);
        }

        return classTypeRepository
                .findAll(pageable)
                .map(this::toResponse);
    }
// Admin get by id
    @Override
    @Transactional(readOnly = true)
    public ClassTypeResponseDTO getClassTypeByIdForAdmin(Long id) {

        ClassType classType = classTypeRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Class type not found")
                );

        return toResponse(classType);
    }
    // CREATE

    @Override
    @Transactional
    public ClassTypeResponseDTO createClassType(
            ClassTypeRequestDTO request
    ) {

        String name =
                request.getName().trim();

        if (classTypeRepository
                .existsByNameIgnoreCase(name)) {

            throw new RuntimeException(
                    "Class type name already exists"
            );
        }

        ClassType classType = new ClassType();

        classType.setName(name);

        classType.setDescription(
                request.getDescription() != null
                        ? request.getDescription().trim()
                        : null
        );

        classType.setActive(
                request.getActive()
        );

        ClassType saved =
                classTypeRepository.save(classType);

        return toResponse(saved);
    }

    
    // UPDATE
    

    @Override
    @Transactional
    public ClassTypeResponseDTO updateClassType(
            Long id,
            ClassTypeUpdateRequestDTO request
    ) {

        ClassType classType =
                classTypeRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Class type not found"
                                )
                        );

        // Update name
        if (request.getName() != null) {

            String name =
                    request.getName().trim();

            if (name.isEmpty()) {
                throw new RuntimeException(
                        "Class type name cannot be empty"
                );
            }

            if (!name.equalsIgnoreCase(
                    classType.getName()
            )
                    && classTypeRepository
                    .existsByNameIgnoreCase(name)) {

                throw new RuntimeException(
                        "Class type name already exists"
                );
            }

            classType.setName(name);
        }

        // Update description
        if (request.getDescription() != null) {

            classType.setDescription(
                    request.getDescription().trim()
            );
        }

        // Update active
        if (request.getActive() != null) {

            classType.setActive(
                    request.getActive()
            );
        }

        ClassType saved =
                classTypeRepository.save(classType);

        return toResponse(saved);
    }
}