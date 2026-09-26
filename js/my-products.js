// 6. My Products - FastAPI + PostgreSQL

async function handleMyProductsSearch() {
    const searchTerm = getValue('myProductsSearchInput')
        .toLowerCase()
        .trim();

    const categoryFilter = getValue('myProductsCategoryFilter');

    await renderMyProductsTable(searchTerm, categoryFilter);
}


async function renderMyProductsTable(search = '', category = 'all') {

    const tbody = document.getElementById('myProductsTableBody');
    const countText = document.getElementById('myProductsCountText');

    if (!tbody) return;

    const sellerId = localStorage.getItem('seller_id');

    if (!sellerId) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-danger">
                    Seller ID not found. Please login again.
                </td>
            </tr>
        `;
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/api/products/seller/${sellerId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        let products = await response.json();

        // Category filter
        if (category !== 'all') {
            products = products.filter(
                product =>
                    product.category.toLowerCase() ===
                    category.toLowerCase()
            );
        }

        // Search
        if (search !== '') {
            products = products.filter(product =>
                product.name.toLowerCase().includes(search) ||
                String(product.id).includes(search) ||
                (
                    product.brand &&
                    product.brand.toLowerCase().includes(search)
                )
            );
        }

        if (countText) {
            countText.textContent =
                `Showing ${products.length} products`;
        }

        if (products.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center py-5 text-muted">

                        <i class="bi bi-search fs-2 d-block mb-2"></i>

                        No products matched your search filter.

                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = products.map(product => `

            <tr>

                <!-- Product -->
                <td>
                    <div class="d-flex align-items-center gap-3">

                        <img
            src="${product.image ? 'http://127.0.0.1:8000' + product.image : ''}"
            alt="${product.name}"
            class="product-thumb"
        >

        <div>
            <div class="fw-semibold">
                ${product.name}
            </div>

            <div class="small text-muted">
                Product ID: ${product.id}
            </div>
        </div>


                        <div>

                            <strong
                                class="d-block text-dark text-truncate"
                                style="max-width: 220px;"
                                title="${product.name}"
                            >
                                ${product.name}
                            </strong>

                            <small class="text-muted">
                                ID: ${product.id}
                            </small>

                        </div>

                    </div>
                </td>


                <!-- Brand & Category -->
                <td>

                    <span class="d-block text-dark fw-semibold">
                        ${product.brand || 'Apex'}
                    </span>

                    <small class="text-muted">
                        ${product.category}
                    </small>

                </td>


                <!-- Pricing -->
                <td>

                    <strong
                        class="text-warning"
                        style="color: var(--primary-orange) !important;"
                    >
                        $${Number(product.price).toFixed(2)}
                    </strong>

                    ${
                        Number(product.discount) > 0
                            ? `
                                <small class="text-muted text-decoration-line-through d-block">
                                    $${Number(product.oldPrice).toFixed(2)}
                                </small>
                            `
                            : ''
                    }

                </td>


                <!-- Stock -->
                <td>

                    <div class="d-flex align-items-center gap-2">

                        <input
                            type="number"
                            min="0"
                            value="${product.stock}"
                            class="stock-input-inline"
                            onchange="handleStockUpdate(${product.id}, this.value)"
                        >

                        <small class="text-muted">
                            units
                        </small>

                    </div>

                </td>


                <!-- Status -->
                <td>

                    <span class="badge ${
                        product.status.toLowerCase() === 'approved'
                            ? 'bg-success'
                            : product.status.toLowerCase() === 'pending'
                                ? 'bg-warning text-dark'
                                : 'bg-danger'
                    }">

                        ${product.status.toUpperCase()}

                    </span>

                </td>


                <!-- Actions -->
                <td class="text-end">

                    <button
                        class="btn btn-outline-primary btn-sm me-1"
                        onclick="viewProduct(${product.id})"
                        title="View Product"
                    >
                        <i class="bi bi-eye"></i>
                    </button>


                    <button
                        class="btn btn-outline-warning btn-sm me-1"
                        onclick="editProduct(${product.id})"
                        title="Edit Product"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>


                    <button
                        class="btn btn-outline-danger btn-sm"
                        onclick="deleteProduct(${product.id})"
                        title="Delete Product"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                </td>

            </tr>

        `).join('');

    } catch (error) {

        console.error(
            'Error loading seller products:',
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="text-center py-5 text-danger">

                    Cannot load products from the server.

                </td>
            </tr>
        `;

    }
}


// ==========================================================================
// Product Actions
// ==========================================================================

async function viewProduct(productId) {

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/api/products/${productId}`
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || 'Product not found.');
            return;
        }

        console.log('Product:', data);

        alert(
            `Product ID: ${data.id}\n` +
            `Name: ${data.name}\n` +
            `Brand: ${data.brand || 'N/A'}\n` +
            `Category: ${data.category}\n` +
            `Price: $${data.price}\n` +
            `Stock: ${data.stock}\n` +
            `Status: ${data.status}`
        );

    } catch (error) {

        console.error('View product error:', error);

        alert('Cannot connect to FastAPI server.');

    }
}


async function editProduct(productId) {
    try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/products/${productId}`
        );

        const product = await response.json();

        if (!response.ok) {
            alert(product.detail || 'Product not found.');
            return;
        }

        // Fill the form
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editProductBrand').value = product.brand || '';
        document.getElementById('editProductCategory').value = product.category || '';
        document.getElementById('editProductBadge').value = product.badge || '';
        document.getElementById('editProductStock').value = product.stock ?? 0;
        document.getElementById('editProductOldPrice').value = product.oldPrice ?? 0;
        document.getElementById('editProductDiscount').value = product.discount ?? 0;
        document.getElementById('editProductPrice').value = product.price ?? 0;
        document.getElementById('editProductImage').value = product.image || '';
        document.getElementById('editProductDescription').value =
            product.description || '';

        // Open Bootstrap modal
        const modalElement =
            document.getElementById('editProductModal');

        const modal =
            bootstrap.Modal.getOrCreateInstance(modalElement);

        modal.show();

    } catch (error) {
        console.error('Edit product error:', error);
        alert('Cannot connect to FastAPI server.');
    }
}


document.getElementById('editProductForm')
    ?.addEventListener('submit', async function (event) {

        event.preventDefault();

        const productId =
            document.getElementById('editProductId').value;

        const productData = {
            name: document.getElementById('editProductName').value.trim(),
            brand: document.getElementById('editProductBrand').value.trim(),
            category: document.getElementById('editProductCategory').value,
            badge: document.getElementById('editProductBadge').value.trim(),
            stock: Number(document.getElementById('editProductStock').value),
            oldPrice: Number(document.getElementById('editProductOldPrice').value),
            discount: Number(document.getElementById('editProductDiscount').value),
            price: Number(document.getElementById('editProductPrice').value),
            image: document.getElementById('editProductImage').value.trim(),
            description:
                document.getElementById('editProductDescription').value.trim()
        };

        try {

            const response = await fetch(
                `http://127.0.0.1:8000/api/products/${productId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || 'Failed to update product.');
                return;
            }

            // Close modal
            const modalElement =
                document.getElementById('editProductModal');

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

            showDashToast('Product updated successfully.');

            // Reload table
            await renderMyProductsTable();

        } catch (error) {

            console.error('Update product error:', error);

            alert('Cannot connect to FastAPI server.');
        }
    });


function calculateEditPrice() {
    const oldPrice = Number(
        document.getElementById('editProductOldPrice').value
    );

    const discount = Number(
        document.getElementById('editProductDiscount').value
    );

    if (oldPrice > 0 && discount >= 0) {
        const finalPrice =
            oldPrice - (oldPrice * discount / 100);

        document.getElementById('editProductPrice').value =
            finalPrice.toFixed(2);
    }
}

async function deleteProduct(productId) {

    const confirmed = confirm(
        `Are you sure you want to delete product ${productId}?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/api/products/${productId}`,
            {
                method: 'DELETE'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || 'Failed to delete product.');
            return;
        }

        showDashToast('Product deleted successfully.');

        await renderMyProductsTable();

    } catch (error) {

        console.error('Delete product error:', error);

        alert('Cannot connect to FastAPI server.');

    }
}