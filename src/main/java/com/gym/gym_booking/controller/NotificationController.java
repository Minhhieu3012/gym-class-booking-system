package com.gym.gym_booking.controller;

import com.gym.gym_booking.dto.notification.NotificationResponseDTO;
import com.gym.gym_booking.dto.notification.UnreadCountResponseDTO;
import com.gym.gym_booking.entity.Notification;
import com.gym.gym_booking.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final Map<Long, NotificationResponseDTO> notificationStore = new ConcurrentHashMap<>();

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
        initDefaultNotifications();
    }

    private void initDefaultNotifications() {
        notificationStore.put(1L, NotificationResponseDTO.builder()
                .id(1L)
                .content("Lớp Yoga Flow của bạn đã được xác nhận thành công!")
                .type("BOOKING_CONFIRMED")
                .read(false)
                .createdAt(LocalDateTime.now().minusMinutes(15))
                .build());

        notificationStore.put(2L, NotificationResponseDTO.builder()
                .id(2L)
                .content("HLV Lê Hoàng Cường vừa thêm ghi chú tiến độ buổi tập mới cho bạn.")
                .type("TRAINER_NOTE")
                .read(false)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build());

        notificationStore.put(3L, NotificationResponseDTO.builder()
                .id(3L)
                .content("Nhắc nhở: Buổi tập PT 1-1 sẽ bắt đầu sau 2 giờ nữa tại Studio 1.")
                .type("REMINDER")
                .read(false)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build());

        notificationStore.put(4L, NotificationResponseDTO.builder()
                .id(4L)
                .content("Chào mừng bạn đến với hệ thống Gym Pulse! Hãy đặt lớp học đầu tiên ngay.")
                .type("SYSTEM")
                .read(true)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetNotifications() {
        initDefaultNotifications();
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Reset notifications to default test state (3 unread)");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<UnreadCountResponseDTO> getUnreadCount() {
        long unread = notificationStore.values().stream()
                .filter(n -> !Boolean.TRUE.equals(n.getRead()))
                .count();

        return ResponseEntity.ok(UnreadCountResponseDTO.builder()
                .count(unread)
                .unreadCount(unread)
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(
            @RequestParam(required = false, defaultValue = "10") Integer size
    ) {
        List<NotificationResponseDTO> list = new ArrayList<>(notificationStore.values());
        list.sort((a, b) -> b.getId().compareTo(a.getId()));
        if (size != null && list.size() > size) {
            list = list.subList(0, size);
        }
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        NotificationResponseDTO item = notificationStore.get(id);
        if (item != null) {
            item.setRead(true);
            item.setReadAt(LocalDateTime.now());
        }
        try {
            Optional<Notification> nOpt = notificationRepository.findById(id);
            if (nOpt.isPresent()) {
                Notification n = nOpt.get();
                n.setRead(true);
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        } catch (Exception ignored) {}

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Notification marked as read");
        result.put("id", id);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        notificationStore.values().forEach(n -> {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        try {
            List<Notification> all = notificationRepository.findAll();
            all.forEach(n -> {
                n.setRead(true);
                n.setReadAt(LocalDateTime.now());
            });
            notificationRepository.saveAll(all);
        } catch (Exception ignored) {}

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "All notifications marked as read");
        return ResponseEntity.ok(result);
    }
}
