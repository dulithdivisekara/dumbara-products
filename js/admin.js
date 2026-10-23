/**
 * Dumbara Products - Admin Management Portal Controller
 * Full executive dashboard, pure-SVG sales statistics charts,
 * product catalog CRUD, 5-stage order delivery management,
 * customer accounts directory, and admin security settings.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  // Navigation & Modal Elements
  const adminFooterLink = document.getElementById('adminFooterLink');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const adminLoginClose = document.getElementById('adminLoginClose');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const demoAdminLoginBtn = document.getElementById('demoAdminLoginBtn');
  const adminLoginNotice = document.getElementById('adminLoginNotice');

  const adminModal = document.getElementById('adminModal');
  const adminClose = document.getElementById('adminClose');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminSessionUser = document.getElementById('adminSessionUser');
  const adminTabs = document.querySelectorAll('.admin-tab');

  // Tab Content Sections
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminProductSection = document.getElementById('adminProductSection');
  const adminOrderSection = document.getElementById('adminOrderSection');
  const adminUserSection = document.getElementById('adminUserSection');
  const adminBackupSection = document.getElementById('adminBackupSection');

  // Dashboard & Analytics Elements
  const adminKpiGrid = document.getElementById('adminKpiGrid');
  const revenueChartContainer = document.getElementById('revenueChartContainer');
  const categoryChartContainer = document.getElementById('categoryChartContainer');
  const adminStatusFunnel = document.getElementById('adminStatusFunnel');
  const adminTopProductsTable = document.getElementById('adminTopProductsTable');

  // Product CRUD Elements
  const adminProductsTable = document.getElementById('adminProductsTable');
  const adminAddProductBtn = document.getElementById('adminAddProductBtn');
  const productFormModal = document.getElementById('productFormModal');
  const productFormClose = document.getElementById('productFormClose');
  const productEditForm = document.getElementById('productEditForm');

  // Orders CRUD Elements
  const adminOrdersTable = document.getElementById('adminOrdersTable');

  // Customer Directory Elements
  const adminUsersTable = document.getElementById('adminUsersTable');

  // Settings & Security Elements
  const adminCredsForm = document.getElementById('adminCredsForm');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const resetDbBtn = document.getElementById('resetDbBtn');

  // ==========================================
  // ADMIN AUTHENTICATION GUARD & MODAL OPEN/CLOSE
  // ==========================================
  if (adminFooterLink) {
    adminFooterLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (store.isAdminAuthenticated()) {
        openAdminPortal();
      } else {
        openAdminLogin();
      }
    });
  }

  function openAdminLogin() {
    if (adminLoginModal) {
      if (adminLoginNotice) adminLoginNotice.style.display = 'none';
      adminLoginModal.classList.add('open');
      const userIn = document.getElementById('adminUser');
      if (userIn) setTimeout(() => userIn.focus(), 100);
    }
  }

  function closeAdminLogin() {
    if (adminLoginModal) adminLoginModal.classList.remove('open');
  }

  if (adminLoginClose) {
    adminLoginClose.addEventListener('click', closeAdminLogin);
  }

  // 1-Click Demo Admin Login
  if (demoAdminLoginBtn) {
    demoAdminLoginBtn.addEventListener('click', () => {
      const creds = store.getAdminCredentials();
      document.getElementById('adminUser').value = creds.username;
      document.getElementById('adminPass').value = creds.password;
      store.loginAdmin(creds.username, creds.password);
      closeAdminLogin();
      openAdminPortal();
    });
  }

  // Admin Login Submit
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('adminUser').value.trim();
      const pass = document.getElementById('adminPass').value.trim();

      if (store.loginAdmin(user, pass)) {
        closeAdminLogin();
        openAdminPortal();
      } else {
        if (adminLoginNotice) {
          adminLoginNotice.textContent = 'Invalid administrator username or password. Check credentials and retry.';
          adminLoginNotice.style.display = 'block';
        }
      }
    });
  }

  function openAdminPortal() {
    if (!adminModal) return;
    const creds = store.getAdminCredentials();
    if (adminSessionUser) adminSessionUser.textContent = creds.username;

    // Load credentials form values
    const newAdminUser = document.getElementById('newAdminUser');
    const newAdminPass = document.getElementById('newAdminPass');
    if (newAdminUser) newAdminUser.value = creds.username;
    if (newAdminPass) newAdminPass.value = creds.password;

    renderAdminDashboard();
    renderAdminProducts();
    renderAdminOrders();
    renderAdminUsers();

    adminModal.classList.add('open');
  }

  function closeAdminPortal() {
    if (adminModal) adminModal.classList.remove('open');
  }

  if (adminClose) {
    adminClose.addEventListener('click', closeAdminPortal);
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      store.logoutAdmin();
      closeAdminPortal();
    });
  }

  // Tab Navigation Controller
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      if (adminDashboardSection) adminDashboardSection.style.display = target === 'dashboard' ? 'block' : 'none';
      if (adminProductSection) adminProductSection.style.display = target === 'products' ? 'block' : 'none';
      if (adminOrderSection) adminOrderSection.style.display = target === 'orders' ? 'block' : 'none';
      if (adminUserSection) adminUserSection.style.display = target === 'users' ? 'block' : 'none';
      if (adminBackupSection) adminBackupSection.style.display = target === 'backup' ? 'block' : 'none';

      if (target === 'dashboard') renderAdminDashboard();
      if (target === 'products') renderAdminProducts();
      if (target === 'orders') renderAdminOrders();
      if (target === 'users') renderAdminUsers();
    });
  });

  // ==========================================
  // TAB 1: EXECUTIVE DASHBOARD & SALES STATISTICS
  // ==========================================
  function renderAdminDashboard() {
    const analytics = store.getSalesAnalytics();

    // 1. Render 5 Real-Time KPI Cards
    if (adminKpiGrid) {
      adminKpiGrid.innerHTML = `
        <div class="admin-kpi-card">
          <span class="kpi-label">Gross Revenue</span>
          <span class="kpi-val">${store.formatPrice(analytics.totalRevenue)}</span>
          <span class="kpi-sub">${analytics.totalOrders} orders processed</span>
        </div>
        <div class="admin-kpi-card">
          <span class="kpi-label">Total Orders</span>
          <span class="kpi-val">${analytics.totalOrders}</span>
          <span class="kpi-sub">${analytics.statusCounts.received + analytics.statusCounts.confirmed} active in factory</span>
        </div>
        <div class="admin-kpi-card">
          <span class="kpi-label">Average Order (AOV)</span>
          <span class="kpi-val">${store.formatPrice(analytics.aov)}</span>
          <span class="kpi-sub">Basket size per client</span>
        </div>
        <div class="admin-kpi-card">
          <span class="kpi-label">Customer Accounts</span>
          <span class="kpi-val">${analytics.customersCount}</span>
          <span class="kpi-sub">Retail & wholesale verified</span>
        </div>
        <div class="admin-kpi-card">
          <span class="kpi-label">Wholesale B2B Share</span>
          <span class="kpi-val">${analytics.wholesalePercent}%</span>
          <span class="kpi-sub">${store.formatPrice(analytics.wholesaleRevenue)} volume</span>
        </div>
      `;
    }

    // 2. Render Pure SVG Revenue Bar Chart
    if (revenueChartContainer) {
      const data = analytics.monthlyTrend;
      const maxRev = Math.max(...data.map(d => d.revenue), 120000);
      const chartWidth = 520;
      const chartHeight = 180;
      const barWidth = 44;
      const spacing = (chartWidth - 60) / data.length;

      let barsSvg = '';
      data.forEach((d, idx) => {
        const h = Math.round((d.revenue / maxRev) * (chartHeight - 40));
        const x = 50 + idx * spacing + (spacing - barWidth) / 2;
        const y = chartHeight - h - 25;
        const formattedAmount = d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : `${d.revenue}`;

        barsSvg += `
          <g class="chart-bar-group">
            <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#0B7D42" rx="2">
              <title>${d.month}: ${store.formatPrice(d.revenue)}</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${y - 6}" font-size="11" font-weight="600" fill="#191919" text-anchor="middle">
              ${formattedAmount}
            </text>
            <text x="${x + barWidth / 2}" y="${chartHeight - 6}" font-size="11" fill="#7B7468" text-anchor="middle">
              ${d.month}
            </text>
          </g>
        `;
      });

      // Axis & Gridlines
      const gridSvg = `
        <line x1="45" y1="${chartHeight - 25}" x2="${chartWidth}" y2="${chartHeight - 25}" stroke="#ECE7DE" stroke-width="1.5" />
        <line x1="45" y1="${chartHeight - 25 - (chartHeight - 40) / 2}" x2="${chartWidth}" y2="${chartHeight - 25 - (chartHeight - 40) / 2}" stroke="#ECE7DE" stroke-width="1.5" stroke-dasharray="4" />
        <line x1="45" y1="15" x2="${chartWidth}" y2="15" stroke="#ECE7DE" stroke-width="1.5" stroke-dasharray="4" />
        <text x="38" y="${chartHeight - 22}" font-size="10" fill="#7B7468" text-anchor="end">0</text>
        <text x="38" y="${chartHeight - 20 - (chartHeight - 40) / 2}" font-size="10" fill="#7B7468" text-anchor="end">${Math.round(maxRev / 2000)}k</text>
        <text x="38" y="18" font-size="10" fill="#7B7468" text-anchor="end">${Math.round(maxRev / 1000)}k</text>
      `;

      revenueChartContainer.innerHTML = `
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width: 100%; height: 100%; display: block;" preserveAspectRatio="none">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    }

    // 3. Render Pure SVG Category Distribution Chart
    if (categoryChartContainer) {
      const cats = [
        { label: 'Kithul Sweeteners', val: analytics.categoryBreakdown.kithul, color: '#0B7D42' },
        { label: 'Ceylon Spices', val: analytics.categoryBreakdown.spices, color: '#C48235' },
        { label: 'Highland Tea', val: analytics.categoryBreakdown.tea, color: '#191919' },
        { label: 'Organic Coconut', val: analytics.categoryBreakdown.coconut, color: '#028A48' },
        { label: 'Wholesale Packs', val: analytics.categoryBreakdown.wholesale, color: '#524C42' }
      ];

      const catTotal = cats.reduce((sum, c) => sum + c.val, 0) || 1;

      categoryChartContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
          ${cats.map(c => {
            const pct = Math.round((c.val / catTotal) * 100);
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
                  <span style="font-weight: 600;">${c.label}</span>
                  <span style="color: var(--color-ink-muted);">${store.formatPrice(c.val)} (${pct}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background-color: var(--color-ground-soft); border-radius: 2px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background-color: ${c.color};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 4. Render Delivery Progression Funnel Pills
    if (adminStatusFunnel) {
      const sc = analytics.statusCounts;
      adminStatusFunnel.innerHTML = `
        <div class="status-pill-metric">
          <span>1. Received:</span>
          <span class="status-pill-count">${sc.received}</span>
        </div>
        <div class="status-pill-metric">
          <span>2. Confirmed:</span>
          <span class="status-pill-count">${sc.confirmed}</span>
        </div>
        <div class="status-pill-metric">
          <span>3. Packed:</span>
          <span class="status-pill-count">${sc.packed}</span>
        </div>
        <div class="status-pill-metric">
          <span>4. Dispatched:</span>
          <span class="status-pill-count">${sc.dispatched}</span>
        </div>
        <div class="status-pill-metric">
          <span>5. Delivered:</span>
          <span class="status-pill-count">${sc.delivered}</span>
        </div>
        ${sc.cancelled > 0 ? `
          <div class="status-pill-metric" style="background-color: #FEE2E2;">
            <span style="color: #991B1B;">Cancelled:</span>
            <span class="status-pill-count" style="background-color: #DC2626;">${sc.cancelled}</span>
          </div>
        ` : ''}
      `;
    }

    // 5. Render Top Products Leaderboard
    if (adminTopProductsTable) {
      const top = analytics.topProducts;
      adminTopProductsTable.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Gross Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${top.map((p, idx) => `
              <tr>
                <td><strong>#${idx + 1}</strong></td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${p.image || 'assets/images/prod-kithul-treacle.jpg'}" alt="${p.name}" style="width: 32px; height: 32px; object-fit: cover; background-color: var(--color-ground-soft);" />
                    <strong>${p.name}</strong>
                  </div>
                </td>
                <td>${p.unitsSold} units</td>
                <td><strong>${store.formatPrice(p.totalRevenue)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // ==========================================
  // TAB 2: PRODUCT CATALOG CRUD
  // ==========================================
  function renderAdminProducts() {
    if (!adminProductsTable) return;
    const products = store.products;

    adminProductsTable.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Retail Price</th>
            <th>Wholesale Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr data-id="${p.id}">
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${p.image}" alt="${p.name}" style="width: 36px; height: 36px; object-fit: cover; background-color: var(--color-ground-soft);" />
                  <div>
                    <strong>${p.name}</strong><br/>
                    <small style="color: var(--color-ink-muted);">${p.unit} ${p.sinhalaName ? `• ${p.sinhalaName}` : ''}</small>
                  </div>
                </div>
              </td>
              <td>${p.category.toUpperCase()}</td>
              <td>${store.formatPrice(p.retailPrice)}</td>
              <td>${store.formatPrice(p.wholesalePrice)}</td>
              <td>${p.stockCount}</td>
              <td>
                <button class="btn btn-sm toggle-stock-btn" data-id="${p.id}" style="background-color: ${p.inStock ? '#E8F8F0' : '#FEE2E2'}; color: ${p.inStock ? '#028A48' : '#B91C1C'}; border-radius: 2px;">
                  ${p.inStock ? 'In Stock' : 'Out of Stock'}
                </button>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-outline btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
                  <button class="btn btn-outline btn-sm delete-prod-btn" data-id="${p.id}" style="color: #DC2626; border-color: #DC2626;">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Toggle stock
    adminProductsTable.querySelectorAll('.toggle-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleStock(id);
        renderAdminProducts();
      });
    });

    // Delete product
    adminProductsTable.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete product "${id}"?`)) {
          store.deleteProduct(id);
          renderAdminProducts();
        }
      });
    });

    // Edit product
    adminProductsTable.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openProductForm(id);
      });
    });
  }

  if (adminAddProductBtn) {
    adminAddProductBtn.addEventListener('click', () => {
      openProductForm(null);
    });
  }

  function openProductForm(productId) {
    if (!productFormModal) return;
    const isEdit = Boolean(productId);
    document.getElementById('productFormTitle').textContent = isEdit ? 'Edit Product' : 'Add New Product';
    document.getElementById('editProdId').value = productId || '';

    if (isEdit) {
      const p = store.products.find(item => item.id === productId);
      if (p) {
        document.getElementById('editProdName').value = p.name || '';
        document.getElementById('editProdSinhala').value = p.sinhalaName || '';
        document.getElementById('editProdCat').value = p.category || 'kithul';
        document.getElementById('editProdRetail').value = p.retailPrice || '';
        document.getElementById('editProdWholesale').value = p.wholesalePrice || '';
        document.getElementById('editProdUnit').value = p.unit || '';
        document.getElementById('editProdStock').value = p.stockCount || '';
        document.getElementById('editProdImage').value = p.image || '';
        document.getElementById('editProdDesc').value = p.description || '';
      }
    } else {
      if (productEditForm) productEditForm.reset();
      document.getElementById('editProdImage').value = 'assets/images/prod-kithul-treacle.jpg';
    }

    productFormModal.classList.add('open');
  }

  if (productFormClose) {
    productFormClose.addEventListener('click', () => {
      productFormModal.classList.remove('open');
    });
  }

  if (productEditForm) {
    productEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prodId = document.getElementById('editProdId').value;
      const data = {
        name: document.getElementById('editProdName').value.trim(),
        sinhalaName: document.getElementById('editProdSinhala').value.trim(),
        category: document.getElementById('editProdCat').value,
        retailPrice: Number(document.getElementById('editProdRetail').value),
        wholesalePrice: Number(document.getElementById('editProdWholesale').value),
        unit: document.getElementById('editProdUnit').value.trim(),
        stockCount: Number(document.getElementById('editProdStock').value),
        image: document.getElementById('editProdImage').value.trim(),
        description: document.getElementById('editProdDesc').value.trim()
      };

      if (prodId) {
        store.updateProduct(prodId, data);
      } else {
        store.addProduct(data);
      }

      productFormModal.classList.remove('open');
      renderAdminProducts();
    });
  }

  // ==========================================
  // TAB 3: ORDERS MANAGEMENT & 5-STAGE DELIVERY
  // ==========================================
  function renderAdminOrders() {
    if (!adminOrdersTable) return;
    const orders = store.orders;

    if (orders.length === 0) {
      adminOrdersTable.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--color-ink-muted);">
          <p>No customer orders in database yet. Place an order on the storefront to test.</p>
        </div>
      `;
      return;
    }

    adminOrdersTable.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Customer</th>
            <th>Contact</th>
            <th>Total</th>
            <th>5-Stage Delivery Progression</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr data-id="${o.id}">
              <td>
                <strong>${o.id}</strong><br/>
                <small style="color: var(--color-ink-muted);">${new Date(o.createdAt).toLocaleDateString()}</small>
              </td>
              <td>
                ${o.customer.name}<br/>
                <small style="color: var(--color-ink-muted);">${o.customer.district} (${o.customer.orderType})</small>
              </td>
              <td>
                <a href="tel:${o.customer.phone}" style="color: var(--color-accent-dark); font-weight: 600;">${o.customer.phone}</a>
              </td>
              <td><strong>${store.formatPrice(o.subtotal)}</strong></td>
              <td>
                <select class="calc-select order-stage-select" data-id="${o.id}" style="padding: 6px 10px; font-size: 0.8125rem;">
                  <option value="1" ${o.stageIndex === 1 ? 'selected' : ''}>1: Order Received</option>
                  <option value="2" ${o.stageIndex === 2 ? 'selected' : ''}>2: Factory Confirmed</option>
                  <option value="3" ${o.stageIndex === 3 ? 'selected' : ''}>3: Hygienically Packed</option>
                  <option value="4" ${o.stageIndex === 4 ? 'selected' : ''}>4: Dispatched for Delivery</option>
                  <option value="5" ${o.stageIndex === 5 ? 'selected' : ''}>5: Delivered & Fulfilled</option>
                </select>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <a href="https://wa.me/94${o.customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Hi ${o.customer.name}, Dumbara Products update regarding order ${o.id}: Status is now ${o.status}.`)}" target="_blank" class="btn btn-outline btn-sm" style="color: var(--color-accent-dark);">
                    WhatsApp
                  </a>
                  <button class="btn btn-outline btn-sm delete-order-btn" data-id="${o.id}" style="color: #DC2626; border-color: #DC2626;">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Stage change listener
    adminOrdersTable.querySelectorAll('.order-stage-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        const stageNum = parseInt(e.target.value, 10);
        store.updateOrderDeliveryStage(id, stageNum);
        renderAdminDashboard();
      });
    });

    // Delete order listener
    adminOrdersTable.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete test order ${id}?`)) {
          store.deleteOrder(id);
          renderAdminOrders();
          renderAdminDashboard();
        }
      });
    });
  }

  // ==========================================
  // TAB 4: CUSTOMER ACCOUNTS DIRECTORY
  // ==========================================
  function renderAdminUsers() {
    if (!adminUsersTable) return;
    const users = store.users;

    if (users.length === 0) {
      adminUsersTable.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--color-ink-muted);">
          <p>No registered customer accounts yet.</p>
        </div>
      `;
      return;
    }

    adminUsersTable.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Contact Details</th>
            <th>District</th>
            <th>Type</th>
            <th>Orders Placed</th>
            <th>Total Spend</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr data-id="${u.id}">
              <td><code>${u.id}</code></td>
              <td><strong>${u.name}</strong></td>
              <td>
                ${u.phone}<br/>
                <small style="color: var(--color-ink-muted);">${u.email || 'No email'}</small>
              </td>
              <td>${u.district || 'Kandy'}</td>
              <td>
                <span style="font-weight: 700; color: ${u.type === 'Wholesale' ? 'var(--color-accent-dark)' : 'var(--color-ink)'};">
                  ${u.type || 'Retail'}
                </span>
              </td>
              <td>${u.ordersCount || 0}</td>
              <td><strong>${store.formatPrice(u.totalSpent || 0)}</strong></td>
              <td>
                <span style="display: inline-block; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; background-color: ${u.status === 'Active' ? '#E8F8F0' : '#FEE2E2'}; color: ${u.status === 'Active' ? '#028A48' : '#B91C1C'};">
                  ${u.status || 'Active'}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-outline btn-sm toggle-user-btn" data-id="${u.id}">
                    ${u.status === 'Active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button class="btn btn-outline btn-sm delete-user-btn" data-id="${u.id}" style="color: #DC2626; border-color: #DC2626;">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    adminUsersTable.querySelectorAll('.toggle-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleUserStatus(id);
        renderAdminUsers();
      });
    });

    adminUsersTable.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete customer account "${id}"?`)) {
          store.deleteUser(id);
          renderAdminUsers();
        }
      });
    });
  }

  // ==========================================
  // TAB 5: SECURITY & DATABASE BACKUP
  // ==========================================
  if (adminCredsForm) {
    adminCredsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUser = document.getElementById('newAdminUser').value.trim();
      const newPass = document.getElementById('newAdminPass').value.trim();

      store.updateAdminCredentials(newUser, newPass);
      if (adminSessionUser) adminSessionUser.textContent = newUser;
      alert('Administrator username and password updated successfully!');
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const jsonStr = store.exportDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dumbara-products-db-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (resetDbBtn) {
    resetDbBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset products, orders, and reviews to factory default sample data?')) {
        store.resetToDefaults().then(() => {
          renderAdminDashboard();
          renderAdminProducts();
          renderAdminOrders();
          renderAdminUsers();
          alert('Database reset to factory defaults successfully!');
        });
      }
    });
  }
});
