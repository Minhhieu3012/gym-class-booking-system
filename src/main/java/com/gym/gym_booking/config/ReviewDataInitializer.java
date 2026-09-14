package com.gym.gym_booking.config;

import com.gym.gym_booking.entity.Review;
import com.gym.gym_booking.entity.TrainerProfile;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.UserRole;
import com.gym.gym_booking.enums.UserStatus;
import com.gym.gym_booking.repository.ReviewRepository;
import com.gym.gym_booking.repository.TrainerProfileRepository;
import com.gym.gym_booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Order(2)
public class ReviewDataInitializer implements CommandLineRunner {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;

    public ReviewDataInitializer(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            TrainerProfileRepository trainerProfileRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.trainerProfileRepository = trainerProfileRepository;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) {
        try {
            seedTrainerAvatars();
            seedTestimonialReviews();
        } catch (Exception e) {
            System.err.println(">>> [ReviewDataInitializer] Warning: Failed to seed landing data: " + e.getMessage());
        }
    }

    private void seedTrainerAvatars() {
        // Cập nhật avatar ảnh chân dung chất lượng cao cho các HLV nếu chưa có
        List<TrainerProfile> trainers = trainerProfileRepository.findAll();
        String[] sampleTrainerAvatars = {
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=500&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"
        };
        int avatarIdx = 0;
        for (TrainerProfile tp : trainers) {
            User u = tp.getUser();
            if (u != null && (u.getAvatarUrl() == null || u.getAvatarUrl().isBlank())) {
                u.setAvatarUrl(sampleTrainerAvatars[avatarIdx % sampleTrainerAvatars.length]);
                userRepository.save(u);
                avatarIdx++;
            }
        }
    }

    private void seedTestimonialReviews() {
        // Đảm bảo review 1 (nếu có) được hiển thị (hidden = false)
        Optional<Review> review1 = reviewRepository.findById(1L);
        review1.ifPresent(r -> {
            if (Boolean.TRUE.equals(r.getHidden())) {
                r.setHidden(false);
                reviewRepository.save(r);
            }
        });

        // Kiểm tra số lượng đánh giá 5 sao đang hiển thị
        long activeFiveStarCount = reviewRepository.findAll().stream()
                .filter(r -> r.getRating() != null && r.getRating() == 5 && Boolean.FALSE.equals(r.getHidden()))
                .count();

        if (activeFiveStarCount >= 3) {
            return;
        }

        // Tạo/tìm các Member đại diện để gắn review 5 sao theo ảnh mẫu
        User member1 = getOrCreateMember(
                "maria.smantha@pulsefitness.com",
                "Maria Smantha",
                "0912345678",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"
        );

        User member2 = getOrCreateMember(
                "lisa.cudrow@pulsefitness.com",
                "Lisa Cudrow",
                "0912345679",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"
        );

        User member3 = getOrCreateMember(
                "john.smith@pulsefitness.com",
                "John Smith",
                "0912345680",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80"
        );

        LocalDateTime now = LocalDateTime.now();

        // 1. Review Maria Smantha
        createReviewIfNotExist(
                member1,
                5,
                "HLV tại GYM HUB hướng dẫn cực kỳ tận tâm, lộ trình tập luyện cá nhân hóa rõ ràng giúp tôi cải thiện vóc dáng và sức bền vượt bậc sau 3 tháng.",
                now.minusDays(5)
        );

        // 2. Review Lisa Cudrow
        createReviewIfNotExist(
                member2,
                5,
                "Không gian tập luyện hiện đại, máy móc tối tân và âm nhạc tràn đầy năng lượng. Tính năng đặt lịch lớp học 1-chạm trên web siêu tiện lợi!",
                now.minusDays(3)
        );

        // 3. Review John Smith
        createReviewIfNotExist(
                member3,
                5,
                "Đội ngũ HLV chuyên nghiệp, theo sát từng kỹ thuật chuyển động chuẩn xác. Tôi đã tăng 3kg cơ bắp và hoàn toàn nghiện không khí tập luyện tại đây.",
                now.minusDays(1)
        );

        System.out.println(">>> [ReviewDataInitializer] Seeded 5-star testimonial reviews successfully.");
    }

    private User getOrCreateMember(String email, String fullName, String phone, String avatarUrl) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            if (u.getAvatarUrl() == null || u.getAvatarUrl().isBlank()) {
                u.setAvatarUrl(avatarUrl);
                return userRepository.save(u);
            }
            return u;
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(fullName);
        newUser.setPhone(phone);
        newUser.setAvatarUrl(avatarUrl);
        newUser.setPassword("$2a$10$dummyencryptedpasswordhashforseededuser");
        newUser.setRole(UserRole.MEMBER);
        newUser.setStatus(UserStatus.ACTIVE);
        return userRepository.save(newUser);
    }

    private void createReviewIfNotExist(User member, int rating, String comment, LocalDateTime createdAt) {
        boolean exists = reviewRepository.findAll().stream()
                .anyMatch(r -> r.getMember() != null && r.getMember().getId().equals(member.getId()));

        if (!exists) {
            Review review = new Review();
            review.setMember(member);
            review.setRating(rating);
            review.setComment(comment);
            review.setHidden(false);
            review.setCreatedAt(createdAt);
            reviewRepository.save(review);
        }
    }
}
