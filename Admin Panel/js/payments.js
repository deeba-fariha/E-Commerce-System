/**
 * ============================================================================
 * ADMIN PANEL - PAYMENTS SECTION (js/payments.js)
 * ============================================================================
 * Manages rendering payment transactions and financial summary metrics.
 */

function renderPayments() {
  const tbody = document.querySelector("#paymentsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td><span style="font-family: var(--font-mono); font-weight: 600;">${p.id}</span></td>
      <td><strong>${p.order}</strong></td>
      <td>${p.method}</td>
      <td>${p.date}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="num"><strong>${money(p.amount)}</strong></td>
    </tr>
  `).join("");
}

