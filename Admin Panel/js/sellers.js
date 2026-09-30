/**
 * ============================================================================
 * ADMIN PANEL - SELLERS MANAGEMENT SECTION (js/sellers.js)
 * ============================================================================
 * Shows registered sellers and their product requests, loaded from the database.
 *
 * 1. Admin can view how many sellers are currently registered.
 * 2. Seller info cards show Seller ID, Store Name, Category, Email and the
 *    number of pending product requests.
 * 3. Clicking a seller card opens the detail page showing:
 *    - All seller details
 *    - Requested product list with "Approve" and "Decline" buttons
 *    - Approved live products list
 * 4. Approving a request sets the product status to "Approved" in the DB,
 *    which makes it show on the homepage.
 *
 * Sellers register themselves from account/seller_form.html.
 */

let activeSellerDetailId = null;

/** Sellers loaded from GET /api/admin/sellers (cached for client-side search) */
let sellerDirectory = [];

const sellerDisplayId = id => "SEL-" + String(id).padStart(3, "0");

/**
 * Main render function for the Sellers module.
 */
function renderSellers() {
  const container = document.getElementById("sellersContent");
  if (!container) return;

  if (activeSellerDetailId) {
    renderSellerDetailView(activeSellerDetailId);
  } else {
    loadSellersListView();
  }
}

/**
 * Fetches sellers with product counts, then renders the list.
 */
async function loadSellersListView() {
  const container = document.getElementById("sellersContent");

  try {
    sellerDirectory = await adminApi("/api/admin/sellers");
  } catch (err) {
    console.error("Sellers load error:", err);
    container.innerHTML = `
      <div class="panel" style="text-align: center; padding: 40px; color: var(--muted);">
        Could not load sellers. Make sure the FastAPI backend is running.
      </div>
    `;
    return;
  }

  renderSellersListView();
}

/**
 * Renders the Sellers List page with count summary and info cards.
 */
function renderSellersListView() {
  const container = document.getElementById("sellersContent");
  const search = (document.getElementById("sellerSearchInput")?.value || "").toLowerCase();

  const filteredSellers = sellerDirectory.filter(s =>
    !search ||
    s.store_name.toLowerCase().includes(search) ||
    s.email.toLowerCase().includes(search) ||
    sellerDisplayId(s.id).toLowerCase().includes(search) ||
    s.category.toLowerCase().includes(search)
  );

  const totalPending = sellerDirectory.reduce((sum, s) => sum + s.pending_products, 0);

  container.innerHTML = `
    <!-- Top Toolbar: Search & Registered Sellers Counter -->
    <div class="toolbar" style="margin-bottom: 20px; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="search small">
          <svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m16 16-3.4-3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input type="text" id="sellerSearchInput" placeholder="Search sellers by store, ID, email or category…" value="${escapeHtml(search)}">
        </div>

        <!-- Currently Registered Sellers Count Badge -->
        <div class="seller-count-badge" style="background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(255,94,0,0.3); padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 13px;">
          Registered Sellers: <strong>${sellerDirectory.length}</strong>
        </div>
      </div>

      <span class="badge ${totalPending > 0 ? "gold" : "grey"}">${totalPending} product request(s) pending</span>
    </div>

    <!-- Sellers Info Cards Grid -->
    <div class="seller-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
      ${filteredSellers.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: 6px;">
          ${sellerDirectory.length === 0 ? "No sellers have registered yet." : "No sellers found matching your search."}
        </div>
      ` : filteredSellers.map(s => `
          <div class="seller-card" style="background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.15s ease;">
            <div>
              <!-- Seller ID & Live Products -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-family: var(--font-mono); font-size: 12px; color: var(--muted); font-weight: 600; background: var(--canvas); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--line);">${sellerDisplayId(s.id)}</span>
                <span class="badge green">${s.approved_products} Live</span>
              </div>

              <!-- Store/Business Name -->
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px;">${escapeHtml(s.store_name)}</h3>

              <!-- Category & Contact Details -->
              <div style="font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.5;">
                <div><strong>Category:</strong> <span style="color: var(--accent); font-weight: 600;">${escapeHtml(s.category)}</span></div>
                <div><strong>Email:</strong> ${escapeHtml(s.email)}</div>
                <div><strong>Phone:</strong> ${escapeHtml(s.phone)}</div>
              </div>
            </div>

            <!-- Card Footer & View Details Button -->
            <div style="border-top: 1px solid var(--line); padding-top: 14px; margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
              ${s.pending_products > 0 ? `
                <span class="badge gold" style="font-size: 11.5px;">${s.pending_products} Product Request(s)</span>
              ` : `
                <span class="badge grey" style="font-size: 11.5px;">No Requests Pending</span>
              `}

              <button class="btn small primary-soft" data-view-seller="${s.id}">
                View Details →
              </button>
            </div>
          </div>
        `).join("")}
    </div>
  `;

  // Search filters the cached list without re-fetching
  const searchInput = document.getElementById("sellerSearchInput");
  searchInput?.addEventListener("input", () => {
    renderSellersListView();
    const input = document.getElementById("sellerSearchInput");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  // Attach View Details handlers
  container.querySelectorAll("[data-view-seller]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeSellerDetailId = Number(btn.dataset.viewSeller);
      renderSellers();
    });
  });
}

/**
 * Renders detailed page view for a selected seller.
 * Displays seller info, requested product approval queue (with Approve/Decline buttons), and approved live products list.
 * @param {number} sellerId - Selected seller's database ID
 */
async function renderSellerDetailView(sellerId) {
  const container = document.getElementById("sellersContent");

  let seller, sellerProducts;
  try {
    [seller, sellerProducts] = await Promise.all([
      adminApi(`/api/admin/sellers/${sellerId}`),
      adminApi(`/api/admin/products?seller_id=${sellerId}`)
    ]);
  } catch (err) {
    console.error("Seller detail load error:", err);
    showToast(err.message || "Could not load seller details");
    activeSellerDetailId = null;
    loadSellersListView();
    return;
  }

  const pendingRequests = sellerProducts.filter(p => p.status === "Pending");
  const liveSellerProducts = sellerProducts.filter(p => p.status === "Approved");
  const rejectedProducts = sellerProducts.filter(p => p.status === "Rejected");
  const joined = seller.created_at ? String(seller.created_at).split("T")[0] : "—";

  container.innerHTML = `
    <!-- Top Header: Back Button & Title -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <button class="btn secondary small" id="btnBackToSellers">
        <svg viewBox="0 0 20 20" style="width: 14px; height: 14px; margin-right: 4px;"><path d="M12.5 15 7.5 10l5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to Sellers List
      </button>

      <span style="font-size: 13px; color: var(--muted);">Seller Profile Details</span>
    </div>

    <!-- Seller Overview Profile Card -->
    <div class="panel" style="margin-bottom: 24px; padding: 22px;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 6px;">${escapeHtml(seller.store_name)}</h2>
          <p style="font-size: 13px; color: var(--muted); margin: 0;">
            Seller ID: <strong style="font-family: var(--font-mono); color: var(--text);">${sellerDisplayId(seller.id)}</strong> | Registered on ${joined}
          </p>
        </div>

        <div style="display: flex; gap: 16px; background: var(--canvas); padding: 12px 18px; border-radius: 6px; border: 1px solid var(--line);">
          <div>
            <div style="font-size: 11.5px; color: var(--muted);">Live Products</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--text);">${liveSellerProducts.length}</div>
          </div>
          <div style="border-left: 1px solid var(--line); padding-left: 16px;">
            <div style="font-size: 11.5px; color: var(--muted);">Pending Requests</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${pendingRequests.length}</div>
          </div>
          <div style="border-left: 1px solid var(--line); padding-left: 16px;">
            <div style="font-size: 11.5px; color: var(--muted);">Declined</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--text);">${rejectedProducts.length}</div>
          </div>
        </div>
      </div>

      <!-- Seller Info Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Contact Email</span>
          <strong style="font-size: 14px; color: var(--text);">${escapeHtml(seller.email)}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Phone Number</span>
          <strong style="font-size: 14px; color: var(--text);">${escapeHtml(seller.phone)}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Primary Category</span>
          <strong style="font-size: 14px; color: var(--accent);">${escapeHtml(seller.category)}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Revenue Tier</span>
          <strong style="font-size: 14px; color: var(--text);">${escapeHtml(seller.revenue_tier)}</strong>
        </div>
      </div>
    </div>

    <!-- SECTION 1: Product Requests Queue (Pending Approval) -->
    <div class="panel" style="margin-bottom: 24px;">
      <div class="panel-head">
        <h2>Requested Product Listing (Pending Approval)</h2>
        <span class="panel-sub">${pendingRequests.length} request(s) waiting for review</span>
      </div>

      ${pendingRequests.length === 0 ? `
        <div style="text-align: center; padding: 30px; color: var(--muted);">
          No pending product approval requests from this seller.
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 14px;" id="sellerRequestsList">
          ${pendingRequests.map(p => productRequestCard(p, false)).join("")}
        </div>
      `}
    </div>

    <!-- SECTION 2: Approved Live Products List -->
    <div class="panel no-pad">
      <div class="panel-head" style="padding: 16px 20px; margin-bottom: 0;">
        <h2>Approved Live Products on Website</h2>
        <span class="panel-sub">${liveSellerProducts.length} product(s) active</span>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th class="num">Price</th>
              <th class="num">Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${liveSellerProducts.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">
                  No live products approved yet for this seller.
                </td>
              </tr>
            ` : liveSellerProducts.map(p => `
              <tr>
                <td><span style="font-family: var(--font-mono); font-weight: 600;">P-${p.id}</span></td>
                <td>
                  <img src="${escapeHtml(productImageUrl(p.image))}" alt="${escapeHtml(p.name)}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line);">
                </td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.category)}</td>
                <td class="num"><strong>${money(Number(p.price))}</strong></td>
                <td class="num">${p.stock}</td>
                <td><span class="badge green">Live on Store</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Back button listener
  document.getElementById("btnBackToSellers").addEventListener("click", () => {
    activeSellerDetailId = null;
    renderSellers();
  });

  // Approve / Decline — re-render this seller and refresh the dashboard queue
  bindProductRequestActions(container, () => {
    renderSellerDetailView(sellerId);
    if (typeof renderDashboard === "function") renderDashboard();
  });
}
