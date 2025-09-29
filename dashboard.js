// dashboard.js
// This file must be served from the same origin as dashboard.html (allowed by CSP 'self').

// SECURITY: Initialize Supabase Client
const SUPABASE_URL = 'https://tfcvfjtounqemishwcop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY3ZmanRvdW5xZW1pc2h3Y29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDI4NjgsImV4cCI6MjA3NDYxODg2OH0.Qso906vE1_1LTIxhrKAswHhNsizquQJ8P7X4ybfaXmM';

// create Supabase client (using global Supabase from CDN)
// CORRECT — when you load the CDN script <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Sample order data (kept as dummy data until server is integrated)
let orders = [
    {
        id: "ORD-2023-001",
        customer: { name: "Rajesh Kumar", email: "rajesh.kumar@example.com", phone: "9876543210", altPhone: "8765432109" },
        deliveryAddress: { address: "123, Street Name, Apartment 4B", landmark: "Near City Mall", city: "Mumbai", state: "Maharashtra", pinCode: "400001" },
        orderDate: "2023-10-15",
        items: [
            { id: 1, name: "Premium Cotton Shirt", category: "Shirts", size: "L", color: "Blue", colorCode: "#1e40af", material: "100% Cotton", brand: "Premium Wear", image: "https://picsum.photos/seed/shirt1/300/300.jpg", price: 39.99, quantity: 2 },
            { id: 4, name: "Leather Belt", category: "Accessories", size: "One Size", color: "Black", colorCode: "#000000", material: "Genuine Leather", brand: "LeatherCraft", image: "https://picsum.photos/seed/belt1/300/300.jpg", price: 24.99, quantity: 1 }
        ],
        subtotal: 104.97, shipping: 10.00, tax: 11.55, total: 126.52, status: "pending"
    },
    {
        id: "ORD-2023-002",
        customer: { name: "Priya Sharma", email: "priya.sharma@example.com", phone: "9988776655", altPhone: "" },
        deliveryAddress: { address: "456, Park Avenue, 2nd Floor", landmark: "Opposite Railway Station", city: "Delhi", state: "Delhi", pinCode: "110001" },
        orderDate: "2023-10-14",
        items: [
            { id: 3, name: "Summer Floral Dress", category: "Dresses", size: "M", color: "Multi-color", colorCode: "#ec4899", material: "100% Polyester", brand: "Summer Breeze", image: "https://picsum.photos/seed/dress1/300/300.jpg", price: 59.99, quantity: 1 }
        ],
        subtotal: 59.99, shipping: 10.00, tax: 6.60, total: 76.59, status: "fulfilled"
    },
    {
        id: "ORD-2023-003",
        customer: { name: "Amit Patel", email: "amit.patel@example.com", phone: "9123456789", altPhone: "9012345678" },
        deliveryAddress: { address: "789, Gandhi Road, House No. 15", landmark: "Behind Temple", city: "Ahmedabad", state: "Gujarat", pinCode: "380001" },
        orderDate: "2023-10-13",
        items: [
            { id: 2, name: "Slim Fit Chinos", category: "Pants", size: "34", color: "Khaki", colorCode: "#d4a574", material: "98% Cotton, 2% Elastane", brand: "Comfort Fit", image: "https://picsum.photos/seed/pants1/300/300.jpg", price: 49.99, quantity: 1 },
            { id: 5, name: "Casual Polo Shirt", category: "Shirts", size: "L", color: "Navy Blue", colorCode: "#1e3a8a", material: "100% Pique Cotton", brand: "Casual Wear", image: "https://picsum.photos/seed/polo1/300/300.jpg", price: 29.99, quantity: 3 }
        ],
        subtotal: 139.96, shipping: 10.00, tax: 15.50, total: 165.46, status: "pending"
    },
    {
        id: "ORD-2023-004",
        customer: { name: "Sneha Reddy", email: "sneha.reddy@example.com", phone: "9876543210", altPhone: "" },
        deliveryAddress: { address: "321, Tech Park, Building C", landmark: "Near IT Hub", city: "Bangalore", state: "Karnataka", pinCode: "560001" },
        orderDate: "2023-10-12",
        items: [
            { id: 1, name: "Premium Cotton Shirt", category: "Shirts", size: "M", color: "White", colorCode: "#ffffff", material: "100% Cotton", brand: "Premium Wear", image: "https://picsum.photos/seed/shirt1/300/300.jpg", price: 39.99, quantity: 1 },
            { id: 2, name: "Slim Fit Chinos", category: "Pants", size: "32", color: "Black", colorCode: "#000000", material: "98% Cotton, 2% Elastane", brand: "Comfort Fit", image: "https://picsum.photos/seed/pants1/300/300.jpg", price: 49.99, quantity: 1 }
        ],
        subtotal: 89.98, shipping: 10.00, tax: 9.90, total: 109.88, status: "fulfilled"
    }
];

let currentOrderId = null;

// Utility: format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Utility: status badge
function getStatusBadge(status) {
    switch(status) {
        case 'pending': return '<span class="badge bg-warning text-dark">Pending</span>';
        case 'fulfilled': return '<span class="badge bg-success">Fulfilled</span>';
        default: return '<span class="badge bg-secondary">Unknown</span>';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    if (type === 'error') notification.classList.add('error');
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// Load orders into table (creates elements and attaches listeners — no inline handlers)
function loadOrderTable() {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    orders.forEach(order => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.className = 'order-id';
        tdId.textContent = order.id;

        const tdCustomer = document.createElement('td');
        tdCustomer.innerHTML = `
            <div class="customer-info">
                <div class="customer-avatar">${order.customer.name.split(' ').map(n => n[0]).join('')}</div>
                <div class="customer-details">
                    <h6>${order.customer.name}</h6>
                    <small>${order.customer.email}</small>
                </div>
            </div>
        `;

        const tdAddress = document.createElement('td');
        tdAddress.innerHTML = `
            <div class="address-info">
                <div>${order.deliveryAddress.address}</div>
                <div>${order.deliveryAddress.city}, ${order.deliveryAddress.state}</div>
                <div>${order.deliveryAddress.pinCode}</div>
            </div>
        `;

        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(order.orderDate);

        const tdTotal = document.createElement('td');
        tdTotal.textContent = `$${order.total.toFixed(2)}`;

        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = getStatusBadge(order.status);

        const tdActions = document.createElement('td');
        tdActions.className = 'action-buttons';

        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-outline-primary';
        viewBtn.type = 'button';
        viewBtn.setAttribute('aria-label', `View ${order.id}`);
        viewBtn.innerHTML = '<i class="bi bi-eye"></i>';
        viewBtn.addEventListener('click', () => viewOrderDetails(order.id));
        tdActions.appendChild(viewBtn);

        // Fulfill button (only if pending)
        if (order.status === 'pending') {
            const fulfillBtn = document.createElement('button');
            fulfillBtn.className = 'btn btn-sm btn-outline-success ms-1';
            fulfillBtn.type = 'button';
            fulfillBtn.setAttribute('aria-label', `Fulfill ${order.id}`);
            fulfillBtn.innerHTML = '<i class="bi bi-check-circle"></i>';
            fulfillBtn.addEventListener('click', () => fulfillOrderDirect(order.id));
            tdActions.appendChild(fulfillBtn);
        }

        tr.appendChild(tdId);
        tr.appendChild(tdCustomer);
        tr.appendChild(tdAddress);
        tr.appendChild(tdDate);
        tr.appendChild(tdTotal);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
    });
}

// Update stats
function updateStats() {
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('fulfilledOrders').textContent = orders.filter(o => o.status === 'fulfilled').length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
}

// Search orders
function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!searchTerm) {
        loadOrderTable();
        return;
    }
    const filtered = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm) ||
        order.customer.name.toLowerCase().includes(searchTerm) ||
        order.customer.email.toLowerCase().includes(searchTerm) ||
        order.deliveryAddress.city.toLowerCase().includes(searchTerm) ||
        order.deliveryAddress.state.toLowerCase().includes(searchTerm)
    );
    displayFilteredOrders(filtered);
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    let filtered = orders.slice();

    if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);

    if (dateFilter) {
        const today = new Date();
        let cutoff = new Date();
        switch (dateFilter) {
            case 'today': cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate()); break;
            case 'week': cutoff.setDate(today.getDate() - 7); break;
            case 'month': cutoff.setMonth(today.getMonth() - 1); break;
        }
        filtered = filtered.filter(o => new Date(o.orderDate) >= cutoff);
    }

    displayFilteredOrders(filtered);
}

function displayFilteredOrders(filteredOrders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    if (filteredOrders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="text-center py-4">
                <div class="text-muted">
                    <i class="bi bi-search fs-1"></i>
                    <p>No orders found matching your criteria.</p>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    // reuse load logic but for the filtered list (create rows)
    filteredOrders.forEach(order => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.className = 'order-id';
        tdId.textContent = order.id;

        const tdCustomer = document.createElement('td');
        tdCustomer.innerHTML = `
            <div class="customer-info">
                <div class="customer-avatar">${order.customer.name.split(' ').map(n => n[0]).join('')}</div>
                <div class="customer-details">
                    <h6>${order.customer.name}</h6>
                    <small>${order.customer.email}</small>
                </div>
            </div>
        `;

        const tdAddress = document.createElement('td');
        tdAddress.innerHTML = `
            <div class="address-info">
                <div>${order.deliveryAddress.address}</div>
                <div>${order.deliveryAddress.city}, ${order.deliveryAddress.state}</div>
                <div>${order.deliveryAddress.pinCode}</div>
            </div>
        `;

        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(order.orderDate);

        const tdTotal = document.createElement('td');
        tdTotal.textContent = `$${order.total.toFixed(2)}`;

        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = getStatusBadge(order.status);

        const tdActions = document.createElement('td');
        tdActions.className = 'action-buttons';

        // View
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-outline-primary';
        viewBtn.type = 'button';
        viewBtn.innerHTML = '<i class="bi bi-eye"></i>';
        viewBtn.addEventListener('click', () => viewOrderDetails(order.id));
        tdActions.appendChild(viewBtn);

        if (order.status === 'pending') {
            const fulfillBtn = document.createElement('button');
            fulfillBtn.className = 'btn btn-sm btn-outline-success ms-1';
            fulfillBtn.type = 'button';
            fulfillBtn.innerHTML = '<i class="bi bi-check-circle"></i>';
            fulfillBtn.addEventListener('click', () => fulfillOrderDirect(order.id));
            tdActions.appendChild(fulfillBtn);
        }

        tr.appendChild(tdId);
        tr.appendChild(tdCustomer);
        tr.appendChild(tdAddress);
        tr.appendChild(tdDate);
        tr.appendChild(tdTotal);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
    });
}

// View Order Details (fills modal)
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) { showNotification('Order not found', 'error'); return; }
    currentOrderId = orderId;

    document.getElementById('modalCustomerName').textContent = order.customer.name;
    document.getElementById('modalCustomerEmail').textContent = order.customer.email;
    document.getElementById('modalCustomerPhone').textContent = order.customer.phone;
    document.getElementById('modalCustomerAltPhone').textContent = order.customer.altPhone || 'N/A';
    document.getElementById('modalDeliveryAddress').textContent = order.deliveryAddress.address;
    document.getElementById('modalLandmark').textContent = order.deliveryAddress.landmark;
    document.getElementById('modalCity').textContent = order.deliveryAddress.city;
    document.getElementById('modalState').textContent = order.deliveryAddress.state;
    document.getElementById('modalPinCode').textContent = order.deliveryAddress.pinCode;
    document.getElementById('modalSubtotal').textContent = `$${order.subtotal.toFixed(2)}`;
    document.getElementById('modalShipping').textContent = `$${order.shipping.toFixed(2)}`;
    document.getElementById('modalTax').textContent = `$${order.tax.toFixed(2)}`;
    document.getElementById('modalTotal').textContent = `$${order.total.toFixed(2)}`;

    const itemsContainer = document.getElementById('modalOrderItems');
    itemsContainer.innerHTML = '';
    order.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'product-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="product-image">
            <div class="product-info">
                <h6>${item.name}</h6>
                <div class="product-description">${item.material} | ${item.brand}</div>
                <div class="product-attributes">
                    <div class="product-attribute">
                        <div class="attribute-label">Size</div>
                        <div class="attribute-value">${item.size}</div>
                    </div>
                    <div class="product-attribute">
                        <div class="attribute-label">Color</div>
                        <div class="attribute-value">
                            <span class="color-badge" style="background-color: ${item.colorCode};"></span>
                            ${item.color}
                        </div>
                    </div>
                    <div class="product-attribute">
                        <div class="attribute-label">Price</div>
                        <div class="attribute-value">$${item.price.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            <div class="product-total">
                <div class="product-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="product-quantity">Qty: ${item.quantity}</div>
            </div>
        `;
        itemsContainer.appendChild(itemEl);
    });

    const fulfillButton = document.getElementById('modalFulfillButton');
    if (order.status === 'fulfilled') {
        fulfillButton.disabled = true;
        fulfillButton.innerHTML = '<i class="bi bi-check-circle"></i> Already Fulfilled';
        fulfillButton.classList.remove('btn-success');
        fulfillButton.classList.add('btn-secondary');
    } else {
        fulfillButton.disabled = false;
        fulfillButton.innerHTML = '<i class="bi bi-check-circle"></i> Mark as Fulfilled';
        fulfillButton.classList.remove('btn-secondary');
        fulfillButton.classList.add('btn-success');
    }

    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Fulfill from modal
function fulfillOrder() {
    if (!currentOrderId) return;
    const order = orders.find(o => o.id === currentOrderId);
    if (!order) { showNotification('Order not found', 'error'); return; }

    // In production: call server endpoint here to update order status with CSRF & auth checks
    order.status = 'fulfilled';
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) modal.hide();

    loadOrderTable();
    updateStats();
    showNotification(`Order ${currentOrderId} has been marked as fulfilled`);
}

// Fulfill directly from row
function fulfillOrderDirect(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) { showNotification('Order not found', 'error'); return; }

    // In production: call server endpoint
    order.status = 'fulfilled';
    loadOrderTable();
    updateStats();
    showNotification(`Order ${orderId} has been marked as fulfilled`);
}

// Refresh order list
function refreshOrderList() {
    // Production: fetch fresh data from server via API (auth + CSRF + validation)
    loadOrderTable();
    updateStats();
    showNotification('Order list refreshed');
}

// Export orders (stub)
function exportOrders() {
    // Production: securely generate and serve export file (server-side)
    showNotification('Export functionality will be implemented with the server');
}

// Auth check & initial wiring
async function checkAuthStatus() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Auth check error:', error.message);
            redirectToLogin();
            return;
        }
        if (!session) {
            console.log('No active session found');
            redirectToLogin();
            return;
        }
        // authenticated
        showDashboard();
    } catch (err) {
        console.error('Auth check failed:', err);
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

function showDashboard() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('adminHeader').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'block';

    // initial render
    loadOrderTable();
    updateStats();
}

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
            showNotification('Logout failed: ' + error.message, 'error');
            return;
        }
        redirectToLogin();
    } catch (err) {
        console.error('Logout failed:', err);
        showNotification('Logout failed', 'error');
    }
}

// CSRF generator (client-side dummy until server-provided tokens used)
function generateCSRFToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Attach DOM listeners once content loaded
document.addEventListener('DOMContentLoaded', function () {
    // wire UI controls (no inline attributes)
    document.getElementById('refreshButton').addEventListener('click', refreshOrderList);
    document.getElementById('exportButton').addEventListener('click', exportOrders);
    document.getElementById('searchButton').addEventListener('click', searchOrders);
    document.getElementById('searchInput').addEventListener('keyup', function (e) { if (e.key === 'Enter') searchOrders(); });
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('dateFilter').addEventListener('change', filterOrders);
    document.getElementById('modalFulfillButton').addEventListener('click', fulfillOrder);
    document.getElementById('logoutButton').addEventListener('click', logout);

    // check auth and hide loading
    checkAuthStatus();

    // CSRF token (placeholder until server provides signed token)
    document.getElementById('csrf_token').value = generateCSRFToken();
});
