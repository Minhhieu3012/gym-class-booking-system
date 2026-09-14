package com.gym.gym_booking.service;

import com.gym.gym_booking.dto.notification.NotificationResponseDTO;
import com.gym.gym_booking.dto.notification.UnreadCountResponseDTO;
import com.gym.gym_booking.entity.Notification;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.NotificationType;

import java.util.List;

public interface NotificationService {

    List<NotificationResponseDTO> getMyNotifications(Integer size);

    UnreadCountResponseDTO getUnreadCount();

    void markAsRead(Long id);

    void markAllAsRead();

    Notification createNotification(User user, String content, NotificationType type);

    Notification createNotification(Long userId, String content, NotificationType type);
}
