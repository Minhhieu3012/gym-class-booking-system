import template from "./packages.html?raw";
import { packageService } from "../../services/admin-core.service";
import { authService } from "../../services/auth.service";
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
    return String(str)
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
      <div class="d-flex align-items-center gap-2 px-4 py-3 rounded-theme-md"
           style="background-color: ${ok ? "var(--color-tertiary-light)" : "var(--color-primary-light)"}; border: 1px solid ${ok ? "var(--color-tertiary)" : "var(--color-primary)"};">
        <svg width="16" height="16" fill="none" stroke="${ok ? "var(--color-tertiary)" : "var(--color-primary)"}" stroke-width="2.5" viewBox="0 0 24 24">
          ${
            ok
              ? '<polyline points="20 6 9 17 4 12"/>'
              : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
          }
        </svg>
        <span style="font-size: 0.85rem; font-weight: 600; color: ${ok ? "var(--color-tertiary)" : "var(--color-primary)"};">${msg}</span>
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
    return `<span class="badge-theme ${isActive ? "badge-active" : "badge-inactive"}" style="font-size: 0.68rem; letter-spacing: 0.05em;">
      ${isActive ? "● ACTIVE" : "○ INACTIVE"}
    </span>`;
  }

  function buildRow(pkg: PackageResponse): string {
    const idStr = `PKG-${String(pkg.id).padStart(3, "0")}`;
    const shortDesc =
      pkg.description.length > 60
        ? escapeHtml(pkg.description.slice(0, 60)) + "…"
        : escapeHtml(pkg.description);

    return `
      <tr data-pkg-id="${pkg.id}">
        <td class="px-4 py-3 text-neutral" style="font-size: 0.8rem; font-weight: 600; white-space: nowrap;">
          <span class="badge-theme bg-surface-alt border-theme text-neutral"
            style="font-size: 0.68rem; border-radius: var(--radius-sm) !important; padding: 0.2em 0.55em;">${idStr}</span>
        </td>
        <td class="px-3 py-3" style="min-width: 160px;">
          <p class="mb-0 fw-semibold text-secondary-theme" style="font-size: 0.88rem;">${escapeHtml(pkg.name)}</p>
        </td>
        <td class="px-3 py-3 text-neutral" style="font-size: 0.82rem; max-width: 240px;">
          ${shortDesc}
        </td>
        <td class="px-3 py-3 text-end" style="white-space: nowrap;">
          <span class="fw-bold text-secondary-theme" style="font-size: 0.92rem;">$${fmtPrice(pkg.price)}</span>
        </td>
        <td class="px-3 py-3 text-center" style="white-space: nowrap;">
          <span class="fw-semibold text-secondary-theme" style="font-size: 0.88rem;">${pkg.durationDays}</span>
          <span class="text-neutral" style="font-size: 0.72rem;"> Days</span>
        </td>
        <td class="px-3 py-3 text-center" style="white-space: nowrap;">
          <span class="fw-semibold text-secondary-theme" style="font-size: 0.88rem;">${pkg.sessionCount}</span>
          <span class="text-neutral" style="font-size: 0.72rem;"> Sessions</span>
        </td>
        <td class="px-3 py-3 text-center">
          <div class="d-flex flex-column align-items-center gap-1">
            <label class="pkg-toggle" title="Toggle active status" aria-label="Toggle package status">
              <input type="checkbox" class="pkg-status-toggle"
                data-id="${pkg.id}" data-current="${pkg.isActive}"
                ${pkg.isActive ? "checked" : ""} />
              <span class="pkg-toggle-slider"></span>
            </label>
            ${buildStatusBadge(pkg.isActive)}
          </div>
        </td>
        <td class="px-4 py-3 text-end">
          <button class="btn-edit-pkg" data-id="${pkg.id}" type="button"
            aria-label="Edit package ${escapeHtml(pkg.name)}">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        </td>
      </tr>`;
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
      renderTable(allPackages);
    } catch (error: unknown) {
      showAlert(authService.extractErrorMessage(error), "danger");
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

    function attachToggleListeners(): void {
    document
      .querySelectorAll<HTMLInputElement>(".pkg-status-toggle")
      .forEach((toggle) => {
        toggle.addEventListener("change", async () => {
          const id = Number(toggle.dataset.id);
          const wasActive = toggle.dataset.current === "true";
          const newActive = !wasActive;

          toggle.disabled = true;
          try {
            if (newActive) {
              await packageService.activate(id);
            } else {
              await packageService.deactivate(id);
            }

            // Update in-memory state
            const pkg = allPackages.find((p) => p.id === id);
            if (pkg) pkg.isActive = newActive;
            toggle.dataset.current = String(newActive);

            // Update badge
            const row = toggle.closest("tr");
            const badgeEl = row?.querySelector<HTMLSpanElement>(".badge-theme");
            if (badgeEl) {
              badgeEl.className = `badge-theme ${newActive ? "badge-active" : "badge-inactive"}`;
              badgeEl.textContent = newActive ? "● ACTIVE" : "○ INACTIVE";
            }

            setStats(allPackages);
            showAlert(
              `Package ${newActive ? "activated" : "deactivated"} successfully.`,
              "success",
            );
          } catch (error: unknown) {
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

  function syncStatusLabel(active: boolean): void {
    if (statusLabel)
      statusLabel.textContent = active
        ? "Active (Available in Member App)"
        : "Inactive (Hidden from Members)";
    if (statusHint)
      statusHint.textContent = active
        ? "Members can see and purchase this package."
        : "This package is archived and not visible to members.";
  }

  function openAddModal(): void {
    if (
      !hiddenId ||
      !nameInput ||
      !descTextarea ||
      !priceInput ||
      !durInput ||
      !sessInput ||
      !isActiveCheck
    )
      return;
    if (modalLabel) modalLabel.textContent = "Add New Package";
    if (modalSubtitle)
      modalSubtitle.textContent =
        "Set pricing, validity window, and quota restrictions.";
    if (submitBtn)
      submitBtn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Save Package`;

    hiddenId.value = "";
    nameInput.value = "";
    descTextarea.value = "";
    priceInput.value = "";
    durInput.value = "30";
    sessInput.value = "10";
    isActiveCheck.checked = true;
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = "0 / 60 chars";
    syncStatusLabel(true);

    getModal()?.show();
  }

  function openEditModal(pkg: PackageResponse): void {
    if (
      !hiddenId ||
      !nameInput ||
      !descTextarea ||
      !priceInput ||
      !durInput ||
      !sessInput ||
      !isActiveCheck
    )
      return;
    if (modalLabel) modalLabel.textContent = "Edit Package";
    if (modalSubtitle)
      modalSubtitle.textContent = `Updating details for PKG-${String(pkg.id).padStart(3, "0")}.`;
    if (submitBtn)
      submitBtn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Update Package`;

    hiddenId.value = String(pkg.id);
    nameInput.value = pkg.name;
    descTextarea.value = pkg.description;
    priceInput.value = String(pkg.price);
    durInput.value = String(pkg.durationDays);
    sessInput.value = String(pkg.sessionCount);
    isActiveCheck.checked = pkg.isActive;
    clearFormErrors();
    if (nameCounter) nameCounter.textContent = `${pkg.name.length} / 60 chars`;
    syncStatusLabel(pkg.isActive);

    getModal()?.show();
  }

    btnDurMinus?.addEventListener("click", () => {
    if (!durInput) return;
    const v = parseInt(durInput.value, 10) || 1;
    if (v > 1) durInput.value = String(v - 1);
  });
  btnDurPlus?.addEventListener("click", () => {
    if (!durInput) return;
    const v = parseInt(durInput.value, 10) || 1;
    if (v < 3650) durInput.value = String(v + 1);
  });
  btnSessMinus?.addEventListener("click", () => {
    if (!sessInput) return;
    const v = parseInt(sessInput.value, 10) || 1;
    if (v > 1) sessInput.value = String(v - 1);
  });
  btnSessPlus?.addEventListener("click", () => {
    if (!sessInput) return;
    const v = parseInt(sessInput.value, 10) || 1;
    if (v < 999) sessInput.value = String(v + 1);
  });

    nameInput?.addEventListener("input", () => {
    if (nameCounter)
      nameCounter.textContent = `${nameInput.value.length} / 60 chars`;
  });

    isActiveCheck?.addEventListener("change", () => {
    syncStatusLabel(isActiveCheck.checked);
  });

    btnOpenAdd?.addEventListener("click", openAddModal);

    pkgForm?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    clearFormErrors();

    if (
      !nameInput ||
      !descTextarea ||
      !priceInput ||
      !durInput ||
      !sessInput ||
      !isActiveCheck ||
      !hiddenId
    )
      return;

    const name = nameInput.value.trim();
    const description = descTextarea.value.trim();
        const price = Number(priceInput.value);
    const durationDays = Number(durInput.value);
    const sessionCount = Number(sessInput.value);
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
    if (!price || price <= 0) {
      if (priceError) priceError.style.display = "block";
      hasError = true;
    }
    if (hasError) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = editingId ? "Updating..." : "Saving...";
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
        showAlert(`Package "${updated.name}" updated successfully.`, "success");
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
        showAlert(`Package "${created.name}" created successfully.`, "success");
      }

      // Re-render table & stats
      setStats(allPackages);
      const filterVal = filterSelect?.value;
      const filtered =
        filterVal === "true"
          ? allPackages.filter((p) => p.isActive)
          : filterVal === "false"
            ? allPackages.filter((p) => !p.isActive)
            : allPackages;
      renderTable(filtered);

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
          </svg> ${hiddenId.value ? "Update Package" : "Save Package"}`;
      }
    }
  });

    filterSelect?.addEventListener("change", () => {
    const val = filterSelect.value;
    const filtered =
      val === "true"
        ? allPackages.filter((p) => p.isActive)
        : val === "false"
          ? allPackages.filter((p) => !p.isActive)
          : allPackages;
    renderTable(filtered);
  });

    await loadPackages();
}
