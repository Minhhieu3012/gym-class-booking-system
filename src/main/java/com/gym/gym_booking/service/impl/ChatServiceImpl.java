package com.gym.gym_booking.service.impl;

import com.gym.gym_booking.dto.chat.ChatErrorDTO;
import com.gym.gym_booking.dto.chat.ChatMessageDTO;
import com.gym.gym_booking.dto.chat.ConversationItem;
import com.gym.gym_booking.dto.chat.SendMessagePayload;
import com.gym.gym_booking.entity.ChatMessage;
import com.gym.gym_booking.entity.ClassBooking;
import com.gym.gym_booking.entity.PTBooking;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.ClassBookingStatus;
import com.gym.gym_booking.enums.PTBookingStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.repository.ChatMessageRepository;
import com.gym.gym_booking.repository.ClassBookingRepository;
import com.gym.gym_booking.repository.PTBookingRepository;
import com.gym.gym_booking.repository.UserRepository;
import com.gym.gym_booking.service.ChatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ClassBookingRepository classBookingRepository;
    private final PTBookingRepository ptBookingRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatServiceImpl(
            ChatMessageRepository chatMessageRepository,
            ClassBookingRepository classBookingRepository,
            PTBookingRepository ptBookingRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.classBookingRepository = classBookingRepository;
        this.ptBookingRepository = ptBookingRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public boolean isChatAllowed(User user1, User user2) {
        if (user1 == null || user2 == null) {
            return false;
        }

        if (user1.getId().equals(user2.getId())) {
            return false;
        }

        // Admin có thể hỗ trợ và chat với mọi người
        if (user1.getRole() == UserRole.ADMIN || user2.getRole() == UserRole.ADMIN) {
            return true;
        }

        Long memberId = null;
        Long trainerId = null;

        if (user1.getRole() == UserRole.MEMBER && user2.getRole() == UserRole.TRAINER) {
            memberId = user1.getId();
            trainerId = user2.getId();
        } else if (user1.getRole() == UserRole.TRAINER && user2.getRole() == UserRole.MEMBER) {
            memberId = user2.getId();
            trainerId = user1.getId();
        } else {
            return false;
        }

        // 1. Kiểm tra ClassBooking hoạt động (CONFIRMED)
        boolean hasActiveClassBooking = classBookingRepository.existsActiveBookingBetween(
                memberId,
                trainerId,
                ClassBookingStatus.CONFIRMED
        );
        if (hasActiveClassBooking) {
            return true;
        }

        // 2. Kiểm tra PTBooking trạng thái CONFIRMED
        boolean hasConfirmedPTBooking = ptBookingRepository.existsByMemberIdAndTrainerIdAndStatus(
                memberId,
                trainerId,
                PTBookingStatus.CONFIRMED
        );
        return hasConfirmedPTBooking;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationItem> getConversations(User currentUser) {
        Map<Long, User> allowedPartners = new HashMap<>();

        if (currentUser.getRole() == UserRole.MEMBER) {
            // Lấy các Trainer từ ClassBooking CONFIRMED
            List<ClassBooking> classBookings = classBookingRepository.findByMemberIdAndStatus(
                    currentUser.getId(),
                    ClassBookingStatus.CONFIRMED
            );
            for (ClassBooking cb : classBookings) {
                if (cb.getGymClass() != null && cb.getGymClass().getTrainer() != null) {
                    User trainer = cb.getGymClass().getTrainer();
                    allowedPartners.put(trainer.getId(), trainer);
                }
            }

            // Lấy các Trainer từ PTBooking CONFIRMED
            List<PTBooking> ptBookings = ptBookingRepository.findByMemberIdAndStatus(
                    currentUser.getId(),
                    PTBookingStatus.CONFIRMED
            );
            for (PTBooking pb : ptBookings) {
                if (pb.getTrainer() != null) {
                    allowedPartners.put(pb.getTrainer().getId(), pb.getTrainer());
                }
            }
        } else if (currentUser.getRole() == UserRole.TRAINER) {
            // Lấy các Member từ ClassBooking CONFIRMED
            List<ClassBooking> classBookings = classBookingRepository.findByTrainerIdAndStatus(
                    currentUser.getId(),
                    ClassBookingStatus.CONFIRMED
            );
            for (ClassBooking cb : classBookings) {
                if (cb.getMember() != null) {
                    allowedPartners.put(cb.getMember().getId(), cb.getMember());
                }
            }

            // Lấy các Member từ PTBooking CONFIRMED
            List<PTBooking> ptBookings = ptBookingRepository.findByTrainerIdAndStatus(
                    currentUser.getId(),
                    PTBookingStatus.CONFIRMED
            );
            for (PTBooking pb : ptBookings) {
                if (pb.getMember() != null) {
                    allowedPartners.put(pb.getMember().getId(), pb.getMember());
                }
            }
        } else if (currentUser.getRole() == UserRole.ADMIN) {
            // Admin có thể thấy các liên hệ đang hoạt động
            List<User> activeUsers = userRepository.findAll();
            for (User u : activeUsers) {
                if (!u.getId().equals(currentUser.getId())) {
                    allowedPartners.put(u.getId(), u);
                }
            }
        }

        List<ConversationItem> result = new ArrayList<>();

        for (User partner : allowedPartners.values()) {
            Optional<ChatMessage> latestMsgOpt = chatMessageRepository.findLatestMessageBetweenUsers(
                    currentUser.getId(),
                    partner.getId()
            );

            long unread = chatMessageRepository.countBySenderIdAndReceiverIdAndReadAtIsNull(
                    partner.getId(),
                    currentUser.getId()
            );

            String lastMsgText = null;
            LocalDateTime lastMsgAt = null;

            if (latestMsgOpt.isPresent()) {
                ChatMessage m = latestMsgOpt.get();
                lastMsgText = (m.getContent() != null && !m.getContent().isEmpty())
                        ? m.getContent()
                        : (m.getImageUrl() != null ? "[Hình ảnh]" : "");
                lastMsgAt = m.getSentAt();
            }

            ConversationItem item = ConversationItem.builder()
                    .userId(partner.getId())
                    .fullName(partner.getFullName())
                    .avatarUrl(partner.getAvatarUrl())
                    .role(partner.getRole() != null ? partner.getRole().name() : "MEMBER")
                    .lastMessage(lastMsgText)
                    .unreadCount((int) unread)
                    .lastMessageAt(lastMsgAt)
                    .build();

            result.add(item);
        }

        // Sắp xếp: có tin nhắn mới nhất lên trước
        result.sort((a, b) -> {
            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getMessages(User currentUser, Long partnerId, Pageable pageable) {
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng đối tác"));

        if (!isChatAllowed(currentUser, partner)) {
            throw new AccessDeniedException("Bạn không có quyền xem cuộc trò chuyện này do không có lịch đặt hợp lệ.");
        }

        Page<ChatMessage> page = chatMessageRepository.findMessagesBetweenUsers(
                currentUser.getId(),
                partnerId,
                pageable
        );

        return page.map(m -> ChatMessageDTO.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .sentAt(m.getSentAt())
                .readAt(m.getReadAt())
                .build());
    }

    @Override
    @Transactional
    public ChatMessageDTO sendMessage(User sender, SendMessagePayload payload) {
        User receiver = userRepository.findById(payload.getReceiverId()).orElse(null);

        // KIỂM TRA PHÂN QUYỀN (Access & Authorization Check)
        if (receiver == null || !isChatAllowed(sender, receiver)) {
            ChatErrorDTO errorDTO = ChatErrorDTO.builder()
                    .code("403_FORBIDDEN")
                    .message("Bạn không có quyền gửi tin nhắn cho người dùng này do chưa có lịch đặt hợp lệ.")
                    .timestamp(LocalDateTime.now())
                    .build();

            // Gửi thông báo lỗi trực tiếp vào kênh cá nhân của sender: /user/queue/errors
            messagingTemplate.convertAndSendToUser(
                    sender.getEmail(),
                    "/queue/errors",
                    errorDTO
            );

            throw new AccessDeniedException("Bạn không có quyền gửi tin nhắn cho người dùng này do chưa có lịch đặt hợp lệ.");
        }

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(payload.getContent() != null ? payload.getContent() : "");
        message.setImageUrl(payload.getImageUrl());
        message.setSentAt(LocalDateTime.now());
        message.setReadAt(null);

        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageDTO dto = ChatMessageDTO.builder()
                .id(saved.getId())
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .content(saved.getContent())
                .imageUrl(saved.getImageUrl())
                .sentAt(saved.getSentAt())
                .readAt(saved.getReadAt())
                .build();

        // 1. Đẩy tin nhắn tới người nhận qua /user/queue/messages
        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/messages",
                dto
        );

        // 2. Đẩy tin nhắn xác nhận lại cho chính người gửi qua /user/queue/messages
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/messages",
                dto
        );

        // 3. Đẩy thông báo xác nhận thành công tới kênh /user/queue/ack của người gửi
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/ack",
                dto
        );

        return dto;
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId, User currentUser) {
        chatMessageRepository.findById(messageId).ifPresent(msg -> {
            if (msg.getReceiver().getId().equals(currentUser.getId()) && msg.getReadAt() == null) {
                msg.setReadAt(LocalDateTime.now());
                chatMessageRepository.save(msg);
            }
        });
    }
}
