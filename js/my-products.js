// ============================================================
// MY PRODUCTS - FastAPI + PostgreSQL
// ============================================================

const PRODUCT_API_BASE = "http://127.0.0.1:8000/api/products";


// ============================================================
// GET LOGGED-IN SELLER ID
// ============================================================

function getLoggedInSellerId() {
    const sellerId = localStorage.getItem("seller_id");

    console.log("Logged-in Seller ID:", sellerId);

    if (!sellerId) {
        return null;
    }

    const numericSellerId = Number(sellerId);

    if (!Number.isInteger(numericSellerId) || numericSellerId <= 0) {
        console.error("Invalid seller ID:", sellerId);
        return null;
    }

    return numericSellerId;
}


// ============================================================
// SEARCH + FILTER
// ============================================================

async function handleMyProductsSearch() {

    const searchInput =
        document.getElementById("myProductsSearchInput");

    const categoryInput =
        document.getElementById("myProductsCategoryFilter");

    const searchTerm = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const categoryFilter = categoryInput
        ? categoryInput.value
        : "all";

    await renderMyProductsTable(
        searchTerm,
        categoryFilter
    );
}


// ============================================================
// LOAD SELLER PRODUCTS
// ============================================================

async function renderMyProductsTable(
    search = "",
    category = "all"
) {

    const tbody =
        document.getElementById("myProductsTableBody");

    const countText =
        document.getElementById("myProductsCountText");


    if (!tbody) {
        console.error(
            "myProductsTableBody element not found."
        );
        return;
    }


    // --------------------------------------------------------
    // Get seller ID
    // --------------------------------------------------------

    const sellerId = getLoggedInSellerId();


    if (!sellerId) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="text-center py-5 text-danger">

                    <i class="bi bi-person-x fs-2 d-block mb-2"></i>

                    Seller ID not found.

                    <br>

                    Please login again.

                </td>
            </tr>
        `;

        if (countText) {
            countText.textContent = "";
        }

        return;
    }


    // --------------------------------------------------------
    // Show loading
    // --------------------------------------------------------

    tbody.innerHTML = `
        <tr>
            <td colspan="6"
                class="text-center py-5 text-muted">

                <div class="spinner-border text-warning mb-2"
                     role="status">
                </div>

                <div>
                    Loading your products...
                </div>

            </td>
        </tr>
    `;


    try {

        // ----------------------------------------------------
        // Call seller-specific endpoint
        // ----------------------------------------------------

        const apiUrl =
            `${PRODUCT_API_BASE}/seller/${sellerId}`;

        console.log(
            "Loading seller products from:",
            apiUrl
        );


        const response =
            await fetch(apiUrl);


        console.log(
            "Seller products response status:",
            response.status
        );


        // ----------------------------------------------------
        // Read response
        // ----------------------------------------------------

        let products = [];

        try {

            products = await response.json();

        } catch (jsonError) {

            console.error(
                "Could not read API response:",
                jsonError
            );

            products = [];
        }


        console.log(
            "Seller products API response:",
            products
        );


        // ----------------------------------------------------
        // API error
        // ----------------------------------------------------

        if (!response.ok) {

            const message =
                products?.detail ||
                `HTTP error ${response.status}`;

            throw new Error(message);
        }


        // ----------------------------------------------------
        // Make sure response is an array
        // ----------------------------------------------------

        if (!Array.isArray(products)) {

            console.error(
                "Unexpected API response:",
                products
            );

            throw new Error(
                "Server returned an invalid product list."
            );
        }


        // ----------------------------------------------------
        // CATEGORY FILTER
        // ----------------------------------------------------

        if (category && category !== "all") {

            products = products.filter(product => {

                const productCategory =
                    String(
                        product.category || ""
                    ).toLowerCase();

                return (
                    productCategory ===
                    category.toLowerCase()
                );

            });
        }


        // ----------------------------------------------------
        // SEARCH FILTER
        // ----------------------------------------------------

        if (search !== "") {

            products = products.filter(product => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();

                const brand =
                    String(
                        product.brand || ""
                    ).toLowerCase();

                const productId =
                    String(
                        product.id || ""
                    );


                return (
                    name.includes(search) ||
                    brand.includes(search) ||
                    productId.includes(search)
                );

            });
        }


        // ----------------------------------------------------
        // Product count
        // ----------------------------------------------------

        if (countText) {

            countText.textContent =
                `Showing ${products.length} product${
                    products.length === 1 ? "" : "s"
                }`;

        }


        // ----------------------------------------------------
        // No products
        // ----------------------------------------------------

        if (products.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center py-5 text-muted">

                        <i class="bi bi-box-seam fs-2 d-block mb-2"></i>

                        No products found for this seller.

                    </td>
                </tr>
            `;

            return;
        }


        // ----------------------------------------------------
        // Render products
        // ----------------------------------------------------

        tbody.innerHTML = products.map(product => {

            const productId =
                product.id ?? "";

            const productName =
                escapeHtml(
                    product.name || "Unnamed Product"
                );

            const brand =
                escapeHtml(
                    product.brand || "Apex"
                );

            const productCategory =
                escapeHtml(
                    product.category || "N/A"
                );

            const imageUrl =
            product.image
                ? (
                    product.image.startsWith("http")
                        ? product.image
                        : `http://127.0.0.1:8000${product.image}`
                )
                : "https://placehold.co/80x80?text=No+Image";

            const price =
                Number(product.price || 0)
                    .toFixed(2);

            const oldPrice =
                Number(product.oldPrice || 0)
                    .toFixed(2);

            const discount =
                Number(product.discount || 0);

            const stock =
                Number(product.stock || 0);


            const status =
                String(
                    product.status || "Pending"
                );


            const statusLower =
                status.toLowerCase();


            let statusClass =
                "bg-danger";


            if (statusLower === "approved") {

                statusClass =
                    "bg-success";

            } else if (
                statusLower === "pending"
            ) {

                statusClass =
                    "bg-warning text-dark";

            }


            const oldPriceHtml =
                discount > 0
                    ? `
                        <small
                            class="text-muted
                                   text-decoration-line-through
                                   d-block">
                            $${oldPrice}
                        </small>
                      `
                    : "";


            return `
                <tr>

                    <!-- Product -->
                    <td>

                        <div
                            class="d-flex
                                   align-items-center
                                   gap-3">

                            <img
                                src="${imageUrl}"
                                alt="${productName}"
                                class="product-thumb"
                                style="
                                    width:60px;
                                    height:60px;
                                    object-fit:cover;
                                    border-radius:10px;
                                "
                            >

                            <div>

                                <strong
                                    class="d-block
                                           text-dark
                                           text-truncate"
                                    style="max-width:220px;"
                                    title="${productName}">

                                    ${productName}

                                </strong>

                                <small
                                    class="text-muted">

                                    Product ID:
                                    ${productId}

                                </small>

                            </div>

                        </div>

                    </td>


                    <!-- Brand & Category -->
                    <td>

                        <span
                            class="d-block
                                   text-dark
                                   fw-semibold">

                            ${brand}

                        </span>

                        <small
                            class="text-muted">

                            ${productCategory}

                        </small>

                    </td>


                    <!-- Pricing -->
                    <td>

                        <strong
                            style="
                                color:
                                var(--primary-orange)
                                !important;
                            ">

                            $${price}

                        </strong>

                        ${oldPriceHtml}

                    </td>


                    <!-- Stock -->
                    <td>

                        <div
                            class="d-flex
                                   align-items-center
                                   gap-2">

                            <input
                                type="number"
                                min="0"
                                value="${stock}"
                                class="stock-input-inline"
                                onchange="
                                    handleStockUpdate(
                                        ${productId},
                                        this.value
                                    )
                                "
                            >

                            <small
                                class="text-muted">

                                units

                            </small>

                        </div>

                    </td>


                    <!-- Status -->
                    <td>

                        <span
                            class="badge ${statusClass}">

                            ${escapeHtml(
                                status.toUpperCase()
                            )}

                        </span>

                    </td>


                    <!-- Actions -->
                    <td class="text-end">

                        <button
                            class="
                                btn
                                btn-outline-primary
                                btn-sm
                                me-1
                            "
                            onclick="
                                viewProduct(${productId})
                            "
                            title="View Product">

                            <i class="bi bi-eye"></i>

                        </button>


                        <button
                            class="
                                btn
                                btn-outline-warning
                                btn-sm
                                me-1
                            "
                            onclick="
                                editProduct(${productId})
                            "
                            title="Edit Product">

                            <i class="bi bi-pencil"></i>

                        </button>


                        <button
                            class="
                                btn
                                btn-outline-danger
                                btn-sm
                            "
                            onclick="
                                deleteProduct(${productId})
                            "
                            title="Delete Product">

                            <i class="bi bi-trash3"></i>

                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    } catch (error) {

        console.error(
            "Error loading seller products:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="text-center py-5 text-danger">

                    <i
                        class="bi bi-exclamation-triangle
                               fs-2
                               d-block
                               mb-2">
                    </i>

                    Cannot load products from the server.

                    <br>

                    <small>
                        ${escapeHtml(
                            error.message ||
                            "Unknown server error."
                        )}
                    </small>

                </td>
            </tr>
        `;

    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// VIEW PRODUCT
// ============================================================

async function viewProduct(productId) {

    try {

        const response =
            await fetch(
                `${PRODUCT_API_BASE}/${productId}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Product not found."
            );

            return;
        }


        console.log(
            "Product:",
            data
        );


        alert(
            `Product ID: ${data.id}\n` +
            `Name: ${data.name}\n` +
            `Brand: ${data.brand || "N/A"}\n` +
            `Category: ${data.category}\n` +
            `Price: $${data.price}\n` +
            `Stock: ${data.stock}\n` +
            `Status: ${data.status}`
        );


    } catch (error) {

        console.error(
            "View product error:",
            error
        );

        alert(
            "Cannot connect to FastAPI server."
        );
    }
}


// ============================================================
// EDIT PRODUCT
// ============================================================

async function editProduct(productId) {

    try {

        const response =
            await fetch(
                `${PRODUCT_API_BASE}/${productId}`
            );


        const product =
            await response.json();


        if (!response.ok) {

            alert(
                product.detail ||
                "Product not found."
            );

            return;
        }


        // ----------------------------------------------------
        // Fill edit form
        // ----------------------------------------------------

        document.getElementById(
            "editProductId"
        ).value = product.id;


        document.getElementById(
            "editProductName"
        ).value = product.name || "";


        document.getElementById(
            "editProductBrand"
        ).value = product.brand || "";


        document.getElementById(
            "editProductCategory"
        ).value = product.category || "";


        document.getElementById(
            "editProductBadge"
        ).value = product.badge || "";


        document.getElementById(
            "editProductStock"
        ).value = product.stock ?? 0;


        document.getElementById(
            "editProductOldPrice"
        ).value =
            product.oldPrice ?? 0;


        document.getElementById(
            "editProductDiscount"
        ).value =
            product.discount ?? 0;


        document.getElementById(
            "editProductPrice"
        ).value =
            product.price ?? 0;


        document.getElementById(
            "editProductImage"
        ).value =
            product.image || "";


        document.getElementById(
            "editProductDescription"
        ).value =
            product.description || "";


        // ----------------------------------------------------
        // Open modal
        // ----------------------------------------------------

        const modalElement =
            document.getElementById(
                "editProductModal"
            );


        if (!modalElement) {

            alert(
                "Edit product modal not found."
            );

            return;
        }


        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );


        modal.show();


    } catch (error) {

        console.error(
            "Edit product error:",
            error
        );

        alert(
            "Cannot connect to FastAPI server."
        );
    }
}


// ============================================================
// UPDATE PRODUCT
// ============================================================

document
    .getElementById("editProductForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const productId =
                document.getElementById(
                    "editProductId"
                ).value;


            const productData = {

                name:
                    document.getElementById(
                        "editProductName"
                    ).value.trim(),

                brand:
                    document.getElementById(
                        "editProductBrand"
                    ).value.trim(),

                category:
                    document.getElementById(
                        "editProductCategory"
                    ).value,

                badge:
                    document.getElementById(
                        "editProductBadge"
                    ).value.trim(),

                stock:
                    Number(
                        document.getElementById(
                            "editProductStock"
                        ).value
                    ),

                oldPrice:
                    Number(
                        document.getElementById(
                            "editProductOldPrice"
                        ).value
                    ),

                discount:
                    Number(
                        document.getElementById(
                            "editProductDiscount"
                        ).value
                    ),

                price:
                    Number(
                        document.getElementById(
                            "editProductPrice"
                        ).value
                    ),

                image:
                    document.getElementById(
                        "editProductImage"
                    ).value.trim(),

                description:
                    document.getElementById(
                        "editProductDescription"
                    ).value.trim()

            };


            try {

                const response =
                    await fetch(
                        `${PRODUCT_API_BASE}/${productId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    productData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.detail ||
                        "Failed to update product."
                    );

                    return;
                }


                // ------------------------------------------------
                // Close modal
                // ------------------------------------------------

                const modalElement =
                    document.getElementById(
                        "editProductModal"
                    );


                const modal =
                    bootstrap.Modal.getInstance(
                        modalElement
                    );


                if (modal) {

                    modal.hide();

                }


                if (
                    typeof showDashToast ===
                    "function"
                ) {

                    showDashToast(
                        "Product updated successfully."
                    );

                } else {

                    alert(
                        "Product updated successfully."
                    );

                }


                // ------------------------------------------------
                // Reload products
                // ------------------------------------------------

                await renderMyProductsTable();


            } catch (error) {

                console.error(
                    "Update product error:",
                    error
                );

                alert(
                    "Cannot connect to FastAPI server."
                );
            }

        }
    );


// ============================================================
// CALCULATE EDIT PRICE
// ============================================================

function calculateEditPrice() {

    const oldPrice =
        Number(
            document.getElementById(
                "editProductOldPrice"
            ).value
        );


    const discount =
        Number(
            document.getElementById(
                "editProductDiscount"
            ).value
        );


    if (
        oldPrice > 0 &&
        discount >= 0
    ) {

        const finalPrice =
            oldPrice -
            (
                oldPrice *
                discount /
                100
            );


        document.getElementById(
            "editProductPrice"
        ).value =
            finalPrice.toFixed(2);
    }
}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {

    const confirmed =
        confirm(
            `Are you sure you want to delete product ${productId}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${PRODUCT_API_BASE}/${productId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Failed to delete product."
            );

            return;
        }


        if (
            typeof showDashToast ===
            "function"
        ) {

            showDashToast(
                "Product deleted successfully."
            );

        } else {

            alert(
                "Product deleted successfully."
            );

        }


        await renderMyProductsTable();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            "Cannot connect to FastAPI server."
        );
    }
}


// ============================================================
// UPDATE STOCK
// ============================================================

async function handleStockUpdate(
    productId,
    newStock
) {

    const stock =
        Number(newStock);


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        alert(
            "Stock must be a valid number."
        );

        await renderMyProductsTable();

        return;
    }


    try {

        const response =
            await fetch(
                `${PRODUCT_API_BASE}/${productId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        stock: stock
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Failed to update stock."
            );

            await renderMyProductsTable();

            return;
        }


        if (
            typeof showDashToast ===
            "function"
        ) {

            showDashToast(
                "Stock updated successfully."
            );

        }


        await renderMyProductsTable();


    } catch (error) {

        console.error(
            "Stock update error:",
            error
        );

        alert(
            "Cannot connect to FastAPI server."
        );

        await renderMyProductsTable();
    }
}


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "My Products page loaded."
        );

        console.log(
            "Current seller_id:",
            localStorage.getItem(
                "seller_id"
            )
        );


        renderMyProductsTable();

    }
);