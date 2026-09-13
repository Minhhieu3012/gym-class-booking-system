import { isAuthenticated, hasRole } from "../../core/api";
import template from "./landing.html?raw";
import "./landing.css";

export function render(): string {
  return template;
}

export function init(): void {
  const ctaContainer = document.querySelector<HTMLDivElement>("#cta-container");
  if (!ctaContainer) return;

  const loginLink = document.querySelector<HTMLAnchorElement>("#landing-login-link");

  if (!isAuthenticated()) {
    // Guest: show Sign Up + Login buttons
    if (loginLink) {
      loginLink.href = "/login";
      loginLink.textContent = "Log In";
    }
    ctaContainer.innerHTML = `
      <a href="/register" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        SIGN UP / JOIN NOW →
      </a>
      <a href="/login" data-link class="btn-brand-outline w-100 justify-content-center py-2" style="font-size: 0.85rem">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 8 8 12 12 16"/>
          <line x1="16" y1="12" x2="8" y2="12"/>
        </svg>
        EXPLORE FACILITY
      </a>
    `;
    return;
  }

  // Authenticated: role-based CTA and navbar destination
  if (hasRole("ADMIN")) {
    if (loginLink) {
      loginLink.href = "/admin/dashboard.html";
      loginLink.textContent = "Dashboard Admin";
    }
    ctaContainer.innerHTML = `
      <a href="/admin/dashboard.html" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        VÀO DASHBOARD ADMIN
      </a>
    `;
  } else if (hasRole("TRAINER")) {
    if (loginLink) {
      loginLink.href = "/trainer/time-slots.html";
      loginLink.textContent = "Trainer Portal";
    }
    ctaContainer.innerHTML = `
      <a href="/trainer/time-slots.html" data-link class="btn-brand w-100 justify-content-center py-3" style="font-size: 1rem; letter-spacing: 0.05em">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        VÀO PORTAL HUẤN LUYỆN VIÊN
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
