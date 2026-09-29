/**
 * ============================================================================
 * ADMIN PANEL - CATEGORIES & CATEGORY PRODUCTS SECTION (js/categories.js)
 * ============================================================================
 * Manages category cards, category deletion popup modal, and the product listing
 * associated with each category.
 *
 * Requirements fulfilled:
 * 1. Category cards red delete button with "delete this category?" modal pop-up
 *    with "Yes" and "Cancel" buttons.
 * 2. Clicking "View products" shows products in that category with columns:
 *    Product ID, Image (small view), Product Name, Stock Amount, Price, Seller Business Name,
 *    and Edit/Delete buttons at the right.
 */

// Track current active category view (null if viewing all category cards)
let currentCategoryView = null;
let categoryToDeleteId = null;

/**
 * Renders the main category cards list or category products view.
 */
function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  const productsView = document.getElementById("categoryProductsView");
  
  if (!grid || !productsView) return;

  if (currentCategoryView) {
    // Hide category cards grid, show category products view
    grid.style.display = "none";
    productsView.style.display = "block";
    renderProductsForCategory(currentCategoryView);
  } else {
    // Show category cards grid, hide category products view
    grid.style.display = "grid";
    productsView.style.display = "none";
    
    // Render Category Cards
    grid.innerHTML = categories.map(c => {
      // Calculate active products count for this category dynamically
      const catProductCount = products.filter(p => p.category === c.name).length;
      
      return `
        <div class="category-card">
          <div class="category-icon">${c.name[0]}</div>
          <div>
            <div class="category-name">${c.name}</div>
            <div class="category-count">${catProductCount} products</div>
          </div>
          <div class="category-foot">
            <button class="btn small primary-soft" data-view-cat="${c.name}">
              <svg viewBox="0 0 20 20" style="width:14px;height:14px;margin-right:4px;"><path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 6.5V14l7 3 7-3V6.5M10 10v7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
              View products
            </button>
            
            <!-- Red Delete Icon Button -->
            <button class="icon-action danger-red" data-del-cat="${c.id}" data-cat-name="${c.name}" title="Delete Category">
              <svg viewBox="0 0 20 20"><path d="M5 6h10M8 6V4.5h4V6M6 6l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Attach Event Listeners for "View products"
    grid.querySelectorAll("[data-view-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCategoryView = btn.dataset.viewCat;
        renderCategories();
      });
    });

    // Attach Event Listeners for "Delete category" (Triggers Pop-up Modal)
    grid.querySelectorAll("[data-del-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        const catId = btn.dataset.delCat;
        const catName = btn.dataset.catName;
        openCategoryDeleteModal(catId, catName);
      });
    });
  }
}

/**
 * Opens the custom "Delete this category?" pop-up modal with Yes and Cancel buttons.
 * @param {string|number} catId - Category ID
 * @param {string} catName - Category Name
 */
function openCategoryDeleteModal(catId, catName) {
  categoryToDeleteId = catId;

  document.getElementById("modalTitle").textContent = "Confirm Deletion";
  document.getElementById("modalBody").innerHTML = `
    <!-- Category Deletion Pop-up Confirmation Modal -->
    <div class="confirm-delete-box" style="text-align: center; padding: 15px 10px;">
      <div style="width: 50px; height: 50px; background: #F7E7E2; color: #C1553D; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
        <svg viewBox="0 0 20 20" style="width: 24px; height: 24px;"><path d="M5 6h10M8 6V4.5h4V6M6 6l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h3 style="font-size: 17px; margin-bottom: 8px; color: var(--text);">Delete this category?</h3>
      <p style="font-size: 13.5px; color: var(--muted); margin-bottom: 20px;">
        Are you sure you want to delete category <strong>"${catName}"</strong>? This action cannot be undone.
      </p>
      
      <!-- Action Buttons: Yes and Cancel -->
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="btn" id="btnCancelCatDelete" style="min-width: 100px;">Cancel</button>
        <button class="btn danger" id="btnConfirmCatDelete" style="min-width: 100px;">Yes, Delete</button>
      </div>
    </div>
  `;

  openModal();

  // Cancel Button Handler
  document.getElementById("btnCancelCatDelete").addEventListener("click", closeModal);

  // Yes Button Handler
  document.getElementById("btnConfirmCatDelete").addEventListener("click", () => {
    const idx = categories.findIndex(c => c.id == categoryToDeleteId);
    if (idx !== -1) {
      categories.splice(idx, 1);
      renderCategories();
      closeModal();
      showToast("Category deleted successfully");
    }
  });
}

/**
 * Renders the products belonging to a specific category.
 * List columns: Product ID, Product Image (small view), Product Name, Stock Amount, Price, Seller Business Name, Edit & Delete buttons.
 * @param {string} catName - Name of the selected category
 */
function renderProductsForCategory(catName) {
  const productsView = document.getElementById("categoryProductsView");
  if (!productsView) return;

  const catProducts = products.filter(p => p.category === catName);

  productsView.innerHTML = `
    <!-- Category View Header -->
    <div class="toolbar" style="margin-bottom: 16px;">
      <button class="btn secondary small" id="btnBackToCategories">
        <svg viewBox="0 0 20 20" style="width:14px;height:14px;margin-right:4px;"><path d="M12.5 15 7.5 10l5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to Categories
      </button>
      
      <div style="margin-left: 10px;">
        <h2 style="font-size: 16px; font-weight: 700; color: var(--text);">${catName}</h2>
        <span style="font-size: 12px; color: var(--muted);">${catProducts.length} items available</span>
      </div>

      <button class="btn primary" id="btnAddProductInCat" style="margin-left: auto;">
        + Add product to ${catName}
      </button>
    </div>

    <!-- Category Products Table -->
    <div class="panel no-pad">
      <div class="table-wrap">
        <table class="data-table" id="categoryProductsTable">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Stock Amount</th>
              <th class="num">Price</th>
              <th>Seller (Business Name)</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${catProducts.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; color: var(--muted); padding: 40px;">
                  No products found in category "${catName}". Click "+ Add product" to list items.
                </td>
              </tr>
            ` : catProducts.map(p => `
              <tr>
                <!-- Product ID -->
                <td><span style="font-family: var(--font-mono); font-weight: 600;">${p.id}</span></td>
                
                <!-- Product Image (Small View) -->
                <td>
                  <div class="product-thumb-small">
                    <img src="${p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80'}" 
                         alt="${p.name}" 
                         style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line);">
                  </div>
                </td>
                
                <!-- Product Name -->
                <td>
                  <strong style="color: var(--text); display: block;">${p.name}</strong>
                </td>
                
                <!-- Stock Amount -->
                <td>
                  ${p.stock > 0 
                    ? `<span class="badge green">${p.stock} in stock</span>`
                    : `<span class="badge red">Out of stock (0)</span>`
                  }
                </td>
                
                <!-- Price -->
                <td class="num"><strong>${money(p.price)}</strong></td>
                
                <!-- Seller Business Name -->
                <td>
                  <span class="seller-tag" style="background: var(--canvas); border: 1px solid var(--line); padding: 4px 8px; border-radius: 4px; font-size: 12.5px; font-weight: 500;">
                    <svg viewBox="0 0 20 20" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"><path d="M3 6h14l-1.5 10h-11L3 6Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
                    ${p.sellerName || 'Apex Store Direct'}
                  </span>
                </td>
                
                <!-- Edit & Delete Buttons at Right of Row -->
                <td style="text-align: right;">
                  <div class="row-actions" style="justify-content: flex-end;">
                    <!-- Edit Button -->
                    <button class="icon-action" title="Edit Product" data-edit-prod="${p.id}">
                      <svg viewBox="0 0 20 20"><path d="M4 15.5 4.7 12l8-8 3.3 3.3-8 8L4 15.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
                    </button>
                    <!-- Delete Button -->
                    <button class="icon-action danger-red" title="Delete Product" data-del-prod="${p.id}">
                      <svg viewBox="0 0 20 20"><path d="M5 6h10M8 6V4.5h4V6M6 6l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Handler for "Back to Categories"
  document.getElementById("btnBackToCategories").addEventListener("click", () => {
    currentCategoryView = null;
    renderCategories();
  });

  // Attach Handler for "+ Add Product to this Category"
  document.getElementById("btnAddProductInCat").addEventListener("click", () => {
    openProductModal(null, catName);
  });

  // Attach Handlers for Edit Product
  productsView.querySelectorAll("[data-edit-prod]").forEach(btn => {
    btn.addEventListener("click", () => {
      openProductModal(btn.dataset.editProd);
    });
  });

  // Attach Handlers for Delete Product
  productsView.querySelectorAll("[data-del-prod]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = btn.dataset.delProd;
      if (confirm(`Are you sure you want to delete product ${pId}?`)) {
        products = products.filter(p => p.id !== pId);
        renderProductsForCategory(catName);
        showToast("Product deleted successfully");
      }
    });
  });
}

/**
 * Opens modal for adding a new category card.
 */
function initAddCategoryButton() {
  const addCatBtn = document.getElementById("addCategoryBtn");
  if (!addCatBtn) return;

  addCatBtn.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Add New Category";
    document.getElementById("modalBody").innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <label>
          Category Name
          <input type="text" id="mCatName" placeholder="e.g. Stationery, Footwear, Jewelry">
        </label>
        
        <div class="modal-foot">
          <button class="btn" id="mCancelCat">Cancel</button>
          <button class="btn primary" id="mSaveCat">Add Category</button>
        </div>
      </div>
    `;

    openModal();

    document.getElementById("mCancelCat").addEventListener("click", closeModal);
    document.getElementById("mSaveCat").addEventListener("click", () => {
      const name = document.getElementById("mCatName").value.trim();
      if (!name) {
        showToast("Please enter a category name");
        return;
      }
      categories.push({ id: Date.now(), name, count: 0 });
      renderCategories();
      closeModal();
      showToast(`Category "${name}" added successfully!`);
    });
  });
}

