/**
 * ============================================================================
 * ADMIN PANEL - SELLERS MANAGEMENT SECTION (js/sellers.js)
 * ============================================================================
 * Manages seller registrations, seller listing cards, detailed seller profiles,
 * and seller product request approvals/declines.
 *
 * Requirements fulfilled:
 * 1. Admin can view how many sellers are currently registered.
 * 2. Form to add/register new sellers.
 * 3. Shows Seller ID, Store/Business Name, Owner Name, Product Category.
 * 4. Clicking a seller info card navigates to the detail page showing:
 *    - All seller details
 *    - Requested product list with "Approve" and "Decline" buttons
 *    - Approved live products list
 * 5. Approving a request makes the product live on the website!
 */

let activeSellerDetailId = null;

/**
 * Main render function for the Sellers module.
 */
function renderSellers() {
  const container = document.getElementById("sellersContent");
  if (!container) return;

  if (activeSellerDetailId) {
    // Render Seller Detail View
    renderSellerDetailView(activeSellerDetailId);
  } else {
    // Render Sellers List View
    renderSellersListView();
  }
}

/**
 * Renders the Sellers List page with count summary, registration button, and info cards.
 */
function renderSellersListView() {
  const container = document.getElementById("sellersContent");
  const search = (document.getElementById("sellerSearchInput")?.value || "").toLowerCase();

  const filteredSellers = sellers.filter(s =>
    !search ||
    s.storeName.toLowerCase().includes(search) ||
    s.ownerName.toLowerCase().includes(search) ||
    s.id.toLowerCase().includes(search) ||
    s.category.toLowerCase().includes(search)
  );

  container.innerHTML = `
    <!-- Top Toolbar: Registered Sellers Counter & Register Button -->
    <div class="toolbar" style="margin-bottom: 20px; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="search small">
          <svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m16 16-3.4-3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input type="text" id="sellerSearchInput" placeholder="Search sellers by store, ID, or owner…" value="${search}">
        </div>

        <!-- Currently Registered Sellers Count Badge -->
        <div class="seller-count-badge" style="background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(255,94,0,0.3); padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 13px;">
          Registered Sellers: <strong>${sellers.length}</strong>
        </div>
      </div>

      <!-- Add/Register New Seller Button -->
      <button class="btn primary" id="btnRegisterNewSeller">
        <svg viewBox="0 0 20 20" style="width: 15px; height: 15px; margin-right: 4px;"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Register New Seller
      </button>
    </div>

    <!-- Sellers Info Cards Grid -->
    <div class="seller-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
      ${filteredSellers.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: 6px;">
          No sellers found matching your search.
        </div>
      ` : filteredSellers.map(s => {
        // Calculate pending requests count
        const pendingCount = (s.productRequests || []).filter(r => r.status === "Pending").length;
        
        return `
          <div class="seller-card" style="background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.15s ease;">
            <div>
              <!-- Seller ID & Status Badge -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-family: var(--font-mono); font-size: 12px; color: var(--muted); font-weight: 600; background: var(--canvas); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--line);">${s.id}</span>
                ${statusBadge(s.status)}
              </div>

              <!-- Store/Business Name -->
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px;">${s.storeName}</h3>
              
              <!-- Owner & Category Details -->
              <div style="font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.5;">
                <div><strong>Owner:</strong> ${s.ownerName}</div>
                <div><strong>Category:</strong> <span style="color: var(--accent); font-weight: 600;">${s.category}</span></div>
                <div><strong>Email:</strong> ${s.email}</div>
              </div>
            </div>

            <!-- Card Footer & View Details Button -->
            <div style="border-top: 1px solid var(--line); padding-top: 14px; margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
              ${pendingCount > 0 ? `
                <span class="badge gold" style="font-size: 11.5px;">${pendingCount} Product Request(s)</span>
              ` : `
                <span class="badge grey" style="font-size: 11.5px;">No Requests Pending</span>
              `}

              <!-- Button to view seller details -->
              <button class="btn small primary-soft" data-view-seller="${s.id}">
                View Details →
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Attach search listener
  document.getElementById("sellerSearchInput")?.addEventListener("input", renderSellersListView);

  // Attach Register Seller modal listener
  document.getElementById("btnRegisterNewSeller")?.addEventListener("click", openRegisterSellerModal);

  // Attach View Details handlers
  container.querySelectorAll("[data-view-seller]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeSellerDetailId = btn.dataset.viewSeller;
      renderSellers();
    });
  });
}

/**
 * Opens modal dialog to register a new seller.
 */
function openRegisterSellerModal() {
  document.getElementById("modalTitle").textContent = "Register New Seller";
  document.getElementById("modalBody").innerHTML = `
    <!-- Seller Registration Form -->
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <label>
        Store / Business Name *
        <input type="text" id="regStoreName" placeholder="e.g. Apex Artisans Ltd.">
      </label>
      
      <label>
        Owner Full Name *
        <input type="text" id="regOwnerName" placeholder="e.g. Rahim Uddin">
      </label>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label>
          Email Address *
          <input type="email" id="regEmail" placeholder="e.g. seller@store.com">
        </label>
        
        <label>
          Phone Number *
          <input type="text" id="regPhone" placeholder="e.g. +880 1700-000000">
        </label>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label>
          Primary Product Category *
          <select id="regCategory">
            ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
          </select>
        </label>
        
        <label>
          Business Location
          <input type="text" id="regLocation" placeholder="e.g. Dhaka, Bangladesh">
        </label>
      </div>

      <!-- Action Buttons -->
      <div class="modal-foot" style="margin-top: 10px;">
        <button class="btn" id="btnCancelRegSeller">Cancel</button>
        <button class="btn primary" id="btnSubmitRegSeller">Register Seller</button>
      </div>
    </div>
  `;

  openModal();

  document.getElementById("btnCancelRegSeller").addEventListener("click", closeModal);
  document.getElementById("btnSubmitRegSeller").addEventListener("click", () => {
    const storeName = document.getElementById("regStoreName").value.trim();
    const ownerName = document.getElementById("regOwnerName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const category = document.getElementById("regCategory").value;
    const location = document.getElementById("regLocation").value.trim() || "Dhaka, Bangladesh";

    if (!storeName || !ownerName || !email) {
      showToast("Please fill in all required fields (*)");
      return;
    }

    // Create new seller object
    const newSeller = {
      id: "SEL-" + (100 + sellers.length + 1),
      storeName,
      ownerName,
      email,
      phone,
      category,
      location,
      joinedDate: new Date().toISOString().split("T")[0],
      status: "Active",
      productRequests: []
    };

    sellers.unshift(newSeller);
    closeModal();
    renderSellers();
    showToast(`Seller "${storeName}" registered successfully!`);
  });
}

/**
 * Renders detailed page view for a selected seller.
 * Displays seller info, requested product approval queue (with Approve/Decline buttons), and approved live products list.
 * @param {string} sellerId - Selected Seller ID
 */
function renderSellerDetailView(sellerId) {
  const container = document.getElementById("sellersContent");
  const seller = sellers.find(s => s.id === sellerId);

  if (!seller) {
    activeSellerDetailId = null;
    renderSellersListView();
    return;
  }

  // Get live products belonging to this seller
  const liveSellerProducts = products.filter(p => p.sellerId === seller.id || p.sellerName === seller.storeName);
  const pendingRequests = (seller.productRequests || []).filter(r => r.status === "Pending");

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
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text);">${seller.storeName}</h2>
            ${statusBadge(seller.status)}
          </div>
          <p style="font-size: 13px; color: var(--muted); margin: 0;">
            Seller ID: <strong style="font-family: var(--font-mono); color: var(--text);">${seller.id}</strong> | Registered on ${seller.joinedDate}
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
        </div>
      </div>

      <!-- Seller Info Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Owner Name</span>
          <strong style="font-size: 14px; color: var(--text);">${seller.ownerName}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Contact Email</span>
          <strong style="font-size: 14px; color: var(--text);">${seller.email}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Phone Number</span>
          <strong style="font-size: 14px; color: var(--text);">${seller.phone}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Primary Category</span>
          <strong style="font-size: 14px; color: var(--accent);">${seller.category}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">Business Address</span>
          <strong style="font-size: 14px; color: var(--text);">${seller.location}</strong>
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
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${pendingRequests.map(req => `
            <div style="display: flex; flex-wrap: wrap; gap: 16px; border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: var(--panel); align-items: center; justify-content: space-between;">
              <div style="display: flex; gap: 14px; align-items: center; max-width: 600px;">
                <img src="${req.image}" alt="${req.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); flex-shrink: 0;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <strong style="font-size: 15px; color: var(--text);">${req.name}</strong>
                    <span class="badge gold">Pending Review</span>
                  </div>
                  <div style="font-size: 13px; color: var(--muted); margin-bottom: 6px;">
                    Category: <strong>${req.category}</strong> | Requested Price: <strong style="color: var(--accent);">${money(req.price)}</strong> | Initial Stock: <strong>${req.stock}</strong>
                  </div>
                  <p style="font-size: 12.5px; color: var(--text); margin: 0; background: var(--canvas); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--line);">
                    <strong>Details & FAQs:</strong> ${req.details}
                  </p>
                </div>
              </div>

              <!-- Approval Actions: Approve & Decline -->
              <div style="display: flex; gap: 10px; align-items: center;">
                <button class="btn danger small" data-decline-req="${req.id}">
                  Decline
                </button>
                <button class="btn primary small" data-approve-req="${req.id}" style="background: var(--success); border-color: var(--success);">
                  <svg viewBox="0 0 20 20" style="width: 14px; height: 14px; margin-right: 4px;"><path d="M4 10l4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Approve & Make Live
                </button>
              </div>
            </div>
          `).join("")}
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
                <td><span style="font-family: var(--font-mono); font-weight: 600;">${p.id}</span></td>
                <td>
                  <img src="${p.image}" alt="${p.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line);">
                </td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td class="num"><strong>${money(p.price)}</strong></td>
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

  // Attach Approve Request Handler
  container.querySelectorAll("[data-approve-req]").forEach(btn => {
    btn.addEventListener("click", () => {
      const reqId = btn.dataset.approveReq;
      const req = seller.productRequests.find(r => r.id === reqId);

      if (req) {
        req.status = "Approved";

        // Create new live product entry
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
        renderSellerDetailView(sellerId);
        showToast(`Product "${req.name}" approved! It is now live on the website.`);
      }
    });
  });

  // Attach Decline Request Handler
  container.querySelectorAll("[data-decline-req]").forEach(btn => {
    btn.addEventListener("click", () => {
      const reqId = btn.dataset.declineReq;
      const req = seller.productRequests.find(r => r.id === reqId);

      if (req && confirm(`Decline product request for "${req.name}"?`)) {
        req.status = "Declined";
        renderSellerDetailView(sellerId);
        showToast(`Product request for "${req.name}" declined.`);
      }
    });
  });
}

