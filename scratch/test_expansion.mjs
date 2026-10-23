import { readFileSync } from 'node:fs';

// Mock localStorage and window
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {};

// Mock fetch to load local JSON files
global.fetch = async (url) => {
  const content = readFileSync(url, 'utf-8');
  return {
    json: async () => JSON.parse(content)
  };
};

// Evaluate store.js in current context
const storeCode = readFileSync('js/store.js', 'utf-8');
eval(storeCode);
const store = window.store;

async function runTests() {
  console.log('--- Starting Expansion E2E Integration Tests ---');
  await store.init();

  // Test 1: Store Init
  console.assert(store.products.length === 12, `Expected 12 products, got ${store.products.length}`);
  console.assert(store.categories.length === 5, `Expected 5 categories, got ${store.categories.length}`);
  console.assert(store.users.length >= 5, `Expected >= 5 users, got ${store.users.length}`);
  console.assert(store.orders.length >= 6, `Expected >= 6 orders, got ${store.orders.length}`);
  console.log('✓ Store initialization passed');

  // Test 2: Language Switching
  store.setLanguage('si');
  console.assert(store.currentLang === 'si', 'Expected currentLang to be si');
  console.assert(store.t('nav_products') === 'නිෂ්පාදන', 'Expected translation to match');
  store.setLanguage('en');
  console.assert(store.currentLang === 'en', 'Expected currentLang to be en');
  console.assert(store.t('nav_products') === 'Products', 'Expected translation to match');
  console.log('✓ Sinhala Language Toggle passed');

  // Test 3: Customer Registration & Login
  const regRes = store.registerUser({
    name: 'Chathura Silva',
    phone: '077 999 1122',
    email: 'chathura@test.lk',
    password: 'customerpass123',
    district: 'Kandy',
    address: '15 Peradeniya Road, Kandy',
    type: 'Retail'
  });
  console.assert(regRes.success, 'Expected user registration to succeed');
  console.assert(store.currentUser.name === 'Chathura Silva', 'Expected currentUser to be set');

  store.updateUserProfile({ address: '20 Katugastota Road, Kandy' });
  console.assert(store.currentUser.address === '20 Katugastota Road, Kandy', 'Profile update failed');

  store.logoutUser();
  console.assert(store.currentUser === null, 'Expected currentUser to be null after logout');

  const loginRes = store.loginUser('chathura@test.lk', 'customerpass123');
  console.assert(loginRes.success, 'Login failed with valid credentials');
  console.assert(store.currentUser.name === 'Chathura Silva', 'User mismatch after login');
  console.log('✓ Customer User Management CRUD passed');

  // Test 4: Order Placement & 5-Stage Delivery Progression
  store.clearCart();
  store.addToCart('dp-001', 2, false);
  console.assert(store.getCartCount() === 2, 'Cart count mismatch');

  const order = store.createOrder({
    name: store.currentUser.name,
    phone: store.currentUser.phone,
    email: store.currentUser.email,
    district: store.currentUser.district,
    address: store.currentUser.address,
    orderType: 'Retail Home Order',
    paymentMethod: 'Cash on Delivery'
  });

  console.assert(order !== null, 'Order placement failed');
  console.assert(order.stageIndex === 1, 'Expected initial delivery stage to be 1');
  console.assert(order.status === 'Received', 'Expected initial status to be Received');

  const fetchedOrder = store.getOrderById(order.id);
  console.assert(fetchedOrder !== null, 'Order lookup failed');

  const userOrders = store.getUserOrders();
  console.assert(userOrders.some(o => o.id === order.id), 'Order missing from user history');

  // Progress to Stage 4 (Dispatched)
  store.updateOrderDeliveryStage(order.id, 4, 'PX-LK-998822');
  console.assert(order.stageIndex === 4, 'Delivery stage update failed');
  console.assert(order.status === 'Dispatched', 'Expected status to be Dispatched');
  console.assert(order.stageHistory[3].done === true, 'Stage history done state invalid');
  console.log('✓ 5-Stage Order Delivery Progression passed');

  // Test 5: Admin Authentication Gate
  console.assert(store.loginAdmin('admin', 'wrongpassword') === false, 'Admin login should fail on wrong pass');
  console.assert(store.loginAdmin('admin', 'dumbara2026') === true, 'Admin login failed with default credentials');
  console.assert(store.isAdminAuthenticated() === true, 'Admin session check failed');

  store.updateAdminCredentials('dumbara_chief', 'kandy2026secure');
  console.assert(store.loginAdmin('dumbara_chief', 'kandy2026secure') === true, 'Updated admin credentials failed');
  store.logoutAdmin();
  console.assert(store.isAdminAuthenticated() === false, 'Admin logout failed');
  console.log('✓ Admin Password Authentication & Settings passed');

  // Test 6: Sales Analytics Engine
  const analytics = store.getSalesAnalytics();
  console.assert(analytics.totalRevenue > 0, 'Total revenue should be > 0');
  console.assert(analytics.totalOrders >= 7, 'Total orders should be >= 7');
  console.assert(analytics.aov > 0, 'AOV should be > 0');
  console.assert(analytics.monthlyTrend.length === 6, 'Monthly trend should have 6 data points');
  console.assert(analytics.topProducts.length > 0, 'Top products should not be empty');
  console.assert(analytics.statusCounts.dispatched >= 1, 'Status counts should reflect updated order');
  console.log('✓ Executive Sales Analytics Engine passed');

  console.log('\n========================================');
  console.log('ALL EXPANSION INTEGRATION TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
