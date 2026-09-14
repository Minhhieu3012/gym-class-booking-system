package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.notification.NotificationResponseDTO;
import com.gym.gym_booking.dto.notification.UnreadCountResponseDTO;
import com.gym.gym_booking.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<UnreadCountResponseDTO> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(
            @RequestParam(required = false, defaultValue = "10") Integer size
    ) {
        return ResponseEntity.ok(notificationService.getMyNotifications(size));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Notification marked as read");
        result.put("id", id);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        notificationService.markAllAsRead();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "All notifications marked as read");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetNotifications() {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Reset notification state completed");
        return ResponseEntity.ok(res);
    }
}
