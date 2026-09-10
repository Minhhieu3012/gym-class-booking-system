import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import template from "./profile.html?raw";
import "./profile.css";


const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%236C757D' stroke-width='1.5'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

export function render(): string {
  return template;
}

export function init(): void {
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
        navGreeting.textContent = `Hey ${profile.fullName.split(" ")[0]}`;
      if (navAvatar)
        navAvatar.textContent = profile.fullName.charAt(0).toUpperCase();
      if (profileIdBadge)
        profileIdBadge.textContent = `● ID #PL-${String(profile.id).padStart(4, "0")} · ACTIVE`;

      // Avatar card
      if (avatarImg) {
        avatarImg.src = profile.avatarUrl ?? PLACEHOLDER_AVATAR;
        avatarImg.alt = profile.fullName;
      }
      if (nameDisplay) nameDisplay.textContent = profile.fullName;
      if (memberSince) memberSince.textContent = `MEMBER SINCE JAN 2024`;

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

    const originalLabel = avatarLabelBtn.textContent ?? "Change Avatar";
    avatarLabelBtn.textContent = "Đang tải ảnh...";
    avatarLabelBtn.setAttribute("disabled", "true");

    try {
      const { imageUrl } = await userService.uploadAvatar(file);
      if (avatarImg) avatarImg.src = imageUrl;
      await userService.updateProfile({ avatarUrl: imageUrl });
      alert("Ảnh đại diện đã được cập nhật.");
    } catch (error: unknown) {
      if (profileError)
        profileError.textContent = authService.extractErrorMessage(error);
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
        navGreeting.textContent = `Hey ${updated.fullName.split(" ")[0]}`;
      originalData = { fullName, phone, address };
      alert("Thông tin đã được cập nhật thành công!");
    } catch (error: unknown) {
      profileError.textContent = authService.extractErrorMessage(error);
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = "SAVE CHANGES ⚡";
    }
  });
}
