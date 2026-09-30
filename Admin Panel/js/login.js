/**
 * =============================================================================
 * ADMIN PANEL — LOGIN PAGE LOGIC (js/login.js)
 * =============================================================================
 * Handles:
 *  - Redirect to index.html if already authenticated
 *  - Admin login form submission → POST /api/admin/login
 *  - JWT storage in localStorage on success
 *  - Inline error display on failure
 *  - Password visibility toggle
 */

(function () {
  'use strict';

  // Backend URL comes from ../js/config.js (API_BASE_URL) via apiFetch()

  // ── Auto-redirect if already logged in ─────────────────────────────────────
  var existingToken = localStorage.getItem('admin_token');
  if (existingToken) {
    // Quickly validate the stored token before redirecting
    apiFetch('/api/admin/me', {
      headers: { 'Authorization': 'Bearer ' + existingToken }
    })
      .then(function () {
        window.location.href = 'index.html';
      })
      .catch(function (error) {
        // Invalid/expired token -> clear it; server offline -> stay on login
        if (error instanceof ApiError && !error.network) ApexAuth.clearSession();
      });
  }

  // ── DOM references ──────────────────────────────────────────────────────────
  var form        = document.getElementById('adminLoginForm');
  var emailEl     = document.getElementById('loginEmail');
  var usernameEl  = document.getElementById('loginUsername');
  var passwordEl  = document.getElementById('loginPassword');
  var errorBox    = document.getElementById('loginError');
  var btnText     = document.getElementById('loginBtnText');
  var btnSpinner  = document.getElementById('loginBtnSpinner');
  var loginBtn    = document.getElementById('loginBtn');
  var toggleBtn   = document.getElementById('togglePassword');
  var toggleIcon  = document.getElementById('toggleIcon');

  // ── Password visibility toggle ──────────────────────────────────────────────
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var isPwd = passwordEl.type === 'password';
      passwordEl.type = isPwd ? 'text' : 'password';
      toggleIcon.className = isPwd ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  }

  // ── Helper: show/hide loading state ────────────────────────────────────────
  function setLoading(on) {
    loginBtn.disabled = on;
    btnText.classList.toggle('d-none', on);
    btnSpinner.classList.toggle('d-none', !on);
  }

  // ── Helper: show error ──────────────────────────────────────────────────────
  var DEFAULT_ERROR = 'Invalid login credentials. Please try again.';
  var errorText = document.getElementById('loginErrorText');

  function showError(message) {
    if (errorText) errorText.textContent = message || DEFAULT_ERROR;
    errorBox.style.display = 'block';
  }

  function hideError() {
    errorBox.style.display = 'none';
  }

  // ── Form submit → POST /api/admin/login ─────────────────────────────────────
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();

      var email    = (emailEl.value    || '').trim();
      var username = (usernameEl.value || '').trim();
      var password = passwordEl.value  || '';

      if (!email || !username || !password) {
        showError();
        return;
      }

      setLoading(true);

      apiFetch('/api/admin/login', {
        method: 'POST',
        body: { email: email, username: username, password: password },
        auth: false
      })
        .then(function (data) {
          // Shared session (../js/auth.js) so the storefront navbar shows
          // the admin. The admin_* keys are what the panel itself reads.
          var admin = data.admin || {};
          ApexAuth.saveSession('admin', data.access_token, {
            id: admin.id,
            first_name: (admin.username || 'Admin').split(' ')[0],
            name: admin.username || 'Admin',
            email: admin.email || ''
          }, {
            admin_token: data.access_token,
            admin_user: admin,
            admin_username: admin.username || ''
          });
          // Redirect into the Admin Panel
          window.location.href = 'index.html';
        })
        .catch(function (error) {
          setLoading(false);
          // 401 -> "Wrong email or password."; server down/CORS -> says so
          showError(apiErrorMessage(error, DEFAULT_ERROR));
        });
    });
  }

})();

