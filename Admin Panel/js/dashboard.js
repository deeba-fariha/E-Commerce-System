/**
 * ============================================================================
 * ADMIN PANEL - DASHBOARD SECTION (js/dashboard.js)
 * ============================================================================
 * Handles rendering for the main dashboard:
 * - Dynamic Welcome header with logged-in Admin username
 * - Product Approval Requests queue (loaded from the database)
 * - Approve & Make Live / Decline actions for product requests
 *
 * Flow:
 *   Seller adds a product  -> saved in DB with status "Pending"
 *   Admin approves         -> PATCH /api/admin/products/{id}/approve -> "Approved"
 *                             (homepage loads /api/products/approved)
 *   Admin declines         -> PATCH /api/admin/products/{id}/reject  -> "Rejected"
 */

/** Helper formatter for currency in case app.js hasn't loaded yet */
const formatMoney = n => typeof money === "function" ? money(Number(n)) : "৳" + Number(n || 0).toLocaleString("en-IN");

/**
 * Resolves current admin username from existing authentication/profile state.
 */
function getAdminUsername() {
  // 1. window.currentAdmin (populated by auth flow)
  if (window.currentAdmin && window.currentAdmin.username) {
    return window.currentAdmin.username;
  }

  // 2. Local storage admin object or username
  try {
    const adminUser = localStorage.getItem("admin_user") || localStorage.getItem("currentAdmin");
    if (adminUser) {
      const parsed = JSON.parse(adminUser);
      if (parsed.username) return parsed.username;
      if (parsed.name) return parsed.name;
    }
  } catch (e) {}

  const storedUsername = localStorage.getItem("admin_username") || localStorage.getItem("username");
  if (storedUsername) return storedUsername;

  // 3. Fallback to existing profile name in topbar
  const profileNameEl = document.querySelector(".profile-name");
  if (profileNameEl && profileNameEl.textContent.trim()) {
    return profileNameEl.textContent.trim();
  }

  return "Admin";
}

/**
 * Updates the welcome banner username on the dashboard.
 */
function updateDashboardWelcome() {
  const welcomeEl = document.getElementById("welcomeUsername");
  if (!welcomeEl) return;
  welcomeEl.textContent = getAdminUsername();
}

// ----------------------------------------------------------------------------
// PRODUCT REQUEST CARD (shared with sellers.js)
// ----------------------------------------------------------------------------

/**
 * Returns the HTML for one pending product request with Approve / Decline buttons.
 * @param {object} p - Product from GET /api/admin/products
 * @param {boolean} showSeller - Show the seller's store name (dashboard view)
 */
function productRequestCard(p, showSeller = true) {
  const features = Array.isArray(p.features) ? p.features.filter(Boolean) : [];
  const oldPrice = p.oldPrice ?? p.old_price;

  return `
    <div style="display: flex; flex-wrap: wrap; gap: 16px; border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: var(--panel); align-items: center; justify-content: space-between;">
      <div style="display: flex; gap: 14px; align-items: center; max-width: 650px;">
        <img src="${escapeHtml(productImageUrl(p.image))}" alt="${escapeHtml(p.name)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); flex-shrink: 0;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <strong style="font-size: 15px; color: var(--text);">${escapeHtml(p.name)}</strong>
            <span class="badge gold">Pending Review</span>
          </div>
          <div style="font-size: 13px; color: var(--muted); margin-bottom: 6px;">
            ${showSeller ? `Seller: <strong style="color: var(--text);">${escapeHtml(p.seller_store_name || "Unknown seller")}</strong> | ` : ""}Category: <strong>${escapeHtml(p.category)}</strong>${p.brand ? ` | Brand: <strong>${escapeHtml(p.brand)}</strong>` : ""} | Price: <strong style="color: var(--accent);">${formatMoney(p.price)}</strong>${oldPrice ? ` <s>${formatMoney(oldPrice)}</s>` : ""} | Stock: <strong>${p.stock}</strong>
          </div>
          <p style="font-size: 12.5px; color: var(--text); margin: 0; background: var(--canvas); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--line);">
            <strong>Description:</strong> ${escapeHtml(p.description)}
            ${features.length ? `<br><strong>Features:</strong> ${features.map(escapeHtml).join(" · ")}` : ""}
          </p>
        </div>
      </div>

      <!-- Approval Actions: Approve & Decline -->
      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="btn danger small" data-reject-product="${p.id}" data-product-name="${escapeHtml(p.name)}">
          Decline
        </button>
        <button class="btn primary small" data-approve-product="${p.id}" data-product-name="${escapeHtml(p.name)}" style="background: var(--success); border-color: var(--success);">
          <svg viewBox="0 0 20 20" style="width: 14px; height: 14px; margin-right: 4px;"><path d="M4 10l4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Approve & Make Live
        </button>
      </div>
    </div>
  `;
}

/**
 * Wires Approve / Decline buttons rendered by productRequestCard().
 * @param {HTMLElement} container
 * @param {Function} onDone - Called after a product was approved/declined
 */
function bindProductRequestActions(container, onDone) {
  container.querySelectorAll("[data-approve-product]").forEach(btn => {
    btn.addEventListener("click", () =>
      reviewProduct(btn, btn.dataset.approveProduct, "approve", onDone));
  });

  container.querySelectorAll("[data-reject-product]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm(`Decline product request for "${btn.dataset.productName}"?`)) return;
      reviewProduct(btn, btn.dataset.rejectProduct, "reject", onDone);
    });
  });
}

async function reviewProduct(btn, productId, action, onDone) {
  const name = btn.dataset.productName;
  btn.disabled = true;

  try {
    await adminApi(`/api/admin/products/${productId}/${action}`, { method: "PATCH" });

    showToast(action === "approve"
      ? `Product "${name}" approved! It is now live on the website.`
      : `Product request for "${name}" declined.`);

    if (onDone) onDone();
  } catch (err) {
    console.error("Product review error:", err);
    showToast(err.message || "Could not update product. Is the backend running?");
    btn.disabled = false;
  }
}

// ----------------------------------------------------------------------------
// DASHBOARD APPROVAL QUEUE
// ----------------------------------------------------------------------------

/**
 * Loads pending products from the backend and renders the approval queue.
 */
async function renderDashboardRequests() {
  const container = document.getElementById("dashboardRequestsList");
  const countEl = document.getElementById("dashboardPendingCount");
  if (!container) return;

  let allPending;
  try {
    allPending = await adminApi("/api/admin/products?status=Pending");
  } catch (err) {
    console.error("Pending products load error:", err);
    if (countEl) countEl.textContent = "Could not load requests";
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--muted);">
        Could not load product requests. Make sure the FastAPI backend is running.
      </div>
    `;
    return;
  }

  const maxPreview = 7;
  const previewList = allPending.slice(0, maxPreview);

  if (countEl) {
    countEl.textContent = allPending.length === 0
      ? "0 pending requests waiting for review"
      : `${allPending.length} request(s) waiting for review (showing ${previewList.length} on dashboard)`;
  }

  if (allPending.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: var(--muted); background: var(--canvas); border-radius: 6px; border: 1px dashed var(--line);">
        <svg viewBox="0 0 20 20" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--success);"><path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-10.3a.75.75 0 0 0-1.06-1.06L9 10.27 7.35 8.64a.75.75 0 0 0-1.06 1.06l2.18 2.18a.75.75 0 0 0 1.06 0l4.17-4.18Z" fill="currentColor"/></svg>
        <div style="font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px;">All caught up!</div>
        <div style="font-size: 12.5px;">There are no pending product approval requests waiting for review.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${previewList.map(p => productRequestCard(p, true)).join("")}
    </div>

    ${allPending.length > maxPreview ? `
      <div style="text-align: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted);">
        Showing ${maxPreview} of ${allPending.length} pending requests.
        <button class="link-btn" data-goto="sellers" style="margin-left: 6px;">Manage all in Sellers section →</button>
      </div>
    ` : ""}
  `;

  bindProductRequestActions(container, renderDashboardRequests);

  // Attach data-goto links within the container
  container.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => {
      if (typeof goTo === "function") {
        goTo(el.dataset.goto);
      }
    });
  });
}

/**
 * Main initialization entry point for the Dashboard.
 */
function initDashboard() {
  updateDashboardWelcome();
  renderDashboardRequests();

  // Attach listener to re-render when switching back to dashboard
  document.querySelectorAll('.nav-item[data-target="dashboard"], [data-goto="dashboard"]').forEach(btn => {
    btn.addEventListener("click", () => {
      updateDashboardWelcome();
      renderDashboardRequests();
    });
  });
}

window.initDashboard = initDashboard;
window.renderDashboard = renderDashboardRequests;
