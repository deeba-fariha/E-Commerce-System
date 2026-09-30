/**
 * ============================================================================
 * ADMIN PANEL - ADD PRODUCT MODAL (js/products-form.js)
 * ============================================================================
 * Admin adds a product under any category:
 *   POST /api/admin/products   (admin only)
 *
 * Admin products have no seller and go live immediately (status
 * "Approved"), so they appear on the home page right away.
 * The category dropdown comes from GET /api/categories.
 */

const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80";

const formLabel = text =>
  `<span style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px; display: block;">${text}</span>`;

/**
 * Opens the Add Product modal.
 * @param {number|null} defaultCategoryId - Pre-selected category (from the category view)
 * @param {Function} [onSaved] - Called with the saved product
 */
async function openProductModal(defaultCategoryId = null, onSaved = null) {
  let categories;
  try {
    categories = await loadAdminCategories();
  } catch (error) {
    showToast(apiErrorMessage(error, "Could not load categories"));
    return;
  }

  if (categories.length === 0) {
    showToast("Add a category first");
    return;
  }

  document.getElementById("modalTitle").textContent = "Add New Product";

  document.getElementById("modalBody").innerHTML = `
    <form id="productAdminForm" style="display: flex; flex-direction: column; gap: 14px;">

      <label class="form-group">
        ${formLabel("Product Name *")}
        <input type="text" id="mProductName" maxlength="255" placeholder="e.g. Ceramic Pour-Over Coffee Set" required>
      </label>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label class="form-group">
          ${formLabel("Category *")}
          <select id="mProductCategory" required></select>
        </label>

        <label class="form-group">
          ${formLabel("Brand")}
          <input type="text" id="mProductBrand" maxlength="255" placeholder="e.g. Apex">
        </label>
      </div>

      <div class="form-group">
        ${formLabel("Product Image URL")}
        <input type="url" id="mProductImage" maxlength="1000" placeholder="https://images.unsplash.com/photo-...">

        <div class="product-img-preview-box" style="margin-top: 8px; padding: 10px; background: var(--canvas); border: 1px solid var(--line); border-radius: 6px; text-align: center;">
          <span style="font-size: 11.5px; color: var(--muted); display: block; margin-bottom: 6px;">Image Preview:</span>
          <img id="mImgPreview" src="${PRODUCT_IMAGE_FALLBACK}" alt="Product Preview"
               style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 6px; border: 1px solid var(--line); background: #fff;">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <label class="form-group">
          ${formLabel("Price *")}
          <input type="number" id="mProductPrice" min="0.01" step="0.01" placeholder="e.g. 49.99" required>
        </label>

        <label class="form-group">
          ${formLabel("Old Price")}
          <input type="number" id="mProductOldPrice" min="0.01" step="0.01" placeholder="optional">
        </label>

        <label class="form-group">
          ${formLabel("Stock Quantity *")}
          <input type="number" id="mProductStock" min="0" step="1" value="10" required>
        </label>
      </div>

      <label class="form-group">
        ${formLabel("Description *")}
        <textarea id="mProductDetails" rows="3" required placeholder="Product highlights, materials, care instructions…" style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 13.5px;"></textarea>
      </label>

      <label class="form-group">
        ${formLabel("Key Features (one per line)")}
        <textarea id="mProductFeatures" rows="3" placeholder="40-hour battery&#10;Bluetooth 5.3" style="width: 100%; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 13.5px;"></textarea>
      </label>

      <p style="font-size: 12.5px; color: var(--muted); margin: 0;">
        Products added by the admin go live on the home page immediately.
      </p>

      <div class="modal-foot" style="margin-top: 4px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn" id="mProductCancel">Cancel</button>
        <button type="submit" class="btn primary" id="mProductSubmit">Add Product</button>
      </div>
    </form>
  `;

  ApexCategories.fillSelect(document.getElementById("mProductCategory"), categories, {
    placeholder: "Select category…",
    value: "id",
    selected: defaultCategoryId ?? ""
  });

  openModal();
  document.getElementById("mProductName").focus();

  // Live image preview
  const imgPreview = document.getElementById("mImgPreview");
  imgPreview.addEventListener("error", () => { imgPreview.src = PRODUCT_IMAGE_FALLBACK; });
  document.getElementById("mProductImage").addEventListener("input", e => {
    imgPreview.src = e.target.value.trim() || PRODUCT_IMAGE_FALLBACK;
  });

  document.getElementById("mProductCancel").addEventListener("click", closeModal);

  document.getElementById("productAdminForm").addEventListener("submit", async event => {
    event.preventDefault();

    const value = id => document.getElementById(id).value.trim();
    const oldPrice = value("mProductOldPrice");

    const body = {
      name: value("mProductName"),
      category_id: Number(value("mProductCategory")),
      brand: value("mProductBrand") || null,
      image: value("mProductImage") || null,
      price: value("mProductPrice"),
      old_price: oldPrice || null,
      stock: Number(value("mProductStock") || 0),
      description: value("mProductDetails"),
      features: value("mProductFeatures").split("\n").map(f => f.trim()).filter(Boolean)
    };

    if (!body.category_id) {
      showToast("Please choose a category");
      return;
    }

    const submitBtn = document.getElementById("mProductSubmit");
    submitBtn.disabled = true;

    try {
      const product = await adminApi("/api/admin/products", { method: "POST", body });

      closeModal();
      showToast(`"${product.name}" added — it is now live on the home page`);
      if (onSaved) onSaved(product);
    } catch (error) {
      // e.g. "Old price must be higher than the price." — keep the form open
      showToast(apiErrorMessage(error, "Could not add product"));
      submitBtn.disabled = false;
    }
  });
}
