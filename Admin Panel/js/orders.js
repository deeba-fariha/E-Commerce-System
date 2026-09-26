/**
 * ============================================================================
 * ADMIN PANEL - ORDERS SECTION (js/orders.js)
 * ============================================================================
 * Manages rendering orders, status filtering, and viewing order details modals.
 */

let orderStatusFilter = "";

function renderOrders() {
  const searchInput = document.getElementById("orderSearch");
  const search = (searchInput ? searchInput.value : "").toLowerCase();
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  const filtered = orders.filter(o =>
    (!search || o.id.toLowerCase().includes(search) || o.customer.toLowerCase().includes(search)) &&
    (!orderStatusFilter || o.status === orderStatusFilter)
  );

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; color:var(--muted); padding:30px;">
          No orders match your active filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.items} items</td>
      <td>${o.date}</td>
      <td>${o.payment}</td>
      <td>${statusBadge(o.status)}</td>
      <td class="num"><strong>${money(o.total)}</strong></td>
      <td>
        <div class="row-actions">
          <button class="icon-action" title="View Order Details" data-view-order="${o.id}">
            <svg viewBox="0 0 20 20"><path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach View Order Modal Event Handler
  tbody.querySelectorAll("[data-view-order]").forEach(btn => {
    btn.addEventListener("click", () => {
      const o = orders.find(x => x.id === btn.dataset.viewOrder);
      if (!o) return;

      document.getElementById("modalTitle").textContent = `Order Details: ${o.id}`;
      document.getElementById("modalBody").innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted);">Customer Name</span><span>${o.customer}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted);">Order Date</span><span>${o.date}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted);">Quantity</span><span>${o.items} items</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted);">Payment Method</span><span>${o.payment}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--muted);">Current Status</span>${statusBadge(o.status)}</div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 12px; margin-top: 4px;"><span style="color: var(--muted);">Grand Total</span><strong style="font-size: 16px; color: var(--text);">${money(o.total)}</strong></div>
        </div>
        <div class="modal-foot" style="margin-top: 16px;">
          <button class="btn" id="mCloseOrder">Close</button>
        </div>
      `;

      openModal();
      document.getElementById("mCloseOrder").addEventListener("click", closeModal);
    });
  });
}

function initOrdersModule() {
  const searchInput = document.getElementById("orderSearch");
  if (searchInput) {
    searchInput.addEventListener("input", renderOrders);
  }

  const statusContainer = document.getElementById("orderStatusFilter");
  if (statusContainer) {
    statusContainer.addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document.querySelectorAll("#orderStatusFilter .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      orderStatusFilter = chip.dataset.status;
      renderOrders();
    });
  }
}

