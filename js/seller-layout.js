/* Shared seller dashboard shell for the individual seller pages. */
(function () {
  const page = document.getElementById('sellerPage');
  if (!page) return;

  const currentPage = page.dataset.page || 'profile';
  const pageMeta = {
    profile: ['My Profile & Overview', 'Seller account metrics, recent performance & store health'],
    'seller-info': ['View & Edit Seller Information', 'Manage store branding, contact details, and payout banking settings'],
    'add-product': ['Post New Product Listing', 'Create a new product with auto-generated ID & instant sale price calculation'],
    'product-status': ['Admin Verification & Approval Status', 'Review approvals, pending checks, and administrative feedback'],
    'my-products': ['My Products Inventory', 'Browse and manage all products listed under your merchant account'],
    orders: ['Order Details & Customer Feedback', 'Review orders placed by shoppers and respond to verified customer reviews']
  };
  const routes = {
    profile: 'seller-dashboard.html',
    'seller-info': 'profile.html',
    'add-product': 'add-product.html',
    'product-status': 'product-status.html',
    'my-products': 'my-products.html',
    orders: 'orders.html'
  };
  const meta = pageMeta[currentPage] || pageMeta.profile;
  const pageContent = page.innerHTML;

  const menuItem = (key, icon, label, badgeId) => `
    <li><a href="${routes[key]}" class="sidebar-btn${currentPage === key ? ' active' : ''}" title="${label}">
      <i class="bi ${icon}"></i><span>${label}</span>${badgeId ? `<span class="badge-counter" id="${badgeId}">0</span>` : ''}
    </a></li>`;

  page.innerHTML = `
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
    <div class="dashboard-wrapper">
      <aside class="dashboard-sidebar" id="dashboardSidebar">
        <div class="sidebar-header">
          <a href="../main/index.html" class="sidebar-brand"><span class="brand-badge"><i class="bi bi-bag-check-fill"></i></span>Apex<span class="highlight">Mart</span></a>
          <span class="sidebar-badge-seller">Seller Hub</span>
        </div>
        <div class="sidebar-seller-card">
        <div class="seller-profile-icon sidebar-icon">
          <i class="bi bi-person-circle"></i>
      </div>
        <div class="seller-mini-info"><h6 class="seller-mini-name" id="sidebarSellerName">Alex Johnson</h6><p class="seller-mini-store" id="sidebarStoreName">Apex Tech & Lifestyle</p></div>
        </div>
        <div class="sidebar-menu-section">
          <div class="sidebar-section-label">Main Menu</div>
          <ul class="sidebar-nav-list">
            <li><a href="../main/index.html" class="sidebar-btn" title="Back to Marketplace Home"><i class="bi bi-house-door"></i><span>Home</span></a></li>
            ${menuItem('profile', 'bi-person-badge', 'My Profile')}
            ${menuItem('seller-info', 'bi-shop', 'Edit Seller Info')}
            ${menuItem('add-product', 'bi-plus-circle', 'Add Product')}
            ${menuItem('product-status', 'bi-check2-circle', 'Product Status', 'badgePendingCount')}
            ${menuItem('my-products', 'bi-box-seam', 'My Products', 'badgeTotalProductsCount')}
            ${menuItem('orders', 'bi-receipt', 'Order Details', 'badgeOrdersCount')}
          </ul>
        </div>
        <div class="sidebar-footer"><button class="sidebar-btn-logout" data-bs-toggle="modal" data-bs-target="#logoutModal"><i class="bi bi-box-arrow-left"></i><span>Logout</span></button></div>
      </aside>
      <main class="dashboard-main">
        <header class="dashboard-navbar">
          <div class="navbar-left-wrap"><button class="btn-sidebar-toggle" id="btnSidebarToggle" aria-label="Toggle Sidebar Menu"><i class="bi bi-list"></i></button><div class="view-breadcrumb"><h1 class="view-title-main">${meta[0]}</h1><p class="view-subtitle-meta">${meta[1]}</p></div></div>
          <div class="navbar-right-wrap">

    <a href="../main/index.html" 
       class="navbar-quick-btn d-none d-md-inline-flex">
        <i class="bi bi-house-door"></i> Home
    </a>


    <a href="add-product.html" 
       class="navbar-btn-orange">
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline">
            Add Product
        </span>
    </a>


    <div class="dropdown">

        <button 
            class="navbar-quick-btn dropdown-toggle border-0" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false">


            <i class="bi bi-person-circle fs-4 me-1"></i>


            <span 
                class="d-none d-lg-inline fw-bold" 
                id="navbarSellerName">
                Seller
            </span>


        </button>



        <ul class="dropdown-menu dropdown-menu-end shadow-sm border p-2"
            style="min-width:230px; border-radius:12px;">


            <li class="px-2 py-1">

                <small class="text-muted d-block">
                    Signed in as Merchant
                </small>


                <strong 
                    class="text-dark d-block" 
                    id="dropdownSellerEmail">
                    seller@email.com
                </strong>

            </li>



            <li>
                <hr class="dropdown-divider">
            </li>



            <li>
                <a class="dropdown-item rounded py-2"
                   href="../main/index.html">

                    <i class="bi bi-house-door text-warning me-2"></i>
                    Home (Storefront)

                </a>
            </li>



            ${Object.entries(routes)
            .filter(([key]) => key !== 'profile')
            .map(([key]) => `

            <li>

                <a class="dropdown-item rounded py-2"
                   href="${routes[key]}">

                    <i class="bi ${
                        key === 'seller-info'
                        ? 'bi-shop'
                        : key === 'add-product'
                        ? 'bi-plus-circle'
                        : key === 'product-status'
                        ? 'bi-check2-circle'
                        : key === 'my-products'
                        ? 'bi-box-seam'
                        : 'bi-receipt'
                    } text-warning me-2"></i>


                    ${pageMeta[key][0]}

                </a>

            </li>

            `).join('')}



            <li>
                <hr class="dropdown-divider">
            </li>



            <li>

                <button 
                    class="dropdown-item rounded py-2 text-danger"
                    data-bs-toggle="modal"
                    data-bs-target="#logoutModal">

                    <i class="bi bi-box-arrow-left me-2"></i>
                    Logout

                </button>

            </li>


        </ul>


    </div>


</div>
          </header>
        <div class="dashboard-content-body">${pageContent}</div>
      </main>
    </div>
    <div class="modal fade custom-modal" id="logoutModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
    <div class="modal-content text-center p-3"><div class="modal-body">
    <div class="display-5 text-danger mb-3">
    <i class="bi bi-box-arrow-left"></i></div>
    <h5 class="fw-bold text-dark mb-2">Sign Out?</h5><p class="text-muted small mb-4">Are you sure you want to log out of your merchant dashboard?</p><div class="d-flex gap-2 justify-content-center"><button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Stay</button>
    <button 
        type="button"
        class="btn btn-danger btn-sm px-3"
        onclick="sellerLogout()">
        Log Out
    </button>
    </div></div></div></div></div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1090;"><div id="dashToast" class="toast custom-toast align-items-center border-0" role="alert"><div class="d-flex"><div class="toast-body d-flex align-items-center gap-2" id="dashToastMessage"><i class="bi bi-check-circle-fill text-warning fs-5"></i><span>Action completed!</span></div><button type="button" class="btn-close btn-close-white me-2 m-auto shadow-none" data-bs-dismiss="toast" aria-label="Close"></button></div></div></div>`;
})();


function sellerLogout(){

    localStorage.removeItem("seller_id");

    window.location.href="../main/index.html";

}