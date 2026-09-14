package com.gym.gym_booking.dto.progress_note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateProgressNoteRequestDTO {
    @NotNull(message = "memberId is required")
    private Long memberId;

    @NotBlank(message = "content cannot be blank")
    private String content;
}
