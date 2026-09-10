// SPA Router — History API, Auth Guard, Theme Switcher
import { isAuthenticated, hasRole } from "./api";
import type { UserRole } from "../models/auth";

import * as LoginPage from "../pages/auth/login";
import * as RegisterPage from "../pages/auth/register";
import * as RegisterTrainerPage from "../pages/auth/register-trainer";
import * as LandingPage from "../pages/public/landing";
import * as ProfilePage from "../pages/public/profile";
import * as ChangePasswordPage from "../pages/public/change-password";
import * as RoomsPage from "../pages/admin/rooms";
import * as ClassTypesPage from "../pages/admin/class-types";
import * as PackagesPage from "../pages/admin/packages";

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
    path: "/forgot-password",
    requiresAuth: false,
    view: () => `
      <section class="container py-5 text-center">
        <h1>Quên mật khẩu</h1>
        <p class="text-neutral">TODO: import render() từ pages/auth/forgot-password.ts</p>
      </section>`,
  },
  {
    path: "/reset-password",
    requiresAuth: false,
    view: () => `
      <section class="container py-5 text-center">
        <h1>Đặt lại mật khẩu</h1>
        <p class="text-neutral">TODO: import render() từ pages/auth/reset-password.ts</p>
      </section>`,
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
    path: "/admin/dashboard",
    // requiresAuth: false,
    requiresAuth: true,
    roles: ["ADMIN"],
    view: () => `
      <section class="container-fluid py-4">
        <h1>Admin Dashboard</h1>
        <p class="text-neutral">TODO: import render() từ pages/admin/dashboard.ts</p>
      </section>`,
  },
  {
    path: "/admin/rooms",
    // requiresAuth: false,
    requiresAuth: true,
    roles: ["ADMIN"],
    view: RoomsPage.render,
    init: RoomsPage.init,
  },
  {
    path: "/admin/class-types",
    // requiresAuth: false,
    requiresAuth: true,
    roles: ["ADMIN"],
    view: ClassTypesPage.render,
    init: ClassTypesPage.init,
  },
  {
    path: "/admin/packages",
    // requiresAuth: false,
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

// Theme Switcher — gắn / gỡ class .admin-theme trên <body>
function applyTheme(path: string): void {
  if (path.startsWith("/admin")) {
    document.body.classList.add("admin-theme");
  } else {
    document.body.classList.remove("admin-theme");
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

  // --- Init (gắn event, khởi tạo component sau khi DOM sẵn) ---
  if (route.init) {
    await route.init();
  }
}

export function initRouter(): void {
  window.addEventListener("popstate", handleRoute);
  handleRoute();
}
