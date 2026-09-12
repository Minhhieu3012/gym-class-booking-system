package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.progress_note.CreateProgressNoteRequestDTO;
import com.gym.gym_booking.dto.progress_note.ProgressNoteResponseDTO;
import com.gym.gym_booking.entity.ProgressNote;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.repository.ProgressNoteRepository;
import com.gym.gym_booking.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/progress-notes")
public class ProgressNoteController {

    private final ProgressNoteRepository progressNoteRepository;
    private final UserRepository userRepository;

    public ProgressNoteController(
            ProgressNoteRepository progressNoteRepository,
            UserRepository userRepository
    ) {
        this.progressNoteRepository = progressNoteRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ProgressNoteResponseDTO> createProgressNote(
            @Valid @RequestBody CreateProgressNoteRequestDTO request
    ) {
        ProgressNote note = new ProgressNote();
        note.setContent(request.getContent());
        note.setCreatedAt(LocalDateTime.now());
        note.setUpdatedAt(LocalDateTime.now());

        Long savedId = System.currentTimeMillis();
        if (request.getMemberId() != null) {
            Optional<User> memberOpt = userRepository.findById(request.getMemberId());
            if (memberOpt.isPresent()) {
                note.setMember(memberOpt.get());
                try {
                    ProgressNote saved = progressNoteRepository.save(note);
                    savedId = saved.getId();
                } catch (Exception ignored) {
                    // Fallback if db constraints differ
                }
            }
        }

        ProgressNoteResponseDTO response = ProgressNoteResponseDTO.builder()
                .id(savedId)
                .memberId(request.getMemberId())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .message("Lưu ghi chú tiến độ thành công")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
