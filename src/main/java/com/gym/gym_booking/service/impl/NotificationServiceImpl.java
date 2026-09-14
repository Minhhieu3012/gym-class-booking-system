package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.notification.NotificationResponseDTO;
import com.gym.gym_booking.dto.notification.UnreadCountResponseDTO;
import com.gym.gym_booking.entity.Notification;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.NotificationType;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.repository.NotificationRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized: User is not authenticated");
        }

        String principal = authentication.getName();
        return userRepository.findByPhoneOrEmail(principal, principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new RuntimeException("User not found: " + principal));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(Integer size) {
        User currentUser = getCurrentUser();
        List<Notification> list = notificationRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId());

        if (size != null && size > 0 && list.size() > size) {
            list = list.subList(0, size);
        }

        return list.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponseDTO getUnreadCount() {
        User currentUser = getCurrentUser();
        long unread = notificationRepository.countByUser_IdAndReadFalse(currentUser.getId());

        return UnreadCountResponseDTO.builder()
                .count(unread)
                .unreadCount(unread)
                .build();
    }

    @Override
    public void markAsRead(Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));

        if (!notification.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Access denied: You can only update your own notifications");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications =
                notificationRepository.findByUser_IdAndReadFalse(currentUser.getId());

        if (unreadNotifications.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notification.setReadAt(now);
        }

        notificationRepository.saveAll(unreadNotifications);
    }

    @Override
    public Notification createNotification(User user, String content, NotificationType type) {
        if (user == null) {
            return null;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setContent(content);
        notification.setType(type);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    @Override
    public Notification createNotification(Long userId, String content, NotificationType type) {
        if (userId == null) {
            return null;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return createNotification(user, content, type);
    }

    private NotificationResponseDTO toResponseDTO(Notification entity) {
        return NotificationResponseDTO.builder()
                .id(entity.getId())
                .content(entity.getContent())
                .type(entity.getType() != null ? entity.getType().name() : "SYSTEM")
                .read(entity.getRead())
                .createdAt(entity.getCreatedAt())
                .readAt(entity.getReadAt())
                .build();
    }
}
