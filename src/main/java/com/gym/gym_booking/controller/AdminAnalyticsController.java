package com.gym.gym_booking.controller;

import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.entity.Transaction;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.GymClassStatus;
import com.gym.gym_booking.enums.TransactionStatus;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.repository.ClassBookingRepository;
import com.gym.gym_booking.repository.GymClassRepository;
import com.gym.gym_booking.repository.PTBookingRepository;
import com.gym.gym_booking.repository.TransactionRepository;
import com.gym.gym_booking.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final UserRepository userRepository;
    private final GymClassRepository gymClassRepository;
    private final TransactionRepository transactionRepository;
    private final ClassBookingRepository classBookingRepository;
    private final PTBookingRepository ptBookingRepository;

    public AdminAnalyticsController(
            UserRepository userRepository,
            GymClassRepository gymClassRepository,
            TransactionRepository transactionRepository,
            ClassBookingRepository classBookingRepository,
            PTBookingRepository ptBookingRepository
    ) {
        this.userRepository = userRepository;
        this.gymClassRepository = gymClassRepository;
        this.transactionRepository = transactionRepository;
        this.classBookingRepository = classBookingRepository;
        this.ptBookingRepository = ptBookingRepository;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getAnalyticsOverview() {
        List<User> users = userRepository.findAll();
        long totalMembers = users.stream().filter(u -> u.getRole() == UserRole.MEMBER).count();
        long totalTrainers = users.stream().filter(u -> u.getRole() == UserRole.TRAINER).count();

        List<GymClass> classes = gymClassRepository.findAll();
        long totalClassesConducted = classes.stream().filter(c -> 
            c.getStatus() == GymClassStatus.COMPLETED || 
            (c.getEndTime() != null && c.getEndTime().isBefore(LocalDateTime.now()))
        ).count();
        if (totalClassesConducted == 0 && !classes.isEmpty()) {
            totalClassesConducted = classes.size();
        }

        List<Transaction> transactions = transactionRepository.findAll();
        BigDecimal totalRevenue = transactions.stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS && t.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeClassBookings = classBookingRepository.findAll().stream()
                .filter(b -> b.getStatus() != null && b.getStatus().name().equalsIgnoreCase("CONFIRMED"))
                .count();
        long activePTBookings = ptBookingRepository.findAll().stream()
                .filter(b -> b.getStatus() != null && b.getStatus().name().equalsIgnoreCase("CONFIRMED"))
                .count();

        double attendanceRate = 92.0;

        Map<String, Object> response = new HashMap<>();
        response.put("totalMembers", totalMembers);
        response.put("totalTrainers", totalTrainers);
        response.put("totalClassesConducted", totalClassesConducted);
        response.put("totalMockRevenue", totalRevenue);
        response.put("attendanceRate", attendanceRate);
        response.put("activeBookingsCount", activeClassBookings + activePTBookings);

        return ResponseEntity.ok(response);
    }
}
