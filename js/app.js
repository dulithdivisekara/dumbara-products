const starSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
const checkSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';

/**
 * Dumbara Products - Main Application Controller
 * Handles UI events, bilingual localization (EN / SI), customer authentication,
 * profile order history, cart drawer, wholesale calculator, and 5-stage order tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  // Header & Nav DOM Elements
  const navMenu = document.querySelector('.nav-menu');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const langBtns = document.querySelectorAll('.lang-btn');
  const langToggleMobile = document.getElementById('langToggleMobile');
  const accountBtn = document.getElementById('accountBtn');
  const userActiveDot = document.getElementById('userActiveDot');

  // Cart Drawer Elements
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

  // Customer Authentication & Profile Modals
  const customerAuthModal = document.getElementById('customerAuthModal');
  const customerAuthClose = document.getElementById('customerAuthClose');
  const authTabLogin = document.getElementById('authTabLogin');
  const authTabRegister = document.getElementById('authTabRegister');
  const customerLoginForm = document.getElementById('customerLoginForm');
  const customerRegisterForm = document.getElementById('customerRegisterForm');
  const authNotice = document.getElementById('authNotice');
  const customerProfileModal = document.getElementById('customerProfileModal');
  const customerProfileClose = document.getElementById('customerProfileClose');
  const customerLogoutBtn = document.getElementById('customerLogoutBtn');
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  const profileOrdersTable = document.getElementById('profileOrdersTable');
  const profileOrdersCount = document.getElementById('profileOrdersCount');

  // Storefront Modals
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
    applyTranslations(store.currentLang);
    renderCategories(data.categories);
    renderProducts(data.products);
    renderReviews(store.reviews);
    updateCartUI(data.cart);
    updateUserIndicator();
    initWholesaleCalculator(data.products);
    initFAQs();
    initScrollReveal();
  });

  // Listen for Store Events
  store.on('products:change', (products) => {
    renderProducts(products);
    initWholesaleCalculator(products);
  });

  store.on('cart:change', (cart) => {
    updateCartUI(cart);
  });

  store.on('wishlist:change', () => {
    renderProducts(store.products);
  });

  store.on('reviews:change', (reviews) => {
    renderReviews(reviews);
  });

  store.on('lang:change', (lang) => {
    applyTranslations(lang);
  });

  store.on('user:session', () => {
    updateUserIndicator();
  });

  // ==========================================
  // LANGUAGE & LOCALIZATION TOGGLE
  // ==========================================
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      store.setLanguage(lang);
    });
  });

  if (langToggleMobile) {
    langToggleMobile.addEventListener('click', () => {
      const nextLang = store.currentLang === 'en' ? 'si' : 'en';
      store.setLanguage(nextLang);
    });
  }

  function applyTranslations(lang) {
    langBtns.forEach(b => {
      if (b.getAttribute('data-lang') === lang) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (langToggleMobile) {
      const label = langToggleMobile.querySelector('.lang-mobile-label');
      if (label) {
        label.textContent = lang === 'en' ? 'සිංහල' : 'English';
      }
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = store.t(key);
      if (text) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    if (store.products && store.products.length) renderProducts(store.products);
    if (store.categories && store.categories.length) renderCategories(store.categories);
  }

  // ==========================================
  // MOBILE NAVIGATION
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
  // CUSTOMER USER MANAGEMENT & MODALS
  // ==========================================
  function updateUserIndicator() {
    if (userActiveDot) {
      userActiveDot.style.display = store.currentUser ? 'block' : 'none';
    }
  }

  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      if (store.currentUser) {
        openCustomerProfile();
      } else {
        openCustomerAuth();
      }
    });
  }

  function openCustomerAuth() {
    if (!customerAuthModal) return;
    if (authNotice) authNotice.style.display = 'none';
    showAuthTab('login');
    customerAuthModal.classList.add('open');
  }

  function closeCustomerAuth() {
    if (customerAuthModal) customerAuthModal.classList.remove('open');
  }

  if (customerAuthClose) {
    customerAuthClose.addEventListener('click', closeCustomerAuth);
  }

  function showAuthTab(tab) {
    if (tab === 'login') {
      if (authTabLogin) authTabLogin.classList.add('active');
      if (authTabRegister) authTabRegister.classList.remove('active');
      if (customerLoginForm) customerLoginForm.style.display = 'block';
      if (customerRegisterForm) customerRegisterForm.style.display = 'none';
    } else {
      if (authTabLogin) authTabLogin.classList.remove('active');
      if (authTabRegister) authTabRegister.classList.add('active');
      if (customerLoginForm) customerLoginForm.style.display = 'none';
      if (customerRegisterForm) customerRegisterForm.style.display = 'block';
    }
  }

  if (authTabLogin) authTabLogin.addEventListener('click', () => showAuthTab('login'));
  if (authTabRegister) authTabRegister.addEventListener('click', () => showAuthTab('register'));

  // Demo Login Shortcuts
  document.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');
      const res = store.loginUser(email, pass);
      if (res.success) {
        closeCustomerAuth();
        openCustomerProfile();
      }
    });
  });

  // Login Form Submit
  if (customerLoginForm) {
    customerLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailOrPhone = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      const res = store.loginUser(emailOrPhone, password);

      if (res.success) {
        closeCustomerAuth();
        openCustomerProfile();
      } else {
        if (authNotice) {
          authNotice.textContent = res.message;
          authNotice.style.display = 'block';
        }
      }
    });
  }

  // Register Form Submit
  if (customerRegisterForm) {
    customerRegisterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const details = {
        name: document.getElementById('regName').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value.trim(),
        district: document.getElementById('regDistrict').value,
        type: document.getElementById('regType').value,
        address: document.getElementById('regAddress').value.trim()
      };

      const res = store.registerUser(details);
      if (res.success) {
        closeCustomerAuth();
        openCustomerProfile();
      } else {
        if (authNotice) {
          authNotice.textContent = res.message;
          authNotice.style.display = 'block';
        }
      }
    });
  }

  // Customer Profile Controller
  function openCustomerProfile() {
    if (!customerProfileModal || !store.currentUser) return;
    const u = store.currentUser;
    const isSi = store.currentLang === 'si';

    document.getElementById('profileName').textContent = u.name;
    document.getElementById('profileEmail').textContent = u.email || u.phone;
    document.getElementById('profileTypeBadge').textContent = (u.type || 'Retail').toUpperCase();
    document.getElementById('profilePhone').value = u.phone || '';
    document.getElementById('profileDistrict').value = u.district || 'Kandy';
    document.getElementById('profileAddress').value = u.address || '';

    renderProfileOrders();
    customerProfileModal.classList.add('open');
  }

  function closeCustomerProfile() {
    if (customerProfileModal) customerProfileModal.classList.remove('open');
  }

  if (customerProfileClose) {
    customerProfileClose.addEventListener('click', closeCustomerProfile);
  }

  if (customerLogoutBtn) {
    customerLogoutBtn.addEventListener('click', () => {
      store.logoutUser();
      closeCustomerProfile();
    });
  }

  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      store.updateUserProfile({
        phone: document.getElementById('profilePhone').value.trim(),
        district: document.getElementById('profileDistrict').value,
        address: document.getElementById('profileAddress').value.trim()
      });
      alert('Delivery profile updated successfully!');
    });
  }

  function renderProfileOrders() {
    if (!profileOrdersTable) return;
    const userOrders = store.getUserOrders();
    if (profileOrdersCount) profileOrdersCount.textContent = `${userOrders.length} Order(s)`;

    if (userOrders.length === 0) {
      profileOrdersTable.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-ink-muted); font-size: var(--font-small-size); background-color: var(--color-ground);">
          No previous orders found for this account. Explore our products and place your first order.
        </div>
      `;
      return;
    }

    profileOrdersTable.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${userOrders.map(o => `
            <tr>
              <td><strong>${o.id}</strong></td>
              <td><small>${new Date(o.createdAt).toLocaleDateString()}</small></td>
              <td>${o.items ? o.items.length : 1} item(s)</td>
              <td><strong>${store.formatPrice(o.subtotal)}</strong></td>
              <td>
                <span style="display: inline-block; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; background-color: var(--color-accent-subtle); color: var(--color-accent-dark);">
                  ${o.status || 'Received'}
                </span>
              </td>
              <td>
                <button class="btn btn-outline btn-sm track-my-order-btn" data-id="${o.id}">Track</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    profileOrdersTable.querySelectorAll('.track-my-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        closeCustomerProfile();
        openTrackOrder();
        const input = document.getElementById('trackIdInput');
        if (input) {
          input.value = orderId;
          trackOrderForm.dispatchEvent(new Event('submit'));
        }
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

    const isSi = store.currentLang === 'si';

    productsGrid.innerHTML = filtered.map(prod => {
      const isWishlisted = store.isInWishlist(prod.id);
      const mainTitle = isSi ? (prod.sinhalaName || prod.name) : prod.name;
      const subTitle = isSi ? prod.name : (prod.sinhalaName || '');

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
            <h3 class="product-title">${mainTitle}</h3>
            ${subTitle ? `<p style="font-size: var(--font-caption-size); color: var(--color-ink-muted); margin-top: -4px; margin-bottom: 8px;">${subTitle}</p>` : ''}
            <p class="product-unit">${prod.unit}</p>
            <div class="product-pricing">
              <span class="price-main">${store.formatPrice(prod.retailPrice)}</span>
              <span class="price-wholesale">${isSi ? 'තොග මිල' : 'Wholesale'}: ${store.formatPrice(prod.wholesalePrice)}</span>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${prod.id}">
                ${store.t('btn_add_cart')}
              </button>
              <button class="btn btn-outline btn-sm quick-view-btn" data-id="${prod.id}">
                ${store.t('btn_quick_view')}
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
  // QUICK VIEW MODAL
  // ==========================================
  function openQuickView(productId) {
    const prod = store.products.find(p => p.id === productId);
    if (!prod || !quickviewModal) return;

    document.getElementById('qvImage').src = prod.image;
    document.getElementById('qvCategory').textContent = prod.category.toUpperCase();
    document.getElementById('qvSinhala').textContent = prod.sinhalaName ? `${prod.name} (${prod.sinhalaName})` : prod.name;
    document.getElementById('qvRetailPrice').textContent = store.formatPrice(prod.retailPrice);
    document.getElementById('qvWholesalePrice').textContent = store.formatPrice(prod.wholesalePrice);
    document.getElementById('qvWholesaleMin').textContent = prod.wholesaleMinQty || 10;
    document.getElementById('qvStock').textContent = prod.inStock ? `In Stock (${prod.stockCount} available)` : 'Out of Stock';
    document.getElementById('qvDescription').textContent = prod.description || prod.shortDesc;
    document.getElementById('qvQty').value = 1;
    document.getElementById('qvWholesaleToggle').checked = false;

    // Specifications
    const specsEl = document.getElementById('qvSpecs');
    if (specsEl) {
      if (prod.specifications) {
        specsEl.innerHTML = Object.entries(prod.specifications)
          .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
          .join('');
      } else {
        specsEl.innerHTML = '<li>Direct from Wattegama, Kandy production facility.</li>';
      }
    }

    // Add to cart in modal
    const addBtn = document.getElementById('qvAddToCart');
    addBtn.onclick = () => {
      const qty = parseInt(document.getElementById('qvQty').value, 10) || 1;
      const isWholesale = document.getElementById('qvWholesaleToggle').checked;
      store.addToCart(prod.id, qty, isWholesale);
      closeQuickView();
      openCartDrawer();
    };

    quickviewModal.classList.add('open');
  }

  function closeQuickView() {
    if (quickviewModal) quickviewModal.classList.remove('open');
  }

  if (quickviewClose) {
    quickviewClose.addEventListener('click', closeQuickView);
  }

  // ==========================================
  // CART DRAWER CONTROLLER
  // ==========================================
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

  function updateCartUI(cart) {
    const count = store.getCartCount();
    const subtotal = store.getCartSubtotal();

    cartCountBadges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });

    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = store.formatPrice(subtotal);
    }

    if (cartItemsList) {
      if (cart.items.length === 0) {
        cartItemsList.innerHTML = '';
        if (cartEmptyMsg) cartEmptyMsg.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'none';
      } else {
        if (cartEmptyMsg) cartEmptyMsg.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';

        cartItemsList.innerHTML = cart.items.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-media" />
            <div class="cart-item-details">
              <h4 class="cart-item-name">${item.name}</h4>
              <p class="cart-item-unit">${item.unit} ${item.isWholesale ? '<span style="color: var(--color-accent-dark); font-weight: 700;">(Wholesale)</span>' : ''}</p>
              <div class="cart-item-pricing">${store.formatPrice(item.price)} each</div>
              <div class="cart-item-actions">
                <div class="qty-stepper">
                  <button type="button" class="stepper-btn dec-btn" data-id="${item.id}" data-wholesale="${item.isWholesale}">-</button>
                  <input type="number" class="stepper-input qty-input" value="${item.quantity}" min="1" max="100" data-id="${item.id}" data-wholesale="${item.isWholesale}" />
                  <button type="button" class="stepper-btn inc-btn" data-id="${item.id}" data-wholesale="${item.isWholesale}">+</button>
                </div>
                <button type="button" class="remove-item-btn" data-id="${item.id}" data-wholesale="${item.isWholesale}">Remove</button>
              </div>
            </div>
          </div>
        `).join('');

        // Bind Stepper & Remove Buttons
        cartItemsList.querySelectorAll('.dec-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const isWholesale = btn.getAttribute('data-wholesale') === 'true';
            const item = cart.items.find(i => i.id === id && i.isWholesale === isWholesale);
            if (item) store.updateCartQty(id, isWholesale, item.quantity - 1);
          });
        });

        cartItemsList.querySelectorAll('.inc-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const isWholesale = btn.getAttribute('data-wholesale') === 'true';
            const item = cart.items.find(i => i.id === id && i.isWholesale === isWholesale);
            if (item) store.updateCartQty(id, isWholesale, item.quantity + 1);
          });
        });

        cartItemsList.querySelectorAll('.qty-input').forEach(input => {
          input.addEventListener('change', () => {
            const id = input.getAttribute('data-id');
            const isWholesale = input.getAttribute('data-wholesale') === 'true';
            const newQty = parseInt(input.value, 10);
            store.updateCartQty(id, isWholesale, isNaN(newQty) ? 1 : newQty);
          });
        });

        cartItemsList.querySelectorAll('.remove-item-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const isWholesale = btn.getAttribute('data-wholesale') === 'true';
            store.removeFromCart(id, isWholesale);
          });
        });
      }
    }

    if (cartNoteInput && cart.note !== undefined) {
      cartNoteInput.value = cart.note;
    }
  }

  if (cartNoteInput) {
    cartNoteInput.addEventListener('blur', () => {
      store.updateCartNote(cartNoteInput.value.trim());
    });
  }

  // ==========================================
  // LIVE SEARCH OVERLAY
  // ==========================================
  function openSearchModal() {
    if (searchModal) {
      searchModal.classList.add('open');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
      }
      renderSearchResults('');
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
      renderSearchResults(e.target.value.trim().toLowerCase());
    });
  }

  function renderSearchResults(query) {
    if (!searchResults) return;

    if (!query) {
      searchResults.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-ink-muted);">
          <p>Type to search products by spice name, kithul treacle, jaggery, coconut oil, or highland tea...</p>
        </div>
      `;
      return;
    }

    const matches = store.products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.sinhalaName && p.sinhalaName.includes(query)) ||
      p.category.toLowerCase().includes(query) ||
      (p.shortDesc && p.shortDesc.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-ink-muted);">
          <p>No products match "${query}". Try searching for "treacle", "cinnamon", "pepper", or "tea".</p>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(p => `
      <div class="search-result-item" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}" class="search-item-thumb" />
        <div style="flex: 1;">
          <h4 style="font-size: var(--font-body-size); margin-bottom: 2px;">${p.name}</h4>
          <span style="font-size: var(--font-small-size); color: var(--color-accent-dark); font-weight: 600;">
            ${p.sinhalaName ? `${p.sinhalaName} • ` : ''}${store.formatPrice(p.retailPrice)}
          </span>
        </div>
        <button class="btn btn-primary btn-sm search-select-btn" data-id="${p.id}">View</button>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        closeSearchModal();
        openQuickView(id);
      });
    });
  }

  // ==========================================
  // WHOLESALE CALCULATOR LOGIC
  // ==========================================
  function initWholesaleCalculator(products) {
    const calcProductSelect = document.getElementById('calcProductSelect');
    const calcQtyInput = document.getElementById('calcQtyInput');
    const calcBasePriceEl = document.getElementById('calcBasePrice');
    const calcDiscountTierEl = document.getElementById('calcDiscountTier');
    const calcDiscountAmountEl = document.getElementById('calcDiscountAmount');
    const calcPerUnitEl = document.getElementById('calcPerUnit');
    const calcTotalPriceEl = document.getElementById('calcTotalPrice');
    const calcAddCartBtn = document.getElementById('calcAddCartBtn');
    const tierPills = document.querySelectorAll('.tier-pill');

    if (!calcProductSelect || !products || products.length === 0) return;

    calcProductSelect.innerHTML = products.map(p => `
      <option value="${p.id}" ${p.id === 'dp-001' ? 'selected' : ''}>
        ${p.name} (Wholesale: ${store.formatPrice(p.wholesalePrice)} / unit)
      </option>
    `).join('');

    function updateCalculator() {
      const selectedId = calcProductSelect.value;
      const product = products.find(p => p.id === selectedId) || products[0];
      const qty = parseInt(calcQtyInput.value, 10) || 10;

      let discountPercent = 0;
      let activeTierIdx = -1;

      if (qty >= 100) {
        discountPercent = 35;
        activeTierIdx = 2;
      } else if (qty >= 50) {
        discountPercent = 25;
        activeTierIdx = 1;
      } else if (qty >= 10) {
        discountPercent = 15;
        activeTierIdx = 0;
      }

      tierPills.forEach((pill, idx) => {
        if (idx === activeTierIdx) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });

      const baseWholesalePrice = product.wholesalePrice || (product.retailPrice * 0.8);
      const discountPerUnit = baseWholesalePrice * (discountPercent / 100);
      const finalUnitWholesalePrice = baseWholesalePrice - discountPerUnit;
      const totalAmount = finalUnitWholesalePrice * qty;
      const totalSavings = (product.retailPrice - finalUnitWholesalePrice) * qty;

      if (calcBasePriceEl) calcBasePriceEl.textContent = store.formatPrice(baseWholesalePrice);
      if (calcDiscountTierEl) calcDiscountTierEl.textContent = `${discountPercent}% Volume Discount`;
      if (calcDiscountAmountEl) calcDiscountAmountEl.textContent = store.formatPrice(totalSavings);
      if (calcPerUnitEl) calcPerUnitEl.textContent = store.formatPrice(finalUnitWholesalePrice);
      if (calcTotalPriceEl) calcTotalPriceEl.textContent = store.formatPrice(totalAmount);
    }

    calcProductSelect.addEventListener('change', updateCalculator);
    calcQtyInput.addEventListener('input', updateCalculator);

    if (calcAddCartBtn) {
      calcAddCartBtn.onclick = () => {
        const selectedId = calcProductSelect.value;
        const qty = parseInt(calcQtyInput.value, 10) || 10;
        store.addToCart(selectedId, qty, true);
        openCartDrawer();
      };
    }

    updateCalculator();
  }

  // ==========================================
  // CHECKOUT & PRE-GATEWAY ORDER PLACEMENT
  // ==========================================
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCartDrawer();
      openCheckoutModal();
    });
  }

  function openCheckoutModal() {
    if (!checkoutModal) return;
    const subtotal = store.getCartSubtotal();
    const count = store.getCartCount();

    if (count === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    // Auto-fill from user profile if signed in
    if (store.currentUser) {
      const u = store.currentUser;
      const nameInput = document.getElementById('custName');
      const phoneInput = document.getElementById('custPhone');
      const addrInput = document.getElementById('custAddress');
      const distSelect = document.getElementById('custDistrict');
      const typeSelect = document.getElementById('custOrderType');

      if (nameInput) nameInput.value = u.name || '';
      if (phoneInput) phoneInput.value = u.phone || '';
      if (addrInput) addrInput.value = u.address || '';
      if (distSelect && u.district) distSelect.value = u.district;
      if (typeSelect) {
        typeSelect.value = u.type === 'Wholesale' ? 'Wholesale Business Client' : 'Retail Home Order';
      }
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
  // ORDER TRACKING LOOKUP (5-STAGE PROGRESSION)
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

  const mobileTrackOrderLink = document.getElementById('mobileTrackOrderLink');
  if (mobileTrackOrderLink) {
    mobileTrackOrderLink.addEventListener('click', () => {
      if (navMenu) navMenu.classList.remove('mobile-open');
      openTrackOrder();
    });
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
          <div style="padding: 16px; background-color: #FEF2F2; color: #991B1B; font-size: 0.875rem;">
            Order Reference "${id}" was not found in our records. Please verify the code on your order confirmation.
          </div>
        `;
        return;
      }

      // 5-Stage Delivery Progression Stepper
      const stages = [
        { id: 1, nameEn: 'Order Received', nameSi: 'ඇණවුම ලැබුණි' },
        { id: 2, nameEn: 'Factory Confirmed', nameSi: 'කර්මාන්ත ශාලාවෙන් තහවුරු කළා' },
        { id: 3, nameEn: 'Hygienically Packed', nameSi: 'ඇසුරුම් කිරීම අවසන්' },
        { id: 4, nameEn: 'Dispatched for Delivery', nameSi: 'බෙදාහැරීමට භාර දෙන ලදී' },
        { id: 5, nameEn: 'Delivered & Fulfilled', nameSi: 'සාර්ථකව භාර දෙන ලදී' }
      ];

      const currentStage = order.stageIndex || 1;
      const isSi = store.currentLang === 'si';

      let timelineHtml = '<div class="delivery-timeline">';
      stages.forEach(s => {
        const isDone = currentStage >= s.id;
        const isActive = currentStage === s.id;
        const stageCls = isDone ? (isActive ? 'timeline-step active' : 'timeline-step completed') : 'timeline-step';
        const stageName = isSi ? s.nameSi : s.nameEn;
        const recordedTime = (order.stageHistory && order.stageHistory.find(h => h.stage === s.id && h.done)) ? order.stageHistory.find(h => h.stage === s.id).time : null;

        timelineHtml += `
          <div class="${stageCls}">
            <div class="step-circle">
              ${isDone && !isActive ? checkSvg : s.id}
            </div>
            <span class="timeline-step-label">${stageName}</span>
            ${recordedTime ? `<span class="timeline-step-time">${recordedTime}</span>` : ''}
          </div>
        `;
      });
      timelineHtml += '</div>';

      const waInquiryText = encodeURIComponent(
        `Hi Dumbara Products, I would like to inquire about my order ${order.id} (Status: ${order.status}).`
      );

      trackResult.innerHTML = `
        <div style="padding: 20px; background-color: var(--color-ground-soft);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="font-size: 1.125rem;">${order.id}</h4>
            <span style="background-color: var(--color-accent-subtle); color: var(--color-accent-dark); padding: 4px 10px; font-size: 0.75rem; font-weight: bold;">
              ${order.status}
            </span>
          </div>

          <p style="font-size: 0.8125rem; color: var(--color-ink-muted); margin-bottom: 16px;">
            Placed on: ${new Date(order.createdAt).toLocaleDateString()} | Subtotal: <strong>${store.formatPrice(order.subtotal)}</strong>
          </p>

          ${timelineHtml}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: var(--font-caption-size); background-color: var(--color-ground); padding: 12px; margin-bottom: 16px;">
            <div>
              <span style="color: var(--color-ink-muted); display: block;">Logistics Partner:</span>
              <strong>${order.trackingCourier || 'Prompt Xpress Logistics'}</strong>
            </div>
            <div>
              <span style="color: var(--color-ink-muted); display: block;">Waybill Reference:</span>
              <strong>${order.trackingWaybill || 'PX-LK-882019'}</strong>
            </div>
            <div style="grid-column: 1 / -1; margin-top: 4px;">
              <span style="color: var(--color-ink-muted); display: block;">Delivery Estimate:</span>
              <strong style="color: var(--color-accent-dark);">${order.estimatedDelivery || 'Within 24 to 72 hours'}</strong>
            </div>
          </div>

          <div style="font-size: 0.8125rem; background-color: var(--color-ground); padding: 12px; margin-bottom: 16px;">
            <strong style="display: block; margin-bottom: 6px;">Order Package Contents:</strong>
            <ul style="padding-left: 18px; list-style: disc; margin: 0;">
              ${order.items.map(i => `<li>${i.name} (${i.isWholesale ? 'Wholesale' : 'Retail'}) &times; ${i.quantity}</li>`).join('')}
            </ul>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="https://wa.me/94777372863?text=${waInquiryText}" target="_blank" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;">
              WhatsApp Hotline Inquiry
            </a>
            ${order.status === 'Received' || order.status === 'Pending' ? `
              <button class="btn btn-outline btn-sm cancel-order-action-btn" data-id="${order.id}" style="color: #DC2626; border-color: #DC2626;">
                Cancel Order
              </button>
            ` : ''}
          </div>
        </div>
      `;

      const cancelBtn = trackResult.querySelector('.cancel-order-action-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to cancel this order?')) {
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
