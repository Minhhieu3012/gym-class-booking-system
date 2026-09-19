package com.gym.gym_booking.config;

import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = new User();
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("Password123@"));
                admin.setFullName("System Administrator");
                admin.setPhone("0900000001");
                admin.setAddress("Gym Hub Headquarters");
                admin.setRole(UserRole.ADMIN);
                admin.setStatus(UserStatus.ACTIVE);

                userRepository.save(admin);
                System.out.println(">>> [AdminDataInitializer] Seeded default admin: admin@gmail.com / Password123@");
            }
        } catch (Exception e) {
            System.err.println(">>> [AdminDataInitializer] Warning: Failed to seed admin: " + e.getMessage());
        }
    }
}
