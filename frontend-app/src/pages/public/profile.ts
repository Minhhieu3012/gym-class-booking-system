import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import template from "./profile.html?raw";
import "./profile.css";
import { renderNavbar, initNavbar } from "../../components/navbar";
import { showToast } from "../../utils/toast";

const PLACEHOLDER_AVATAR = "/src/assets/img/avatar-user-default.jpg";

export function render(): string {
  return `
    ${renderNavbar({ active: "profile" })}
    ${template}
  `;
}
export function init(): void {
  initNavbar();
  const user = getStoredUser();

  // Hiển thị trainer bottom nav chỉ khi user là TRAINER
  const trainerBottomNav = document.querySelector<HTMLElement>(
    "#profile-trainer-bottom-nav",
  );
  if (trainerBottomNav && user?.role === "TRAINER") {
    trainerBottomNav.classList.remove("d-none");
  }

  const chatLink = document.querySelector<HTMLAnchorElement>("#nav-chat-link");
  if (chatLink) {
    chatLink.href =
      user?.role === "TRAINER" ? "/trainer/chat.html" : "/member/chat.html";
  }

  const backLink =
    document.querySelector<HTMLAnchorElement>("#profile-back-link");
  if (backLink) {
    if (user?.role === "TRAINER") {
      backLink.href = "/trainer/time-slots.html";
      backLink.setAttribute("title", "Quay lại Lịch dạy Huấn Luyện Viên");
    } else if (user?.role === "ADMIN") {
      backLink.href = "/admin/dashboard.html";
      backLink.setAttribute("title", "Quay lại Dashboard Admin");
    } else {
      backLink.href = "/member/class-list.html";
      backLink.setAttribute("title", "Quay lại Lịch lớp học");
    }
  }

  // Tùy chỉnh điều hướng Top Navbar & Bottom Nav theo vai trò (Role-Aware Navigation)
//   const trainerNav = document.querySelector<HTMLElement>(
//     "#profile-trainer-nav",
//   );
//   const memberNav = document.querySelector<HTMLElement>("#profile-member-nav");
//   const bottomNav = document.querySelector<HTMLElement>("#trainer-bottom-nav");
//   const memberBottomNav =
//     document.querySelector<HTMLElement>("#member-bottom-nav");
//   const headerDesc = document.querySelector<HTMLElement>(
//     ".trainer-header-desc",
//   );
//   const headerTag = document.querySelector<HTMLElement>(
//     ".trainer-header-tag span:last-child",
//   );
//
//   if (user?.role === "MEMBER") {
//     const portalTag = document.querySelector<HTMLElement>(
//       "#profile-portal-tag",
//     );
//     if (portalTag) portalTag.textContent = "MEMBER PORTAL";
//     const roleBadge = document.querySelector<HTMLElement>(
//       "#profile-role-badge",
//     );
//     if (roleBadge) roleBadge.textContent = "HỘI VIÊN";
//     const athleteBadge = document.querySelector<HTMLElement>(
//       "#profile-athlete-badge",
//     );
//     if (athleteBadge) athleteBadge.textContent = "MEMBER VIP";
//     const homeLink = document.querySelector<HTMLAnchorElement>(
//       "#profile-nav-home-link",
//     );
//     if (homeLink) homeLink.href = "/member/class-list.html";
//
//     // Ẩn hoàn toàn các cụm link điều hướng ở Top Navbar để tránh xung đột 2 navbar với Bottom Nav
//     if (trainerNav) {
//       trainerNav.classList.add("d-none");
//       trainerNav.classList.remove("d-lg-flex");
//     }
//     if (memberNav) {
//       memberNav.classList.remove("d-none");
//       memberNav.classList.add("d-md-flex");
//     }
//
//     // Ẩn thanh bottom nav của Trainer, hiện thanh bottom nav của Member
//     if (bottomNav) bottomNav.classList.add("d-none");
//     if (memberBottomNav) memberBottomNav.classList.remove("d-none");
//
//     if (headerTag) headerTag.textContent = "THÔNG TIN HỘI VIÊN & HỒ SƠ";
//     if (headerDesc) {
//       headerDesc.textContent =
//         "Quản lý thông tin hội viên cá nhân, theo dõi thành tích tập luyện và thiết lập bảo mật GYM HUB.";
//     }
//   } else if (user?.role === "TRAINER") {
//     if (memberBottomNav) memberBottomNav.classList.add("d-none");
//     if (bottomNav) bottomNav.classList.remove("d-none");
//     const portalTag = document.querySelector<HTMLElement>(
//       "#profile-portal-tag",
//     );
//     if (portalTag) portalTag.textContent = "TRAINER PORTAL";
//     const roleBadge = document.querySelector<HTMLElement>(
//       "#profile-role-badge",
//     );
//     if (roleBadge) roleBadge.textContent = "HUẤN LUYỆN VIÊN";
//     const athleteBadge = document.querySelector<HTMLElement>(
//       "#profile-athlete-badge",
//     );
//     if (athleteBadge) athleteBadge.textContent = "PRO TRAINER";
//     const homeLink = document.querySelector<HTMLAnchorElement>(
//       "#profile-nav-home-link",
//     );
//     if (homeLink) homeLink.href = "/trainer/time-slots.html";
//
//     // Hiện navbar desktop cho Trainer
//     if (trainerNav) {
//       trainerNav.classList.remove("d-none");
//       trainerNav.classList.add("d-lg-flex");
//     }
//     if (memberNav) {
//       memberNav.classList.add("d-none");
//       memberNav.classList.remove("d-md-flex");
//     }
//   } else {
//     if (trainerNav) {
//       trainerNav.classList.add("d-none");
//       trainerNav.classList.remove("d-lg-flex");
//     }
//     if (memberNav) {
//       memberNav.classList.add("d-none");
//       memberNav.classList.remove("d-lg-flex");
//     }
//     if (memberBottomNav) memberBottomNav.classList.add("d-none");
//     if (bottomNav) bottomNav.classList.add("d-none");
//   }
  const avatarImg = document.querySelector<HTMLImageElement>("#profile-avatar");
  const avatarInput = document.querySelector<HTMLInputElement>(
    "#profile-avatar-input",
  );
  const avatarTriggerBtn = document.querySelector<HTMLButtonElement>(
    "#btn-avatar-trigger",
  );
  const avatarLabelBtn = document.querySelector<HTMLButtonElement>(
    "#btn-change-avatar-label",
  );
  const nameDisplay = document.querySelector<HTMLHeadingElement>(
    "#profile-name-display",
  );
  const memberSince = document.querySelector<HTMLSpanElement>(
    "#profile-member-since",
  );
  const navGreeting =
    document.querySelector<HTMLParagraphElement>("#nav-greeting");
  const navAvatar = document.querySelector<HTMLDivElement>("#nav-avatar");
  const profileIdBadge =
    document.querySelector<HTMLSpanElement>("#profile-id-badge");

  const fnInput = document.querySelector<HTMLInputElement>("#profile-fullname");
  const emailInput = document.querySelector<HTMLInputElement>("#profile-email");
  const phoneInput = document.querySelector<HTMLInputElement>("#profile-phone");
  const addressInput =
    document.querySelector<HTMLInputElement>("#profile-address");

  const profileForm = document.querySelector<HTMLFormElement>("#profile-form");
  const profileError = document.querySelector<HTMLDivElement>("#profile-error");
  const updateBtn = document.querySelector<HTMLButtonElement>(
    "#btn-update-profile",
  );
  const discardBtn = document.querySelector<HTMLButtonElement>(
    "#btn-discard-profile",
  );

  let originalData: {
    fullName: string;
    phone: string;
    address: string;
  } = { fullName: "", phone: "", address: "" };

  (async () => {
    try {
      const profile = await userService.getMyProfile();

      // Nav bar
      if (navGreeting)
        navGreeting.textContent = `Chào, ${profile.fullName.split(" ")[0]}`;
      if (navAvatar) {
        const avatarSrc = profile.avatarUrl || PLACEHOLDER_AVATAR;
        navAvatar.innerHTML = `<img src="${avatarSrc}" alt="${profile.fullName}" class="w-100 h-100 object-fit-cover rounded-circle" />`;
      }
      if (profileIdBadge)
        profileIdBadge.textContent = `● ID #PL-${String(profile.id).padStart(4, "0")} · HOẠT ĐỘNG`;

      // Avatar card
      if (avatarImg) {
        avatarImg.src = profile.avatarUrl ?? PLACEHOLDER_AVATAR;
        avatarImg.alt = profile.fullName;
      }
      if (nameDisplay) nameDisplay.textContent = profile.fullName;
      if (memberSince) memberSince.textContent = `THÀNH VIÊN TỪ THÁNG 01/2024`;

      // Form fields
      if (fnInput) fnInput.value = profile.fullName;
      if (emailInput) emailInput.value = profile.email;
      if (phoneInput) phoneInput.value = profile.phone;
      if (addressInput) addressInput.value = profile.address ?? "";

      // Store original values for discard
      originalData = {
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address ?? "",
      };
    } catch (error: unknown) {
      console.error("Lỗi khi tải thông tin hồ sơ:", error);
      if (profileError)
        profileError.textContent = authService.extractErrorMessage(error);
    }
  })();

  const triggerAvatar = () => avatarInput?.click();
  avatarTriggerBtn?.addEventListener("click", triggerAvatar);
  avatarLabelBtn?.addEventListener("click", triggerAvatar);

  avatarInput?.addEventListener("change", async () => {
    const file = avatarInput.files?.[0];
    if (!file || !avatarLabelBtn) return;

    const originalLabel = avatarLabelBtn.textContent ?? "Đổi ảnh đại diện";
    avatarLabelBtn.textContent = "Đang tải ảnh...";
    avatarLabelBtn.setAttribute("disabled", "true");

    try {
      const { imageUrl } = await userService.uploadAvatar(file);
      if (avatarImg) avatarImg.src = imageUrl || PLACEHOLDER_AVATAR;
      if (navAvatar) {
        navAvatar.innerHTML = `<img src="${imageUrl || PLACEHOLDER_AVATAR}" alt="${originalData?.fullName || "Avatar"}" class="w-100 h-100 object-fit-cover rounded-circle" />`;
      }
      const updatedProfile = await userService.updateProfile({
        fullName: originalData?.fullName || fnInput?.value || "",
        phone: originalData?.phone || phoneInput?.value || "",
        address: originalData?.address || addressInput?.value || "",
        avatarUrl: imageUrl,
      });

      // Cập nhật lại localStorage để các trang khác và navbar luôn giữ avatar mới
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify({ ...stored, avatarUrl: updatedProfile.avatarUrl || imageUrl }),
        );
      }
      showToast("Cập nhật ảnh đại diện thành công!", "success");
    } catch (error: unknown) {
      console.error("Lỗi khi cập nhật avatar:", error);
      const msg = authService.extractErrorMessage(error);
      showToast(msg, "error");
      if (profileError) profileError.textContent = msg;
    } finally {
      avatarLabelBtn.textContent = originalLabel;
      avatarLabelBtn.removeAttribute("disabled");
      // Clear input so same file can be re-selected
      avatarInput.value = "";
    }
  });

  discardBtn?.addEventListener("click", () => {
    if (fnInput) fnInput.value = originalData.fullName;
    if (phoneInput) phoneInput.value = originalData.phone;
    if (addressInput) addressInput.value = originalData.address;
    if (profileError) profileError.textContent = "";
  });

  profileForm?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    if (!updateBtn || !profileError) return;

    const fullName = fnInput?.value.trim() ?? "";
    const phone = phoneInput?.value.trim() ?? "";
    const address = addressInput?.value.trim() ?? "";

    profileError.textContent = "";

    if (!fullName || !phone) {
      profileError.textContent =
        "Vui lòng điền đầy đủ Họ tên và Số điện thoại.";
      return;
    }

    updateBtn.disabled = true;
    updateBtn.textContent = "Đang lưu...";

    try {
      const updated = await userService.updateProfile({
        fullName,
        phone,
        address,
      });
      // Refresh display
      if (nameDisplay) nameDisplay.textContent = updated.fullName;
      if (navGreeting)
        navGreeting.textContent = `Chào, ${updated.fullName.split(" ")[0]}`;
      originalData = { fullName, phone, address };
      showToast("Thông tin đã được cập nhật thành công!", "success");
    } catch (error: unknown) {
      console.error("Lỗi khi cập nhật thông tin hồ sơ:", error);
      const msg = authService.extractErrorMessage(error);
      showToast(msg, "error");
      profileError.textContent = msg;
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = "LƯU THAY ĐỔI ⚡";
    }
  });
}
