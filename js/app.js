//  =
// E-Commerce Application Logic
//  =

// Application State
let currentCategory = 'all';
let currentSearchTerm = '';
let currentSort = 'featured';
let cart = JSON.parse(localStorage.getItem('apexmart_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('apexmart_wishlist')) || [];

// DOM Elements
const productsGridContainer = document.getElementById('productsGridContainer');
const emptyStateContainer = document.getElementById('emptyStateContainer');
const catalogCountDisplay = document.getElementById('catalogCountDisplay');
const categoryPills = document.querySelectorAll('.category-pill');
const productSortSelect = document.getElementById('productSortSelect');
const navbarSearchInput = document.getElementById('navbarSearchInput');
const btnNavbarSearch = document.getElementById('btnNavbarSearch');
const searchCategorySelect = document.getElementById('searchCategorySelect');
const cartCountBadge = document.getElementById('cartCountBadge');
const cartDrawerCount = document.getElementById('cartDrawerCount');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartSubtotalText = document.getElementById('cartSubtotalText');
const cartShippingText = document.getElementById('cartShippingText');
const cartTotalText = document.getElementById('cartTotalText');
const wishlistCount = document.getElementById('wishlistCount');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  updateCartUI();
  updateWishlistUI();
  filterAndRenderProducts();
});

// Event Listeners Initialization
function initEventListeners() {
  // Category Pills
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-category');
      
      // Sync with top search category select if exists
      if (searchCategorySelect) {
        searchCategorySelect.value = currentCategory;
      }
      
      filterAndRenderProducts();
    });
  });

  // Sort Dropdown
  if (productSortSelect) {
    productSortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      filterAndRenderProducts();
    });
  }

  // Live Search Input
  if (navbarSearchInput) {
    navbarSearchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.trim().toLowerCase();
      filterAndRenderProducts();
    });
    navbarSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentSearchTerm = navbarSearchInput.value.trim().toLowerCase();
        filterAndRenderProducts();
        scrollToProducts();
      }
    });
  }

  // Search Button
  if (btnNavbarSearch) {
    btnNavbarSearch.addEventListener('click', () => {
      currentSearchTerm = navbarSearchInput.value.trim().toLowerCase();
      filterAndRenderProducts();
      scrollToProducts();
    });
  }

  // Top Search Category Select
  if (searchCategorySelect) {
    searchCategorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      // Sync pill active state
      categoryPills.forEach(pill => {
        if (pill.getAttribute('data-category') === currentCategory) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
      filterAndRenderProducts();
    });
  }
}

// Scroll into products catalog smoothly
function scrollToProducts() {
  const section = document.querySelector('.products-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Filter and Sort Products
function filterAndRenderProducts() {
  let filtered = [...productsData];

  // Category Filter
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  // Search Filter
  if (currentSearchTerm) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(currentSearchTerm) ||
      p.categoryName.toLowerCase().includes(currentSearchTerm) ||
      p.description.toLowerCase().includes(currentSearchTerm)
    );
  }

  // Sort Filter
  if (currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  renderProducts(filtered);
}

// Generate Star Rating HTML
function generateStarsHtml(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let html = '';

  for (let i = 0; i < fullStars; i++) {
    html += '<i class="bi bi-star-fill text-warning"></i> ';
  }
  if (hasHalfStar) {
    html += '<i class="bi bi-star-half text-warning"></i> ';
  }
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="bi bi-star text-warning"></i> ';
  }

  return html;
}

// Render Products Grid
function renderProducts(products) {
  if (!productsGridContainer) return;

  if (products.length === 0) {
    productsGridContainer.innerHTML = '';
    emptyStateContainer.classList.remove('d-none');
    catalogCountDisplay.textContent = 'Showing 0 items';
    return;
  }

  emptyStateContainer.classList.add('d-none');
  catalogCountDisplay.textContent = `Showing ${products.length} items`;

  productsGridContainer.innerHTML = products.map(product => {
    const isWishlisted = wishlist.includes(product.id);
    const badgeClass = product.badgeType === 'hot' ? 'badge-hot' 
                     : product.badgeType === 'sale' ? 'badge-sale' 
                     : product.badgeType === 'dark' ? 'badge-dark' : 'badge-orange';

    return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="product-card">
          <!-- Top Bar: Badges & Wishlist -->
          <div class="product-top-bar">
            <span class="product-badge ${badgeClass}">${product.badge}</span>
            <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" 
                    onclick="toggleWishlist(${product.id})" 
                    title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
              <i class="bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </button>
          </div>

          <!-- Product Image & Quick View Trigger -->
          <div class="product-thumb-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="quick-view-overlay">
              <button class="btn-quick-view" onclick="openQuickView(${product.id})">
                <i class="bi bi-eye"></i> Quick View
              </button>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info">
            <span class="product-category">${product.categoryName}</span>
            <h3 class="product-title" title="${product.name}">${product.name}</h3>
            
            <div class="rating-stars">
              <span class="stars-list">${generateStarsHtml(product.rating)}</span>
              <span class="reviews-count">(${product.reviewsCount})</span>
            </div>

            <div class="product-pricing">
              <span class="product-price">$${product.price.toFixed(2)}</span>
              ${product.oldPrice ? `<span class="product-old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
            </div>

            <button class="btn-add-cart" onclick="addToCart(${product.id}, 1)">
              <i class="bi bi-cart-plus"></i> Add to Cart
            </button>
            <a href="product.html?id=${product.id}" class="btn-add-cart" style="text-decoration:none;">
              <i class="bi bi-eye"></i> View Product
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset Filters
function resetFilters() {
  currentCategory = 'all';
  currentSearchTerm = '';
  currentSort = 'featured';
  
  if (navbarSearchInput) navbarSearchInput.value = '';
  if (searchCategorySelect) searchCategorySelect.value = 'all';
  if (productSortSelect) productSortSelect.value = 'featured';

  categoryPills.forEach(pill => {
    if (pill.getAttribute('data-category') === 'all') {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  filterAndRenderProducts();
}

// Filter by Category directly (e.g. from footer links)
function filterByCategory(cat) {
  currentCategory = cat;
  categoryPills.forEach(pill => {
    if (pill.getAttribute('data-category') === cat) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
  if (searchCategorySelect) searchCategorySelect.value = cat;
  filterAndRenderProducts();
  scrollToProducts();
}

//  =
// Cart Management
//  =

function addToCart(productId, quantity = 1) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const existingItemIndex = cart.findIndex(item => item.id === productId);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added <strong>${product.name}</strong> to your cart!`);
  openCartOffcanvas();
}

function updateCartQuantity(productId, delta) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].quantity += delta;

  if (cart[itemIndex].quantity <= 0) {
    cart.splice(itemIndex, 1);
    showToast('Item removed from cart');
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from cart');
}

function saveCart() {
  localStorage.setItem('apexmart_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 9.99;
  const grandTotal = subtotal + shipping;

  // Update badges
  if (cartCountBadge) cartCountBadge.textContent = totalCount;
  if (cartDrawerCount) cartDrawerCount.textContent = totalCount;

  // Update summary
  if (cartSubtotalText) cartSubtotalText.textContent = `$${subtotal.toFixed(2)}`;
  if (cartShippingText) {
    cartShippingText.textContent = (shipping === 0 && subtotal > 0) ? 'FREE' : `$${shipping.toFixed(2)}`;
    cartShippingText.className = (shipping === 0 && subtotal > 0) ? 'text-success fw-bold' : 'text-dark fw-bold';
  }
  if (cartTotalText) cartTotalText.textContent = `$${grandTotal.toFixed(2)}`;

  // Render items list inside offcanvas
  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x text-muted display-4"></i>
        <h6 class="fw-bold mt-3 text-dark">Your cart is empty</h6>
        <p class="small text-muted mb-4">Looks like you haven't added anything to your cart yet.</p>
        <button class="btn btn-orange btn-sm" data-bs-dismiss="offcanvas" onclick="scrollToProducts()">
          <i class="bi bi-bag"></i> Start Shopping
        </button>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="flex-grow-1 min-w-0">
        <h6 class="cart-item-title text-truncate" title="${item.name}">${item.name}</h6>
        <div class="cart-item-price mb-2">$${item.price.toFixed(2)}</div>
        
        <div class="d-flex align-items-center justify-content-between">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
          </div>
          <button class="btn-remove-item" onclick="removeFromCart(${item.id})" title="Remove item">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function openCartOffcanvas() {
  const offcanvasEl = document.getElementById('cartOffcanvas');
  if (offcanvasEl) {
    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
    bsOffcanvas.show();
  }
}

function handleCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty! Add items first.');
    return;
  }
   window.location.href = "../customer/checkout.html";
}

//  =
// Wishlist Management
//  =

function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  const product = productsData.find(p => p.id === productId);

  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`Removed from wishlist`);
  } else {
    wishlist.push(productId);
    showToast(`Added <strong>${product ? product.name : 'item'}</strong> to wishlist!`);
  }

  localStorage.setItem('apexmart_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
  filterAndRenderProducts();
}

function updateWishlistUI() {
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
  }
}

//  =
// Quick View Modal
//  =

function openQuickView(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const quickViewContent = document.getElementById('quickViewContent');
  if (!quickViewContent) return;

  quickViewContent.innerHTML = `
    <div class="row g-4 align-items-center">
      <div class="col-md-6 text-center">
        <div class="border rounded-3 p-3 bg-white">
          <img src="${product.image}" alt="${product.name}" class="img-fluid rounded-2" style="max-height: 320px; object-fit: contain;">
        </div>
      </div>
      <div class="col-md-6">
        <span class="badge bg-warning text-dark mb-2">${product.categoryName}</span>
        <h4 class="fw-bold text-dark mb-2">${product.name}</h4>
        
        <div class="rating-stars mb-3">
          <span class="stars-list">${generateStarsHtml(product.rating)}</span>
          <span class="reviews-count">(${product.reviewsCount} customer reviews)</span>
        </div>

        <div class="d-flex align-items-baseline gap-2 mb-3">
          <span class="fs-3 fw-bold text-warning" style="color: var(--primary-orange) !important;">$${product.price.toFixed(2)}</span>
          ${product.oldPrice ? `<span class="text-muted text-decoration-line-through fs-6">$${product.oldPrice.toFixed(2)}</span>` : ''}
          <span class="badge bg-success ms-2">In Stock</span>
        </div>

        <p class="text-secondary small mb-4">${product.description}</p>

        <div class="d-flex align-items-center gap-3 mb-4">
          <label class="small fw-bold">Quantity:</label>
          <div class="qty-control">
            <button class="qty-btn" type="button" onclick="const q = document.getElementById('quickViewQty'); if(parseInt(q.value) > 1) q.value = parseInt(q.value) - 1;">-</button>
            <input type="number" id="quickViewQty" value="1" min="1" max="99" class="qty-val border-0" style="outline: none;">
            <button class="qty-btn" type="button" onclick="const q = document.getElementById('quickViewQty'); q.value = parseInt(q.value) + 1;">+</button>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-orange flex-grow-1 py-2" onclick="
            const qty = parseInt(document.getElementById('quickViewQty').value) || 1;
            addToCart(${product.id}, qty);
            bootstrap.Modal.getInstance(document.getElementById('quickViewModal'))?.hide();
            openCartOffcanvas();
          ">
            <i class="bi bi-cart-check-fill"></i> Add to Cart & Checkout
          </button>
          <button class="btn btn-outline-secondary" onclick="toggleWishlist(${product.id})">
            <i class="bi bi-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const modalEl = document.getElementById('quickViewModal');
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
}

//  =
// Auth & Seller Submissions
//  =
// FOR REG

async function handleAuthSubmit(mode) {

  if (mode === 'register') {

    const userData = {
      first_name: document.getElementById('firstName').value,
      last_name: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      password: document.getElementById('registerPassword').value
    };


    try {

      const response = await fetch("http://127.0.0.1:8000/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });


      if (response.ok) {

        showToast('Account created successfully! Welcome to ApexMart.');

        setTimeout(() => {
          window.location.href = '../main/index.html';
        }, 1500);

      } 
      else {

        const error = await response.json();
        alert(error.detail || "Registration failed");

      }


    } catch(error) {

      console.log(error);
      alert("Server connection failed");

    }

  }




    if (mode === 'login') {

    const loginData = {
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    };


    try {

      const response = await fetch(
        "http://127.0.0.1:8000/customer/login",
        {
          method: "POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify(loginData)
        }
      );


      if(response.ok){

        const user = await response.json();

        localStorage.setItem(
        "apexmart_user",
        JSON.stringify(user)
        );

        showToast("Login successful!");

        setTimeout(()=>{
          window.location.href="../customer/dashboard.html";
        },1500);

      }
      else{

        alert("Invalid email or password");

      }


    }
    catch(error){

      console.log(error);
      alert("Server connection failed");

    }

  }

}







function handleSellerSubmit() {
  const modalEl = document.getElementById('becomeSellerModal');
  const bsModal = bootstrap.Modal.getInstance(modalEl);
  if (bsModal) bsModal.hide();

  showToast('Merchant application received! Our team will contact you in 24 hours.');
}

//  =
// Toast Helper
//  =

function showToast(message) {
  const toastEl = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');

  if (toastEl && toastMessage) {
    toastMessage.innerHTML = `<i class="bi bi-check-circle-fill text-warning fs-5"></i> <span>${message}</span>`;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    toast.show();
  }
}