/**
 * ============================================================================
 * ADMIN PANEL - CUSTOMERS SECTION (js/customers.js)
 * ============================================================================
 * Lists registered customers from the database:
 *   GET /api/admin/customers?search=...   (admin only)
 *
 * Search is done by the backend (name or email). The Refresh button
 * reloads the list, so newly registered customers appear.
 */

let customerSearchTimer = null;

/** "2026-09-30T10:15:00Z" -> "30 Sep 2026, 10:15" in the admin's local time */
function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (isNaN(date)) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function customersMessageRow(message, color = "var(--muted)") {
  return `
    <tr>
      <td colspan="6" style="text-align:center; color:${color}; padding:30px;">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

async function renderCustomers() {
  const tbody = document.querySelector("#customersTable tbody");
  const countEl = document.getElementById("customerCount");
  if (!tbody) return;

  const search = (document.getElementById("customerSearch")?.value || "").trim();
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  tbody.innerHTML = customersMessageRow("Loading customers…");

  let customers;
  try {
    customers = await adminApi(`/api/admin/customers${query}`);
  } catch (error) {
    tbody.innerHTML = customersMessageRow(
      "Could not load customers: " + apiErrorMessage(error),
      "var(--red)"
    );
    if (countEl) countEl.textContent = "";
    return;
  }

  if (countEl) {
    countEl.textContent = search
      ? `${customers.length} matching customer(s)`
      : `${customers.length} registered customer(s)`;
  }

  if (customers.length === 0) {
    tbody.innerHTML = customersMessageRow(
      search ? "No customers match your search." : "No customers have registered yet."
    );
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><span style="font-family: var(--font-mono); font-weight: 600;">CUS-${String(c.id).padStart(4, "0")}</span></td>
      <td>
        <div class="cell-main">
          <div class="thumb">${escapeHtml(initials(`${c.first_name} ${c.last_name}`))}</div>
          <span class="cell-title">${escapeHtml(c.first_name)}</span>
        </div>
      </td>
      <td>${escapeHtml(c.last_name)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${formatDateTime(c.created_at)}</td>
      <td>${c.last_login_at ? formatDateTime(c.last_login_at) : '<span style="color: var(--muted);">Never</span>'}</td>
    </tr>
  `).join("");
}

function initCustomersModule() {
  const searchInput = document.getElementById("customerSearch");
  if (searchInput) {
    // Wait until typing pauses before asking the backend
    searchInput.addEventListener("input", () => {
      clearTimeout(customerSearchTimer);
      customerSearchTimer = setTimeout(renderCustomers, 300);
    });
  }

  document.getElementById("refreshCustomersBtn")?.addEventListener("click", () => {
    renderCustomers();
    showToast("Customer list refreshed");
  });
}
