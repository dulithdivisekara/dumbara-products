/**
 * Dumbara Products - Admin Management Portal Controller
 * Full CRUD for Products, Orders, and Database persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  // DOM Elements
  const adminFooterLink = document.getElementById('adminFooterLink');
  const adminModal = document.getElementById('adminModal');
  const adminClose = document.getElementById('adminClose');
  const adminTabs = document.querySelectorAll('.admin-tab');
  const adminProductSection = document.getElementById('adminProductSection');
  const adminOrderSection = document.getElementById('adminOrderSection');
  const adminBackupSection = document.getElementById('adminBackupSection');

  // Product CRUD Elements
  const adminProductsTable = document.getElementById('adminProductsTable');
  const adminAddProductBtn = document.getElementById('adminAddProductBtn');
  const productFormModal = document.getElementById('productFormModal');
  const productFormClose = document.getElementById('productFormClose');
  const productEditForm = document.getElementById('productEditForm');

  // Orders CRUD Elements
  const adminOrdersTable = document.getElementById('adminOrdersTable');

  // Database Backup Elements
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const resetDbBtn = document.getElementById('resetDbBtn');

  // Open & Close Admin Modal
  if (adminFooterLink && adminModal) {
    adminFooterLink.addEventListener('click', (e) => {
      e.preventDefault();
      adminModal.classList.add('open');
      renderAdminProducts();
      renderAdminOrders();
    });
  }

  if (adminClose && adminModal) {
    adminClose.addEventListener('click', () => {
      adminModal.classList.remove('open');
    });
  }

  // Admin Tab Navigation
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      if (adminProductSection) adminProductSection.style.display = target === 'products' ? 'block' : 'none';
      if (adminOrderSection) adminOrderSection.style.display = target === 'orders' ? 'block' : 'none';
      if (adminBackupSection) adminBackupSection.style.display = target === 'backup' ? 'block' : 'none';
    });
  });

  // ==========================================
  // PRODUCT CATALOG CRUD
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
                    <small style="color: var(--color-ink-muted);">${p.unit}</small>
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

  // Add Product Button
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
  // ORDERS MANAGEMENT CRUD
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
            <th>Order ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr data-id="${o.id}">
              <td><strong>${o.id}</strong><br/><small style="color: var(--color-ink-muted);">${new Date(o.createdAt).toLocaleDateString()}</small></td>
              <td>${o.customer.name}<br/><small style="color: var(--color-ink-muted);">${o.customer.district}</small></td>
              <td><a href="tel:${o.customer.phone}" style="color: var(--color-accent-dark); font-weight: 600;">${o.customer.phone}</a></td>
              <td>${o.items.length} item(s)</td>
              <td><strong>${store.formatPrice(o.subtotal)}</strong></td>
              <td>
                <select class="calc-select order-status-select" data-id="${o.id}" style="padding: 6px 10px; font-size: 0.8125rem;">
                  <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                  <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
                  <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td>
                <button class="btn btn-outline btn-sm delete-order-btn" data-id="${o.id}" style="color: #DC2626; border-color: #DC2626;">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    adminOrdersTable.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        store.updateOrderStatus(id, e.target.value);
      });
    });

    adminOrdersTable.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete test order ${id}?`)) {
          store.deleteOrder(id);
          renderAdminOrders();
        }
      });
    });
  }

  // ==========================================
  // DATABASE EXPORT & RESET
  // ==========================================
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
      if (confirm('Are you sure you want to reset the catalog and reviews to factory default sample data? Any newly created test products will be reset.')) {
        store.resetToDefaults().then(() => {
          renderAdminProducts();
          renderAdminOrders();
          alert('Database reset to default products and reviews successfully!');
        });
      }
    });
  }
});
