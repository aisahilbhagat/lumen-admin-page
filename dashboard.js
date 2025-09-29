/**
 * dashboard.js
 * - No inline handlers; all DOM wiring via addEventListener.
 * - Uses UMD Supabase global createClient() (loaded before this file).
 * - Defensive checks to avoid "createClient is not defined" runtime errors.
 *
 * SECURITY NOTES:
 * - The anon key below is present for demo/dummy local usage only.
 * - In production, avoid embedding long-lived anon keys: use server endpoints, short-lived tokens, or strict RLS.
 * - All server updates (fulfill/export) should be done server-side with authenticated calls and CSRF protections.
 */

// ----- Supabase config (replace with your values) -----
const SUPABASE_URL = 'https://tfcvfjtounqemishwcop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY3ZmanRvdW5xZW1pc2h3Y29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI4NjgsImV4cCI6MjA3NDYxODg2OH0.Qso906vE1_1LTIxhrKAswHhNsizquQJ8P7X4ybfaXmM';

// initialize supabase using available factory
let supabase = null;
if (typeof createClient !== 'undefined') {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof window !== 'undefined' && window.supabaseClient) {
  // fallback if user used module bootstrap to attach client
  supabase = window.supabaseClient;
} else {
  console.error('Supabase client not available. Ensure the UMD script https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js is loaded before dashboard.js');
  // We'll continue with the page in offline/demo mode (no Supabase), but many features will be stubbed.
}

// ----------------- Dummy orders (kept intentionally) -----------------
let orders = [
  {
    id: "ORD-2023-001",
    customer: { name: "Rajesh Kumar", email: "rajesh.kumar@example.com", phone: "9876543210", altPhone: "8765432109" },
    deliveryAddress: { address: "123, Street Name, Apartment 4B", landmark: "Near City Mall", city: "Mumbai", state: "Maharashtra", pinCode: "400001" },
    orderDate: "2023-10-15",
    items: [
      { id: 1, name: "Premium Cotton Shirt", size: "L", color: "Blue", colorCode: "#1e40af", material: "100% Cotton", brand: "Premium Wear", image: "https://picsum.photos/seed/shirt1/300/300.jpg", price: 39.99, quantity: 2 },
      { id: 4, name: "Leather Belt", size: "One Size", color: "Black", colorCode: "#000000", material: "Genuine Leather", brand: "LeatherCraft", image: "https://picsum.photos/seed/belt1/300/300.jpg", price: 24.99, quantity: 1 }
    ],
    subtotal: 104.97, shipping: 10.00, tax: 11.55, total: 126.52, status: "pending"
  },
  {
    id: "ORD-2023-002",
    customer: { name: "Priya Sharma", email: "priya.sharma@example.com", phone: "9988776655", altPhone: "" },
    deliveryAddress: { address: "456, Park Avenue, 2nd Floor", landmark: "Opposite Railway Station", city: "Delhi", state: "Delhi", pinCode: "110001" },
    orderDate: "2023-10-14",
    items: [
      { id: 3, name: "Summer Floral Dress", size: "M", color: "Multi-color", colorCode: "#ec4899", material: "100% Polyester", brand: "Summer Breeze", image: "https://picsum.photos/seed/dress1/300/300.jpg", price: 59.99, quantity: 1 }
    ],
    subtotal: 59.99, shipping: 10.00, tax: 6.60, total: 76.59, status: "fulfilled"
  }
];

// track currently opened order in modal
let currentOrderId = null;

// ----------------- Utilities -----------------
function formatDate(dateString) {
  try {
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, opts);
  } catch (e) {
    return dateString;
  }
}

function getStatusBadge(status) {
  if (status === 'pending') return '<span class="badge bg-warning text-dark">Pending</span>';
  if (status === 'fulfilled') return '<span class="badge bg-success">Fulfilled</span>';
  return '<span class="badge bg-secondary">Unknown</span>';
}

function showNotification(message, type = 'success') {
  const el = document.getElementById('notification');
  el.textContent = message;
  el.style.display = 'block';
  el.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ----------------- Rendering -----------------
function loadOrderTable() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" class="text-center py-4 text-muted">No orders available</td>`;
    tbody.appendChild(tr);
    return;
  }

  orders.forEach(order => {
    const tr = document.createElement('tr');

    // Order ID
    const tdId = document.createElement('td');
    tdId.textContent = order.id;
    tdId.style.fontWeight = '600';

    // Customer
    const tdCustomer = document.createElement('td');
    tdCustomer.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="customer-avatar me-2">${initials(order.customer.name)}</div>
        <div>
          <div style="font-weight:600">${escapeHtml(order.customer.name)}</div>
          <div class="text-muted small">${escapeHtml(order.customer.email)}</div>
        </div>
      </div>`;

    // Address
    const tdAddress = document.createElement('td');
    tdAddress.innerHTML = `${escapeHtml(order.deliveryAddress.address)}<br><small class="text-muted">${escapeHtml(order.deliveryAddress.city)}, ${escapeHtml(order.deliveryAddress.state)} - ${escapeHtml(order.deliveryAddress.pinCode)}</small>`;

    // Date & Total & Status
    const tdDate = document.createElement('td'); tdDate.textContent = formatDate(order.orderDate);
    const tdTotal = document.createElement('td'); tdTotal.textContent = `₹${order.total.toFixed(2)}`;
    const tdStatus = document.createElement('td'); tdStatus.innerHTML = getStatusBadge(order.status);

    // Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'text-end';

    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'btn btn-sm btn-outline-primary me-1';
    viewBtn.innerHTML = '<i class="bi bi-eye"></i>';
    viewBtn.addEventListener('click', () => viewOrderDetails(order.id));
    tdActions.appendChild(viewBtn);

    if (order.status === 'pending') {
      const fulfillBtn = document.createElement('button');
      fulfillBtn.type = 'button';
      fulfillBtn.className = 'btn btn-sm btn-success';
      fulfillBtn.innerHTML = '<i class="bi bi-check-circle"></i>';
      fulfillBtn.addEventListener('click', () => fulfillOrderDirect(order.id));
      tdActions.appendChild(fulfillBtn);
    }

    tr.append(tdId, tdCustomer, tdAddress, tdDate, tdTotal, tdStatus, tdActions);
    tbody.appendChild(tr);
  });
}

function updateStats() {
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('fulfilledOrders').textContent = orders.filter(o => o.status === 'fulfilled').length;
  document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
}

// ----------------- Helpers -----------------
function initials(name) {
  return (name || '').split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase();
}

// Very small escaping helper for safe DOM insertion when using innerHTML
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#039;');
}

// ----------------- Interactions -----------------
function viewOrderDetails(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) { showNotification('Order not found', 'error'); return; }
  currentOrderId = orderId;

  const body = document.getElementById('orderDetailsBody');
  body.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h6>Customer</h6>
        <div><strong>${escapeHtml(order.customer.name)}</strong></div>
        <div class="text-muted small">${escapeHtml(order.customer.email)}</div>
        <div class="text-muted small">Phone: ${escapeHtml(order.customer.phone || 'N/A')}</div>
      </div>
      <div class="col-md-6">
        <h6>Delivery Address</h6>
        <div>${escapeHtml(order.deliveryAddress.address)}</div>
        <div class="text-muted small">${escapeHtml(order.deliveryAddress.city)}, ${escapeHtml(order.deliveryAddress.state)} - ${escapeHtml(order.deliveryAddress.pinCode)}</div>
        <div class="text-muted small">Landmark: ${escapeHtml(order.deliveryAddress.landmark || 'N/A')}</div>
      </div>
    </div>
    <hr />
    <div>
      <h6>Items</h6>
      ${order.items.map(it => `
        <div class="d-flex mb-3">
          <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}" style="width:84px;height:84px;object-fit:cover;border-radius:8px;margin-right:12px;">
          <div>
            <div style="font-weight:600">${escapeHtml(it.name)}</div>
            <div class="text-muted small">${escapeHtml(it.brand)} • ${escapeHtml(it.material)}</div>
            <div class="text-muted small">Size: ${escapeHtml(it.size)} • Qty: ${it.quantity}</div>
          </div>
          <div class="ms-auto text-end">
            <div style="font-weight:600">₹${(it.price * it.quantity).toFixed(2)}</div>
            <div class="text-muted small">₹${it.price.toFixed(2)} each</div>
          </div>
        </div>
      `).join('')}
    </div>
    <hr />
    <div class="d-flex justify-content-end gap-3">
      <div class="text-muted" style="min-width:180px;">
        <div>Subtotal</div>
        <div>Shipping</div>
        <div>Tax</div>
        <div class="fw-bold mt-2">Total</div>
      </div>
      <div style="min-width:120px; text-align:right;">
        <div>₹${order.subtotal.toFixed(2)}</div>
        <div>₹${order.shipping.toFixed(2)}</div>
        <div>₹${order.tax.toFixed(2)}</div>
        <div class="fw-bold mt-2">₹${order.total.toFixed(2)}</div>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
  const fulfillBtn = document.getElementById('modalFulfillButton');
  if (order.status === 'fulfilled') {
    fulfillBtn.disabled = true;
    fulfillBtn.textContent = 'Already Fulfilled';
    fulfillBtn.classList.remove('btn-success');
    fulfillBtn.classList.add('btn-secondary');
  } else {
    fulfillBtn.disabled = false;
    fulfillBtn.textContent = 'Mark as Fulfilled';
    fulfillBtn.classList.remove('btn-secondary');
    fulfillBtn.classList.add('btn-success');
  }
  modal.show();
}

function fulfillOrder() {
  if (!currentOrderId) return;
  const order = orders.find(o => o.id === currentOrderId);
  if (!order) { showNotification('Order not found', 'error'); return; }

  // Production: call server endpoint to update order. Client-side change is only a UI stub.
  order.status = 'fulfilled';
  loadOrderTable();
  updateStats();
  const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
  if (modal) modal.hide();
  showNotification(`Order ${order.id} marked fulfilled`);
}

function fulfillOrderDirect(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) { showNotification('Order not found', 'error'); return; }
  order.status = 'fulfilled';
  loadOrderTable();
  updateStats();
  showNotification(`Order ${orderId} marked fulfilled`);
}

function refreshOrderList() {
  // If supabase client is available, fetch fresh orders here (example stub).
  // Example: await supabase.from('orders').select('*').order('orderDate', {ascending:false})
  // For now, just re-render existing list.
  loadOrderTable();
  updateStats();
  showNotification('Order list refreshed');
}

function exportOrders() {
  // Production: generate CSV on server or build CSV here and prompt download.
  // Keep heavy exports server-side so keys / PII aren't exposed.
  showNotification('Export planned (server-side implementation recommended)');
}

// ----------------- Search & Filter -----------------
function searchOrders() {
  const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  if (!q) { loadOrderTable(); return; }
  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(q) ||
    (o.customer.name || '').toLowerCase().includes(q) ||
    (o.customer.email || '').toLowerCase().includes(q) ||
    (o.deliveryAddress.city || '').toLowerCase().includes(q)
  );
  renderFiltered(filtered);
}

function filterOrders() {
  const state = document.getElementById('statusFilter').value;
  const date = document.getElementById('dateFilter').value;
  let filtered = orders.slice();

  if (state) filtered = filtered.filter(o => o.status === state);
  if (date) {
    const now = new Date();
    let cutoff = new Date();
    if (date === 'today') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date === 'week') cutoff.setDate(now.getDate() - 7);
    if (date === 'month') cutoff.setMonth(now.getMonth() - 1);
    filtered = filtered.filter(o => new Date(o.orderDate) >= cutoff);
  }
  renderFiltered(filtered);
}

function renderFiltered(list) {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';
  if (!list || list.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="text-center text-muted py-4">No matching orders</td>';
    tbody.appendChild(tr);
    return;
  }
  list.forEach(item => {
    // Reuse loadOrderTable row creation logic by temporarily substituting orders to filtered list.
    // Simpler: create DOM rows directly (similar to loadOrderTable). For brevity we call loadOrderTable with filtered substitution.
  });

  // Quick approach: temporarily swap orders, render, then restore original array
  const original = orders;
  orders = list;
  loadOrderTable();
  orders = original;
}

// ----------------- Auth check & initialization -----------------
async function checkAuthAndInit() {
  try {
    // If supabase available, try to check session; otherwise proceed in demo mode.
    if (supabase) {
      // Supabase v2: getSession style depends on bundle; use defensive approach
      if (supabase.auth && typeof supabase.auth.getSession === 'function') {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase session check error:', error.message);
          // fallback to showing dashboard in demo mode or redirect to login
          showDashboard();
          return;
        }
        if (!data?.session) {
          // no session -> redirect to login page
          // If your app uses different login, adjust path.
          window.location.href = 'index.html';
          return;
        }
        // authenticated: continue
        showDashboard();
      } else {
        // supabase client present but auth API shape unexpected (module mismatch) -> show UI
        showDashboard();
      }
    } else {
      // supabase not present -> show demo dashboard
      showDashboard();
    }
  } catch (err) {
    console.error('Auth/init failure', err);
    showDashboard();
  }
}

function showDashboard() {
  document.getElementById('loadingOverlay').style.display = 'none';
  document.getElementById('adminHeader').style.display = '';
  document.getElementById('dashboardContent').style.display = '';
  loadOrderTable();
  updateStats();
}

// ----------------- Small UX wiring -----------------
document.addEventListener('DOMContentLoaded', () => {
  // Wire UI controls (no inline attributes anywhere)
  document.getElementById('refreshButton').addEventListener('click', refreshOrderList);
  document.getElementById('exportButton').addEventListener('click', exportOrders);
  document.getElementById('searchButton').addEventListener('click', searchOrders);
  document.getElementById('searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchOrders(); });
  document.getElementById('statusFilter').addEventListener('change', filterOrders);
  document.getElementById('dateFilter').addEventListener('change', filterOrders);
  document.getElementById('modalFulfillButton').addEventListener('click', fulfillOrder);
  document.getElementById('logoutButton').addEventListener('click', async () => {
    if (!supabase) { window.location.href = 'index.html'; return; }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error', error);
        showNotification('Logout failed', 'error');
        return;
      }
      window.location.href = 'index.html';
    } catch (e) {
      console.error('Logout exception', e);
      window.location.href = 'index.html';
    }
  });

  // initialize auth check and UI
  checkAuthAndInit();
});
