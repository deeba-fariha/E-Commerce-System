/**
 * ============================================================================
 * ADMIN PANEL - PRODUCT FORM MODAL MODULE (js/products-form.js)
 * ============================================================================
 * Handles the Add Product and Edit Product modal forms.
 *
 * Requirements fulfilled:
 * 1. Product Name input
 * 2. Category selection from existing categories list
 * 3. Image URL input with preview box (styled according to product details page aspect ratio)
 * 4. Price (in BDT ৳)
 * 5. Product Details & FAQs (textarea)
 * 6. Stock Quantity (number)
 * 7. Status (In Stock / Out of Stock)
 * 8. Submit ("Add Product" / "Save Changes") and Cancel buttons at the bottom.
 *
 * Detailed comments added throughout so it can be easily updated in the future.
 */

/**
 * Opens the product add/edit modal form.
 * @param {string|null} editId - Product ID to edit, or null to add new product
 * @param {string|null} defaultCategory - Pre-selected category name if opened from category view
 */
function openProductModal(editId = null, defaultCategory = null) {
  const editing = products.find(p => p.id === editId);

  // Set modal title dynamically
  document.getElementById("modalTitle").textContent = editing ? "Edit Product Details" : "Add New Product";

  // Pre-fill values if editing, or set default initial values
  const initialName = editing ? editing.name : "";
  const initialCategory = editing ? editing.category : (defaultCategory || (categories[0] ? categories[0].name : "Kitchenware"));
  const initialImage = editing ? (editing.image || "") : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80";
  const initialPrice = editing ? editing.price : "";
  const initialDetails = editing ? (editing.details || "") : "";
  const initialStock = editing ? editing.stock : 10;
  const initialStatus = editing ? editing.status : "In Stock";
  const initialSeller = editing ? (editing.sellerName || "Apex Store Direct") : "Apex Store Direct";

  // Render Form Content into modalBody
  document.getElementById("modalBody").innerHTML = `
    <!-- ===================================================================== -->
    <!-- ADD / EDIT PRODUCT FORM -->
    <!-- ===================================================================== -->
    <form id="productAdminForm" onsubmit="return false;" style="display: flex; flex-direction: column; gap: 14px;">
      
      <!-- 1. PRODUCT NAME -->
      <label class="form-group">
        <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Product Name *</span>
        <input type="text" id="mProductName" value="${initialName}" placeholder="e.g. Ceramic Pour-Over Coffee Set" required>
      </label>

      <!-- 2. CATEGORY SELECTION & STATUS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label class="form-group">
          <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Category Selection *</span>
          <select id="mProductCategory">
            ${categories.map(c => `
              <option value="${c.name}" ${initialCategory === c.name ? "selected" : ""}>
                ${c.name}
              </option>
            `).join("")}
          </select>
        </label>

        <!-- 7. STATUS (IN STOCK / OUT OF STOCK) -->
        <label class="form-group">
          <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Availability Status *</span>
          <select id="mProductStatus">
            <option value="In Stock" ${initialStatus === "In Stock" ? "selected" : ""}>In Stock</option>
            <option value="Out of Stock" ${initialStatus === "Out of Stock" ? "selected" : ""}>Out of Stock</option>
          </select>
        </label>
      </div>

      <!-- 3. PRODUCT IMAGE URL & PREVIEW -->
      <div class="form-group">
        <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Product Image URL *</span>
        <input type="url" id="mProductImage" value="${initialImage}" placeholder="https://images.unsplash.com/photo-..." required>
        
        <!-- Live Image Preview (Styled according to product details page aspect ratio) -->
        <div class="product-img-preview-box" style="margin-top: 8px; padding: 10px; background: var(--canvas); border: 1px solid var(--line); border-radius: 6px; text-align: center;">
          <span style="font-size: 11.5px; color: var(--muted); display: block; margin-bottom: 6px;">Image Preview (Product Details Page Display Ratio):</span>
          <img id="mImgPreview" src="${initialImage}" alt="Product Preview" 
               style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 6px; border: 1px solid var(--line); background: #fff;"
               onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80'">
        </div>
      </div>

      <!-- 4. PRICE & 6. STOCK QUANTITY -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label class="form-group">
          <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Price (৳ BDT) *</span>
          <input type="number" id="mProductPrice" value="${initialPrice}" min="0" step="1" placeholder="e.g. 1450" required>
        </label>

        <label class="form-group">
          <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Stock Quantity *</span>
          <input type="number" id="mProductStock" value="${initialStock}" min="0" step="1" placeholder="e.g. 25" required>
        </label>
      </div>

      <!-- SELLER BUSINESS NAME -->
      <label class="form-group">
        <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Seller Business Name</span>
        <input type="text" id="mProductSeller" value="${initialSeller}" placeholder="e.g. Apex Artisans">
      </label>

      <!-- 5. PRODUCT DETAILS & FAQS -->
      <label class="form-group">
        <span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">Product Details & FAQs</span>
        <textarea id="mProductDetails" rows="3" placeholder="Enter product highlights, material specs, care instructions, and FAQs..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 13.5px;">${initialDetails}</textarea>
      </label>

      <!-- SUBMIT & CANCEL BUTTONS IN THE BOTTOM OF THE FORM -->
      <div class="modal-foot" style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn" id="mProductCancel">Cancel</button>
        <button type="button" class="btn primary" id="mProductSubmit">
          ${editing ? "Save Changes" : "Submit & Add Product"}
        </button>
      </div>

    </form>
  `;

  openModal();

  // Attach live image preview listener
  const imgInput = document.getElementById("mProductImage");
  const imgPreview = document.getElementById("mImgPreview");
  if (imgInput && imgPreview) {
    imgInput.addEventListener("input", (e) => {
      imgPreview.src = e.target.value.trim() || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80";
    });
  }

  // Cancel Button Handler
  document.getElementById("mProductCancel").addEventListener("click", closeModal);

  // Submit Button Handler
  document.getElementById("mProductSubmit").addEventListener("click", () => {
    const name = document.getElementById("mProductName").value.trim();
    const category = document.getElementById("mProductCategory").value;
    const image = document.getElementById("mProductImage").value.trim();
    const price = Number(document.getElementById("mProductPrice").value) || 0;
    const stock = Number(document.getElementById("mProductStock").value) || 0;
    const status = document.getElementById("mProductStatus").value;
    const sellerName = document.getElementById("mProductSeller").value.trim() || "Apex Store Direct";
    const details = document.getElementById("mProductDetails").value.trim();

    // Validation
    if (!name) {
      showToast("Please enter a product name");
      return;
    }
    if (price <= 0) {
      showToast("Please enter a valid price");
      return;
    }

    if (editing) {
      // Update existing product
      Object.assign(editing, {
        name,
        category,
        image,
        price,
        stock,
        status: stock === 0 ? "Out of Stock" : status,
        sellerName,
        details
      });
      showToast(`Product "${name}" updated successfully`);
    } else {
      // Add new product
      const newProd = {
        id: "P-" + (1000 + products.length + 1),
        name,
        category,
        image: image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
        price,
        stock,
        status: stock === 0 ? "Out of Stock" : status,
        sellerName,
        details
      };
      products.unshift(newProd);
      showToast(`New product "${name}" added successfully`);
    }

    closeModal();

    // Re-render relevant view
    if (currentCategoryView) {
      renderProductsForCategory(currentCategoryView);
    } else if (typeof renderCategories === "function") {
      renderCategories();
    }
  });
}

