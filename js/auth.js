// =========================================================
// APEXMART - SHARED AUTH & NAVBAR STATE (js/auth.js)
// =========================================================
// Load after js/api.js on every page:
//   <script src="../js/api.js"></script>
//   <script src="../js/auth.js"></script>
//
// Session (localStorage "apexmart_session"):
//   { token, role: "customer" | "seller" | "admin",
//     id, first_name, name, email }
//
// Page hooks (plain HTML attributes, no page code needed):
//   data-auth-menu            filled with the Login dropdown when
//                             logged out, the avatar menu when logged in
//   data-auth-menu="user-only"  only replaced when logged in
//   data-auth-logout          click logs out
//   data-auth-hide-for="..."  hidden for these roles (space separated)
//
// All pages sit one folder below the project root (main/,
// customer/, seller/, account/, Admin Panel/), so every link
// here starts with "../".

(function () {

    const SESSION_KEY = ApexApi.SESSION_KEY;

    // Older keys other pages still read. Kept in sync on login
    // and removed on logout.
    const STOREFRONT_KEYS = [
        "apexmart_user",
        "apexmart_role",
        "seller_id",
        "seller_email",
    ];

    // The Admin Panel's own login. A customer/seller logging in on
    // the storefront (e.g. while testing in another tab) must not
    // log the admin out of the panel; logout clears everything.
    const ADMIN_KEYS = [
        "admin_token",
        "admin_user",
        "admin_username",
    ];

    const LEGACY_KEYS = [...STOREFRONT_KEYS, ...ADMIN_KEYS];

    const ROUTES = {
        customer: {
            dashboard: "../customer/dashboard.html",
            profile: "../customer/profile.html",
            label: "Customer",
        },
        seller: {
            dashboard: "../seller/seller-dashboard.html",
            profile: "../seller/profile.html",
            label: "Seller",
        },
        admin: {
            dashboard: "../Admin%20Panel/index.html",
            profile: "../Admin%20Panel/index.html#settings",
            label: "Admin",
        },
    };

    const HOME_URL = "../main/index.html";


    // -----------------------------------------------------
    // SESSION STORAGE
    // -----------------------------------------------------

    function readJson(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    function getSession() {
        const session = readJson(SESSION_KEY);
        if (session && ROUTES[session.role]) return session;

        return migrateLegacySession();
    }

    /**
     * Users who logged in before js/auth.js existed only have the
     * old keys. Build a session from them so they stay logged in.
     */
    function migrateLegacySession() {
        let session = null;

        const adminToken = localStorage.getItem("admin_token");
        const customer = readJson("apexmart_user");
        const sellerId = localStorage.getItem("seller_id");

        if (adminToken) {
            const admin = readJson("admin_user") || {};
            session = {
                token: adminToken,
                role: "admin",
                id: admin.id,
                first_name: (admin.username || "Admin").split(" ")[0],
                name: admin.username || "Admin",
                email: admin.email || "",
            };
        } else if (customer && customer.id) {
            session = {
                token: null,
                role: "customer",
                id: customer.id,
                first_name: customer.first_name,
                name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
                email: customer.email,
            };
        } else if (sellerId) {
            session = {
                token: null,
                role: "seller",
                id: Number(sellerId),
                first_name: "Seller",
                name: "Seller",
                email: localStorage.getItem("seller_email") || "",
            };
        }

        if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    }

    /**
     * Saves a login. Called by the customer, seller and admin login pages.
     * @param {string} role - "customer" | "seller" | "admin"
     * @param {string} token - access_token from the login response
     * @param {object} profile - { id, first_name, name, email }
     * @param {object} [legacy] - extra old keys to keep other pages working
     */
    function saveSession(role, token, profile, legacy = {}) {
        // One storefront login at a time: drop whatever role was
        // logged in before (the Admin Panel login is kept, see ADMIN_KEYS)
        localStorage.removeItem(SESSION_KEY);
        STOREFRONT_KEYS.forEach(key => localStorage.removeItem(key));
        if (role === "admin") ADMIN_KEYS.forEach(key => localStorage.removeItem(key));

        const session = {
            token,
            role,
            id: profile.id,
            first_name: profile.first_name || (profile.name || "").split(" ")[0],
            name: profile.name || profile.first_name || "",
            email: profile.email || "",
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        Object.entries(legacy).forEach(([key, value]) => {
            localStorage.setItem(
                key,
                typeof value === "string" ? value : JSON.stringify(value)
            );
        });

        return session;
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    }

    function logout(redirectUrl = HOME_URL) {
        clearSession();
        window.location.href = redirectUrl;
    }

    function dashboardUrl(role) {
        return ROUTES[role] ? ROUTES[role].dashboard : HOME_URL;
    }


    // -----------------------------------------------------
    // NAVBAR USER MENU
    // -----------------------------------------------------

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function initialsOf(name) {
        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "?";
        return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
    }

    function loginMenuHtml() {
        return `
            <button class="btn btn-charcoal btn-sm dropdown-toggle" type="button"
                    data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person"></i> Login
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border p-2 login-dropdown-menu" style="min-width: 250px; border-radius: 12px;">
                <li class="px-2 py-1 mb-1">
                    <span class="d-block small text-muted">Select your portal</span>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                    <a class="dropdown-item py-2 px-2 rounded d-flex align-items-center gap-2 login-drop-item" href="../account/seller-login.html?role=seller">
                        <span class="login-drop-icon seller-icon"><i class="bi bi-shop"></i></span>
                        <div>
                            <strong class="d-block text-dark">Seller Login</strong>
                            <small class="text-muted d-block" style="font-size: 0.65rem;">Manage store & products</small>
                        </div>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item py-2 px-2 rounded d-flex align-items-center gap-2 login-drop-item mt-1" href="../account/login.html?role=customer">
                        <span class="login-drop-icon customer-icon"><i class="bi bi-person-check-fill"></i></span>
                        <div>
                            <strong class="d-block text-dark">Customer Login</strong>
                            <small class="text-muted d-block" style="font-size: 0.65rem;">Shop, cart & orders</small>
                        </div>
                    </a>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li class="px-2 pt-1 text-center">
                    <span class="small text-muted">New customer?</span>
                    <a href="../account/register.html" class="small text-warning fw-bold text-decoration-none ms-1">Sign up now</a>
                </li>
            </ul>
        `;
    }

    function userMenuHtml(session) {
        const route = ROUTES[session.role];

        return `
            <button class="auth-user-btn dropdown-toggle" type="button"
                    data-bs-toggle="dropdown" aria-expanded="false"
                    aria-label="Account menu for ${escapeHtml(session.name)}">
                <span class="auth-avatar">${escapeHtml(initialsOf(session.name))}</span>
                <span class="auth-first-name">${escapeHtml(session.first_name)}</span>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow-sm border p-2 auth-user-menu">
                <li class="px-2 py-2 d-flex align-items-center gap-2">
                    <span class="auth-avatar auth-avatar-lg">${escapeHtml(initialsOf(session.name))}</span>
                    <div class="text-truncate">
                        <strong class="d-block text-dark text-truncate">${escapeHtml(session.name)}</strong>
                        <small class="d-block text-muted text-truncate">${escapeHtml(session.email)}</small>
                        <span class="auth-role-badge">${route.label}</span>
                    </div>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                    <a class="dropdown-item rounded py-2" href="${route.dashboard}">
                        <i class="bi bi-grid me-2"></i> My Dashboard
                    </a>
                </li>
                <li>
                    <a class="dropdown-item rounded py-2" href="${route.profile}">
                        <i class="bi bi-person me-2"></i> My Profile
                    </a>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                    <button class="dropdown-item rounded py-2 text-danger" type="button" data-auth-logout>
                        <i class="bi bi-box-arrow-right me-2"></i> Logout
                    </button>
                </li>
            </ul>
        `;
    }

    function renderNavbar() {
        const session = getSession();

        document.querySelectorAll("[data-auth-hide-for]").forEach(el => {
            const roles = el.dataset.authHideFor.split(/\s+/);
            el.classList.toggle("d-none", !!session && roles.includes(session.role));
        });

        document.querySelectorAll("[data-auth-menu]").forEach(slot => {
            // data-auth-menu="user-only": keep the page's own markup
            // when logged out (customer pages link to Profile instead)
            if (!session && slot.dataset.authMenu === "user-only") return;

            slot.classList.add("dropdown");
            slot.innerHTML = session ? userMenuHtml(session) : loginMenuHtml();
        });
    }

    /**
     * Confirms the stored token with the backend and refreshes the
     * name shown in the navbar. An expired/invalid token logs out.
     */
    async function refreshSession() {
        const session = getSession();
        if (!session || !session.token) return;

        try {
            const me = await ApexApi.request("/api/auth/me");
            localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, ...me }));
            renderNavbar();
        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                clearSession();
                window.location.reload();
            }
            // Server offline: keep the stored session
        }
    }


    // -----------------------------------------------------
    // INIT
    // -----------------------------------------------------

    // Logout works for any [data-auth-logout] element, including
    // ones rendered later (the navbar menu, seller layout).
    document.addEventListener("click", event => {
        const trigger = event.target.closest("[data-auth-logout]");
        if (!trigger) return;

        event.preventDefault();
        logout();
    });

    document.addEventListener("DOMContentLoaded", () => {
        renderNavbar();
        refreshSession();
    });


    window.ApexAuth = {
        getSession,
        saveSession,
        clearSession,
        logout,
        dashboardUrl,
        renderNavbar,
    };

})();
