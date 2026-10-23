/**
 * Dumbara Products - Central State Store
 * Handles persistence with LocalStorage, reactive pub/sub events, and business logic
 */

class DumbaraStore {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'dumbara_products_v1',
      CART: 'dumbara_cart_v1',
      WISHLIST: 'dumbara_wishlist_v1',
      ORDERS: 'dumbara_orders_v1',
      REVIEWS: 'dumbara_reviews_v1'
    };

    this.products = [];
    this.categories = [];
    this.siteContent = {};
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.orders = this.loadOrders();
    this.reviews = [];
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

  // Initialize Store from JSON files
  async init() {
    try {
      const [prodRes, catRes, contentRes, revRes] = await Promise.all([
        fetch('data/products.json'),
        fetch('data/categories.json'),
        fetch('data/site-content.json'),
        fetch('data/reviews.json')
      ]);

      const defaultProducts = await prodRes.json();
      this.categories = await catRes.json();
      this.siteContent = await contentRes.json();
      const defaultReviews = await revRes.json();

      // Check if products exist in LocalStorage
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

      this.emit('init', {
        products: this.products,
        categories: this.categories,
        siteContent: this.siteContent,
        cart: this.cart,
        wishlist: this.wishlist,
        orders: this.orders
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
        price: price,
        image: product.image,
        unit: product.unit,
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
  // ORDERS CRUD
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

    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customer: customerDetails,
      items: [...this.cart.items],
      note: this.cart.note || '',
      subtotal: this.getCartSubtotal(),
      status: 'Pending',
      paymentMethod: customerDetails.paymentMethod || 'Cash on Delivery'
    };

    this.orders.unshift(order);
    this.saveOrders();
    this.clearCart();
    return order;
  }

  getOrderById(orderId) {
    if (!orderId) return null;
    return this.orders.find(o => o.id.trim().toUpperCase() === orderId.trim().toUpperCase());
  }

  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.saveOrders();
      return true;
    }
    return false;
  }

  cancelOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'Pending') {
      order.status = 'Cancelled';
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
      sinhalaName: productData.sinhalaName || '',
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
    return this.init();
  }

  exportDatabase() {
    return JSON.stringify({
      products: this.products,
      orders: this.orders,
      reviews: this.reviews,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Global Single Instance
window.store = new DumbaraStore();
