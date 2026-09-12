import template from "./packages.html?raw";
import { packageService } from "../../services/admin-core.service";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import "./packages.css";
import type { PackageResponse } from "../../models/admin";

declare const bootstrap: {
  Modal: new (el: Element) => { show(): void; hide(): void };
};

let allPackages: PackageResponse[] = [];

// Lazy Bootstrap Modal factory — always grabs the live DOM element
function getModal(): InstanceType<typeof bootstrap.Modal> | null {
  const el = document.querySelector<HTMLElement>("#modal-package");
  if (!el || typeof bootstrap === "undefined") return null;
  return (
    (
      bootstrap.Modal as unknown as {
        getInstance(el: Element): InstanceType<typeof bootstrap.Modal> | null;
      }
    ).getInstance(el) ?? new bootstrap.Modal(el)
  );
}

export function render(): string {
  return template;
}

export async function init(): Promise<void> {
  const tbody = document.querySelector<HTMLTableSectionElement>("#pkg-tbody");
  const loadingEl = document.querySelector<HTMLDivElement>("#pkg-loading");
  const tableWrapper =
    document.querySelector<HTMLDivElement>("#pkg-table-wrapper");
  const emptyEl = document.querySelector<HTMLDivElement>("#pkg-empty");
  const alertEl = document.querySelector<HTMLDivElement>("#pkg-alert");

  const statTotal = document.querySelector<HTMLParagraphElement>("#stat-total");
  const statActive =
    document.querySelector<HTMLParagraphElement>("#stat-active");
  const statInactive =
    document.querySelector<HTMLParagraphElement>("#stat-inactive");

  const searchInput =
    document.querySelector<HTMLInputElement>("#pkg-search-input");
  const filterSelect =
    document.querySelector<HTMLSelectElement>("#pkg-filter-status");
  const btnOpenAdd = document.querySelector<HTMLButtonElement>(
    "#btn-open-add-package",
  );

  // Modal form refs
  const pkgForm = document.querySelector<HTMLFormElement>("#pkg-form");
  const modalLabel =
    document.querySelector<HTMLHeadingElement>("#modal-pkg-label");
  const modalSubtitle = document.querySelector<HTMLParagraphElement>(
    "#modal-pkg-subtitle",
  );
  const hiddenId = document.querySelector<HTMLInputElement>("#pkg-id-hidden");
  const nameInput = document.querySelector<HTMLInputElement>("#pkg-name");
  const nameCounter =
    document.querySelector<HTMLSpanElement>("#pkg-name-counter");
  const descTextarea =
    document.querySelector<HTMLTextAreaElement>("#pkg-description");
  const priceInput = document.querySelector<HTMLInputElement>("#pkg-price");
  const durInput = document.querySelector<HTMLInputElement>("#pkg-duration");
  const sessInput = document.querySelector<HTMLInputElement>("#pkg-sessions");
  const isActiveCheck =
    document.querySelector<HTMLInputElement>("#pkg-is-active");
  const statusLabel =
    document.querySelector<HTMLParagraphElement>("#pkg-status-label");
  const statusHint =
    document.querySelector<HTMLParagraphElement>("#pkg-status-hint");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#btn-pkg-submit");
  const formError = document.querySelector<HTMLDivElement>("#pkg-form-error");
  const nameError = document.querySelector<HTMLDivElement>("#pkg-name-error");
  const descError = document.querySelector<HTMLDivElement>(
    "#pkg-description-error",
  );
  const priceError = document.querySelector<HTMLDivElement>("#pkg-price-error");

  const btnDurMinus =
    document.querySelector<HTMLButtonElement>("#btn-dur-minus");
  const btnDurPlus = document.querySelector<HTMLButtonElement>("#btn-dur-plus");
  const btnSessMinus =
    document.querySelector<HTMLButtonElement>("#btn-sess-minus");
  const btnSessPlus =
    document.querySelector<HTMLButtonElement>("#btn-sess-plus");

  function escapeHtml(str: string): string {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showAlert(
    msg: string,
    type: "success" | "danger" = "success",
  ): void {
    if (!alertEl) return;
    const ok = type === "success";
    alertEl.style.display = "block";
    alertEl.innerHTML = `
      <div class="alert alert-${ok ? "success" : "danger"} alert-dismissible fade show rounded-3 shadow-sm d-flex align-items-center gap-2 mb-0" role="alert">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          ${
            ok
              ? '<polyline points="20 6 9 17 4 12"/>'
              : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
          }
        </svg>
        <span class="fw-medium">${msg}</span>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    setTimeout(() => {
      if (alertEl) alertEl.style.display = "none";
    }, 4000);
  }

  function setStats(items: PackageResponse[]): void {
    const active = items.filter((p) => p.isActive).length;
    const inactive = items.length - active;
    if (statTotal) statTotal.textContent = String(items.length);
    if (statActive) statActive.textContent = String(active);
    if (statInactive) statInactive.textContent = String(inactive);
  }

  function fmtPrice(price: number): string {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function buildStatusBadge(isActive: boolean): string {
    return `<span class="badge ${isActive ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} px-2.5 py-1 rounded-pill small fw-semibold">${isActive ? "ACTIVE" : "INACTIVE"}</span>`;
  }

  function buildRow(pkg: PackageResponse): string {
    const idStr = `PKG-${String(pkg.id).padStart(3, "0")}`;
    const rawDesc = pkg.description ?? "";
    const shortDesc =
      rawDesc.length > 60
        ? escapeHtml(rawDesc.slice(0, 60)) + "…"
        : escapeHtml(rawDesc);

    return `
      <tr data-pkg-id="${pkg.id}">
        <td class="ps-4 py-3">
          <span class="badge bg-light text-dark border font-monospace px-2.5 py-1 rounded-3">${idStr}</span>
        </td>
        <td class="py-3" style="min-width: 150px;">
          <span class="fw-bold text-dark">${escapeHtml(pkg.name)}</span>
        </td>
        <td class="py-3 text-muted small" style="max-width: 260px;">
          ${shortDesc}
        </td>
        <td class="py-3 text-end">
          <span class="fw-bold text-dark font-monospace">${fmtPrice(pkg.price)} $</span>
        </td>
        <td class="py-3 text-center">
          <span class="badge bg-light text-dark border px-2 py-1 rounded-3">${pkg.durationDays} ngày</span>
        </td>
        <td class="py-3 text-center">
          <span class="badge bg-light text-dark border px-2 py-1 rounded-3">${pkg.sessionCount} buổi</span>
        </td>
        <td class="py-3 text-center">
          ${buildStatusBadge(pkg.isActive)}
        </td>
        <td class="pe-4 py-3 text-end">
          <div class="d-inline-flex align-items-center gap-1 justify-content-end">
            <button class="btn btn-outline-secondary btn-sm rounded-3 px-2 py-1 btn-edit-pkg d-inline-flex align-items-center gap-1 shadow-none" data-id="${pkg.id}" title="Chỉnh sửa">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span class="small">Sửa</span>
            </button>
            <button class="btn btn-outline-${pkg.isActive ? "warning" : "success"} btn-sm rounded-3 px-2 py-1 btn-toggle-pkg d-inline-flex align-items-center gap-1 shadow-none" data-id="${pkg.id}" data-current="${pkg.isActive}" title="${pkg.isActive ? "Tạm dừng gói tập" : "Kích hoạt gói tập"}">
              <span class="small">${pkg.isActive ? "Tạm dừng" : "Kích hoạt"}</span>
            </button>
          </div>
        </td>
      </tr>`;
  }

  function getFilteredPackages(): PackageResponse[] {
    const keyword = searchInput?.value.trim().toLowerCase() ?? "";
    const statusVal = filterSelect?.value ?? "";

    return allPackages.filter((pkg) => {
      const matchesKeyword =
        !keyword ||
        (pkg.name && pkg.name.toLowerCase().includes(keyword)) ||
        (pkg.description && pkg.description.toLowerCase().includes(keyword));

      const matchesStatus =
        statusVal === "" ||
        (statusVal === "true" && pkg.isActive) ||
        (statusVal === "false" && !pkg.isActive);

      return matchesKeyword && matchesStatus;
    });
  }

  function renderTable(items: PackageResponse[]): void {
    if (!tbody || !tableWrapper || !emptyEl) return;
    tableWrapper.style.display = "block";
    if (items.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
    } else {
      emptyEl.style.display = "none";
      tbody.innerHTML = items.map(buildRow).join("");
      attachToggleListeners();
      attachEditListeners();
    }
  }

  async function loadPackages(): Promise<void> {
    if (loadingEl) loadingEl.style.display = "block";
    if (tableWrapper) tableWrapper.style.display = "none";

    try {
      const page = await packageService.getAll();
      allPackages = page.content;
      setStats(allPackages);
      renderTable(getFilteredPackages());
    } catch (error: unknown) {
      showAlert(authService.extractErrorMessage(error), "danger");
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  function attachToggleListeners(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".btn-toggle-pkg")
      .forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = Number(btn.dataset.id);
          const wasActive = btn.dataset.current === "true";
          const newActive = !wasActive;

          btn.disabled = true;
          try {
            if (newActive) {
              await packageService.activate(id);
            } else {
              await packageService.deactivate(id);
            }

            // Update in-memory state
            const pkg = allPackages.find((p) => p.id === id);
            if (pkg) pkg.isActive = newActive;

            setStats(allPackages);
            renderTable(getFilteredPackages());
            showAlert(
              `Trạng thái gói "${pkg?.name}" đã chuyển sang ${newActive ? "Hoạt động" : "Tạm dừng"}.`,
              "success",
            );
          } catch (error: unknown) {
            showAlert(authService.extractErrorMessage(error), "danger");
          } finally {
            btn.disabled = false;
          }
        });
      });
  }

  function attachEditListeners(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".btn-edit-pkg")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const pkg = allPackages.find((p) => p.id === id);
          if (!pkg) return;
          openEditModal(pkg);
        });
      });
  }

  function clearFormErrors(): void {
    if (nameError) nameError.style.display = "none";
    if (descError) descError.style.display = "none";
    if (priceError) priceError.style.display = "none";
    if (formError) {
      formError.style.display = "none";
      formError.textContent = "";
    }
  }

  function resetForm(): void {
    if (pkgForm) pkgForm.reset();
    if (hiddenId) hiddenId.value = "";
    if (nameCounter) nameCounter.textContent = "0 / 60 ký tự";
    if (durInput) durInput.value = "30";
    if (sessInput) sessInput.value = "10";
    if (isActiveCheck) isActiveCheck.checked = true;
    updateStatusLabels(true);
    clearFormErrors();
  }

  function updateStatusLabels(active: boolean): void {
    if (statusLabel) {
      statusLabel.textContent = active
        ? "Đang phát hành (Hiển thị trên App)"
        : "Tạm dừng (Lưu trữ / Không hiển thị)";
    }
    if (statusHint) {
      statusHint.textContent = active
        ? "Hội viên có thể tìm thấy và mua gói tập này."
        : "Gói bị ẩn khỏi ứng dụng người dùng, không thể mua mới.";
    }
  }

  function openCreateModal(): void {
    resetForm();
    if (modalLabel) modalLabel.textContent = "Thêm Gói tập mới";
    if (modalSubtitle)
      modalSubtitle.textContent =
        "Thiết lập mức giá, hạn sử dụng và số buổi tập cho gói thẻ.";
    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg> Lưu Gói tập`;
    }
    getModal()?.show();
  }

  function openEditModal(pkg: PackageResponse): void {
    resetForm();
    if (modalLabel) modalLabel.textContent = "Chỉnh sửa Gói tập";
    if (modalSubtitle)
      modalSubtitle.textContent = `Cập nhật thông số kỹ thuật cho mã gói PKG-${String(pkg.id).padStart(3, "0")}.`;
    if (hiddenId) hiddenId.value = String(pkg.id);
    if (nameInput) {
      nameInput.value = pkg.name;
      if (nameCounter)
        nameCounter.textContent = `${pkg.name.length} / 60 ký tự`;
    }
    if (descTextarea) descTextarea.value = pkg.description;
    if (priceInput) priceInput.value = String(pkg.price);
    if (durInput) durInput.value = String(pkg.durationDays);
    if (sessInput) sessInput.value = String(pkg.sessionCount);
    if (isActiveCheck) isActiveCheck.checked = pkg.isActive;
    updateStatusLabels(pkg.isActive);

    if (submitBtn) {
      submitBtn.innerHTML = `
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg> Cập nhật Gói tập`;
    }
    getModal()?.show();
  }

  // Event: Open Add modal
  btnOpenAdd?.addEventListener("click", openCreateModal);

  // Character counter for package name
  nameInput?.addEventListener("input", () => {
    if (nameCounter) {
      nameCounter.textContent = `${nameInput.value.length} / 60 ký tự`;
    }
  });

  // Active status toggle inside modal
  isActiveCheck?.addEventListener("change", () => {
    updateStatusLabels(isActiveCheck.checked);
  });

  // Duration steppers
  btnDurMinus?.addEventListener("click", () => {
    if (!durInput) return;
    const cur = parseInt(durInput.value, 10) || 30;
    if (cur > 1) durInput.value = String(cur - 1);
  });
  btnDurPlus?.addEventListener("click", () => {
    if (!durInput) return;
    const cur = parseInt(durInput.value, 10) || 0;
    if (cur < 3650) durInput.value = String(cur + 1);
  });

  // Session steppers
  btnSessMinus?.addEventListener("click", () => {
    if (!sessInput) return;
    const cur = parseInt(sessInput.value, 10) || 10;
    if (cur > 1) sessInput.value = String(cur - 1);
  });
  btnSessPlus?.addEventListener("click", () => {
    if (!sessInput) return;
    const cur = parseInt(sessInput.value, 10) || 0;
    if (cur < 999) sessInput.value = String(cur + 1);
  });

  // Form Submit
  pkgForm?.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();
    clearFormErrors();

    const name = nameInput?.value.trim() ?? "";
    const description = descTextarea?.value.trim() ?? "";
    const priceRaw = priceInput?.value.trim() ?? "";
    const price = parseFloat(priceRaw);
    const durationDays = parseInt(durInput?.value ?? "0", 10);
    const sessionCount = parseInt(sessInput?.value ?? "0", 10);
    const isActive = isActiveCheck?.checked ?? true;
    const editingId = hiddenId?.value ? Number(hiddenId.value) : null;

    let hasError = false;

    if (!name) {
      if (nameError) nameError.style.display = "block";
      hasError = true;
    }
    if (!description) {
      if (descError) descError.style.display = "block";
      hasError = true;
    }
    if (!priceRaw || isNaN(price) || price <= 0) {
      if (priceError) priceError.style.display = "block";
      hasError = true;
    }

    if (hasError) return;

    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = editingId ? "Đang cập nhật..." : "Đang lưu...";
    }

    try {
      if (editingId) {
        const updated = await packageService.update(editingId, {
          name,
          description,
          price,
          durationDays,
          sessionCount,
          isActive,
        });
        const idx = allPackages.findIndex((p) => p.id === editingId);
        if (idx !== -1) allPackages[idx] = { ...allPackages[idx], ...updated };
        showAlert(`Gói "${updated.name}" đã được cập nhật thành công.`, "success");
      } else {
        const created = await packageService.create({
          name,
          description,
          price,
          durationDays,
          sessionCount,
          isActive,
        });
        allPackages.push(created);
        showAlert(`Gói "${created.name}" đã được tạo thành công.`, "success");
      }

      // Re-render table & stats
      setStats(allPackages);
      renderTable(getFilteredPackages());

      getModal()?.hide();
    } catch (error: unknown) {
      const msg = authService.extractErrorMessage(error);
      if (formError) {
        formError.textContent = msg;
        formError.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg> ${hiddenId?.value ? "Cập nhật Gói tập" : "Lưu Gói tập"}`;
      }
    }
  });

  searchInput?.addEventListener("input", () => {
    renderTable(getFilteredPackages());
  });

  filterSelect?.addEventListener("change", () => {
    renderTable(getFilteredPackages());
  });

  setupAdminProfile();
  setupLogoutAction();
  highlightActiveNav();

  await loadPackages();
}

/**
 * Hiển thị thông tin Admin trên Header và Sidebar
 */
function setupAdminProfile(): void {
  const user = getStoredUser();
  const displayName = user?.fullName || user?.email || user?.phone || "Admin";

  const headerName = document.querySelector<HTMLElement>("#admin-name");
  if (headerName) {
    headerName.textContent = displayName;
  }

  const sidebarName = document.querySelector<HTMLElement>("#sidebar-admin-name");
  if (sidebarName) {
    sidebarName.textContent = displayName;
  }
}

/**
 * Xử lý đăng xuất
 */
function setupLogoutAction(): void {
  const logoutBtn = document.querySelector<HTMLElement>("#btn-logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    try {
      if (authService && typeof authService.logout === "function") {
        await authService.logout();
      }
    } catch (err) {
      console.warn("Lỗi khi gọi API logout:", err);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = "/auth/login.html";
    }
  });
}

/**
 * Làm nổi bật menu active trên Sidebar
 */
function highlightActiveNav(): void {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".admin-nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "/admin/packages" && href === "/admin/packages")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}
