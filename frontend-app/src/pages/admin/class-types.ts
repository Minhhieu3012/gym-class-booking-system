import template from "./class-types.html?raw";
import { classTypeService } from "../../services/admin-core.service";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import "./class-types.css";
import type { ClassTypeResponse } from "../../models/admin";

declare const bootstrap: {
  Modal: new (el: Element) => {
    show(): void;
    hide(): void;
  };
};

let allClassTypes: ClassTypeResponse[] = [];

// Lazy Bootstrap Modal factory — always grabs the live DOM element
function getModal(): InstanceType<typeof bootstrap.Modal> | null {
  const el = document.querySelector<HTMLElement>("#modal-class-type");
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
  // Grab DOM refs ───────────────────────────────────────────────────────────────
  const tbody = document.querySelector<HTMLTableSectionElement>("#ct-tbody");
  const loadingEl = document.querySelector<HTMLDivElement>("#ct-loading");
  const tableWrapper =
    document.querySelector<HTMLDivElement>("#ct-table-wrapper");
  const emptyEl = document.querySelector<HTMLDivElement>("#ct-empty");
  const alertEl = document.querySelector<HTMLDivElement>("#ct-alert");

  const statTotal = document.querySelector<HTMLParagraphElement>("#stat-total");
  const statActive =
    document.querySelector<HTMLParagraphElement>("#stat-active");
  const statInactive =
    document.querySelector<HTMLParagraphElement>("#stat-inactive");

  const filterSelect =
    document.querySelector<HTMLSelectElement>("#ct-filter-status");
  const btnOpenAdd = document.querySelector<HTMLButtonElement>(
    "#btn-open-add-class-type",
  );

  // Modal form refs
  const ctForm = document.querySelector<HTMLFormElement>("#ct-form");
  const modalLabel =
    document.querySelector<HTMLHeadingElement>("#modal-ct-label");
  const modalSubtitle =
    document.querySelector<HTMLParagraphElement>("#modal-ct-subtitle");
  const hiddenId = document.querySelector<HTMLInputElement>("#ct-id-hidden");
  const nameInput = document.querySelector<HTMLInputElement>("#ct-name");
  const nameCounter =
    document.querySelector<HTMLSpanElement>("#ct-name-counter");
  const descTextarea =
    document.querySelector<HTMLTextAreaElement>("#ct-description");
  const descCounter =
    document.querySelector<HTMLSpanElement>("#ct-desc-counter");
  const isActiveCheck =
    document.querySelector<HTMLInputElement>("#ct-is-active");
  const statusLabel =
    document.querySelector<HTMLParagraphElement>("#ct-status-label");
  const statusHint =
    document.querySelector<HTMLParagraphElement>("#ct-status-hint");
  const submitBtn = document.querySelector<HTMLButtonElement>("#btn-ct-submit");
  const formError = document.querySelector<HTMLDivElement>("#ct-form-error");
  const nameError = document.querySelector<HTMLDivElement>("#ct-name-error");
  const descError = document.querySelector<HTMLDivElement>(
    "#ct-description-error",
  );

  
  function escapeHtml(str: string): string {
    return str
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
    const isSuccess = type === "success";
    alertEl.style.display = "block";
    alertEl.innerHTML = `
      <div class="alert alert-${isSuccess ? "success" : "danger"} alert-dismissible fade show rounded-3 shadow-sm d-flex align-items-center gap-2 mb-0" role="alert">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          ${isSuccess ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span class="fw-medium">${msg}</span>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    setTimeout(() => {
      if (alertEl) alertEl.style.display = "none";
    }, 4000);
  }

  function setStats(items: ClassTypeResponse[]): void {
    const active = items.filter((ct) => ct.isActive).length;
    const inactive = items.filter((ct) => !ct.isActive).length;
    if (statTotal) statTotal.textContent = String(items.length);
    if (statActive) statActive.textContent = String(active);
    if (statInactive) statInactive.textContent = String(inactive);
  }

  function buildStatusBadge(isActive: boolean): string {
    return `<span class="badge ${isActive ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} rounded-pill small fw-semibold px-2 py-1">${isActive ? "ACTIVE" : "INACTIVE"}</span>`;
  }

  function buildRow(ct: ClassTypeResponse): string {
    const idStr = `CT-${String(ct.id).padStart(3, "0")}`;
    // Truncate description for table display
    const shortDesc =
      ct.description.length > 80
        ? escapeHtml(ct.description.slice(0, 80)) + "…"
        : escapeHtml(ct.description);

    return `
      <tr data-ct-id="${ct.id}">
        <td class="ps-4 py-3">
          <span class="badge bg-light text-dark border font-monospace px-2 py-1 rounded-3">${idStr}</span>
        </td>
        <td class="py-3">
          <span class="fw-bold text-dark">${escapeHtml(ct.name)}</span>
        </td>
        <td class="py-3 text-muted small" style="max-width: 320px;">
          ${shortDesc}
        </td>
        <td class="py-3 text-center">
          <div class="d-flex flex-column align-items-center gap-1">
            <label class="ct-toggle" title="Chuyển trạng thái" aria-label="Chuyển trạng thái thể loại lớp">
              <input
                type="checkbox"
                class="ct-status-toggle"
                data-id="${ct.id}"
                data-current="${ct.isActive}"
                ${ct.isActive ? "checked" : ""}
              />
              <span class="ct-toggle-slider"></span>
            </label>
            ${buildStatusBadge(ct.isActive)}
          </div>
        </td>
        <td class="pe-4 py-3 text-end">
          <button
            class="btn btn-sm btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1 btn-edit-ct"
            data-id="${ct.id}"
            type="button"
            aria-label="Sửa thể loại ${escapeHtml(ct.name)}"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Sửa</span>
          </button>
        </td>
      </tr>`;
  }

  function renderTable(items: ClassTypeResponse[]): void {
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

  async function loadClassTypes(): Promise<void> {
    if (loadingEl) loadingEl.style.display = "block";
    if (tableWrapper) tableWrapper.style.display = "none";

    try {
      const page = await classTypeService.getAll();
      allClassTypes = page.content;
      setStats(allClassTypes);
      renderTable(allClassTypes);
    } catch (error: unknown) {
      showAlert(authService.extractErrorMessage(error), "danger");
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  function attachToggleListeners(): void {
    document
      .querySelectorAll<HTMLInputElement>(".ct-status-toggle")
      .forEach((toggle) => {
        toggle.addEventListener("change", async () => {
          const id = Number(toggle.dataset.id);
          const wasActive = toggle.dataset.current === "true";
          const newActive = !wasActive;

          toggle.disabled = true;

          try {
            await classTypeService.update(id, { isActive: newActive });

            // Update in-memory state
            const ct = allClassTypes.find((c) => c.id === id);
            if (ct) ct.isActive = newActive;

            // Update data attribute
            toggle.dataset.current = String(newActive);

            // Update badge
            const row = toggle.closest("tr");
            const badgeContainer = row?.querySelector("td:nth-child(4) .d-flex");
            if (badgeContainer) {
              const oldBadge = badgeContainer.querySelector(".badge");
              if (oldBadge) {
                oldBadge.className = `badge ${newActive ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} rounded-pill small fw-semibold px-2 py-1`;
                oldBadge.textContent = newActive ? "ACTIVE" : "INACTIVE";
              }
            }

            setStats(allClassTypes);
            showAlert(
              `Trạng thái thể loại đã chuyển sang ${newActive ? "Hoạt động" : "Tạm dừng"}.`,
              "success",
            );
          } catch (error: unknown) {
            // Revert
            toggle.checked = !toggle.checked;
            showAlert(authService.extractErrorMessage(error), "danger");
          } finally {
            toggle.disabled = false;
          }
        });
      });
  }

    function attachEditListeners(): void {
    document
      .querySelectorAll<HTMLButtonElement>(".btn-edit-ct")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const ct = allClassTypes.find((c) => c.id === id);
          if (!ct) return;
          openEditModal(ct);
        });
      });
  }

    function clearFormErrors(): void {
    if (nameError) nameError.style.display = "none";
    if (descError) descError.style.display = "none";
    if (formError) {
      formError.style.display = "none";
      formError.textContent = "";
    }
  }

  function syncStatusLabel(active: boolean): void {
    if (statusLabel) {
      statusLabel.textContent = active
        ? "Active (Visible)"
        : "Inactive (Hidden)";
    }
    if (statusHint) {
      statusHint.textContent = active
        ? "This class type will be visible to members for booking."
        : "This class type will be hidden from the member catalog.";
    }
  }

  function openAddModal(): void {
    if (!hiddenId || !nameInput || !descTextarea || !isActiveCheck) return;
    if (modalLabel) modalLabel.textContent = "Add New Class Type";
    if (modalSubtitle)
      modalSubtitle.textContent =
        "Configure modality parameters, target exertion levels, and equipment requirements.";
    if (submitBtn)
      submitBtn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Save Class Type`;

    hiddenId.value = "";
    nameInput.value = "";
    descTextarea.value = "";
    isActiveCheck.checked = true;
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = "0 / 50 chars";
    if (descCounter) descCounter.textContent = "0 / 500 chars";
    syncStatusLabel(true);

    getModal()?.show();
  }

  function openEditModal(ct: ClassTypeResponse): void {
    if (!hiddenId || !nameInput || !descTextarea || !isActiveCheck) return;
    if (modalLabel) modalLabel.textContent = "Edit Class Type";
    if (modalSubtitle)
      modalSubtitle.textContent = `Updating details for CT-${String(ct.id).padStart(3, "0")}.`;
    if (submitBtn)
      submitBtn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Update Class Type`;

    hiddenId.value = String(ct.id);
    nameInput.value = ct.name;
    descTextarea.value = ct.description;
    isActiveCheck.checked = ct.isActive;
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = `${ct.name.length} / 50 chars`;
    if (descCounter)
      descCounter.textContent = `${ct.description.length} / 500 chars`;
    syncStatusLabel(ct.isActive);

    getModal()?.show();
  }

    nameInput?.addEventListener("input", () => {
    if (nameCounter)
      nameCounter.textContent = `${nameInput.value.length} / 50 chars`;
  });

  descTextarea?.addEventListener("input", () => {
    if (descCounter)
      descCounter.textContent = `${descTextarea.value.length} / 500 chars`;
  });

    isActiveCheck?.addEventListener("change", () => {
    syncStatusLabel(isActiveCheck.checked);
  });

    btnOpenAdd?.addEventListener("click", openAddModal);

    ctForm?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    clearFormErrors();

    if (!nameInput || !descTextarea || !isActiveCheck || !hiddenId) return;

    const name = nameInput.value.trim();
    const description = descTextarea.value.trim();
    const isActive = isActiveCheck.checked;
    const editingId = hiddenId.value ? Number(hiddenId.value) : null;

    // Client-side validation
    let hasError = false;
    if (!name) {
      if (nameError) nameError.style.display = "block";
      hasError = true;
    }
    if (!description) {
      if (descError) descError.style.display = "block";
      hasError = true;
    }
    if (hasError) return;

    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = editingId ? "Updating..." : "Saving...";
    }

    try {
      if (editingId) {
                const updated = await classTypeService.update(editingId, {
          name,
          description,
          isActive,
        });
        const idx = allClassTypes.findIndex((c) => c.id === editingId);
        if (idx !== -1) {
          allClassTypes[idx] = { ...allClassTypes[idx], ...updated };
        }
        showAlert(
          `Class type "${updated.name}" updated successfully.`,
          "success",
        );
      } else {
                const created = await classTypeService.create({
          name,
          description,
          isActive,
        });
        allClassTypes.push(created);
        showAlert(
          `Class type "${created.name}" created successfully.`,
          "success",
        );
      }

      // Re-render table & stats
      setStats(allClassTypes);
      const filterVal = filterSelect?.value;
      const filtered =
        filterVal === "true"
          ? allClassTypes.filter((c) => c.isActive)
          : filterVal === "false"
            ? allClassTypes.filter((c) => !c.isActive)
            : allClassTypes;
      renderTable(filtered);

      // Close modal
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
          </svg> ${hiddenId.value ? "Update Class Type" : "Save Class Type"}`;
      }
    }
  });

    filterSelect?.addEventListener("change", () => {
    const val = filterSelect.value;
    const filtered =
      val === "true"
        ? allClassTypes.filter((c) => c.isActive)
        : val === "false"
          ? allClassTypes.filter((c) => !c.isActive)
          : allClassTypes;
    renderTable(filtered);
  });

    setupAdminProfile();
    setupLogoutAction();
    highlightActiveNav();

    await loadClassTypes();
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
    if (href === currentPath || (currentPath === "/admin/class-types" && href === "/admin/class-types") || (currentPath === "/admin/classes" && href === "/admin/class-types")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}

