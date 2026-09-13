package com.gym.gym_booking.config;

import com.gym.gym_booking.entity.Notification;
import com.gym.gym_booking.entity.User;
import com.gym.gym_booking.enums.NotificationType;
import com.gym.gym_booking.repository.NotificationRepository;
import com.gym.gym_booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class NotificationDataInitializer implements CommandLineRunner {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationDataInitializer(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            return;
        }

        List<Notification> initialNotifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Seed cho Member (member@gmail.com)
        Optional<User> memberOpt = userRepository.findByEmail("member@gmail.com");
        if (memberOpt.isPresent()) {
            User member = memberOpt.get();

            Notification n1 = new Notification();
            n1.setUser(member);
            n1.setContent("Chào mừng bạn gia nhập Gym Hub! Hãy bắt đầu hành trình rèn luyện thể lực ngay hôm nay.");
            n1.setType(NotificationType.SYSTEM);
            n1.setRead(true);
            n1.setCreatedAt(now.minusDays(3));
            n1.setReadAt(now.minusDays(2));
            initialNotifications.add(n1);

            Notification n2 = new Notification();
            n2.setUser(member);
            n2.setContent("Lớp Yoga Flow của bạn đã được xác nhận thành công cho ngày mai lúc 08:00.");
            n2.setType(NotificationType.BOOKING_CONFIRMED);
            n2.setRead(false);
            n2.setCreatedAt(now.minusMinutes(15));
            initialNotifications.add(n2);

            Notification n3 = new Notification();
            n3.setUser(member);
            n3.setContent("HLV Nguyen Van Phuc vừa thêm ghi chú tiến độ buổi tập mới cho bạn.");
            n3.setType(NotificationType.TRAINER_NOTE);
            n3.setRead(false);
            n3.setCreatedAt(now.minusHours(1));
            initialNotifications.add(n3);

            Notification n4 = new Notification();
            n4.setUser(member);
            n4.setContent("Nhắc nhở: Buổi tập PT 1-1 sẽ bắt đầu sau 2 giờ nữa tại Studio 1.");
            n4.setType(NotificationType.CLASS_REMINDER);
            n4.setRead(false);
            n4.setCreatedAt(now.minusHours(2));
            initialNotifications.add(n4);
        }

        // 2. Seed cho Trainer Phuc (trainer_phuc@gmail.com)
        Optional<User> trainerPhucOpt = userRepository.findByEmail("trainer_phuc@gmail.com");
        if (trainerPhucOpt.isPresent()) {
            User trainerPhuc = trainerPhucOpt.get();

            Notification t1 = new Notification();
            t1.setUser(trainerPhuc);
            t1.setContent("Chào mừng Huấn luyện viên Nguyen Van Phuc! Tài khoản giảng dạy của bạn đã được kích hoạt.");
            t1.setType(NotificationType.ACCOUNT);
            t1.setRead(true);
            t1.setCreatedAt(now.minusDays(5));
            t1.setReadAt(now.minusDays(4));
            initialNotifications.add(t1);

            Notification t2 = new Notification();
            t2.setUser(trainerPhuc);
            t2.setContent("Học viên Member vừa gửi yêu cầu đặt lịch tập PT 1-1 với bạn vào thứ Bảy tuần này.");
            t2.setType(NotificationType.PT_REQUEST);
            t2.setRead(false);
            t2.setCreatedAt(now.minusMinutes(30));
            initialNotifications.add(t2);

            Notification t3 = new Notification();
            t3.setUser(trainerPhuc);
            t3.setContent("Lớp Cardio HIIT lúc 18:00 hôm nay đã đạt 12/15 học viên đăng ký tham gia.");
            t3.setType(NotificationType.BOOKING_CONFIRMED);
            t3.setRead(false);
            t3.setCreatedAt(now.minusHours(2));
            initialNotifications.add(t3);

            Notification t4 = new Notification();
            t4.setUser(trainerPhuc);
            t4.setContent("Nhắc nhở: Lịch dạy lớp Kickboxing của bạn sẽ bắt đầu trong 3 giờ tới tại Studio A.");
            t4.setType(NotificationType.CLASS_REMINDER);
            t4.setRead(false);
            t4.setCreatedAt(now.minusHours(3));
            initialNotifications.add(t4);
        }

        // 3. Seed cho Trainer B (trainer@gmail.com)
        Optional<User> trainerBOpt = userRepository.findByEmail("trainer@gmail.com");
        if (trainerBOpt.isPresent()) {
            User trainerB = trainerBOpt.get();

            Notification tb1 = new Notification();
            tb1.setUser(trainerB);
            tb1.setContent("Chào mừng Huấn luyện viên Nguyen Van B! Chúc bạn có những giờ dạy tràn đầy năng lượng.");
            tb1.setType(NotificationType.ACCOUNT);
            tb1.setRead(true);
            tb1.setCreatedAt(now.minusDays(5));
            tb1.setReadAt(now.minusDays(4));
            initialNotifications.add(tb1);

            Notification tb2 = new Notification();
            tb2.setUser(trainerB);
            tb2.setContent("Bạn có 1 yêu cầu đặt lịch PT 1-1 mới từ thành viên đang chờ xác nhận.");
            tb2.setType(NotificationType.PT_REQUEST);
            tb2.setRead(false);
            tb2.setCreatedAt(now.minusHours(1));
            initialNotifications.add(tb2);
        }

        // 4. Seed cho Admin (admin@gmail.com)
        Optional<User> adminOpt = userRepository.findByEmail("admin@gmail.com");
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();

            Notification a1 = new Notification();
            a1.setUser(admin);
            a1.setContent("Hệ thống ghi nhận: Huấn luyện viên Trần Văn Hùng vừa gửi đơn ứng tuyển và đang chờ xét duyệt hồ sơ.");
            a1.setType(NotificationType.ACCOUNT);
            a1.setRead(false);
            a1.setCreatedAt(now.minusMinutes(45));
            initialNotifications.add(a1);

            Notification a2 = new Notification();
            a2.setUser(admin);
            a2.setContent("Thành viên Member vừa thanh toán thành công gói tập Platinum 30 ngày (2.500.000 VNĐ).");
            a2.setType(NotificationType.PAYMENT);
            a2.setRead(false);
            a2.setCreatedAt(now.minusHours(2));
            initialNotifications.add(a2);

            Notification a3 = new Notification();
            a3.setUser(admin);
            a3.setContent("Báo cáo phân tích doanh thu và số lượng hội viên mới tháng này đã sẵn sàng để xem trong Analytics Dashboard.");
            a3.setType(NotificationType.SYSTEM);
            a3.setRead(true);
            a3.setCreatedAt(now.minusDays(1));
            a3.setReadAt(now.minusHours(6));
            initialNotifications.add(a3);
        }

        if (!initialNotifications.isEmpty()) {
            notificationRepository.saveAll(initialNotifications);
            System.out.println(">>> [NotificationDataInitializer] Seeded " + initialNotifications.size() + " real database notifications for default users.");
        }
    }
}
