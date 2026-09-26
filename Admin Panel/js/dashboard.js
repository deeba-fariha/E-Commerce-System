/**
 * ============================================================================
 * ADMIN PANEL - DASHBOARD SECTION (js/dashboard.js)
 * ============================================================================
 * Handles rendering for the main dashboard:
 * - Dynamic Welcome header with logged-in Admin username
 * - Product Approval Requests queue preview (matches Sellers section styling)
 * - Quick Approve & Make Live / Decline actions for product requests
 */

/** Helper formatter for currency in case app.js hasn't loaded yet */
const formatMoney = n => typeof money === "function" ? money(n) : "৳" + (n || 0).toLocaleString("en-IN");

/**
 * Ensures a realistic preview of ~6-7 pending product approval requests
 * across registered sellers in the mock data store.
 */
function ensureSampleRequests() {
  if (typeof sellers === "undefined" || !Array.isArray(sellers)) return;

  // Seller 4 (SEL-104 - GreenLife Home)
  const sel104 = sellers.find(s => s.id === "SEL-104");
  if (sel104 && (!sel104.productRequests || sel104.productRequests.length === 0)) {
    sel104.productRequests = [
      {
        id: "REQ-205",
        name: "Handwoven Jute Area Rug (5x7 ft)",
        category: "Home & Living",
        price: 3200,
        stock: 20,
        image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=700&auto=format&fit=crop&q=80",
        details: "100% natural eco-friendly woven jute rug with anti-slip backing. FAQs: Washable? Spot clean recommended.",
        status: "Pending"
      },
      {
        id: "REQ-206",
        name: "Ceramic Aroma Diffuser & Humidifier",
        category: "Home & Living",
        price: 1650,
        stock: 35,
        image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=700&auto=format&fit=crop&q=80",
        details: "Ultrasonic whisper-quiet cool mist aroma diffuser with 7 ambient LED colors. FAQs: Auto shut-off? Yes, when water runs out.",
        status: "Pending"
      }
    ];
  }

  // Seller 2 (SEL-102 - TechHub BD) - add 1 more pending item
  const sel102 = sellers.find(s => s.id === "SEL-102");
  if (sel102 && Array.isArray(sel102.productRequests) && !sel102.productRequests.some(r => r.id === "REQ-207")) {
    sel102.productRequests.push({
      id: "REQ-207",
      name: "Wireless ANC Over-Ear Headphones",
      category: "Electronics",
      price: 4500,
      stock: 18,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
      details: "Hybrid Active Noise Cancellation with 40-hour playback and fast USB-C charging. FAQs: Bluetooth version? 5.3.",
      status: "Pending"
    });
  }
}

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

/**
 * Asynchronously verifies if a logged-in admin token exists and updates username.
 */
function checkAdminAuth() {
  const token = localStorage.getItem("admin_token");
  if (token && !window.currentAdmin) {
    fetch("/api/admin/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.username) {
          window.currentAdmin = data;
          const el = document.getElementById("welcomeUsername");
          if (el) el.textContent = data.username;
          const profileName = document.querySelector(".profile-name");
          if (profileName) profileName.textContent = data.username;
          const avatarEl = document.querySelector(".profile .avatar");
          if (avatarEl && typeof initials === "function") avatarEl.textContent = initials(data.username);
        }
      })
      .catch(() => {});
  }
}

/**
 * Collects all pending product requests across all sellers.
 */
function getAllPendingRequests() {
  if (typeof sellers === "undefined" || !Array.isArray(sellers)) return [];

  const pending = [];
  sellers.forEach(s => {
    (s.productRequests || []).forEach(r => {
      if (r.status === "Pending") {
        pending.push({
          ...r,
          sellerName: s.storeName,
          sellerId: s.id,
          sellerRef: s
        });
      }
    });
  });
  return pending;
}

/**
 * Renders the product approval requests preview on the dashboard.
 * Shows around 6–7 pending requests matching the Sellers section component design.
 */
function renderDashboardRequests() {
  const container = document.getElementById("dashboardRequestsList");
  const countEl = document.getElementById("dashboardPendingCount");
  if (!container) return;

  const allPending = getAllPendingRequests();
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

  // Render cards visually matching the Sellers section design (sellers.js lines 320-350)
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${previewList.map(req => `
        <div style="display: flex; flex-wrap: wrap; gap: 16px; border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: var(--panel); align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 14px; align-items: center; max-width: 650px;">
            <img src="${req.image}" alt="${req.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); flex-shrink: 0;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 15px; color: var(--text);">${req.name}</strong>
                <span class="badge gold">Pending Review</span>
              </div>
              <div style="font-size: 13px; color: var(--muted); margin-bottom: 6px;">
                Seller: <strong style="color: var(--text);">${req.sellerName}</strong> | Category: <strong>${req.category}</strong> | Requested Price: <strong style="color: var(--accent);">${formatMoney(req.price)}</strong> | Initial Stock: <strong>${req.stock}</strong>
              </div>
              <p style="font-size: 12.5px; color: var(--text); margin: 0; background: var(--canvas); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--line);">
                <strong>Details & FAQs:</strong> ${req.details}
              </p>
            </div>
          </div>

          <!-- Approval Actions: Approve & Decline -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn danger small" data-dash-decline="${req.id}" data-seller-id="${req.sellerId}">
              Decline
            </button>
            <button class="btn primary small" data-dash-approve="${req.id}" data-seller-id="${req.sellerId}" style="background: var(--success); border-color: var(--success);">
              <svg viewBox="0 0 20 20" style="width: 14px; height: 14px; margin-right: 4px;"><path d="M4 10l4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Approve & Make Live
            </button>
          </div>
        </div>
      `).join("")}
    </div>

    ${allPending.length > maxPreview ? `
      <div style="text-align: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted);">
        Showing 7 of ${allPending.length} pending requests.
        <button class="link-btn" data-goto="sellers" style="margin-left: 6px;">Manage all in Sellers section →</button>
      </div>
    ` : ""}
  `;

  // Attach Approve Request Handler
  container.querySelectorAll("[data-dash-approve]").forEach(btn => {
    btn.addEventListener("click", () => {
      const reqId = btn.dataset.dashApprove;
      const sellerId = btn.dataset.sellerId;
      const seller = sellers.find(s => s.id === sellerId);
      if (!seller) return;

      const req = (seller.productRequests || []).find(r => r.id === reqId);
      if (req) {
        req.status = "Approved";

        // Create new live product entry (consistent with sellers.js lines 416-427)
        if (typeof products !== "undefined" && Array.isArray(products)) {
          const newProduct = {
            id: "P-" + (1000 + products.length + 1),
            name: req.name,
            category: req.category,
            price: req.price,
            stock: req.stock,
            status: req.stock > 0 ? "In Stock" : "Out of Stock",
            sellerName: seller.storeName,
            sellerId: seller.id,
            image: req.image,
            details: req.details
          };
          products.unshift(newProduct);
        }

        renderDashboardRequests();
        if (typeof showToast === "function") {
          showToast(`Product "${req.name}" approved! It is now live on the website.`);
        }
      }
    });
  });

  // Attach Decline Request Handler
  container.querySelectorAll("[data-dash-decline]").forEach(btn => {
    btn.addEventListener("click", () => {
      const reqId = btn.dataset.dashDecline;
      const sellerId = btn.dataset.sellerId;
      const seller = sellers.find(s => s.id === sellerId);
      if (!seller) return;

      const req = (seller.productRequests || []).find(r => r.id === reqId);
      if (req && confirm(`Decline product request for "${req.name}"?`)) {
        req.status = "Declined";
        renderDashboardRequests();
        if (typeof showToast === "function") {
          showToast(`Product request for "${req.name}" declined.`);
        }
      }
    });
  });

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
  ensureSampleRequests();
  updateDashboardWelcome();
  checkAdminAuth();
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
