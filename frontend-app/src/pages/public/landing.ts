import { isAuthenticated, hasRole } from "../../core/api";
import { trainerService } from "../../services/trainer.service";
import { reviewService } from "../../services/review.service";
import type { Trainer } from "../../models/trainer";
import type { Review } from "../../models/review";
import template from "./landing.html?raw";
import "./landing.css";

export function render(): string {
  return template;
}

export function init(): void {
  setupNavbarNavigation();
  setupCtaContainer();
  loadLandingTrainers();
  loadLandingreview();
}

/**
 * Xử lý cuộn trang mượt mà cho thanh Navbar và tự động thu gọn menu trên mobile
 */
function setupNavbarNavigation(): void {
  const navCollapse = document.querySelector<HTMLDivElement>("#landingNavbar");
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(
    ".landing-nav-link, #logo-link",
  );

  navLinks.forEach((link) => {
    link.addEventListener("click", (e: MouseEvent) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Cuộn mượt với tính năng offset của CSS scroll-padding-top
          targetElement.scrollIntoView({ behavior: "smooth" });
          history.pushState(null, "", href);
        }

        // Tự động đóng navbar collapse trên di động
        if (navCollapse && navCollapse.classList.contains("show")) {
          if (
            typeof (window as any).bootstrap !== "undefined" &&
            (window as any).bootstrap.Collapse
          ) {
            const bsCollapse = (window as any).bootstrap.Collapse.getInstance(
              navCollapse,
            );
            if (bsCollapse) {
              bsCollapse.hide();
            } else {
              navCollapse.classList.remove("show");
            }
          } else {
            navCollapse.classList.remove("show");
          }
        }
      }
    });
  });
}

/**
 * Tải danh sách Huấn luyện viên từ Database và hiển thị lên giao diện
 */
async function loadLandingTrainers(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>(
    "#landing-trainers-container",
  );
  if (!container) return;

  try {
    const res: any = await trainerService.getTrainers({
      status: "ACTIVE",
      size: 6,
    });

    let trainers: Trainer[] = [];
    if (res && Array.isArray(res.content)) {
      trainers = res.content;
    } else if (Array.isArray(res)) {
      trainers = res;
    }

    if (trainers.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-4 text-neutral">
          <p class="mb-0">Đội ngũ Huấn luyện viên đang cập nhật thông tin mới. Vui lòng quay lại sau!</p>
        </div>
      `;
      return;
    }

    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    ];

    container.innerHTML = trainers
      .map((trainer, index) => {
        const avatar =
          trainer.avatarUrl && trainer.avatarUrl.trim() !== ""
            ? trainer.avatarUrl
            : defaultAvatars[index % defaultAvatars.length];

        const specialization =
          trainer.specialization && trainer.specialization.trim() !== ""
            ? escapeHtml(trainer.specialization)
            : "Chuyên gia Thể hình & Thể lực";

        const bio =
          trainer.bio && trainer.bio.trim() !== ""
            ? escapeHtml(trainer.bio)
            : "HLV chuyên nghiệp với lộ trình đào tạo bài bản, đồng hành cùng bạn đạt được thể hình mơ ước.";

        const exp = trainer.experienceYears
          ? `${trainer.experienceYears}+ năm kinh nghiệm`
          : "HLV Chuyên nghiệp";

        const fee =
          trainer.hourlyFee !== undefined && trainer.hourlyFee !== null
            ? new Intl.NumberFormat("vi-VN").format(Number(trainer.hourlyFee)) +
              " đ/h"
            : "Theo gói tập";

        return `
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card-theme p-4 h-100 d-flex flex-column justify-content-between shadow-theme-sm">
              <div>
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div
                    class="landing-trainer-avatar rounded-circle overflow-hidden flex-shrink-0"
                    style="width: 64px; height: 64px"
                  >
                    <img
                      src="${avatar}"
                      alt="${escapeHtml(trainer.fullName)}"
                      class="w-100 h-100 object-fit-cover"
                      onerror="this.src='/src/assets/img/avatar-user-default.jpg'"
                    />
                  </div>
                  <div>
                    <h3 class="fw-bold text-secondary-theme fs-5 mb-0">
                      ${escapeHtml(trainer.fullName)}
                    </h3>
                    <span class="text-danger fw-semibold fs-8 text-uppercase">
                      ${specialization}
                    </span>
                  </div>
                </div>
                <p class="text-neutral fs-7 mb-4">
                  ${bio}
                </p>
              </div>
              <div class="d-flex justify-content-between align-items-center pt-3 border-top border-theme">
                <div class="d-flex align-items-center gap-1 text-warning fs-7">
                  <i class="bi bi-star-fill"></i>
                  <strong class="text-secondary-theme">5.0</strong>
                  <span class="text-neutral fs-8">(${exp})</span>
                </div>
                <span class="badge bg-success-subtle text-success">${fee}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải danh sách HLV cho landing page:", error);
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-neutral">
        <p class="mb-0">Chưa thể tải dữ liệu huấn luyện viên lúc này. Vui lòng thử lại sau.</p>
      </div>
    `;
  }
}

/**
 * Tải 3 đánh giá 5 sao từ Database và hiển thị trên 1 hàng ngang theo ảnh mẫu
 */
async function loadLandingreview(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>(
    "#landing-review-container",
  );
  if (!container) return;

  try {
    const res: any = await reviewService.getAllReviews({
      rating: 5,
      hidden: false,
      size: 3,
    });

    let reviews: Review[] = [];
    if (res && Array.isArray(res.content)) {
      reviews = res.content;
    } else if (Array.isArray(res)) {
      reviews = res;
    }

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-4 text-neutral">
          <p class="mb-0">Chưa có đánh giá nào từ hội viên.</p>
        </div>
      `;
      return;
    }

    // Lấy đúng tối đa 3 review 5 sao để hiển thị trên 1 hàng ngang
    const topThreeReviews = reviews.slice(0, 3);

    // Mẫu avatar dự phòng theo ảnh tham chiếu
    const fallbackAvatars = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    ];

    container.innerHTML = topThreeReviews
      .map((review, index) => {
        // Trích xuất avatar từ memberAvatar, member.avatarUrl hoặc fallback
        const avatar =
          review.memberAvatar && review.memberAvatar.trim() !== ""
            ? review.memberAvatar
            : (review.member as any)?.avatarUrl ||
              fallbackAvatars[index % fallbackAvatars.length];

        const memberName = review.memberName
          ? escapeHtml(review.memberName)
          : "Hội viên GYM HUB";

        // Nghề nghiệp / Vai trò màu xanh theo ảnh minh họa
        let role = "Hội viên GYM HUB";
        const email = (review.memberEmail || "").toLowerCase();
        if (
          email.includes("maria") ||
          memberName.toLowerCase().includes("maria")
        ) {
          role = "Kỹ sư phần mềm";
        } else if (
          email.includes("lisa") ||
          memberName.toLowerCase().includes("lisa")
        ) {
          role = "Thiết kế đồ họa";
        } else if (
          email.includes("john") ||
          memberName.toLowerCase().includes("john")
        ) {
          role = "Chuyên viên Marketing";
        } else if (review.targetName && review.targetName !== "--") {
          role = escapeHtml(review.targetName);
        } else {
          const roles = [
            "Hội viên VIP",
            "Hội viên Platinum",
            "Hội viên Yoga & Fitness",
          ];
          role = roles[index % roles.length];
        }

        const comment = review.comment
          ? escapeHtml(review.comment)
          : "Dịch vụ phòng tập rất tuyệt vời!";

        return `
          <div class="col-12 col-md-4">
            <div class="landing-testimonial-card shadow-theme-sm">
              <div class="landing-testimonial-avatar">
                <img
                  src="${avatar}"
                  alt="${memberName}"
                  loading="lazy"
                  onerror="this.src='/src/assets/img/avatar-user-default.jpg'"
                />
              </div>
              <h3 class="landing-testimonial-name">${memberName}</h3>
              <p class="landing-testimonial-role">${role}</p>
              <div class="landing-testimonial-quote-wrap">
                <p class="landing-testimonial-quote">
                  <span class="landing-testimonial-quote-mark">“</span>${comment}
                </p>
              </div>
              <div class="landing-testimonial-stars">
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
                <i class="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải đánh giá review:", error);
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-neutral">
        <p class="mb-0">Chưa thể tải đánh giá lúc này. Vui lòng thử lại sau.</p>
      </div>
    `;
  }
}

/**
 * Xử lý trạng thái nút kêu gọi hành động (CTA) và Đăng nhập / Profile
 */
function setupCtaContainer(): void {
  const ctaContainer = document.querySelector<HTMLDivElement>("#cta-container");
  if (!ctaContainer) return;

  const loginLink = document.querySelector<HTMLAnchorElement>(
    "#landing-login-link",
  );

  if (!isAuthenticated()) {
    // Guest: show Sign Up + Login buttons
    if (loginLink) {
      loginLink.href = "/auth/login.html";
      loginLink.textContent = "Đăng nhập";
    }
    ctaContainer.innerHTML = `
      <div class="d-flex flex-column flex-sm-row gap-3 w-100 mt-2">
        <a href="/auth/register.html" data-link class="btn-brand flex-fill justify-content-center py-3 px-4 shadow-lg text-center text-nowrap fw-bold" style="font-size: 1rem; letter-spacing: 0.04em">
          <i class="bi bi-lightning-charge-fill me-1 text-warning"></i> ĐĂNG KÝ NGAY →
        </a>
        <a href="/auth/login.html" data-link class="btn-brand-outline flex-fill justify-content-center py-3 px-4 text-center text-nowrap fw-bold" style="font-size: 1rem">
          <i class="bi bi-box-arrow-in-right me-1"></i> ĐĂNG NHẬP
        </a>
      </div>
    `;
    return;
  }

  // Authenticated: role-based CTA and navbar destination
  if (hasRole("ADMIN")) {
    if (loginLink) {
      loginLink.href = "/admin/dashboard.html";
      loginLink.textContent = "Trang Quản Trị";
    }
    ctaContainer.innerHTML = `
      <a href="/admin/dashboard.html" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        TRANG QUẢN TRỊ VIÊN
      </a>
    `;
  } else if (hasRole("TRAINER")) {
    if (loginLink) {
      loginLink.href = "/trainer/time-slots.html";
      loginLink.textContent = "Cổng Huấn Luyện Viên";
    }
    ctaContainer.innerHTML = `
      <a href="/trainer/time-slots.html" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        CỔNG HUẤN LUYỆN VIÊN
      </a>
    `;
  } else {
    if (loginLink) {
      loginLink.href = "/profile";
      loginLink.textContent = "Hồ sơ của tôi";
    }
    ctaContainer.innerHTML = `
      <a href="/member/class-list.html" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        LỊCH LỚP HỌC CỦA TÔI
      </a>
    `;
  }
}

/**
 * Hàm chống XSS khi render dữ liệu động
 */
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
