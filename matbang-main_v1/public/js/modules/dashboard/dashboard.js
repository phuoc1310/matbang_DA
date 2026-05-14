// ================== DASHBOARD MODULE ==================
// Fetches real statistics from the backend API

const BACKEND_URL = localStorage.getItem('admin_backend_url') || 'http://localhost:3033';

// ================== INITIALIZE DASHBOARD ==================
async function initDashboard() {
    await loadDashboardStats();
}

// ================== LOAD REAL STATS FROM API ==================
async function loadDashboardStats() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/dashboard/stats`);
        const data = await res.json();

        if (data.success && data.stats) {
            const s = data.stats;

            const totalUsersEl = document.getElementById('dashboard-total-users');
            const totalListingsEl = document.getElementById('dashboard-total-listings');
            const pendingEl = document.getElementById('dashboard-pending-listings');
            const visitsEl = document.getElementById('dashboard-total-visits');

            if (totalUsersEl) totalUsersEl.textContent = s.totalUsers.toLocaleString('vi-VN');
            if (totalListingsEl) totalListingsEl.textContent = s.totalListings.toLocaleString('vi-VN');
            if (pendingEl) pendingEl.textContent = s.pendingListings.toLocaleString('vi-VN');
            if (visitsEl) visitsEl.textContent = s.totalVisits.toLocaleString('vi-VN');
        }
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
}

// ================== REFRESH ==================
function refreshDashboard() {
    loadDashboardStats();
}

// ================== EXPORT ==================
if (typeof window !== 'undefined') {
    window.initDashboard = initDashboard;
    window.refreshDashboard = refreshDashboard;
}
