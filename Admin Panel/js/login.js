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

  // Backend base URL — works when page is opened as file:// or via a server
  var ADMIN_API = 'http://127.0.0.1:8000';

  // ── Auto-redirect if already logged in ─────────────────────────────────────
  var existingToken = localStorage.getItem('admin_token');
  if (existingToken) {
    // Quickly validate the stored token before redirecting
    fetch(ADMIN_API + '/api/admin/me', {
      headers: { 'Authorization': 'Bearer ' + existingToken }
    })
      .then(function (r) {
        if (r.ok) window.location.href = 'index.html';
        else localStorage.removeItem('admin_token');
      })
      .catch(function () { /* server offline — stay on login */ });
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
  function showError() {
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

      fetch(ADMIN_API + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, username: username, password: password })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bad_credentials');
          return res.json();
        })
        .then(function (data) {
          // Store JWT and admin info
          localStorage.setItem('admin_token', data.access_token);
          if (data.admin) {
            localStorage.setItem('admin_user',     JSON.stringify(data.admin));
            localStorage.setItem('admin_username', data.admin.username || '');
          }
          // Redirect into the Admin Panel
          window.location.href = 'index.html';
        })
        .catch(function () {
          setLoading(false);
          showError();
        });
    });
  }

})();

