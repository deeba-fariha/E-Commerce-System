/**
 * ============================================================================
 * ADMIN PANEL - CATEGORIES SECTION (js/categories.js)
 * ============================================================================
 * Categories are stored in the database:
 *   GET  /api/admin/categories                 list + product counts
 *   POST /api/admin/categories                 add
 *   GET  /api/admin/categories/{id}/products   all products in one category
 *        ?status=approved|pending|declined &added_by=admin|seller &search=
 *
 * A category added here shows up on the home page (search dropdown,
 * filter pills, footer) and in the seller/admin Add Product forms.
 */

/** Categories loaded from the backend (also used by products-form.js) */
let adminCategories = [];

// Category shown in the detail view (null = the cards grid)
let currentCategoryView = null;
let categoryProductsSearchTimer = null;

const PRODUCT_STATUS_LABELS = {
  Approved: { label: "Approved", cls: "green" },
  Pending: { label: "Pending", cls: "gold" },
  Rejected: { label: "Declined", cls: "red" }
};

function categoryIconHtml(category) {
  if (category.image) {
    return `<img src="${escapeHtml(apiAssetUrl(category.image))}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
  }
  return `<i class="${ApexCategories.iconClass(category)}" style="font-size: 18px;"></i>`;
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date)
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadAdminCategories() {
  adminCategories = await adminApi("/api/admin/categories");
  return adminCategories;
}

// ----------------------------------------------------------------------------
// CATEGORY CARDS
// ----------------------------------------------------------------------------

async function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  const productsView = document.getElementById("categoryProductsView");
  if (!grid || !productsView) return;

  if (currentCategoryView) {
    grid.style.display = "none";
    productsView.style.display = "block";
    renderCategoryDetail();
    return;
  }

  grid.style.display = "grid";
  productsView.style.display = "none";

  try {
    await loadAdminCategories();
  } catch (error) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--red); background: var(--panel); border: 1px solid var(--line); border-radius: 6px;">
        Could not load categories: ${escapeHtml(apiErrorMessage(error))}
      </div>
    `;
    return;
  }

  if (adminCategories.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: 6px;">
        No categories yet. Click "+ Add New Category" to create one.
      </div>
    `;
    return;
  }

  grid.innerHTML = adminCategories.map(c => `
    <div class="category-card">
      <div class="category-icon">${categoryIconHtml(c)}</div>
      <div>
        <div class="category-name">${escapeHtml(c.name)}</div>
        <div class="category-count">${c.product_count} product${c.product_count === 1 ? "" : "s"}</div>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <span class="badge green" title="Live on the home page">${c.approved_count} live</span>
        ${c.pending_count ? `<span class="badge gold">${c.pending_count} pending</span>` : ""}
        ${c.declined_count ? `<span class="badge red">${c.declined_count} declined</span>` : ""}
      </div>
      <div class="category-foot" style="gap: 8px;">
        <span title="/${escapeHtml(c.slug)}" style="font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">/${escapeHtml(c.slug)}</span>
        <button class="btn small primary-soft" data-view-cat="${c.id}" style="white-space: nowrap; flex-shrink: 0;">
          <svg viewBox="0 0 20 20" style="width:14px;height:14px;margin-right:4px;"><path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 6.5V14l7 3 7-3V6.5M10 10v7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          View products
        </button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-view-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategoryView = adminCategories.find(c => c.id === Number(btn.dataset.viewCat));
      renderCategories();
    });
  });
}

// ----------------------------------------------------------------------------
// CATEGORY DETAIL VIEW (all products, admin + seller, with filters)
// ----------------------------------------------------------------------------

function renderCategoryDetail() {
  const view = document.getElementById("categoryProductsView");
  const cat = currentCategoryView;

  view.innerHTML = `
    <div class="toolbar" style="margin-bottom: 16px;">
      <button class="btn secondary small" id="btnBackToCategories">
        <svg viewBox="0 0 20 20" style="width:14px;height:14px;margin-right:4px;"><path d="M12.5 15 7.5 10l5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to Categories
      </button>

      <div class="category-icon" style="flex-shrink: 0;">${categoryIconHtml(cat)}</div>
      <div>
        <h2 style="font-size: 16px; font-weight: 700; color: var(--text);">${escapeHtml(cat.name)}</h2>
        <span style="font-size: 12px; color: var(--muted);" id="categoryProductsCount">Loading…</span>
      </div>

      <button class="btn primary" id="btnAddProductInCat" style="margin-left: auto;">
        + Add product to ${escapeHtml(cat.name)}
      </button>
    </div>

    <!-- Filters -->
    <div class="toolbar">
      <div class="search small">
        <svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m16 16-3.4-3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="text" id="catProductSearch" placeholder="Search by product name…" aria-label="Search products by name">
      </div>

      <select id="catProductStatus" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
        <option value="declined">Declined</option>
      </select>

      <select id="catProductAddedBy" aria-label="Filter by who added the product">
        <option value="">Added by anyone</option>
        <option value="admin">Admin</option>
        <option value="seller">Sellers</option>
      </select>
    </div>

    <div class="panel no-pad">
      <div class="table-wrap">
        <table class="data-table" id="categoryProductsTable">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th class="num">Price</th>
              <th class="num">Stock</th>
              <th>Added By</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("btnBackToCategories").addEventListener("click", () => {
    currentCategoryView = null;
    renderCategories();
  });

  document.getElementById("btnAddProductInCat").addEventListener("click", () => {
    openProductModal(cat.id, () => loadCategoryProducts());
  });

  document.getElementById("catProductSearch").addEventListener("input", () => {
    clearTimeout(categoryProductsSearchTimer);
    categoryProductsSearchTimer = setTimeout(loadCategoryProducts, 300);
  });
  document.getElementById("catProductStatus").addEventListener("change", loadCategoryProducts);
  document.getElementById("catProductAddedBy").addEventListener("change", loadCategoryProducts);

  loadCategoryProducts();
}

function categoryProductsMessage(message, color = "var(--muted)") {
  return `
    <tr>
      <td colspan="7" style="text-align: center; color: ${color}; padding: 40px;">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

async function loadCategoryProducts() {
  const cat = currentCategoryView;
  const tbody = document.querySelector("#categoryProductsTable tbody");
  const countEl = document.getElementById("categoryProductsCount");
  if (!cat || !tbody) return;

  const params = new URLSearchParams();
  const search = document.getElementById("catProductSearch").value.trim();
  const status = document.getElementById("catProductStatus").value;
  const addedBy = document.getElementById("catProductAddedBy").value;
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (addedBy) params.set("added_by", addedBy);

  const filtered = params.toString() !== "";
  tbody.innerHTML = categoryProductsMessage("Loading products…");

  let products;
  try {
    products = await adminApi(`/api/admin/categories/${cat.id}/products?${params}`);
  } catch (error) {
    tbody.innerHTML = categoryProductsMessage(
      "Could not load products: " + apiErrorMessage(error),
      "var(--red)"
    );
    countEl.textContent = "";
    return;
  }

  // Ignore a slow response if the admin already left this category
  if (currentCategoryView !== cat) return;

  countEl.textContent = filtered
    ? `${products.length} matching product(s)`
    : `${products.length} product(s) from admin and sellers`;

  if (products.length === 0) {
    tbody.innerHTML = categoryProductsMessage(
      filtered
        ? "No products match these filters."
        : `No products in "${cat.name}" yet. Click "+ Add product" to add one.`
    );
    return;
  }

  tbody.innerHTML = products.map(p => {
    const status = PRODUCT_STATUS_LABELS[p.status] || { label: p.status, cls: "grey" };
    const addedBy = p.added_by_role === "admin"
      ? `<span class="badge blue">Admin</span>`
      : `<span class="seller-tag" style="background: var(--canvas); border: 1px solid var(--line); padding: 4px 8px; border-radius: 4px; font-size: 12.5px; font-weight: 500;">
           <svg viewBox="0 0 20 20" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"><path d="M3 6h14l-1.5 10h-11L3 6Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
           ${escapeHtml(p.seller_store_name || "Unknown seller")}
         </span>`;

    return `
      <tr>
        <td>
          <img src="${escapeHtml(productImageUrl(p.image))}" alt=""
               style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line);">
        </td>
        <td>
          <strong style="color: var(--text); display: block;">${escapeHtml(p.name)}</strong>
          <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--muted);">P-${p.id}</span>
        </td>
        <td class="num"><strong>${money(Number(p.price))}</strong></td>
        <td class="num">${p.stock > 0 ? p.stock : '<span class="badge red">Out of stock</span>'}</td>
        <td>${addedBy}</td>
        <td><span class="badge ${status.cls}">${status.label}</span></td>
        <td>${formatShortDate(p.created_at)}</td>
      </tr>
    `;
  }).join("");
}

// ----------------------------------------------------------------------------
// ADD CATEGORY / ADD PRODUCT BUTTONS
// ----------------------------------------------------------------------------

/**
 * "+ Add New Category" modal: name (required), slug, icon, image.
 * "+ Add Product" opens the product form (products-form.js).
 */
function initAddCategoryButton() {
  document.getElementById("addProductBtn")?.addEventListener("click", () => {
    openProductModal(null, () => renderCategories());
  });

  const addCatBtn = document.getElementById("addCategoryBtn");
  if (!addCatBtn) return;

  addCatBtn.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Add New Category";
    document.getElementById("modalBody").innerHTML = `
      <form id="addCategoryForm" style="display: flex; flex-direction: column; gap: 14px;">
        <label>
          Category Name *
          <input type="text" id="mCatName" maxlength="100" placeholder="e.g. Stationery, Footwear, Jewelry" required>
        </label>

        <label>
          Slug <span style="color: var(--muted); font-weight: 400;">(optional — used in links and filters)</span>
          <input type="text" id="mCatSlug" maxlength="120" placeholder="auto from name">
        </label>

        <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end;">
          <label>
            Icon <span style="color: var(--muted); font-weight: 400;">(optional <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener">Bootstrap Icons</a> name)</span>
            <input type="text" id="mCatIcon" maxlength="60" placeholder="e.g. book, gem, bicycle">
          </label>
          <div class="category-icon" id="mCatIconPreview" title="Icon preview"><i class="bi bi-tag" style="font-size: 18px;"></i></div>
        </div>

        <label>
          Image URL <span style="color: var(--muted); font-weight: 400;">(optional — shown instead of the icon)</span>
          <input type="url" id="mCatImage" maxlength="1000" placeholder="https://…">
        </label>

        <div class="modal-foot">
          <button type="button" class="btn" id="mCancelCat">Cancel</button>
          <button type="submit" class="btn primary" id="mSaveCat">Add Category</button>
        </div>
      </form>
    `;

    openModal();

    const nameInput = document.getElementById("mCatName");
    const slugInput = document.getElementById("mCatSlug");
    const iconInput = document.getElementById("mCatIcon");
    const iconPreview = document.getElementById("mCatIconPreview");

    nameInput.focus();

    // Show the slug that will be generated, until the admin types their own
    nameInput.addEventListener("input", () => {
      slugInput.placeholder = slugify(nameInput.value) || "auto from name";
    });

    iconInput.addEventListener("input", () => {
      const name = iconInput.value.trim().replace(/^bi-/, "");
      iconPreview.innerHTML = `<i class="${ApexCategories.iconClass({ icon: name })}" style="font-size: 18px;"></i>`;
    });

    document.getElementById("mCancelCat").addEventListener("click", closeModal);

    document.getElementById("addCategoryForm").addEventListener("submit", async event => {
      event.preventDefault();

      const name = nameInput.value.trim();
      if (!name) {
        showToast("Please enter a category name");
        return;
      }

      const saveBtn = document.getElementById("mSaveCat");
      saveBtn.disabled = true;

      try {
        const category = await adminApi("/api/admin/categories", {
          method: "POST",
          body: {
            name,
            slug: slugInput.value.trim() || null,
            icon: iconInput.value.trim() || null,
            image: document.getElementById("mCatImage").value.trim() || null
          }
        });

        closeModal();
        showToast(`Category "${category.name}" added — it is now on the home page`);
        currentCategoryView = null;
        renderCategories();
      } catch (error) {
        // e.g. 'A category named "Books" already exists.' — keep the form open
        showToast(apiErrorMessage(error, "Could not add category"));
        saveBtn.disabled = false;
      }
    });
  });
}

/** Same rule as the backend: "Home & Living" -> "home-living" */
function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
