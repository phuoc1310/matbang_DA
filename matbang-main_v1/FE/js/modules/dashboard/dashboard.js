// ================== DASHBOARD MODULE ==================
// Fetches real statistics from the backend API and renders Chart.js charts

const BACKEND_URL = '';

// Store chart instances to destroy before re-creating
let chartInstances = {};

// ================== INITIALIZE DASHBOARD ==================
async function initDashboard() {
    await loadDashboardStats();
    await loadDashboardCharts();
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

// ================== LOAD DASHBOARD CHARTS ==================
async function loadDashboardCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping charts');
        return;
    }

    // Fetch all data in parallel
    const [listingStats, users, contacts, feedbacks] = await Promise.all([
        fetchJSON(`${BACKEND_URL}/api/admin/listings/stats`),
        fetchJSON(`${BACKEND_URL}/api/admin/users`),
        fetchJSON(`${BACKEND_URL}/api/admin/contacts`),
        fetchJSON(`${BACKEND_URL}/api/admin/feedbacks`)
    ]);

    renderListingStatusChart(listingStats);
    renderUserRolesChart(users);
    renderContactStatusChart(contacts);
    renderFeedbackRatingsChart(feedbacks);
}

async function fetchJSON(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn('Fetch error:', url, e);
        return null;
    }
}

// ================== CHART 1: Listing Status Distribution ==================
function renderListingStatusChart(data) {
    const ctx = document.getElementById('chart-listing-status');
    if (!ctx) return;
    destroyChart('listingStatus');

    const stats = data?.stats || { pending: 0, approved: 0, rejected: 0 };

    chartInstances.listingStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
            datasets: [{
                data: [stats.pending, stats.approved, stats.rejected],
                backgroundColor: [
                    'rgba(234, 179, 8, 0.85)',
                    'rgba(34, 197, 94, 0.85)',
                    'rgba(239, 68, 68, 0.85)'
                ],
                borderColor: [
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 12,
                        font: { size: 13, family: 'Manrope', weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '55%'
        }
    });
}

// ================== CHART 2: User Roles Distribution ==================
function renderUserRolesChart(data) {
    const ctx = document.getElementById('chart-user-roles');
    if (!ctx) return;
    destroyChart('userRoles');

    const users = data?.users || [];
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role !== 'admin').length;

    chartInstances.userRoles = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Admin', 'Người dùng'],
            datasets: [{
                label: 'Số lượng',
                data: [adminCount, userCount],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y} tài khoản`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { family: 'Manrope', weight: '500' }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                x: {
                    ticks: { font: { family: 'Manrope', weight: '600', size: 13 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ================== CHART 3: Contact Status Distribution ==================
function renderContactStatusChart(data) {
    const ctx = document.getElementById('chart-contact-status');
    if (!ctx) return;
    destroyChart('contactStatus');

    const contacts = data?.contacts || [];
    const pending = contacts.filter(c => c.status === 'pending' || !c.status).length;
    const processed = contacts.filter(c => c.status === 'processed').length;
    const resolved = contacts.filter(c => c.status === 'resolved').length;

    chartInstances.contactStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chưa xử lý', 'Đã xử lý', 'Đã giải quyết'],
            datasets: [{
                data: [pending, processed, resolved],
                backgroundColor: [
                    'rgba(249, 115, 22, 0.85)',
                    'rgba(59, 130, 246, 0.85)',
                    'rgba(34, 197, 94, 0.85)'
                ],
                borderColor: [
                    'rgba(249, 115, 22, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 12,
                        font: { size: 13, family: 'Manrope', weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '55%'
        }
    });
}

// ================== CHART 4: Feedback Ratings Distribution ==================
function renderFeedbackRatingsChart(data) {
    const ctx = document.getElementById('chart-feedback-ratings');
    if (!ctx) return;
    destroyChart('feedbackRatings');

    const feedbacks = data?.feedbacks || [];
    const ratingCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars

    feedbacks.forEach(f => {
        const r = parseInt(f.rating);
        if (r >= 1 && r <= 5) ratingCounts[r - 1]++;
    });

    const colors = [
        'rgba(239, 68, 68, 0.8)',   // 1 star - red
        'rgba(249, 115, 22, 0.8)',  // 2 stars - orange
        'rgba(234, 179, 8, 0.8)',   // 3 stars - yellow
        'rgba(34, 197, 94, 0.8)',   // 4 stars - green
        'rgba(59, 130, 246, 0.8)'   // 5 stars - blue
    ];

    const borderColors = [
        'rgba(239, 68, 68, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)'
    ];

    chartInstances.feedbackRatings = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['⭐ 1 sao', '⭐ 2 sao', '⭐ 3 sao', '⭐ 4 sao', '⭐ 5 sao'],
            datasets: [{
                label: 'Số phản hồi',
                data: ratingCounts,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y} phản hồi`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { family: 'Manrope', weight: '500' }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                x: {
                    ticks: { font: { family: 'Manrope', weight: '600', size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ================== DESTROY CHART HELPER ==================
function destroyChart(key) {
    if (chartInstances[key]) {
        chartInstances[key].destroy();
        chartInstances[key] = null;
    }
}

// ================== REFRESH ==================
function refreshDashboard() {
    loadDashboardStats();
    loadDashboardCharts();
}

// ================== EXPORT ==================
if (typeof window !== 'undefined') {
    window.initDashboard = initDashboard;
    window.refreshDashboard = refreshDashboard;
}
