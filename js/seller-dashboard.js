// ==========================================================================
// Seller Dashboard Controller
// Handles view switching, dynamic calculations, form validation, and data rendering.
// ==========================================================================

async function loadSellerDashboard(){

    const sellerId = localStorage.getItem("seller_id");

    if(!sellerId){
        console.log("Seller ID missing");
        return;
    }


    try{

        const response = await fetch(
            `http://127.0.0.1:8000/api/sellers/${sellerId}/dashboard`
        );


        const data = await response.json();


        const seller = data.seller;
        const stats = data.statistics;



        document.getElementById(
            "profileStoreName"
        ).textContent = seller.store_name;



        document.getElementById(
            "profileOwnerName"
        ).textContent = seller.store_name;



        document.getElementById(
            "profileEmail"
        ).textContent = seller.email;



        document.getElementById(
            "profilePhone"
        ).textContent = seller.phone;



        document.getElementById(
            "statApproved"
        ).textContent = stats.live_products;



        document.getElementById(
            "statPending"
        ).textContent = stats.pending_products;



        document.getElementById(
            "sidebarSellerName"
        ).textContent = seller.store_name;



        document.getElementById(
            "navbarSellerName"
        ).textContent =
        seller.store_name.split(" ")[0];



        document.getElementById(
            "dropdownSellerEmail"
        ).textContent = seller.email;



    }

    catch(error){

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}



// State Variables
let currentActiveView = 'profile';
let currentStatusFilter = 'all';
let currentUploadedImageDataUrl = '';

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {

    initDashboardNavigation();

    initAddProductForm();

    refreshAllDashboardData();

    loadSellerDashboard();

});

// ==========================================================================
// 1. Navigation & View Switching
// ==========================================================================

function initDashboardNavigation() {
  // Sidebar View Buttons
  const sidebarButtons = document.querySelectorAll('.sidebar-btn[data-view]');
  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      switchView(viewId);
    });
  });

  // Mobile Sidebar Toggle
  const btnSidebarToggle = document.getElementById('btnSidebarToggle');
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (btnSidebarToggle && sidebar && backdrop) {
    btnSidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show-sidebar');
      backdrop.classList.toggle('show');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show-sidebar');
      backdrop.classList.remove('show');
    });
  }
}

// View Metadata Map for Breadcrumbs
const VIEW_METADATA = {
  'profile': {
    title: 'My Profile & Overview',
    subtitle: 'Seller account metrics, recent performance & store health'
  },
  'seller-info': {
    title: 'View & Edit Seller Information',
    subtitle: 'Manage store branding, contact details, and payout banking settings'
  },
  'add-product': {
    title: 'Post New Product Listing',
    subtitle: 'Create a new product with auto-generated ID & instant sale price calculation'
  },
  'product-status': {
    title: 'Admin Verification & Approval Status',
    subtitle: 'Review approvals, pending checks, and administrative feedback'
  },
  'my-products': {
    title: 'My Products Inventory',
    subtitle: 'Browse and manage all products listed under your merchant account'
  },
  'orders': {
    title: 'Order Details & Customer Feedback',
    subtitle: 'Review orders placed by shoppers and respond to verified customer reviews'
  }
};

const VIEW_ROUTES = {
  profile: 'seller-dashboard.html',
  'seller-info': 'profile.html',
  'add-product': 'add-product.html',
  'product-status': 'product-status.html',
  'my-products': 'my-products.html',
  orders: 'orders.html'
};

function switchView(viewId) {
  if (!VIEW_METADATA[viewId]) return;

  const targetPane = document.getElementById(`view-${viewId}`);
  if (!targetPane && VIEW_ROUTES[viewId]) {
    window.location.href = VIEW_ROUTES[viewId];
    return;
  }

  currentActiveView = viewId;

  // Update Sidebar active state
  document.querySelectorAll('.sidebar-btn[data-view]').forEach(btn => {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update View Panes
  document.querySelectorAll('.dashboard-view-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  if (targetPane) {
    targetPane.classList.add('active');
  }

  // Update Navbar Breadcrumb
  const titleEl = document.getElementById('navbarViewTitle');
  const subtitleEl = document.getElementById('navbarViewSubtitle');
  if (titleEl) titleEl.textContent = VIEW_METADATA[viewId].title;
  if (subtitleEl) subtitleEl.textContent = VIEW_METADATA[viewId].subtitle;

  // Close mobile sidebar if open
  const sidebar = document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('show-sidebar')) {
    sidebar.classList.remove('show-sidebar');
    if (backdrop) backdrop.classList.remove('show');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Refresh view-specific content
  if (viewId === 'profile') renderProfileView();
  if (viewId === 'seller-info') loadSellerInfoForm();
  if (viewId === 'add-product') refreshAddProductId();
  if (viewId === 'product-status') renderStatusTable(currentStatusFilter);
  if (viewId === 'my-products') renderMyProductsTable();
  if (viewId === 'orders') {
    renderOrdersTable();
    renderReviewsList();
  }
}

// Refresh all sections and sidebar badges
function refreshAllDashboardData() {
  updateSidebarBadges();
  renderProfileView();
  loadSellerInfoForm();
  renderStatusTable('all');
  renderOrdersTable();
  renderReviewsList();
}

function updateSidebarBadges() {

  const badgePending = document.getElementById('badgePendingCount');
  const badgeProducts = document.getElementById('badgeTotalProductsCount');
  const badgeOrders = document.getElementById('badgeOrdersCount');

  if (badgePending) badgePending.textContent = '0';
  if (badgeProducts) badgeProducts.textContent = '0';
  if (badgeOrders) badgeOrders.textContent = '0';
}

// ==========================================================================
// 2. View 1: My Profile & Overview
// ==========================================================================

function renderProfileView() {
  const profile = {
    ownerName: 'Seller',
    storeName: 'My Store',
    email: '',
    phone: '',
    address: '',
    tagline: '',
    bio: '',
    logoUrl: ''
  };

  const stats = {
    storeRating: 0,
    totalRevenue: 0,
    totalOrders: 0,
    approvedProducts: 0,
    pendingProducts: 0
  };

  // Sidebar Mini Card
  const sidebarName = document.getElementById('sidebarSellerName');
  const sidebarStore = document.getElementById('sidebarStoreName');
  const sidebarAvatar = document.getElementById('sidebarSellerAvatar');
  if (sidebarName) sidebarName.textContent = profile.ownerName;
  if (sidebarStore) sidebarStore.textContent = profile.storeName;
  if (sidebarAvatar && profile.logoUrl) sidebarAvatar.src = profile.logoUrl;

  // Top Navbar Mini Card
  const navName = document.getElementById('navbarSellerName');
  const navEmail = document.getElementById('dropdownSellerEmail');
  const navAvatar = document.getElementById('navbarSellerAvatar');
  if (navName) navName.textContent = profile.ownerName.split(' ')[0];
  if (navEmail) navEmail.textContent = profile.email;
  if (navAvatar && profile.logoUrl) navAvatar.src = profile.logoUrl;

  // Profile Header Card
  const profName = document.getElementById('profileStoreName');
  const profTag = document.getElementById('profileStoreTagline');
  const profLogo = document.getElementById('profileStoreLogo');
  const profRating = document.getElementById('profileRating');
  const profBio = document.getElementById('profileBioText');
  const profOwner = document.getElementById('profileOwnerName');
  const profEmail = document.getElementById('profileEmail');
  const profPhone = document.getElementById('profilePhone');
  const profAddress = document.getElementById('profileAddress');

  if (profName) profName.textContent = profile.storeName;
  if (profTag) profTag.textContent = profile.tagline;
  if (profLogo && profile.logoUrl) profLogo.src = profile.logoUrl;
  if (profRating) profRating.textContent = stats.storeRating.toFixed(2);
  if (profBio) profBio.textContent = profile.bio;
  if (profOwner) profOwner.textContent = profile.ownerName;
  if (profEmail) profEmail.textContent = profile.email;
  if (profPhone) profPhone.textContent = profile.phone;
  if (profAddress) profAddress.textContent = profile.address;

  // Stat Counters
  const statRevenue = document.getElementById('statRevenue');
  const statOrders = document.getElementById('statTotalOrders');
  const statApproved = document.getElementById('statApproved');
  const statPending = document.getElementById('statPending');

  if (statRevenue) statRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;
  if (statOrders) statOrders.textContent = stats.totalOrders;
  if (statApproved) statApproved.textContent = stats.approvedProducts;
  if (statPending) statPending.textContent = stats.pendingProducts;
}

// ==========================================================================
// 3. View 2: View / Edit Seller Information Form
// ==========================================================================

function loadSellerInfoForm() {
  const profile = {
      ownerName: 'Seller',
      storeName: 'My Store',
      email: '',
      phone: '',
      address: '',
      tagline: '',
      bio: '',
      logoUrl: ''
    };
  setValue('infoStoreName', profile.storeName);
  setValue('infoTagline', profile.tagline);
  setValue('infoCategory', profile.category);
  setValue('infoLogoUrl', profile.logoUrl);
  setValue('infoBio', profile.bio);

  setValue('infoOwnerName', profile.ownerName);
  setValue('infoEmail', profile.email);
  setValue('infoPhone', profile.phone);
  setValue('infoAddress', profile.address);

  setValue('infoBankName', profile.bankName);
  setValue('infoAccountNumber', profile.accountNumber);
  setValue('infoRoutingNumber', profile.routingNumber);
}

async function handleSellerInfoSubmit(e) {
    e.preventDefault();

    const sellerId = localStorage.getItem("seller_id");
    if (!sellerId) {
        alert("Seller session not found. Please login again.");
        window.location.href = "../account/seller-login.html";
        return;
    }
    const updatedProfile = {
        store_name:
            getValue("infoStoreName"),
        category:
            getValue("infoCategory"),
        email:
            getValue("infoEmail"),
        phone:
            getValue("infoPhone"),
        revenue_tier:
            getValue("infoRevenue")
    };
    // Password update only if entered
    const password =
        getValue("infoPassword");
    if(password && password.trim() !== "") {
        updatedProfile.password = password;
    }
    try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/sellers/${sellerId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProfile)
            }
        );
        const data = await response.json();
        if(!response.ok) {
            alert(
                data.detail ||
                "Profile update failed."
            );
            return;
        }

        showDashToast(
            "Seller information updated successfully!"
        );
        // Reload updated profile
        loadSellerProfile();
    }
    catch(error) {
        console.error(
            "Profile update error:",
            error
        );
        alert(
            "Cannot connect to FastAPI server."
        );
    }
}

// ==========================================================================
// 4. View 3: Add Product Form (Auto-ID, Real-time Sale Price, Subcategories)
// ==========================================================================

function initAddProductForm() {
  refreshAddProductId();
  handleCategoryChange();
  calculateSalePrice();
}

function refreshAddProductId() {
  const idInput = document.getElementById('addProductId');
  if (idInput) {
    idInput.value = SellerDB.peekNextProductId();
  }
}

function copyProductId() {
  const idInput = document.getElementById('addProductId');
  if (idInput && idInput.value) {
    navigator.clipboard.writeText(idInput.value).then(() => {
      showDashToast(`Product ID ${idInput.value} copied to clipboard!`);
    });
  }
}

function handleCategoryChange() {
  const catSelect = document.getElementById('addProductCategory');
  const subcatSelect = document.getElementById('addProductSubcategory');
  if (!catSelect || !subcatSelect) return;

  const selectedCategory = catSelect.value;
  const subcategories = CATEGORY_SUBCATEGORIES[selectedCategory] || [];

  if (subcategories.length === 0) {
    subcatSelect.innerHTML = '<option value="">Select category first...</option>';
    return;
  }

  subcatSelect.innerHTML = subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');
}

// Automatic Calculation: Regular Price - (Regular Price * Discount / 100)
function calculateSalePrice() {
  const priceInput = document.getElementById('addProductPrice');
  const discountInput = document.getElementById('addProductDiscount');
  const salePriceDisplay = document.getElementById('displaySalePrice');

  if (!priceInput || !discountInput || !salePriceDisplay) return;

  const regularPrice = parseFloat(priceInput.value) || 0;
  const discountPercent = parseFloat(discountInput.value) || 0;

  let calculatedSalePrice = regularPrice;
  if (discountPercent > 0 && discountPercent <= 99) {
    calculatedSalePrice = regularPrice - (regularPrice * (discountPercent / 100));
  }

  salePriceDisplay.textContent = `$${calculatedSalePrice.toFixed(2)}`;
}

// Image URL or File Upload Preview
function handleImageUrlInput() {
  const urlInput = document.getElementById('addProductImageUrl');
  const imgEl = document.getElementById('imagePreviewElement');
  const emptyEl = document.getElementById('imagePreviewEmpty');

  if (urlInput && urlInput.value.trim() !== '') {
    currentUploadedImageDataUrl = urlInput.value.trim();
    imgEl.src = currentUploadedImageDataUrl;
    imgEl.classList.remove('d-none');
    emptyEl.classList.add('d-none');
  } else {
    currentUploadedImageDataUrl = '';
    imgEl.classList.add('d-none');
    emptyEl.classList.remove('d-none');
  }
}

function handleImageFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentUploadedImageDataUrl = e.target.result;
    const imgEl = document.getElementById('imagePreviewElement');
    const emptyEl = document.getElementById('imagePreviewEmpty');
    imgEl.src = currentUploadedImageDataUrl;
    imgEl.classList.remove('d-none');
    emptyEl.classList.add('d-none');
  };
  reader.readAsDataURL(file);
}

function resetAddProductForm() {
  document.getElementById('addProductForm').reset();
  currentUploadedImageDataUrl = '';
  const imgEl = document.getElementById('imagePreviewElement');
  const emptyEl = document.getElementById('imagePreviewEmpty');
  if (imgEl) imgEl.classList.add('d-none');
  if (emptyEl) emptyEl.classList.remove('d-none');
  refreshAddProductId();
  handleCategoryChange();
  calculateSalePrice();
}

function handleAddProductSubmit(e) {
  e.preventDefault();

  const oldPrice = parseFloat(document.getElementById('addProductPrice').value);
  const discount = parseFloat(document.getElementById('addProductDiscount').value) || 0;
  const price = +(oldPrice * (1 - discount / 100)).toFixed(2);

  const product = {
    id: document.getElementById('addProductId').value,
    name: document.getElementById('addProductName').value.trim(),
    category: document.getElementById('addProductCategory').value,
    subcategory: document.getElementById('addProductSubcategory').value,
    brand: document.getElementById('addProductBrand').value.trim(),
    description: document.getElementById('addProductDescription').value.trim(),
    badge: document.getElementById('addProductBadge').value,
    features: document.getElementById('addProductFeatures').value
                .split('\n').map(f => f.trim()).filter(Boolean),
    price,                                  // current (sale) price
    oldPrice: discount > 0 ? oldPrice : null, // shown struck-through
    discount,                               // drives savings badge
    stock: parseInt(document.getElementById('addProductStock').value, 10),
    image: /* URL or uploaded base64 */
    currentUploadedImageDataUrl || document.getElementById('addProductImageUrl').value.trim(),
    rating: 0,                              // system-controlled
    reviews: 0                              // system-controlled
  };

  // save to your seller DB here
}

// 5. View 4: Product Status Tracking (Approved, Pending, Rejected, Stock)

function filterStatusTable(status) {
  currentStatusFilter = status;

  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    if (btn.getAttribute('data-status-filter') === status) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderStatusTable(status);
}

function renderStatusTable(filter = 'all') {
  const tbody = document.getElementById('statusTableBody');
  if (!tbody) return;

  const products = SellerDB.getProducts();

  // Update Counter Pills
  const countAll = document.getElementById('countStatusAll');
  const countApp = document.getElementById('countStatusApproved');
  const countPen = document.getElementById('countStatusPending');
  const countRej = document.getElementById('countStatusRejected');

  if (countAll) countAll.textContent = products.length;
  if (countApp) countApp.textContent = products.filter(p => p.status === 'approved').length;
  if (countPen) countPen.textContent = products.filter(p => p.status === 'pending').length;
  if (countRej) countRej.textContent = products.filter(p => p.status === 'rejected').length;

  // Filter List
  let filtered = products;
  if (filter !== 'all') {
    filtered = products.filter(p => p.status === filter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          No products found under "<strong>${filter}</strong>" status.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    let badgeHtml = '';
    if (item.status === 'approved') {
      badgeHtml = `<span class="badge-status-approved"><i class="bi bi-check-circle-fill"></i> Approved</span>`;
    } else if (item.status === 'pending') {
      badgeHtml = `<span class="badge-status-pending"><i class="bi bi-hourglass-split"></i> Pending Admin</span>`;
    } else {
      badgeHtml = `<span class="badge-status-rejected"><i class="bi bi-x-circle-fill"></i> Rejected</span>`;
    }

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-3">
            <img src="${item.image}" alt="${item.name}" class="table-prod-thumb">
            <div>
              <strong class="d-block text-dark text-truncate" style="max-width: 230px;" title="${item.name}">${item.name}</strong>
              <small class="badge bg-light text-dark border">${item.id}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="fw-semibold text-dark">${item.categoryName}</span>
          <small class="d-block text-muted">${item.subcategory || ''}</small>
        </td>
        <td>
          <span class="text-muted text-decoration-line-through">$${Number(item.price).toFixed(2)}</span>
          ${item.discount > 0 ? `<small class="badge bg-danger ms-1">-${item.discount}%</small>` : ''}
        </td>
        <td>
          <strong class="text-warning fs-6" style="color: var(--primary-orange) !important;">$${item.salePrice.toFixed(2)}</strong>
        </td>
        <td>
          ${item.stock > 0 
            ? `<span class="fw-bold text-dark">${item.stock} units</span>` 
            : `<span class="badge bg-danger">Out of stock</span>`}
        </td>
        <td>${badgeHtml}</td>
        <td>
          <small class="text-secondary d-block" style="max-width: 220px;">
            ${item.adminRemarks || 'No notes available'}
          </small>
        </td>
      </tr>
    `;
  }).join('');
}


// 7. View 6: Orders Details & Customer Reviews

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const badgeCount = document.getElementById('ordersCountBadge');
  if (!tbody) return;

  const orders = SellerDB.getOrders();
  if (badgeCount) badgeCount.textContent = orders.length;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(ord => {
    const statusClass = ord.status === 'Delivered' ? 'bg-success' 
                      : ord.status === 'Shipped' ? 'bg-info text-dark'
                      : ord.status === 'Processing' ? 'bg-warning text-dark' : 'bg-secondary';

    return `
      <tr>
        <td><strong class="text-dark">${ord.orderId}</strong></td>
        <td>
          <span class="d-block fw-bold text-dark">${ord.customerName}</span>
          <small class="text-muted">${ord.customerEmail}</small>
        </td>
        <td>
          <span class="d-block text-dark fw-semibold text-truncate" style="max-width: 250px;">${ord.productName}</span>
          <small class="text-muted">Item ID: ${ord.productId}</small>
        </td>
        <td><strong class="text-dark">x${ord.quantity}</strong></td>
        <td><strong class="text-warning" style="color: var(--primary-orange) !important;">$${ord.totalPrice.toFixed(2)}</strong></td>
        <td><span class="text-muted small">${ord.orderDate}</span></td>
        <td><span class="badge ${statusClass} px-3 py-1">${ord.status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderReviewsList() {
  const container = document.getElementById('reviewsListContainer');
  const badgeCount = document.getElementById('reviewsCountBadge');
  if (!container) return;

  const reviews = SellerDB.getReviews();
  if (badgeCount) badgeCount.textContent = reviews.length;

  if (reviews.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted">No customer reviews yet.</div>`;
    return;
  }

  container.innerHTML = reviews.map(rev => `
    <div class="review-card">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div class="d-flex align-items-center gap-2">
            <strong class="text-dark">${rev.customerName}</strong>
            ${rev.verifiedPurchase ? `<span class="badge bg-success small"><i class="bi bi-check2"></i> Verified Purchase</span>` : ''}
          </div>
          <small class="text-muted">Reviewed product: <span class="fw-semibold text-dark">${rev.productName}</span></small>
        </div>
        <div class="text-end">
          <div class="text-warning mb-1">
            ${'<i class="bi bi-star-fill"></i> '.repeat(rev.rating)}
          </div>
          <small class="text-muted">${rev.date}</small>
        </div>
      </div>

      <p class="text-secondary small mb-2">${rev.comment}</p>

      ${rev.sellerReply ? `
        <div class="review-seller-reply">
          <strong class="d-block text-dark small mb-1"><i class="bi bi-reply-fill text-warning"></i> Your Store Response:</strong>
          <span>${rev.sellerReply}</span>
        </div>
      ` : `
        <div class="text-end mt-2">
          <button class="btn btn-outline-dark btn-sm" onclick="openReplyModal('${rev.id}')">
            <i class="bi bi-reply"></i> Reply to Customer
          </button>
        </div>
      `}
    </div>
  `).join('');
}

function openReplyModal(reviewId) {
  const reviews = SellerDB.getReviews();
  const rev = reviews.find(r => r.id === reviewId);
  if (!rev) return;

  document.getElementById('replyReviewId').value = rev.id;
  document.getElementById('replyCustomerName').textContent = rev.customerName;
  document.getElementById('replyReviewQuote').textContent = `"${rev.comment}"`;
  document.getElementById('replyInputText').value = '';

  const modal = new bootstrap.Modal(document.getElementById('replyReviewModal'));
  modal.show();
}

function handleReplySubmit() {
  const reviewId = document.getElementById('replyReviewId').value;
  const replyText = document.getElementById('replyInputText').value.trim();

  if (!replyText) {
    showDashToast('Please type your response message.');
    return;
  }

  SellerDB.addReviewReply(reviewId, replyText);
  bootstrap.Modal.getInstance(document.getElementById('replyReviewModal'))?.hide();
  showDashToast('Your response has been published.');
  renderReviewsList();
}


// 8. Helper Functions
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function getSelectText(id) {
  const el = document.getElementById(id);
  return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
}

function showDashToast(message) {
  const toastEl = document.getElementById('dashToast');
  const toastMsg = document.getElementById('dashToastMessage');

  if (toastEl && toastMsg) {
    toastMsg.innerHTML = `<i class="bi bi-check-circle-fill text-warning fs-5"></i> <span>${message}</span>`;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    toast.show();
  }
}
