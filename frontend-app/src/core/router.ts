// SPA Router — History API, Auth Guard, Theme Switcher
import { isAuthenticated, hasRole } from "./api";
import type { UserRole } from "../models/auth";

import * as LoginPage from "../pages/auth/login";
import * as RegisterPage from "../pages/auth/register";
import * as RegisterTrainerPage from "../pages/auth/register-trainer";
import * as ForgotPasswordPage from "../pages/auth/forgot-password";
import * as ResetPasswordPage from "../pages/auth/reset-password";
import * as LandingPage from "../pages/public/landing";
import * as ProfilePage from "../pages/public/profile";
import * as ChangePasswordPage from "../pages/public/change-password";
import * as RoomsPage from "../pages/admin/rooms";
import * as ClassTypesPage from "../pages/admin/class-types";
import * as PackagesPage from "../pages/admin/packages";
import * as DashboardPage from "../pages/admin/dashboard";
import * as UsersPage from "../pages/admin/users";
import * as TrainersPage from "../pages/admin/trainers";
import * as MemberPackagesPage from "../pages/member/packages";
import * as MemberClassesPage from "../pages/member/class-list";
import * as MemberPTBookingPage from "../pages/member/pt-booking";
import * as MemberMyBookingsPage from "../pages/member/my-bookings";
import * as ChatPage from "../pages/member/chat";
import * as TrainerPTRequestsPage from "../pages/trainer/pt-requests";
import * as TrainerTimeSlotsPage from "../pages/trainer/time-slots";
import * as TrainerAttendancePage from "../pages/trainer/attendance";
import * as TrainerProgressNotesPage from "../pages/trainer/progress-notes";
import { initNotification } from "../components/notification-popover";

// Types
export interface Route {
  path: string;
  view: () => string | Promise<string>;
  init?: () => void | Promise<void>;
  requiresAuth: boolean;
  roles?: UserRole[];
}

// Route definitions
const routes: Route[] = [
  {
    path: "/forgot-password",
    requiresAuth: false,
    view: ForgotPasswordPage.render,
    init: ForgotPasswordPage.init,
  },
  {
    path: "/reset-password",
    requiresAuth: false,
    view: ResetPasswordPage.render,
    init: ResetPasswordPage.init,
  },
  {
    path: "/",
    requiresAuth: false,
    view: LandingPage.render,
    init: LandingPage.init,
  },
  {
    path: "/login",
    requiresAuth: false,
    view: LoginPage.render,
    init: LoginPage.init,
  },
  {
    path: "/auth/login.html",
    requiresAuth: false,
    view: LoginPage.render,
    init: LoginPage.init,
  },
  {
    path: "/auth/login",
    requiresAuth: false,
    view: LoginPage.render,
    init: LoginPage.init,
  },
  {
    path: "/register",
    requiresAuth: false,
    view: RegisterPage.render,
    init: RegisterPage.init,
  },
  {
    path: "/register-trainer",
    requiresAuth: false,
    view: RegisterTrainerPage.render,
    init: RegisterTrainerPage.init,
  },
  {
    path: "/profile",
    requiresAuth: true,
    view: ProfilePage.render,
    init: ProfilePage.init,
  },
  {
    path: "/change-password",
    requiresAuth: true,
    view: ChangePasswordPage.render,
    init: ChangePasswordPage.init,
  },
  {
    path: "/member/packages",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberPackagesPage.render,
    init: MemberPackagesPage.init,
  },
  {
    path: "/member/classes",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberClassesPage.render,
    init: MemberClassesPage.init,
  },
  {
    path: "/member/pt-booking",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberPTBookingPage.render,
    init: MemberPTBookingPage.init,
  },
  {
    path: "/member/my-bookings",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberMyBookingsPage.render,
    init: MemberMyBookingsPage.init,
  },
  {
    path: "/member/my-bookings.html",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberMyBookingsPage.render,
    init: MemberMyBookingsPage.init,
  },
  {
    path: "/my-bookings.html",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: MemberMyBookingsPage.render,
    init: MemberMyBookingsPage.init,
  },
  {
    path: "/member/chat",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: ChatPage.render,
    init: ChatPage.init,
  },
  {
    path: "/member/chat.html",
    requiresAuth: true,
    roles: ["MEMBER", "ADMIN"],
    view: ChatPage.render,
    init: ChatPage.init,
  },
  {
    path: "/trainer/pt-requests",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerPTRequestsPage.render,
    init: TrainerPTRequestsPage.init,
  },
  {
    path: "/trainer/time-slots",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerTimeSlotsPage.render,
    init: TrainerTimeSlotsPage.init,
  },
  {
    path: "/trainer/attendance",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerAttendancePage.render,
    init: TrainerAttendancePage.init,
  },
  {
    path: "/trainer/attendance.html",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerAttendancePage.render,
    init: TrainerAttendancePage.init,
  },
  {
    path: "/attendance.html",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerAttendancePage.render,
    init: TrainerAttendancePage.init,
  },
  {
    path: "/trainer/progress-notes",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerProgressNotesPage.render,
    init: TrainerProgressNotesPage.init,
  },
  {
    path: "/trainer/progress-notes.html",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerProgressNotesPage.render,
    init: TrainerProgressNotesPage.init,
  },
  {
    path: "/progress-notes.html",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: TrainerProgressNotesPage.render,
    init: TrainerProgressNotesPage.init,
  },
  {
    path: "/trainer/chat",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: ChatPage.render,
    init: ChatPage.init,
  },
  {
    path: "/trainer/chat.html",
    requiresAuth: true,
    roles: ["TRAINER", "ADMIN"],
    view: ChatPage.render,
    init: ChatPage.init,
  },
  {
    path: "/admin/dashboard",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: DashboardPage.render,
    init: DashboardPage.init,
  },
  {
    path: "/admin/users",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: UsersPage.render,
    init: UsersPage.init,
  },
  {
    path: "/admin/trainers",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: TrainersPage.render,
    init: TrainersPage.init,
  },
  {
    path: "/admin/rooms",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: RoomsPage.render,
    init: RoomsPage.init,
  },
  {
    path: "/admin/class-types",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: ClassTypesPage.render,
    init: ClassTypesPage.init,
  },
  {
    path: "/admin/packages",
    requiresAuth: true,
    roles: ["ADMIN"],
    view: PackagesPage.render,
    init: PackagesPage.init,
  },
];

// 404 view
function view404(): string {
  return `
    <section class="container py-5 text-center">
      <h1 style="font-size:6rem;font-weight:800;color:var(--color-primary)">404</h1>
      <p class="fs-5 text-neutral mb-4">Không tìm thấy trang bạn yêu cầu.</p>
      <a href="/" data-link class="btn-brand">Về trang chủ</a>
    </section>`;
}

// Theme Switcher — gắn / gỡ class .admin-theme và .gym-chat-app trên <body>
function applyTheme(path: string): void {
  if (path.startsWith("/admin")) {
    document.body.classList.add("admin-theme");
  } else {
    document.body.classList.remove("admin-theme");
  }

  if (path.includes("/chat")) {
    document.body.classList.add("gym-chat-app");
  } else {
    document.body.classList.remove("gym-chat-app");
  }
}

// navigate — thay đổi URL không reload trang
export function navigate(path: string): void {
  window.history.pushState({}, "", path);
  handleRoute();
}

// Core route matching & rendering
async function handleRoute(): Promise<void> {
  const pathname = window.location.pathname;
  const appRoot = document.querySelector<HTMLDivElement>("#app");
  if (!appRoot) return;

  // Áp theme trước khi render
  applyTheme(pathname);

  // Tìm route khớp
  const route = routes.find((r) => r.path === pathname);

  // --- 404 ---
  if (!route) {
    appRoot.innerHTML = view404();
    return;
  }

  // --- Chặn user đã đăng nhập vào /login hoặc /register ---
  const guestOnlyPaths = ["/login", "/register", "/register-trainer"];
  if (guestOnlyPaths.includes(pathname) && isAuthenticated()) {
    navigate("/");
    return;
  }

  // --- Auth Guard ---
  if (route.requiresAuth && !isAuthenticated()) {
    // Lưu lại đích đến để redirect-back sau khi đăng nhập
    navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
    return;
  }

  // --- Role Guard ---
  if (route.roles && route.roles.length > 0) {
    if (!isAuthenticated() || !hasRole(...route.roles)) {
      navigate("/");
      return;
    }
  }

  // --- Render ---
  appRoot.innerHTML = await route.view();

  // --- Dynamic Scripts: Kích hoạt thẻ script nhúng trong HTML (nếu có) ---
  const scripts = appRoot.querySelectorAll<HTMLScriptElement>("script");
  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) =>
      newScript.setAttribute(attr.name, attr.value),
    );
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.textContent = oldScript.textContent;
    }
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });

  // --- Init (gắn event, khởi tạo component sau khi DOM sẵn) ---
  if (route.init) {
    await route.init();
  }

  // Khởi tạo notification bell & popover nếu trang có header chứa notification
  initNotification();
}

export function initRouter(): void {
  window.addEventListener("popstate", handleRoute);
  handleRoute();
}
