// ============================================
// Product Detail Page Logic
// ============================================

(function () {
  'use strict';

  // --- Get Product ID from URL ---
  function getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'), 10);
  }

  // --- Generate Star Rating HTML ---
  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="bi bi-star-fill"></i> ';
    }
    if (hasHalfStar) {
      html += '<i class="bi bi-star-half"></i> ';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="bi bi-star"></i> ';
    }
    return html;
  }

  // --- Generate Feature Points from Description ---
  function generateFeatures(product) {
    const features = [];
    // Split description into meaningful parts
    const sentences = product.description.split(/[.!]+/).filter(s => s.trim().length > 10);
    sentences.forEach(s => features.push(s.trim()));
    
    // Add generic features based on category
    if (product.category === 'electronics') {
      features.push('Premium build quality with durable materials');
      features.push('1-year manufacturer warranty included');
    } else if (product.category === 'audio') {
      features.push('Crystal-clear audio performance');
      features.push('Premium acoustic engineering');
    } else if (product.category === 'wearables') {
      features.push('Water-resistant design for active lifestyles');
      features.push('Advanced health & fitness tracking');
    } else if (product.category === 'fashion') {
      features.push('Premium craftsmanship with quality materials');
      features.push('Timeless design for everyday wear');
    } else if (product.category === 'home') {
      features.push('Elegant design complements any home décor');
      features.push('Easy to set up and maintain');
    }
    return features;
  }

  // --- Render Product Detail ---
  function renderProductDetail(product) {
    if (!product) {
      document.querySelector('.product-detail-section').innerHTML = `
        <div class="container text-center py-5">
          <div class="display-1 text-muted mb-3"><i class="bi bi-exclamation-triangle"></i></div>
          <h3 class="fw-bold">Product Not Found</h3>
          <p class="text-muted">The product you're looking for doesn't exist or has been removed.</p>
          <a href="index.html" class="btn btn-orange"><i class="bi bi-arrow-left"></i> Back to Store</a>
        </div>
      `;
      return;
    }

    // Update page title
    document.title = `${product.name} - ApexMart`;

    // Breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const breadcrumbProduct = document.getElementById('breadcrumbProduct');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.categoryName;
      breadcrumbCategory.href = `index.html`;
    }
    if (breadcrumbProduct) {
      breadcrumbProduct.textContent = product.name;
    }

    // Main Image
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
      mainImage.src = product.image;
      mainImage.alt = product.name;
    }

    // Expanded Image
    const expandedImage = document.getElementById('expandedImage');
    if (expandedImage) {
      expandedImage.src = product.image;
      expandedImage.alt = product.name;
    }

    // Badge
    const badgeWrap = document.getElementById('detailBadgeWrap');
    if (badgeWrap) {
      const badgeClass = product.badgeType === 'hot' ? 'badge-hot'
        : product.badgeType === 'sale' ? 'badge-sale'
        : product.badgeType === 'dark' ? 'badge-dark' : 'badge-orange';
      badgeWrap.innerHTML = `<span class="detail-badge ${badgeClass}"><i class="bi bi-award-fill"></i> ${product.badge}</span>`;
    }

    // Title
    const titleEl = document.getElementById('detailProductTitle');
    if (titleEl) titleEl.textContent = product.name;

    // Rating
    const ratingEl = document.getElementById('detailRating');
    if (ratingEl) {
      ratingEl.innerHTML = `
        <span class="stars-list">${generateStars(product.rating)}</span>
        <span class="rating-value">${product.rating}</span>
        <span class="rating-count">(${product.reviewsCount.toLocaleString()} customer reviews)</span>
      `;
    }

    // Category Tag
    const categoryTag = document.getElementById('detailCategoryTag');
    if (categoryTag) {
      categoryTag.querySelector('span').textContent = product.categoryName;
      categoryTag.href = `index.html`;
    }

    // Description
    const descEl = document.getElementById('detailDescription');
    if (descEl) {
      descEl.querySelector('p').textContent = product.description;
    }

    // Features
    const featuresList = document.getElementById('featuresList');
    if (featuresList) {
      const features = generateFeatures(product);
      featuresList.innerHTML = features.map(f => `<li>${f}</li>`).join('');
    }

    // Price
    const currentPrice = document.getElementById('detailCurrentPrice');
    const oldPrice = document.getElementById('detailOldPrice');
    const savingsBadge = document.getElementById('detailSavingsBadge');
    if (currentPrice) currentPrice.textContent = `$${product.price.toFixed(2)}`;
    if (oldPrice && product.oldPrice) {
      oldPrice.textContent = `$${product.oldPrice.toFixed(2)}`;
    } else if (oldPrice) {
      oldPrice.style.display = 'none';
    }
    if (savingsBadge && product.oldPrice) {
      const savings = product.oldPrice - product.price;
      savingsBadge.textContent = `Save $${savings.toFixed(2)}`;
    } else if (savingsBadge) {
      savingsBadge.style.display = 'none';
    }

    // Recommended Category Name
    const recCatName = document.getElementById('recommendedCategoryName');
    if (recCatName) recCatName.textContent = product.categoryName;
  }

  // --- Render Recommended Products ---
  function renderRecommendedProducts(currentProduct) {
    const grid = document.getElementById('recommendedProductsGrid');
    if (!grid || !currentProduct) return;

    // Get products from same category, excluding current
    let recommended = productsData.filter(
      p => p.category === currentProduct.category && p.id !== currentProduct.id
    );

    // If not enough from same category, fill with other products
    if (recommended.length < 4) {
      const others = productsData.filter(
        p => p.category !== currentProduct.category && p.id !== currentProduct.id
      );
      recommended = recommended.concat(others.slice(0, 5 - recommended.length));
    }

    // Limit to 5
    recommended = recommended.slice(0, 5);

    grid.innerHTML = recommended.map(product => `
      <a href="product.html?id=${product.id}" class="rec-product-card" title="${product.name}">
        <div class="rec-product-thumb">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="rec-product-body">
          <div class="rec-product-name">${product.name}</div>
          <div class="rec-product-rating">
            ${generateStars(product.rating)}
            <span class="text-muted">(${product.reviewsCount})</span>
          </div>
          <div class="rec-product-price">
            $${product.price.toFixed(2)}
            ${product.oldPrice ? `<span class="rec-old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
          </div>
          <span class="btn-view-product">
            <i class="bi bi-eye"></i> View Product
          </span>
        </div>
      </a>
    `).join('');
  }

  // --- Image Zoom Logic ---
  function initImageZoom() {
    const container = document.getElementById('mainImageContainer');
    const image = document.getElementById('mainProductImage');
    if (!container || !image) return;

    container.addEventListener('mouseenter', function () {
      container.classList.add('zooming');
    });

    container.addEventListener('mouseleave', function () {
      container.classList.remove('zooming');
      image.style.transformOrigin = 'center center';
    });

    container.addEventListener('mousemove', function (e) {
      if (!container.classList.contains('zooming')) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      image.style.transformOrigin = `${x}% ${y}%`;
    });

    // Click to expand
    container.addEventListener('click', function () {
      const modal = document.getElementById('imageExpandModal');
      if (modal) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();
      }
    });
  }

  // --- Quantity Controls ---
  function initQuantityControls() {
    const qtyInput = document.getElementById('productQty');
    const btnMinus = document.getElementById('qtyMinus');
    const btnPlus = document.getElementById('qtyPlus');

    if (btnMinus && qtyInput) {
      btnMinus.addEventListener('click', () => {
        const val = parseInt(qtyInput.value, 10);
        if (val > 1) qtyInput.value = val - 1;
      });
    }

    if (btnPlus && qtyInput) {
      btnPlus.addEventListener('click', () => {
        const val = parseInt(qtyInput.value, 10);
        qtyInput.value = val + 1;
      });
    }
  }

  // --- Action Buttons ---
  function initActionButtons(product) {
    if (!product) return;

    const btnBuyNow = document.getElementById('btnBuyNow');
    const btnAddToCart = document.getElementById('btnAddToCart');
    const btnWishlist = document.getElementById('btnWishlist');
    const qtyInput = document.getElementById('productQty');

    if (btnBuyNow) {
      btnBuyNow.addEventListener('click', () => {
        const qty = parseInt(qtyInput?.value, 10) || 1;
        addToCart(product.id, qty);
        openCartOffcanvas();
      });
    }

    if (btnAddToCart) {
      btnAddToCart.addEventListener('click', () => {
        const qty = parseInt(qtyInput?.value, 10) || 1;
        addToCart(product.id, qty);
      });
    }

    if (btnWishlist) {
      // Check initial state
      const wishlistData = JSON.parse(localStorage.getItem('apexmart_wishlist')) || [];
      if (wishlistData.includes(product.id)) {
        btnWishlist.classList.add('active');
        btnWishlist.innerHTML = '<i class="bi bi-heart-fill"></i>';
      }

      btnWishlist.addEventListener('click', () => {
        toggleWishlist(product.id);
        const currentWishlist = JSON.parse(localStorage.getItem('apexmart_wishlist')) || [];
        if (currentWishlist.includes(product.id)) {
          btnWishlist.classList.add('active');
          btnWishlist.innerHTML = '<i class="bi bi-heart-fill"></i>';
        } else {
          btnWishlist.classList.remove('active');
          btnWishlist.innerHTML = '<i class="bi bi-heart"></i>';
        }
      });
    }
  }

  // --- Search Bar Integration ---
  function initSearchBar() {
    const searchInput = document.getElementById('navbarSearchInput');
    const searchBtn = document.getElementById('btnNavbarSearch');

    function doSearch() {
      const term = searchInput ? searchInput.value.trim() : '';
      if (term) {
        window.location.href = `index.html?search=${encodeURIComponent(term)}`;
      }
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', doSearch);
    }
  }

  // --- Initialize Everything ---
  document.addEventListener('DOMContentLoaded', function () {
    const productId = getProductIdFromURL();
    const product = productsData.find(p => p.id === productId) || productsData[0];

    renderProductDetail(product);
    renderRecommendedProducts(product);
    initImageZoom();
    initQuantityControls();
    initActionButtons(product);
    initSearchBar();
    updateCartUI();
  });

})();
