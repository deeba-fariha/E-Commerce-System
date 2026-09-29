/**
 * ============================================================================
 * ADMIN PANEL - MAIN CONTROLLER (js/app.js)
 * ============================================================================
 * Global utility helpers, sidebar navigation controller, modal managers, toast
 * notification system, and application bootstrapping.
 *
 * Menu order configured:
 * 1. Dashboard
 * 2. Categories
 * 3. Sellers
 * 4. Customers
 * 5. Orders
 * 6. Payments
 */

// ----------------------------------------------------------------------------
// 1. GLOBAL FORMATTERS & BADGE HELPERS
// ----------------------------------------------------------------------------

/** Formats a number to BDT currency string */
const money = n => "৳" + (n || 0).toLocaleString("en-IN");

/** Extracts up to 2 uppercase initials from a person or store name */
const initials = name => (name || "AP").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/**
 * Returns HTML tag for status badges with color coding.
 * @param {string} status - Status string
 */
function statusBadge(status) {
  const map = {
    "Active": "green", "Delivered": "green", "Completed": "green", "Approved": "green", "In Stock": "green",
    "Processing": "blue", "Shipped": "blue",
    "Pending": "gold", "Pending Review": "gold",
    "Out of Stock": "red", "Out of stock": "red", "Cancelled": "red", "Failed": "red", "Expired": "red", "Declined": "red",
    "Draft": "grey"
  };
  const cls = map[status] || "grey";
  return `<span class="badge ${cls}">${status}</span>`;
}

/**
 * Displays a transient notification toast message at bottom right.
 * @param {string} msg - Message text to display
 */
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

// ----------------------------------------------------------------------------
// 2. MODAL OVERLAY HELPERS
// ----------------------------------------------------------------------------

function openModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) modalOverlay.classList.add("open");
}

function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) modalOverlay.classList.remove("open");
}

// ----------------------------------------------------------------------------
// 3. NAVIGATION CONTROLLER
// ----------------------------------------------------------------------------

/** Page Header Titles Mapping */
const pageTitles = {
  dashboard: "Dashboard Overview",
  categories: "Category Management",
  sellers: "Sellers & Merchant Directory",
  customers: "Customer Records",
  orders: "Customer Orders",
  payments: "Transactions & Payments",
  settings: "Store & Admin Settings"
};

/**
 * Switches the active panel view based on menu target.
 * @param {string} target - Section ID to switch to
 */
function goTo(target) {
  // Update sidebar button active state
  document.querySelectorAll(".nav-item[data-target]").forEach(b => {
    b.classList.toggle("active", b.dataset.target === target);
  });

  // Update page section active state
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === target);
  });

  // Update topbar title
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    titleEl.textContent = pageTitles[target] || target;
  }

  // Reset scroll position
  const contentEl = document.getElementById("content");
  if (contentEl) contentEl.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" });

  // Close mobile sidebar if open
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.classList.remove("open");

  // Trigger page-specific re-renders if required
  if (target === "categories") renderCategories();
  if (target === "sellers") renderSellers();
  if (target === "orders") renderOrders();
  if (target === "customers") renderCustomers();
  if (target === "payments") renderPayments();
}

// ----------------------------------------------------------------------------
// 4. EVENT LISTENERS INITIALIZATION
// ----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  // ── AUTHENTICATION GUARD ────────────────────────────────────────────────────
  // All admin panel pages require a valid JWT. Redirect to login if missing.
  const ADMIN_API = 'http://127.0.0.1:8000';
  const _token = localStorage.getItem('admin_token');
  if (!_token) {
    window.location.href = 'login.html';
    return; // stop execution — page is redirecting
  }

  // Validate token and load admin data for the UI
  fetch(ADMIN_API + '/api/admin/me', {
    headers: { 'Authorization': 'Bearer ' + _token }
  })
    .then(r => r.ok ? r.json() : Promise.reject('invalid_token'))
    .then(admin => {
      window.currentAdmin = admin;
      // Header avatar (2-letter initials)
      const avatarEl = document.querySelector('.profile .avatar');
      if (avatarEl) avatarEl.textContent = (admin.username || 'A').slice(0, 2).toUpperCase();
      // Header username
      const nameEl = document.querySelector('.profile-name');
      if (nameEl) nameEl.textContent = admin.username;
      // Dashboard welcome banner
      const welcomeEl = document.getElementById('welcomeUsername');
      if (welcomeEl) welcomeEl.textContent = admin.username;
      // Pre-fill Settings form
      const uEl = document.getElementById('settingsUsername');
      if (uEl) uEl.value = admin.username;
      const eEl = document.getElementById('settingsEmail');
      if (eEl) eEl.value = admin.email;
    })
    .catch(() => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_username');
      window.location.href = 'login.html';
    });
  // ────────────────────────────────────────────────────────────────────────────

  // Sidebar menu clicks

  document.querySelectorAll(".nav-item[data-target]").forEach(btn => {
    btn.addEventListener("click", () => goTo(btn.dataset.target));
  });

  // Links with data-goto attributes
  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => goTo(el.dataset.goto));
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }

  // Logout — clear JWT and redirect to login page
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to log out of Apex Mart Admin?")) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_username');
        window.location.href = 'login.html';
      }
    });
  }

  // Modal backdrop click and Escape key handlers
  const modalClose = document.getElementById("modalClose");
  if (modalClose) modalClose.addEventListener("click", closeModal);

  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", e => {
      if (e.target.id === "modalOverlay") closeModal();
    });
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // Global topbar search input handler
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.value.trim()) {
        goTo("orders");
        const orderSearch = document.getElementById("orderSearch");
        if (orderSearch) orderSearch.value = e.target.value;
        renderOrders();
      }
    });
  }

  // Admin Profile Settings — PUT /api/admin/profile
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async e => {
      e.preventDefault();

      const token = localStorage.getItem('admin_token');
      if (!token) { window.location.href = 'login.html'; return; }

      const username        = (document.getElementById('settingsUsername')?.value || '').trim();
      const newPassword     = document.getElementById('settingsNewPassword')?.value || '';
      const confirmPassword = document.getElementById('settingsConfirmPassword')?.value || '';

      // Frontend-only validation: passwords must match
      if (newPassword && newPassword !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }

      // Build payload with only the fields that changed; email is NEVER sent
      const payload = {};
      if (username && window.currentAdmin && username !== window.currentAdmin.username) {
        payload.username = username;
      }
      if (newPassword) {
        payload.password = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        showToast('No changes to save');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:8000/api/admin/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Profile update failed');
          return;
        }

        const updated = await res.json();
        window.currentAdmin = updated;

        // Persist updated username
        localStorage.setItem('admin_username', updated.username);
        try {
          const stored = localStorage.getItem('admin_user');
          if (stored) {
            localStorage.setItem('admin_user',
              JSON.stringify({ ...JSON.parse(stored), ...updated }));
          }
        } catch (_) { /* ignore parse errors */ }

        // Sync all username display points
        const avatarEl = document.querySelector('.profile .avatar');
        if (avatarEl) avatarEl.textContent = (updated.username || 'A').slice(0, 2).toUpperCase();
        const nameEl = document.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = updated.username;
        const welcomeEl = document.getElementById('welcomeUsername');
        if (welcomeEl) welcomeEl.textContent = updated.username;
        const uEl = document.getElementById('settingsUsername');
        if (uEl) uEl.value = updated.username;

        // Clear password fields
        const pwEl = document.getElementById('settingsNewPassword');
        const cpEl = document.getElementById('settingsConfirmPassword');
        if (pwEl) pwEl.value = '';
        if (cpEl) cpEl.value = '';

        showToast('Profile updated successfully');
      } catch (err) {
        console.error('Profile update error:', err);
        showToast('Profile update failed — check connection');
      }
    });
  }

  // Initialize Modules
  initDashboard();
  initAddCategoryButton();
  initCustomersModule();
  initOrdersModule();

  // Initial render calls
  renderCategories();
  renderSellers();
  renderCustomers();
  renderOrders();
  renderPayments();
});

