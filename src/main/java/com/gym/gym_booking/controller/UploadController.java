package com.gym.gym_booking.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
public class UploadController {

    private static final String UPLOAD_DIR = "uploads";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Vui lòng chọn một file để tải lên.");
            return ResponseEntity.badRequest().body(error);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Kích thước ảnh không được vượt quá 5MB.");
            return ResponseEntity.status(HttpStatus.valueOf(413)).body(error);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Chỉ chấp nhận các định dạng file ảnh (JPEG, PNG, GIF, WEBP).");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils.cleanPath(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "avatar.png"
            );
            // Replace unsafe characters
            originalFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

            String fileExtension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalFilename.substring(dotIndex);
            }

            String newFilename = UUID.randomUUID().toString() + fileExtension;
            Path destination = uploadPath.resolve(newFilename);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(newFilename)
                    .toUriString();

            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", fileDownloadUri);
            response.put("format", contentType);
            response.put("createdAt", Instant.now().toString());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Không thể lưu file trên máy chủ: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
