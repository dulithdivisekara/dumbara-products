/**
 * Dumbara Products - Central State Store
 * Handles persistence with LocalStorage, reactive pub/sub events,
 * customer user management, admin authentication, sales analytics,
 * 5-stage order delivery tracking, and bilingual localization (EN / SI).
 */

class DumbaraStore {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'dumbara_products_v1',
      CART: 'dumbara_cart_v1',
      WISHLIST: 'dumbara_wishlist_v1',
      ORDERS: 'dumbara_orders_v1',
      REVIEWS: 'dumbara_reviews_v1',
      USERS: 'dumbara_users_v1',
      CURRENT_USER: 'dumbara_current_user_v1',
      ADMIN_AUTH: 'dumbara_admin_auth_v1',
      ADMIN_SESSION: 'dumbara_admin_session_v1',
      LANG: 'dumbara_lang_v1'
    };

    this.DELIVERY_STAGES = [
      { id: 1, key: 'track_stage_1', nameEn: 'Order Received', nameSi: 'ඇණවුම ලැබුණි' },
      { id: 2, key: 'track_stage_2', nameEn: 'Factory Confirmed', nameSi: 'කර්මාන්ත ශාලාවෙන් තහවුරු කළා' },
      { id: 3, key: 'track_stage_3', nameEn: 'Hygienically Packed', nameSi: 'ඇසුරුම් කිරීම අවසන්' },
      { id: 4, key: 'track_stage_4', nameEn: 'Dispatched for Delivery', nameSi: 'බෙදාහැරීමට භාර දෙන ලදී' },
      { id: 5, key: 'track_stage_5', nameEn: 'Delivered & Fulfilled', nameSi: 'සාර්ථකව භාර දෙන ලදී' }
    ];

    this.products = [];
    this.categories = [];
    this.siteContent = {};
    this.reviews = [];
    this.users = [];
    this.translations = { en: {}, si: {} };
    this.currentLang = this.loadLanguage();
    this.currentUser = this.loadCurrentUser();
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.orders = [];
    this.listeners = {};
  }

  // Pub/Sub Event System
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // Initialize Store from JSON data files
  async init() {
    try {
      const [prodRes, catRes, contentRes, revRes, userRes, orderRes, transRes] = await Promise.all([
        fetch('data/products.json'),
        fetch('data/categories.json'),
        fetch('data/site-content.json'),
        fetch('data/reviews.json'),
        fetch('data/users.json'),
        fetch('data/orders.json'),
        fetch('data/translations.json')
      ]);

      const defaultProducts = await prodRes.json();
      this.categories = await catRes.json();
      this.siteContent = await contentRes.json();
      const defaultReviews = await revRes.json();
      const defaultUsers = await userRes.json();
      const defaultOrders = await orderRes.json();
      this.translations = await transRes.json();

      // Check products
      const savedProducts = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        try {
          this.products = JSON.parse(savedProducts);
        } catch (e) {
          this.products = defaultProducts;
          this.saveProducts();
        }
      } else {
        this.products = defaultProducts;
        this.saveProducts();
      }

      // Check reviews
      const savedReviews = localStorage.getItem(this.STORAGE_KEYS.REVIEWS);
      if (savedReviews) {
        try {
          this.reviews = JSON.parse(savedReviews);
        } catch (e) {
          this.reviews = defaultReviews;
          this.saveReviews();
        }
      } else {
        this.reviews = defaultReviews;
        this.saveReviews();
      }

      // Check users
      const savedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
      if (savedUsers) {
        try {
          this.users = JSON.parse(savedUsers);
        } catch (e) {
          this.users = defaultUsers;
          this.saveUsers();
        }
      } else {
        this.users = defaultUsers;
        this.saveUsers();
      }

      // Check orders
      const savedOrders = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        try {
          this.orders = JSON.parse(savedOrders);
        } catch (e) {
          this.orders = defaultOrders;
          this.saveOrders();
        }
      } else {
        this.orders = defaultOrders;
        this.saveOrders();
      }

      // Check admin credentials
      if (!localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUTH)) {
        localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUTH, JSON.stringify({
          username: 'admin',
          password: 'dumbara2026'
        }));
      }

      this.emit('init', {
        products: this.products,
        categories: this.categories,
        siteContent: this.siteContent,
        cart: this.cart,
        wishlist: this.wishlist,
        orders: this.orders,
        users: this.users,
        currentUser: this.currentUser,
        currentLang: this.currentLang
      });
    } catch (err) {
      console.error('Failed to initialize DumbaraStore:', err);
    }
  }

  // Currency Formatter (රු / LKR)
  formatPrice(amount) {
    if (isNaN(amount)) return 'රු 0';
    return 'රු ' + Number(amount).toLocaleString('en-LK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  // ==========================================
  // LANGUAGE & LOCALIZATION (EN / SI)
  // ==========================================
  loadLanguage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.LANG);
      return saved === 'si' ? 'si' : 'en';
    } catch {
      return 'en';
    }
  }

  setLanguage(lang) {
    const nextLang = lang === 'si' ? 'si' : 'en';
    this.currentLang = nextLang;
    try {
      localStorage.setItem(this.STORAGE_KEYS.LANG, nextLang);
    } catch (e) {
      console.warn('Could not persist language preference:', e);
    }
    this.emit('lang:change', nextLang);
  }

  t(key) {
    const dict = this.translations[this.currentLang] || this.translations['en'] || {};
    if (dict[key]) return dict[key];
    const fallback = (this.translations['en'] && this.translations['en'][key]) || key;
    return fallback;
  }

  // ==========================================
  // CUSTOMER USER MANAGEMENT
  // ==========================================
  loadCurrentUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveUsers() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(this.users));
      this.emit('users:change', this.users);
    } catch (e) {
      console.warn('Error saving users:', e);
    }
  }

  saveCurrentUser(user) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
      }
      this.emit('user:session', this.currentUser);
    } catch (e) {
      console.warn('Error saving current user:', e);
    }
  }

  registerUser(details) {
    const existing = this.users.find(u => 
      (details.email && u.email.toLowerCase() === details.email.toLowerCase()) ||
      (details.phone && u.phone === details.phone)
    );
    if (existing) {
      return { success: false, message: 'An account with this email or phone number already exists.' };
    }

    const newUser = {
      id: 'usr-' + String(this.users.length + 1).padStart(3, '0') + '-' + Math.floor(100 + Math.random() * 900),
      name: details.name.trim(),
      email: (details.email || '').trim().toLowerCase(),
      phone: details.phone.trim(),
      password: details.password || 'customer123',
      district: details.district || 'Kandy',
      address: details.address ? details.address.trim() : '',
      type: details.type === 'Wholesale' ? 'Wholesale' : 'Retail',
      status: 'Active',
      ordersCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };

    this.users.unshift(newUser);
    this.saveUsers();
    this.saveCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  loginUser(emailOrPhone, password) {
    const query = (emailOrPhone || '').trim().toLowerCase();
    const user = this.users.find(u => 
      (u.email.toLowerCase() === query || u.phone === query) &&
      u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email/phone or password. Please try again.' };
    }

    if (user.status === 'Suspended') {
      return { success: false, message: 'This customer account has been suspended by administration.' };
    }

    this.saveCurrentUser(user);
    return { success: true, user: user };
  }

  logoutUser() {
    this.saveCurrentUser(null);
    return true;
  }

  updateUserProfile(updatedFields) {
    if (!this.currentUser) return false;
    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index > -1) {
      this.users[index] = { ...this.users[index], ...updatedFields };
      this.saveUsers();
      this.saveCurrentUser(this.users[index]);
      return true;
    }
    return false;
  }

  getUserOrders(userId = null) {
    const uid = userId || (this.currentUser ? this.currentUser.id : null);
    if (!uid) return [];
    return this.orders.filter(o => o.userId === uid || (this.currentUser && o.customer && o.customer.phone === this.currentUser.phone));
  }

  toggleUserStatus(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'Active' ? 'Suspended' : 'Active';
      this.saveUsers();
      return user.status;
    }
    return null;
  }

  deleteUser(userId) {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
    if (this.currentUser && this.currentUser.id === userId) {
      this.logoutUser();
    }
    return true;
  }

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  getAdminCredentials() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUTH);
      return raw ? JSON.parse(raw) : { username: 'admin', password: 'dumbara2026' };
    } catch {
      return { username: 'admin', password: 'dumbara2026' };
    }
  }

  updateAdminCredentials(newUsername, newPassword) {
    const creds = {
      username: (newUsername || 'admin').trim(),
      password: (newPassword || 'dumbara2026').trim()
    };
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(creds));
    this.emit('admin:credentials', creds);
    return true;
  }

  loginAdmin(username, password) {
    const creds = this.getAdminCredentials();
    if (username.trim() === creds.username && password.trim() === creds.password) {
      localStorage.setItem(this.STORAGE_KEYS.ADMIN_SESSION, 'true');
      this.emit('admin:session', true);
      return true;
    }
    return false;
  }

  logoutAdmin() {
    localStorage.removeItem(this.STORAGE_KEYS.ADMIN_SESSION);
    this.emit('admin:session', false);
    return true;
  }

  isAdminAuthenticated() {
    return localStorage.getItem(this.STORAGE_KEYS.ADMIN_SESSION) === 'true';
  }

  // ==========================================
  // CART CRUD
  // ==========================================
  loadCart() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.CART);
      return raw ? JSON.parse(raw) : { items: [], note: '' };
    } catch {
      return { items: [], note: '' };
    }
  }

  saveCart() {
    localStorage.setItem(this.STORAGE_KEYS.CART, JSON.stringify(this.cart));
    this.emit('cart:change', this.cart);
  }

  addToCart(productId, quantity = 1, isWholesale = false) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return false;

    const existingIndex = this.cart.items.findIndex(
      item => item.id === productId && item.isWholesale === isWholesale
    );

    const price = isWholesale ? product.wholesalePrice : product.retailPrice;

    if (existingIndex > -1) {
      this.cart.items[existingIndex].quantity += quantity;
    } else {
      this.cart.items.push({
        id: product.id,
        name: product.name,
        sinhalaName: product.sinhalaName || product.name,
        price: price,
        image: product.image,
        unit: product.unit,
        category: product.category,
        quantity: quantity,
        isWholesale: isWholesale
      });
    }

    this.saveCart();
    return true;
  }

  updateCartQty(productId, isWholesale, newQty) {
    const index = this.cart.items.findIndex(
      item => item.id === productId && item.isWholesale === isWholesale
    );

    if (index > -1) {
      if (newQty <= 0) {
        this.cart.items.splice(index, 1);
      } else {
        this.cart.items[index].quantity = newQty;
      }
      this.saveCart();
    }
  }

  removeFromCart(productId, isWholesale) {
    this.cart.items = this.cart.items.filter(
      item => !(item.id === productId && item.isWholesale === isWholesale)
    );
    this.saveCart();
  }

  updateCartNote(note) {
    this.cart.note = note || '';
    this.saveCart();
  }

  clearCart() {
    this.cart = { items: [], note: '' };
    this.saveCart();
  }

  getCartCount() {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSubtotal() {
    return this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // ==========================================
  // WISHLIST CRUD
  // ==========================================
  loadWishlist() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.WISHLIST);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveWishlist() {
    localStorage.setItem(this.STORAGE_KEYS.WISHLIST, JSON.stringify(this.wishlist));
    this.emit('wishlist:change', this.wishlist);
  }

  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(productId);
    }
    this.saveWishlist();
    return this.isInWishlist(productId);
  }

  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  // ==========================================
  // ORDERS CRUD & 5-STAGE DELIVERY TRACKING
  // ==========================================
  loadOrders() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveOrders() {
    localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
    this.emit('orders:change', this.orders);
  }

  createOrder(customerDetails) {
    if (this.cart.items.length === 0) return null;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `DP-${dateStr}-${randSuffix}`;

    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.slice(0, 16).replace('T', ' ');

    const order = {
      id: orderId,
      createdAt: nowIso,
      userId: this.currentUser ? this.currentUser.id : null,
      customer: customerDetails,
      items: [...this.cart.items],
      note: this.cart.note || '',
      subtotal: this.getCartSubtotal(),
      status: 'Received',
      stageIndex: 1,
      stageHistory: [
        { stage: 1, name: 'Order Received', time: nowReadable, done: true },
        { stage: 2, name: 'Factory Confirmed', time: null, done: false },
        { stage: 3, name: 'Hygienically Packed', time: null, done: false },
        { stage: 4, name: 'Dispatched for Delivery', time: null, done: false },
        { stage: 5, name: 'Delivered & Fulfilled', time: null, done: false }
      ],
      paymentMethod: customerDetails.paymentMethod || 'Cash on Delivery',
      trackingCourier: customerDetails.district === 'Kandy' ? 'Dumbara Factory Rider (Kandy 24h)' : 'Prompt Xpress Logistics',
      trackingWaybill: 'Pending assignment',
      estimatedDelivery: customerDetails.district === 'Kandy' ? 'Local delivery within 24 hours' : 'Within 48 to 72 hours islandwide'
    };

    this.orders.unshift(order);
    this.saveOrders();

    // Update customer stats if logged in
    if (this.currentUser) {
      const uIndex = this.users.findIndex(u => u.id === this.currentUser.id);
      if (uIndex > -1) {
        this.users[uIndex].ordersCount = (this.users[uIndex].ordersCount || 0) + 1;
        this.users[uIndex].totalSpent = (this.users[uIndex].totalSpent || 0) + order.subtotal;
        this.saveUsers();
        this.saveCurrentUser(this.users[uIndex]);
      }
    }

    this.clearCart();
    return order;
  }

  getOrderById(orderId) {
    if (!orderId) return null;
    const cleanId = orderId.trim().toUpperCase();
    return this.orders.find(o => o.id.trim().toUpperCase() === cleanId);
  }

  updateOrderDeliveryStage(orderId, newStageIndex, courierNotes = null) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const stageNum = Math.min(5, Math.max(1, Number(newStageIndex)));
    order.stageIndex = stageNum;

    const nowReadable = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (!order.stageHistory) {
      order.stageHistory = [
        { stage: 1, name: 'Order Received', time: nowReadable, done: true },
        { stage: 2, name: 'Factory Confirmed', time: null, done: false },
        { stage: 3, name: 'Hygienically Packed', time: null, done: false },
        { stage: 4, name: 'Dispatched for Delivery', time: null, done: false },
        { stage: 5, name: 'Delivered & Fulfilled', time: null, done: false }
      ];
    }

    order.stageHistory.forEach(s => {
      if (s.stage <= stageNum) {
        s.done = true;
        if (!s.time) s.time = nowReadable;
      } else {
        s.done = false;
        s.time = null;
      }
    });

    // Update status string
    const stageNames = ['Received', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];
    order.status = stageNames[stageNum - 1] || 'Received';

    if (courierNotes) {
      order.trackingWaybill = courierNotes;
    }

    this.saveOrders();
    return true;
  }

  cancelOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order && (order.status === 'Received' || order.status === 'Pending')) {
      order.status = 'Cancelled';
      order.stageIndex = 0;
      this.saveOrders();
      return true;
    }
    return false;
  }

  deleteOrder(orderId) {
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.saveOrders();
  }

  // ==========================================
  // SALES ANALYTICS ENGINE
  // ==========================================
  getSalesAnalytics(period = 'all') {
    const orders = this.orders.filter(o => o.status !== 'Cancelled');
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    let wholesaleRevenue = 0;
    let retailRevenue = 0;

    const categoryBreakdown = {
      kithul: 0,
      spices: 0,
      coconut: 0,
      tea: 0,
      wholesale: 0
    };

    const productSalesMap = {};

    orders.forEach(o => {
      const isOrderWholesale = o.customer && o.customer.orderType && o.customer.orderType.toLowerCase().includes('wholesale');
      if (isOrderWholesale) {
        wholesaleRevenue += o.subtotal;
      } else {
        retailRevenue += o.subtotal;
      }

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const cat = item.category || 'kithul';
          const lineTotal = (item.price || 0) * (item.quantity || 1);
          if (categoryBreakdown[cat] !== undefined) {
            categoryBreakdown[cat] += lineTotal;
          } else {
            categoryBreakdown.wholesale += lineTotal;
          }

          if (!productSalesMap[item.id]) {
            productSalesMap[item.id] = {
              id: item.id,
              name: item.name,
              unitsSold: 0,
              totalRevenue: 0,
              image: item.image
            };
          }
          productSalesMap[item.id].unitsSold += item.quantity || 1;
          productSalesMap[item.id].totalRevenue += lineTotal;
        });
      }
    });

    const wholesalePercent = totalRevenue > 0 ? Math.round((wholesaleRevenue / totalRevenue) * 100) : 0;

    // Monthly breakdown (last 6 months)
    const monthlyMap = {
      'May': 38500,
      'Jun': 54200,
      'Jul': 72100,
      'Aug': 91400,
      'Sep': 112800,
      'Oct': totalRevenue
    };

    const monthlyTrend = Object.keys(monthlyMap).map(m => ({
      month: m,
      revenue: monthlyMap[m]
    }));

    // Status counts
    const statusCounts = {
      received: this.orders.filter(o => o.status === 'Received' || o.status === 'Pending').length,
      confirmed: this.orders.filter(o => o.status === 'Confirmed').length,
      packed: this.orders.filter(o => o.status === 'Packed').length,
      dispatched: this.orders.filter(o => o.status === 'Dispatched').length,
      delivered: this.orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length,
      cancelled: this.orders.filter(o => o.status === 'Cancelled').length
    };

    // Top selling products ranked
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Fallback if no order items yet
    if (topProducts.length === 0 && this.products.length > 0) {
      this.products.slice(0, 5).forEach((p, idx) => {
        topProducts.push({
          id: p.id,
          name: p.name,
          unitsSold: 45 - idx * 6,
          totalRevenue: (45 - idx * 6) * p.retailPrice,
          image: p.image
        });
      });
    }

    return {
      totalRevenue,
      totalOrders,
      aov,
      retailRevenue,
      wholesaleRevenue,
      wholesalePercent,
      customersCount: this.users.length,
      statusCounts,
      categoryBreakdown,
      monthlyTrend,
      topProducts
    };
  }

  // ==========================================
  // REVIEWS CRUD
  // ==========================================
  saveReviews() {
    localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
    this.emit('reviews:change', this.reviews);
  }

  addReview(reviewData) {
    const newReview = {
      id: 'rev-' + Date.now(),
      author: reviewData.author || 'Valued Customer',
      role: reviewData.role || 'Verified Buyer',
      rating: Number(reviewData.rating) || 5,
      product: reviewData.product || 'Dumbara Products',
      date: new Date().toISOString().slice(0, 10),
      comment: reviewData.comment || ''
    };
    this.reviews.unshift(newReview);
    this.saveReviews();
    return newReview;
  }

  // ==========================================
  // PRODUCT CATALOG ADMIN CRUD
  // ==========================================
  saveProducts() {
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    this.emit('products:change', this.products);
  }

  addProduct(productData) {
    const newId = 'dp-' + String(this.products.length + 1).padStart(3, '0');
    const newProd = {
      id: newId,
      name: productData.name,
      sinhalaName: productData.sinhalaName || productData.name,
      category: productData.category || 'kithul',
      retailPrice: Number(productData.retailPrice) || 0,
      wholesalePrice: Number(productData.wholesalePrice) || 0,
      wholesaleMinQty: Number(productData.wholesaleMinQty) || 10,
      unit: productData.unit || 'Standard Pack',
      inStock: productData.inStock !== false,
      stockCount: Number(productData.stockCount) || 50,
      rating: 5.0,
      reviewCount: 1,
      badge: productData.badge || 'New',
      image: productData.image || 'assets/images/prod-kithul-treacle.jpg',
      shortDesc: productData.shortDesc || '',
      description: productData.description || '',
      features: productData.features || ['Pure Ceylon Quality', 'Direct from Kandy'],
      specifications: productData.specifications || { Origin: 'Wattegama, Kandy' }
    };
    this.products.unshift(newProd);
    this.saveProducts();
    return newProd;
  }

  updateProduct(productId, updatedFields) {
    const index = this.products.findIndex(p => p.id === productId);
    if (index > -1) {
      this.products[index] = { ...this.products[index], ...updatedFields };
      this.saveProducts();
      return true;
    }
    return false;
  }

  deleteProduct(productId) {
    this.products = this.products.filter(p => p.id !== productId);
    this.saveProducts();
    return true;
  }

  toggleStock(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (prod) {
      prod.inStock = !prod.inStock;
      this.saveProducts();
      return prod.inStock;
    }
    return false;
  }

  resetToDefaults() {
    localStorage.removeItem(this.STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(this.STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(this.STORAGE_KEYS.USERS);
    localStorage.removeItem(this.STORAGE_KEYS.ORDERS);
    return this.init();
  }

  exportDatabase() {
    return JSON.stringify({
      products: this.products,
      orders: this.orders,
      users: this.users,
      reviews: this.reviews,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Global Single Instance
window.store = new DumbaraStore();
