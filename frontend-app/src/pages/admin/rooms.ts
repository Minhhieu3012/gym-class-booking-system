import template from "./rooms.html?raw";
import { roomService } from "../../services/admin-core.service";
import { authService } from "../../services/auth.service";
import { getStoredUser, STORAGE_KEYS } from "../../core/api";
import "./rooms.css";
import type { RoomResponse, RoomStatus } from "../../models/admin";

declare const bootstrap: {
  Modal: new (el: Element) => {
    show(): void;
    hide(): void;
  };
};

let allRooms: RoomResponse[] = [];

// Lazy Bootstrap Modal factory — always grabs the live DOM element
function getModal(): InstanceType<typeof bootstrap.Modal> | null {
  const el = document.querySelector<HTMLElement>("#modal-room");
  if (!el || typeof bootstrap === "undefined") return null;
  // bootstrap.Modal.getInstance returns existing instance or null
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
  // Grab DOM refs
  const tbody = document.querySelector<HTMLTableSectionElement>("#rooms-tbody");
  const loadingEl = document.querySelector<HTMLDivElement>("#rooms-loading");
  const tableWrapper = document.querySelector<HTMLDivElement>(
    "#rooms-table-wrapper",
  );
  const emptyEl = document.querySelector<HTMLDivElement>("#rooms-empty");
  const alertEl = document.querySelector<HTMLDivElement>("#rooms-alert");

  const statTotal = document.querySelector<HTMLParagraphElement>("#stat-total");
  const statActive =
    document.querySelector<HTMLParagraphElement>("#stat-active");
  const statInactive =
    document.querySelector<HTMLParagraphElement>("#stat-inactive");
  const statCapacity =
    document.querySelector<HTMLParagraphElement>("#stat-capacity");

  const filterSelect =
    document.querySelector<HTMLSelectElement>("#filter-status");
  const btnOpenAdd =
    document.querySelector<HTMLButtonElement>("#btn-open-add-room");

  // Modal form refs
  const roomForm = document.querySelector<HTMLFormElement>("#room-form");
  const modalLabel =
    document.querySelector<HTMLHeadingElement>("#modal-room-label");
  const modalSubtitle = document.querySelector<HTMLParagraphElement>(
    "#modal-room-subtitle",
  );
  const hiddenId = document.querySelector<HTMLInputElement>("#room-id-hidden");
  const nameInput = document.querySelector<HTMLInputElement>("#room-name");
  const nameCounter =
    document.querySelector<HTMLSpanElement>("#room-name-counter");
  const locationInput =
    document.querySelector<HTMLInputElement>("#room-location");
  const capacityInput =
    document.querySelector<HTMLInputElement>("#room-capacity");
  const statusSelect =
    document.querySelector<HTMLSelectElement>("#room-status");
  const btnCapMinus =
    document.querySelector<HTMLButtonElement>("#btn-cap-minus");
  const btnCapPlus = document.querySelector<HTMLButtonElement>("#btn-cap-plus");
  const submitBtn =
    document.querySelector<HTMLButtonElement>("#btn-room-submit");
  const formError = document.querySelector<HTMLDivElement>("#room-form-error");
  const nameError = document.querySelector<HTMLDivElement>("#room-name-error");
  const locationError = document.querySelector<HTMLDivElement>(
    "#room-location-error",
  );
  const capacityError = document.querySelector<HTMLDivElement>(
    "#room-capacity-error",
  );

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

  function setStats(rooms: RoomResponse[]): void {
    const active = rooms.filter((r) => r.status === "ACTIVE").length;
    const inactive = rooms.filter((r) => r.status === "INACTIVE").length;
    const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    if (statTotal) statTotal.textContent = String(rooms.length);
    if (statActive) statActive.textContent = String(active);
    if (statInactive) statInactive.textContent = String(inactive);
    if (statCapacity) statCapacity.textContent = String(capacity);
  }

  function buildStatusBadge(status: RoomStatus): string {
    const isActive = status === "ACTIVE";
    return `<span class="badge ${isActive ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} rounded-pill small fw-semibold px-2 py-1">${isActive ? "ACTIVE" : "INACTIVE"}</span>`;
  }

  function buildRow(room: RoomResponse): string {
    const idStr = `RM-${String(room.id).padStart(3, "0")}`;
    const isActive = room.status === "ACTIVE";
    return `
      <tr data-room-id="${room.id}">
        <td class="ps-4 py-3">
          <span class="badge bg-light text-dark border font-monospace px-2 py-1 rounded-3">${idStr}</span>
        </td>
        <td class="py-3">
          <span class="fw-bold text-dark">${escapeHtml(room.name)}</span>
        </td>
        <td class="py-3 text-muted small">
          ${escapeHtml(room.location)}
        </td>
        <td class="py-3 text-center">
          <span class="fw-bold text-dark">${room.capacity}</span>
          <span class="text-muted small"> người</span>
        </td>
        <td class="py-3 text-center">
          <div class="d-flex flex-column align-items-center gap-1">
            <label class="room-toggle" title="Chuyển trạng thái" aria-label="Chuyển trạng thái phòng">
              <input
                type="checkbox"
                class="room-status-toggle"
                data-id="${room.id}"
                data-current="${room.status}"
                ${isActive ? "checked" : ""}
              />
              <span class="room-toggle-slider"></span>
            </label>
            ${buildStatusBadge(room.status)}
          </div>
        </td>
        <td class="pe-4 py-3 text-end">
          <button
            class="btn btn-sm btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1 btn-edit-room"
            data-id="${room.id}"
            type="button"
            aria-label="Sửa phòng ${escapeHtml(room.name)}"
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

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTable(rooms: RoomResponse[]): void {
    if (!tbody || !tableWrapper || !emptyEl) return;

    tableWrapper.style.display = "block";

    if (rooms.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
    } else {
      emptyEl.style.display = "none";
      tbody.innerHTML = rooms.map(buildRow).join("");
      attachToggleListeners();
      attachEditListeners();
    }
  }

  async function loadRooms(status?: RoomStatus | ""): Promise<void> {
    if (loadingEl) loadingEl.style.display = "block";
    if (tableWrapper) tableWrapper.style.display = "none";

    try {
      const params = status ? { status } : {};
      const page = await roomService.getAll(params);
      allRooms = page.content;
      setStats(allRooms);
      renderTable(allRooms);
    } catch (error: unknown) {
      showAlert(authService.extractErrorMessage(error), "danger");
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  function attachToggleListeners(): void {
    document
      .querySelectorAll<HTMLInputElement>(".room-status-toggle")
      .forEach((toggle) => {
        toggle.addEventListener("change", async () => {
          const id = Number(toggle.dataset.id);
          const currentStatus = toggle.dataset.current as RoomStatus;
          const newStatus: RoomStatus =
            currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

          // Disable toggle while API call is in flight
          toggle.disabled = true;

          try {
            await roomService.updateStatus(id, { status: newStatus });

            // Update in-memory data
            const room = allRooms.find((r) => r.id === id);
            if (room) room.status = newStatus;

            // Update dataset and badge
            toggle.dataset.current = newStatus;
            const row = toggle.closest("tr");
            const badgeContainer = row?.querySelector("td:nth-child(5) .d-flex");
            if (badgeContainer) {
              const oldBadge = badgeContainer.querySelector(".badge");
              if (oldBadge) {
                const isNowActive = newStatus === "ACTIVE";
                oldBadge.className = `badge ${isNowActive ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"} rounded-pill small fw-semibold px-2 py-1`;
                oldBadge.textContent = isNowActive ? "ACTIVE" : "INACTIVE";
              }
            }

            // Refresh stats
            setStats(allRooms);
            showAlert(`Trạng thái phòng đã được cập nhật sang ${newStatus}.`, "success");
          } catch (error: unknown) {
            // Revert toggle visual
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
      .querySelectorAll<HTMLButtonElement>(".btn-edit-room")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const room = allRooms.find((r) => r.id === id);
          if (!room) return;
          openEditModal(room);
        });
      });
  }

    function clearFormErrors(): void {
    if (nameError) nameError.style.display = "none";
    if (locationError) locationError.style.display = "none";
    if (capacityError) capacityError.style.display = "none";
    if (formError) {
      formError.style.display = "none";
      formError.textContent = "";
    }
  }

  function openAddModal(): void {
    if (
      !hiddenId ||
      !nameInput ||
      !locationInput ||
      !capacityInput ||
      !statusSelect
    )
      return;
    if (modalLabel) modalLabel.textContent = "Add New Room";
    if (modalSubtitle)
      modalSubtitle.textContent =
        "Configure studio dimensions, booking quotas, and availability.";
    if (submitBtn) submitBtn.textContent = " Save Room";

    // Reset form
    hiddenId.value = "";
    nameInput.value = "";
    locationInput.value = "";
    capacityInput.value = "20";
    statusSelect.value = "ACTIVE";
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = "0 / 60 chars";

    getModal()?.show();
  }

  function openEditModal(room: RoomResponse): void {
    if (
      !hiddenId ||
      !nameInput ||
      !locationInput ||
      !capacityInput ||
      !statusSelect
    )
      return;
    if (modalLabel) modalLabel.textContent = "Edit Room";
    if (modalSubtitle)
      modalSubtitle.textContent = `Updating details for RM-${String(room.id).padStart(3, "0")}.`;
    if (submitBtn)
      submitBtn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Update Room`;

    hiddenId.value = String(room.id);
    nameInput.value = room.name;
    locationInput.value = room.location;
    capacityInput.value = String(room.capacity);
    statusSelect.value = room.status;
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = `${room.name.length} / 60 chars`;

    getModal()?.show();
  }

    btnCapMinus?.addEventListener("click", () => {
    if (!capacityInput) return;
    const val = parseInt(capacityInput.value, 10) || 1;
    if (val > 1) capacityInput.value = String(val - 1);
  });

  btnCapPlus?.addEventListener("click", () => {
    if (!capacityInput) return;
    const val = parseInt(capacityInput.value, 10) || 1;
    if (val < 500) capacityInput.value = String(val + 1);
  });

    nameInput?.addEventListener("input", () => {
    if (nameCounter)
      nameCounter.textContent = `${nameInput.value.length} / 60 chars`;
  });

    btnOpenAdd?.addEventListener("click", openAddModal);

    roomForm?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    clearFormErrors();

    if (
      !nameInput ||
      !locationInput ||
      !capacityInput ||
      !statusSelect ||
      !hiddenId
    )
      return;

    const name = nameInput.value.trim();
    const location = locationInput.value.trim();
    const capacity = parseInt(capacityInput.value, 10);
    const status = statusSelect.value as RoomStatus;
    const editingId = hiddenId.value ? Number(hiddenId.value) : null;

    // Client-side validation
    let hasError = false;
    if (!name) {
      if (nameError) nameError.style.display = "block";
      hasError = true;
    }
    if (!location) {
      if (locationError) locationError.style.display = "block";
      hasError = true;
    }
    if (!capacity || capacity < 1) {
      if (capacityError) capacityError.style.display = "block";
      hasError = true;
    }
    if (hasError) return;

    // Disable submit
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = editingId ? "Updating..." : "Saving...";
    }

    try {
      if (editingId) {
                const updated = await roomService.update(editingId, {
          name,
          location,
          capacity,
        });
        // Reflect in local state
        const idx = allRooms.findIndex((r) => r.id === editingId);
        if (idx !== -1) {
          allRooms[idx] = { ...allRooms[idx], ...updated };
        }
        showAlert(`Room "${updated.name}" updated successfully.`, "success");
      } else {
                const created = await roomService.create({
          name,
          location,
          capacity,
          status,
        });
        allRooms.push(created);
        showAlert(`Room "${created.name}" created successfully.`, "success");
      }

      // Re-render table & stats
      setStats(allRooms);
      const currentFilter = filterSelect?.value as RoomStatus | "";
      const filtered = currentFilter
        ? allRooms.filter((r) => r.status === currentFilter)
        : allRooms;
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
          </svg> ${hiddenId.value ? "Update Room" : "Save Room"}`;
      }
    }
  });

    filterSelect?.addEventListener("change", () => {
    const val = filterSelect.value as RoomStatus | "";
    const filtered = val ? allRooms.filter((r) => r.status === val) : allRooms;
    renderTable(filtered);
  });

  highlightActiveNav();
  setupAdminProfile();
  setupLogoutAction();

  await loadRooms();
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
    if (href === currentPath || (currentPath === "/admin/rooms" && href === "/admin/rooms")) {
      link.classList.add("active", "text-white");
      link.classList.remove("text-secondary-emphasis");
    } else {
      link.classList.remove("active", "text-white");
      link.classList.add("text-secondary-emphasis");
    }
  });
}
