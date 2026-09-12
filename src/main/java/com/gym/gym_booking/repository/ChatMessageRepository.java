package com.gym.gym_booking.repository;

import com.gym.gym_booking.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :u1 AND m.receiver.id = :u2) OR " +
           "(m.sender.id = :u2 AND m.receiver.id = :u1) " +
           "ORDER BY m.sentAt DESC")
    Page<ChatMessage> findMessagesBetweenUsers(
            @Param("u1") Long u1,
            @Param("u2") Long u2,
            Pageable pageable
    );

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :u1 AND m.receiver.id = :u2) OR " +
           "(m.sender.id = :u2 AND m.receiver.id = :u1) " +
           "ORDER BY m.sentAt DESC LIMIT 1")
    Optional<ChatMessage> findLatestMessageBetweenUsers(
            @Param("u1") Long u1,
            @Param("u2") Long u2
    );

    long countBySenderIdAndReceiverIdAndReadAtIsNull(Long senderId, Long receiverId);
}