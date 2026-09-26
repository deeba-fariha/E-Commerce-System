/**
 * ============================================================================
 * ADMIN PANEL - CUSTOMERS SECTION (js/customers.js)
 * ============================================================================
 * Manages rendering and searching for registered store customers.
 */

function renderCustomers() {
  const searchInput = document.getElementById("customerSearch");
  const search = (searchInput ? searchInput.value : "").toLowerCase();
  const tbody = document.querySelector("#customersTable tbody");
  if (!tbody) return;

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search) ||
    c.location.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--muted); padding:30px;">
          No customers match your search criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>
        <div class="cell-main">
          <div class="thumb">${initials(c.name)}</div>
          <span class="cell-title">${c.name}</span>
        </div>
      </td>
      <td>${c.email}</td>
      <td>${c.location}</td>
      <td class="num">${c.orders}</td>
      <td class="num"><strong>${money(c.spend)}</strong></td>
      <td>${c.joined}</td>
    </tr>
  `).join("");
}

function initCustomersModule() {
  const searchInput = document.getElementById("customerSearch");
  if (searchInput) {
    searchInput.addEventListener("input", renderCustomers);
  }
}

