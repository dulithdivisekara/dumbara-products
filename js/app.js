const starSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
/**
 * Dumbara Products - Main Application Controller
 * Handles UI events, DOM rendering, modal states, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  // DOM Elements
  const header = document.querySelector('.site-header');
  const navMenu = document.querySelector('.nav-menu');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartDrawerClose = document.getElementById('cartDrawerClose');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const cartEmptyMsg = document.getElementById('cartEmptyMsg');
  const cartFooter = document.getElementById('cartFooter');
  const cartNoteInput = document.getElementById('cartNote');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Modals
  const quickviewModal = document.getElementById('quickviewModal');
  const quickviewClose = document.getElementById('quickviewClose');
  const searchModal = document.getElementById('searchModal');
  const searchToggleBtns = document.querySelectorAll('.search-toggle-btn');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutClose = document.getElementById('checkoutClose');
  const checkoutForm = document.getElementById('checkoutForm');
  const orderSuccessModal = document.getElementById('orderSuccessModal');
  const orderSuccessClose = document.getElementById('orderSuccessClose');
  const trackOrderModal = document.getElementById('trackOrderModal');
  const trackOrderClose = document.getElementById('trackOrderClose');
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  const trackOrderForm = document.getElementById('trackOrderForm');
  const trackResult = document.getElementById('trackResult');

  // Grids
  const categoriesGrid = document.getElementById('categoriesGrid');
  const productsGrid = document.getElementById('productsGrid');
  const reviewsGrid = document.getElementById('reviewsGrid');
  const filterTabs = document.querySelectorAll('.tab-btn');

  // Active state
  let activeCategoryFilter = 'all';

  // Initialize Store
  store.init();

  // Listen for Store Init
  store.on('init', (data) => {
    renderCategories(data.categories);
    renderProducts(data.products);
    renderReviews(store.reviews);
    updateCartUI(data.cart);
    initWholesaleCalculator(data.products);
    initFAQs();
    initScrollReveal();
  });

  // Listen for Product Changes
  store.on('products:change', (products) => {
    renderProducts(products);
    initWholesaleCalculator(products);
  });

  // Listen for Cart Changes
  store.on('cart:change', (cart) => {
    updateCartUI(cart);
  });

  // Listen for Wishlist Changes
  store.on('wishlist:change', () => {
    renderProducts(store.products);
  });

  // Listen for Reviews Changes
  store.on('reviews:change', (reviews) => {
    renderReviews(reviews);
  });

  // ==========================================
  // MOBILE NAVIGATION & HEADER DYNAMICS
  // ==========================================
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  // ==========================================
  // CATEGORIES RENDERING
  // ==========================================
  function renderCategories(categories) {
    if (!categoriesGrid) return;
    categoriesGrid.innerHTML = categories.map(cat => `
      <div class="category-card" data-category="${cat.id}">
        <div class="category-media">
          <img src="${cat.image}" alt="${cat.name}" loading="lazy" />
        </div>
        <div class="category-body">
          <span class="category-tag">${cat.tag}</span>
          <h3 class="category-name">${cat.name}</h3>
          <p class="category-desc">${cat.description}</p>
          <span class="category-link-text">Browse Collection &rarr;</span>
        </div>
      </div>
    `).join('');

    categoriesGrid.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.getAttribute('data-category');
        setCategoryFilter(catId);
        const prodSec = document.getElementById('products');
        if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ==========================================
  // PRODUCTS FILTERING & RENDERING
  // ==========================================
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategoryFilter = tab.getAttribute('data-filter');
      renderProducts(store.products);
    });
  });

  function setCategoryFilter(catId) {
    activeCategoryFilter = catId;
    filterTabs.forEach(tab => {
      if (tab.getAttribute('data-filter') === catId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    renderProducts(store.products);
  }

  function renderProducts(products) {
    if (!productsGrid) return;

    let filtered = products;
    if (activeCategoryFilter === 'bestseller') {
      filtered = products.filter(p => p.badge && p.badge.toLowerCase().includes('best'));
    } else if (activeCategoryFilter === 'wholesale') {
      filtered = products.filter(p => p.category === 'wholesale' || p.wholesalePrice > 0);
    } else if (activeCategoryFilter !== 'all') {
      filtered = products.filter(p => p.category === activeCategoryFilter);
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
          <p style="font-size: 1.125rem; color: var(--color-ink-muted);">No products found in this category.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(prod => {
      const isWishlisted = store.isInWishlist(prod.id);
      return `
        <article class="product-card" data-id="${prod.id}">
          <div class="product-media-wrap">
            <img src="${prod.image}" alt="${prod.name}" loading="lazy" />
            ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ''}
            <button class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${prod.id}" title="Save to Wishlist" aria-label="Save to Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="product-info">
            <span class="product-category-label">${prod.category.toUpperCase()}</span>
            <h3 class="product-title">${prod.name}</h3>
            <p class="product-unit">${prod.unit}</p>
            <div class="product-pricing">
              <span class="price-main">${store.formatPrice(prod.retailPrice)}</span>
              <span class="price-wholesale">Wholesale: ${store.formatPrice(prod.wholesalePrice)}</span>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${prod.id}">
                Add to Cart
              </button>
              <button class="btn btn-outline btn-sm quick-view-btn" data-id="${prod.id}">
                Details
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Bind Wishlist Buttons
    productsGrid.querySelectorAll('.product-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        store.toggleWishlist(id);
      });
    });

    // Bind Add to Cart Buttons
    productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        store.addToCart(id, 1, false);
        openCartDrawer();
      });
    });

    // Bind Quick View Buttons
    productsGrid.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openQuickView(id);
      });
    });
  }

  // ==========================================
  // CART DRAWER & UI UPDATES
  // ==========================================
  function updateCartUI(cart) {
    const totalCount = store.getCartCount();
    const subtotal = store.getCartSubtotal();

    cartCountBadges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = store.formatPrice(subtotal);
    }

    if (!cartItemsList) return;

    if (cart.items.length === 0) {
      cartItemsList.innerHTML = '';
      if (cartEmptyMsg) cartEmptyMsg.style.display = 'block';
      if (cartFooter) cartFooter.style.display = 'none';
    } else {
      if (cartEmptyMsg) cartEmptyMsg.style.display = 'none';
      if (cartFooter) cartFooter.style.display = 'block';

      cartItemsList.innerHTML = cart.items.map(item => `
        <div class="cart-item-row" data-id="${item.id}" data-wholesale="${item.isWholesale}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />
          <div>
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">${store.formatPrice(item.price)} ${item.isWholesale ? '(Wholesale)' : ''}</div>
            <div class="qty-control">
              <button class="qty-btn qty-decrease">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn qty-increase">+</button>
            </div>
          </div>
          <div>
            <button class="action-btn cart-item-remove" title="Remove item" aria-label="Remove item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      // Bind quantity and remove
      cartItemsList.querySelectorAll('.cart-item-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const isWholesale = row.getAttribute('data-wholesale') === 'true';
        const item = cart.items.find(i => i.id === id && i.isWholesale === isWholesale);

        row.querySelector('.qty-decrease').addEventListener('click', () => {
          if (item) store.updateCartQty(id, isWholesale, item.quantity - 1);
        });

        row.querySelector('.qty-increase').addEventListener('click', () => {
          if (item) store.updateCartQty(id, isWholesale, item.quantity + 1);
        });

        row.querySelector('.cart-item-remove').addEventListener('click', () => {
          store.removeFromCart(id, isWholesale);
        });
      });
    }

    if (cartNoteInput) {
      cartNoteInput.value = cart.note || '';
    }
  }

  function openCartDrawer() {
    if (cartDrawer) cartDrawer.classList.add('open');
  }

  function closeCartDrawer() {
    if (cartDrawer) cartDrawer.classList.remove('open');
  }

  cartToggleBtns.forEach(btn => {
    btn.addEventListener('click', openCartDrawer);
  });

  if (cartDrawerClose) {
    cartDrawerClose.addEventListener('click', closeCartDrawer);
  }

  if (cartNoteInput) {
    cartNoteInput.addEventListener('change', (e) => {
      store.updateCartNote(e.target.value);
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCartDrawer();
      openCheckoutModal();
    });
  }

  // ==========================================
  // QUICK VIEW MODAL
  // ==========================================
  function openQuickView(productId) {
    const product = store.products.find(p => p.id === productId);
    if (!product || !quickviewModal) return;

    document.getElementById('qvImage').src = product.image;
    document.getElementById('qvTitle').textContent = product.name;
    document.getElementById('qvSinhala').textContent = product.sinhalaName || '';
    document.getElementById('qvCategory').textContent = product.category.toUpperCase();
    document.getElementById('qvRetailPrice').textContent = store.formatPrice(product.retailPrice);
    document.getElementById('qvWholesalePrice').textContent = store.formatPrice(product.wholesalePrice);
    document.getElementById('qvWholesaleMin').textContent = product.wholesaleMinQty;
    document.getElementById('qvStock').textContent = product.inStock ? `${product.stockCount} units available in Wattegama warehouse` : 'Out of Stock';
    document.getElementById('qvDescription').textContent = product.description;

    const specsList = document.getElementById('qvSpecs');
    if (specsList && product.specifications) {
      specsList.innerHTML = Object.entries(product.specifications).map(([k, v]) => `
        <li style="margin-bottom: 6px;"><strong>${k}:</strong> ${v}</li>
      `).join('');
    }

    const qvQtyInput = document.getElementById('qvQty');
    if (qvQtyInput) qvQtyInput.value = 1;

    const qvAddBtn = document.getElementById('qvAddToCart');
    if (qvAddBtn) {
      qvAddBtn.onclick = () => {
        const qty = parseInt(qvQtyInput.value, 10) || 1;
        const isWholesale = document.getElementById('qvWholesaleToggle')?.checked || false;
        store.addToCart(product.id, qty, isWholesale);
        closeQuickView();
        openCartDrawer();
      };
    }

    quickviewModal.classList.add('open');
  }

  function closeQuickView() {
    if (quickviewModal) quickviewModal.classList.remove('open');
  }

  if (quickviewClose) {
    quickviewClose.addEventListener('click', closeQuickView);
  }

  // ==========================================
  // LIVE SEARCH OVERLAY
  // ==========================================
  function openSearchModal() {
    if (searchModal) {
      searchModal.classList.add('open');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        handleSearch('');
      }
    }
  }

  function closeSearchModal() {
    if (searchModal) searchModal.classList.remove('open');
  }

  searchToggleBtns.forEach(btn => {
    btn.addEventListener('click', openSearchModal);
  });

  if (searchClose) {
    searchClose.addEventListener('click', closeSearchModal);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  function handleSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();

    if (!q) {
      searchResults.innerHTML = `
        <div style="padding: 24px 0; color: var(--color-ink-muted);">
          <p style="font-size: 0.875rem;">Type to search Dumbara products by name, spice, or category...</p>
        </div>
      `;
      return;
    }

    const matches = store.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sinhalaName && p.sinhalaName.includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div style="padding: 24px 0; text-align: center; color: var(--color-ink-muted);">
          <p>No products matching "${query}".</p>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(p => `
      <div class="cart-item-row search-item" data-id="${p.id}" style="cursor: pointer;">
        <img src="${p.image}" alt="${p.name}" class="cart-item-thumb" />
        <div>
          <h4 class="cart-item-title">${p.name}</h4>
          <span style="font-size: 0.75rem; color: var(--color-accent-dark);">${p.category.toUpperCase()}</span>
          <div class="cart-item-price">${store.formatPrice(p.retailPrice)}</div>
        </div>
        <div>
          <button class="btn btn-outline btn-sm search-select-btn" data-id="${p.id}">View</button>
        </div>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-item').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        closeSearchModal();
        openQuickView(id);
      });
    });
  }

  // Keyboard Shortcuts: ESC to close any modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeQuickView();
      closeSearchModal();
      closeCheckoutModal();
      closeOrderSuccess();
      closeTrackOrder();
    }
  });

  // ==========================================
  // WHOLESALE CALCULATOR (INTERACTIVE LIVE TOOL)
  // ==========================================
  function initWholesaleCalculator(products) {
    const productSelect = document.getElementById('calcProduct');
    const qtyInput = document.getElementById('calcQty');
    const tierPills = document.querySelectorAll('.tier-pill');
    const calcSubtotal = document.getElementById('calcSubtotal');
    const calcDiscount = document.getElementById('calcDiscount');
    const calcTotal = document.getElementById('calcTotal');
    const calcAddToCart = document.getElementById('calcAddToCart');

    if (!productSelect || !qtyInput) return;

    // Populate products in select
    productSelect.innerHTML = products.map(p => `
      <option value="${p.id}">${p.name} - ${store.formatPrice(p.wholesalePrice)}/unit</option>
    `).join('');

    function updateCalculator() {
      const selectedId = productSelect.value;
      const product = products.find(p => p.id === selectedId) || products[0];
      const qty = parseInt(qtyInput.value, 10) || 10;

      let discountPercent = 0.15;
      let activeTierIndex = 0;

      if (qty >= 100) {
        discountPercent = 0.35;
        activeTierIndex = 2;
      } else if (qty >= 50) {
        discountPercent = 0.25;
        activeTierIndex = 1;
      }

      tierPills.forEach((pill, idx) => {
        pill.classList.toggle('active', idx === activeTierIndex);
      });

      const rawRetailTotal = product.retailPrice * qty;
      const discountedTotal = rawRetailTotal * (1 - discountPercent);
      const savings = rawRetailTotal - discountedTotal;

      if (calcSubtotal) calcSubtotal.textContent = store.formatPrice(rawRetailTotal);
      if (calcDiscount) calcDiscount.textContent = `-${store.formatPrice(savings)} (${Math.round(discountPercent * 100)}% Off)`;
      if (calcTotal) calcTotal.textContent = store.formatPrice(discountedTotal);
    }

    productSelect.addEventListener('change', updateCalculator);
    qtyInput.addEventListener('input', updateCalculator);

    tierPills.forEach((pill, idx) => {
      pill.addEventListener('click', () => {
        if (idx === 0) qtyInput.value = 25;
        else if (idx === 1) qtyInput.value = 75;
        else qtyInput.value = 150;
        updateCalculator();
      });
    });

    if (calcAddToCart) {
      calcAddToCart.addEventListener('click', () => {
        const selectedId = productSelect.value;
        const qty = parseInt(qtyInput.value, 10) || 10;
        store.addToCart(selectedId, qty, true);
        openCartDrawer();
      });
    }

    updateCalculator();
  }

  // ==========================================
  // CHECKOUT & ORDER SUBMISSION FLOW
  // ==========================================
  function openCheckoutModal() {
    if (!checkoutModal) return;
    const subtotal = store.getCartSubtotal();
    const count = store.getCartCount();

    if (count === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    document.getElementById('checkoutSummaryTotal').textContent = store.formatPrice(subtotal);
    document.getElementById('checkoutSummaryItems').textContent = `${count} item(s)`;
    checkoutModal.classList.add('open');
  }

  function closeCheckoutModal() {
    if (checkoutModal) checkoutModal.classList.remove('open');
  }

  if (checkoutClose) {
    checkoutClose.addEventListener('click', closeCheckoutModal);
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const customerDetails = {
        name: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        address: document.getElementById('custAddress').value.trim(),
        district: document.getElementById('custDistrict').value,
        orderType: document.getElementById('custOrderType').value,
        paymentMethod: document.getElementById('custPaymentMethod').value
      };

      const order = store.createOrder(customerDetails);
      if (order) {
        closeCheckoutModal();
        showOrderSuccess(order);
      }
    });
  }

  function showOrderSuccess(order) {
    if (!orderSuccessModal) return;

    document.getElementById('successOrderId').textContent = order.id;
    document.getElementById('successOrderTotal').textContent = store.formatPrice(order.subtotal);
    document.getElementById('successCustomerName').textContent = order.customer.name;
    document.getElementById('successCustomerPhone').textContent = order.customer.phone;
    document.getElementById('successCustomerAddress').textContent = `${order.customer.address}, ${order.customer.district}`;

    // Prepare WhatsApp Message Link
    const waText = encodeURIComponent(
      `*Dumbara Products - New Order Confirmation*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Customer:* ${order.customer.name}\n` +
      `*Contact:* ${order.customer.phone}\n` +
      `*Address:* ${order.customer.address}, ${order.customer.district}\n` +
      `*Type:* ${order.customer.orderType}\n` +
      `*Total Amount:* ${store.formatPrice(order.subtotal)}\n\n` +
      `*Items Ordered:*\n` +
      order.items.map(i => `- ${i.name} (${i.isWholesale ? 'Wholesale' : 'Retail'}) x ${i.quantity} = ${store.formatPrice(i.price * i.quantity)}`).join('\n') +
      `\n\n_Please confirm delivery schedule from Wattegama, Kandy._`
    );

    const waBtn = document.getElementById('successWhatsAppBtn');
    if (waBtn) {
      waBtn.href = `https://wa.me/94777372863?text=${waText}`;
    }

    orderSuccessModal.classList.add('open');
  }

  function closeOrderSuccess() {
    if (orderSuccessModal) orderSuccessModal.classList.remove('open');
  }

  if (orderSuccessClose) {
    orderSuccessClose.addEventListener('click', closeOrderSuccess);
  }

  // ==========================================
  // ORDER TRACKING LOOKUP
  // ==========================================
  function openTrackOrder() {
    if (trackOrderModal) {
      trackOrderModal.classList.add('open');
      if (trackResult) trackResult.innerHTML = '';
      const input = document.getElementById('trackIdInput');
      if (input) input.value = '';
    }
  }

  function closeTrackOrder() {
    if (trackOrderModal) trackOrderModal.classList.remove('open');
  }

  if (trackOrderBtn) {
    trackOrderBtn.addEventListener('click', openTrackOrder);
  }

  if (trackOrderClose) {
    trackOrderClose.addEventListener('click', closeTrackOrder);
  }

  if (trackOrderForm) {
    trackOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('trackIdInput').value.trim();
      const order = store.getOrderById(id);

      if (!order) {
        trackResult.innerHTML = `
          <div style="padding: 16px; background-color: #FEF2F2; background-color: #FEF2F2; color: #991B1B; font-size: 0.875rem;">
            Order ID "${id}" was not found in our records. Please verify the code on your order confirmation.
          </div>
        `;
        return;
      }

      const statusColors = {
        'Pending': '#D97706',
        'Confirmed': '#2563EB',
        'Dispatched': '#02BF63',
        'Completed': '#059669',
        'Cancelled': '#DC2626'
      };

      trackResult.innerHTML = `
        <div style="padding: 20px; background-color: var(--color-ground-soft);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 1.125rem;">${order.id}</h4>
            <span style="background-color: ${statusColors[order.status] || '#666'}; color: #FFF; padding: 4px 10px; font-size: 0.75rem; font-weight: bold;">
              ${order.status}
            </span>
          </div>
          <p style="font-size: 0.875rem; color: var(--color-ink-muted); margin-bottom: 8px;">
            Placed on: ${new Date(order.createdAt).toLocaleDateString()} | Total: ${store.formatPrice(order.subtotal)}
          </p>
          <p style="font-size: 0.875rem; margin-bottom: 12px;">
            Destination: ${order.customer.address}, ${order.customer.district}
          </p>
          <div style="font-size: 0.8125rem; background-color: var(--color-ground); padding: 10px; margin-bottom: 12px;">
            <strong>Items:</strong>
            <ul style="margin-top: 4px; padding-left: 18px; list-style: disc;">
              ${order.items.map(i => `<li>${i.name} (${i.isWholesale ? 'Wholesale' : 'Retail'}) &times; ${i.quantity}</li>`).join('')}
            </ul>
          </div>
          ${order.status === 'Pending' ? `
            <button class="btn btn-outline btn-sm cancel-order-action-btn" data-id="${order.id}" style="color: #DC2626; border-color: #DC2626;">
              Cancel This Order
            </button>
          ` : ''}
        </div>
      `;

      const cancelBtn = trackResult.querySelector('.cancel-order-action-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to cancel this pending order?')) {
            store.cancelOrder(order.id);
            trackOrderForm.dispatchEvent(new Event('submit'));
          }
        });
      }
    });
  }

  // ==========================================
  // REVIEWS RENDERING
  // ==========================================
  function renderReviews(reviews) {
    if (!reviewsGrid) return;
    reviewsGrid.innerHTML = reviews.map(r => `
      <div class="review-card">
        <p class="review-comment">"${r.comment}"</p>
        <div class="review-meta">
          <div>
            <div class="review-author">${r.author}</div>
            <div class="review-role">${r.role}</div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--color-accent-dark); font-weight: 700; font-size: 0.875rem;">Verified Rating: ${r.rating}.0 / 5.0</div>
            <span class="review-product-tag">${r.product}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // FAQ ACCORDION LOGIC
  // ==========================================
  function initFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const q = item.querySelector('.faq-question');
      if (q) {
        q.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          faqItems.forEach(i => i.classList.remove('active'));
          if (!isActive) item.classList.add('active');
        });
      }
    });
  }

  // ==========================================
  // MOTION LAYER (CHOREOGRAPHED SCROLL ENTRANCES)
  // ==========================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.motion-reveal');
    if (!reveals.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('is-revealed');
              entry.target.style.transform = 'translateY(0)';
              entry.target.style.opacity = '1';
            }, idx * 60);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      reveals.forEach(el => observer.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('is-revealed'));
    }
  }
});
