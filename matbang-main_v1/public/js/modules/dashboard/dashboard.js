// ================== DASHBOARD ANALYTICS MODULE ==================
// Business Intelligence Dashboard với Chart.js

let ratingChart = null;
let subjectChart = null;
let trendChart = null;
let sentimentChart = null;

// ================== INITIALIZE DASHBOARD ==================
function initDashboard() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js chưa được load');
        return;
    }
    
    loadDashboardData();
}

// ================== LOAD DASHBOARD DATA ==================
function loadDashboardData() {
    const contacts = getContacts ? getContacts() : [];
    const feedbacks = getFeedbacks ? getFeedbacks() : [];
    
    // Update summary cards
    updateSummaryCards(contacts, feedbacks);
    
    // Create charts
    createRatingChart(feedbacks);
    createSubjectChart(contacts);
    createTrendChart(contacts, feedbacks);
    createSentimentChart(contacts, feedbacks);
    
    // Update additional insights
    updateTopIssues(contacts);
    updateRecentActivity(contacts, feedbacks);
    updateResponseTime(contacts);
}

// ================== UPDATE SUMMARY CARDS ==================
function updateSummaryCards(contacts, feedbacks) {
    // Total contacts
    document.getElementById('dashboard-total-contacts').textContent = contacts.length;
    
    // Total feedbacks
    document.getElementById('dashboard-total-feedbacks').textContent = feedbacks.length;
    
    // Average rating
    if (feedbacks.length > 0) {
        const totalRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
        const avgRating = (totalRating / feedbacks.length).toFixed(1);
        document.getElementById('dashboard-avg-rating').textContent = avgRating;
    } else {
        document.getElementById('dashboard-avg-rating').textContent = '0.0';
    }
    
    // Resolution rate
    if (contacts.length > 0) {
        const resolvedCount = contacts.filter(c => c.status === 'processed' || c.status === 'resolved').length;
        const resolutionRate = ((resolvedCount / contacts.length) * 100).toFixed(0);
        document.getElementById('dashboard-resolution-rate').textContent = resolutionRate + '%';
    } else {
        document.getElementById('dashboard-resolution-rate').textContent = '0%';
    }
}

// ================== CREATE RATING CHART (PIE) ==================
function createRatingChart(feedbacks) {
    const ctx = document.getElementById('ratingChart');
    if (!ctx) return;
    
    // Count ratings
    const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
    feedbacks.forEach(f => {
        if (f.rating >= 1 && f.rating <= 5) {
            ratingCounts[f.rating - 1]++;
        }
    });
    
    // Destroy existing chart
    if (ratingChart) {
        ratingChart.destroy();
    }
    
    // Create new chart
    ratingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['⭐ 1 sao', '⭐⭐ 2 sao', '⭐⭐⭐ 3 sao', '⭐⭐⭐⭐ 4 sao', '⭐⭐⭐⭐⭐ 5 sao'],
            datasets: [{
                label: 'Số lượng',
                data: ratingCounts,
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // red-500
                    'rgba(249, 115, 22, 0.8)',  // orange-500
                    'rgba(234, 179, 8, 0.8)',   // yellow-500
                    'rgba(34, 197, 94, 0.8)',   // green-500
                    'rgba(59, 130, 246, 0.8)'   // blue-500
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(249, 115, 22, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('color') || '#334155',
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Manrope'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ================== CREATE SUBJECT CHART (BAR) ==================
function createSubjectChart(contacts) {
    const ctx = document.getElementById('subjectChart');
    if (!ctx) return;
    
    // Count subjects
    const subjectCounts = {
        tuvan: 0,
        dangtin: 0,
        vip: 0,
        kythuat: 0,
        khac: 0
    };
    
    contacts.forEach(c => {
        if (subjectCounts.hasOwnProperty(c.subject)) {
            subjectCounts[c.subject]++;
        }
    });
    
    const subjectLabels = {
        tuvan: 'Tư vấn tìm mặt bằng',
        dangtin: 'Hỗ trợ đăng tin',
        vip: 'Gói VIP',
        kythuat: 'Hỗ trợ kỹ thuật',
        khac: 'Khác'
    };
    
    // Destroy existing chart
    if (subjectChart) {
        subjectChart.destroy();
    }
    
    // Create new chart
    subjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(subjectCounts).map(key => subjectLabels[key]),
            datasets: [{
                label: 'Số lượng liên hệ',
                data: Object.values(subjectCounts),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',   // indigo
                    'rgba(168, 85, 247, 0.8)',   // purple
                    'rgba(236, 72, 153, 0.8)',   // pink
                    'rgba(59, 130, 246, 0.8)',   // blue
                    'rgba(107, 114, 128, 0.8)'   // gray
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(107, 114, 128, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `Số lượng: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#64748b'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ================== CREATE TREND CHART (LINE) ==================
function createTrendChart(contacts, feedbacks) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Get last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push(date);
    }
    
    // Count contacts and feedbacks per day
    const contactsPerDay = last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        return contacts.filter(c => {
            const createdDate = new Date(c.createdAt);
            return createdDate >= date && createdDate < nextDay;
        }).length;
    });
    
    const feedbacksPerDay = last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        return feedbacks.filter(f => {
            const createdDate = new Date(f.createdAt);
            return createdDate >= date && createdDate < nextDay;
        }).length;
    });
    
    // Format labels (dd/mm)
    const labels = last7Days.map(date => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    });
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }
    
    // Create new chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Liên hệ',
                    data: contactsPerDay,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Phản hồi',
                    data: feedbacksPerDay,
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#64748b',
                        padding: 15,
                        font: {
                            size: 13,
                            family: 'Manrope',
                            weight: '600'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    borderWidth: 1,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return 'Ngày ' + context[0].label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#64748b'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ================== UPDATE TOP ISSUES ==================
function updateTopIssues(contacts) {
    const container = document.getElementById('top-issues-list');
    if (!container) return;
    
    // Count subjects
    const subjectCounts = {};
    contacts.forEach(c => {
        subjectCounts[c.subject] = (subjectCounts[c.subject] || 0) + 1;
    });
    
    // Sort by count
    const sorted = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const subjectLabels = {
        tuvan: 'Tư vấn tìm mặt bằng',
        dangtin: 'Hỗ trợ đăng tin',
        vip: 'Gói VIP',
        kythuat: 'Hỗ trợ kỹ thuật',
        khac: 'Khác'
    };
    
    const subjectIcons = {
        tuvan: 'support_agent',
        dangtin: 'post_add',
        vip: 'workspace_premium',
        kythuat: 'settings',
        khac: 'help'
    };
    
    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = sorted.map(([subject, count]) => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">${subjectIcons[subject] || 'help'}</span>
                <div>
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">${subjectLabels[subject] || subject}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${count} liên hệ</p>
                </div>
            </div>
            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">${count}</span>
        </div>
    `).join('');
}

// ================== UPDATE RECENT ACTIVITY ==================
function updateRecentActivity(contacts, feedbacks) {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    
    // Combine and sort by date
    const activities = [
        ...contacts.map(c => ({ ...c, type: 'contact' })),
        ...feedbacks.map(f => ({ ...f, type: 'feedback' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, 5);
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400">Chưa có hoạt động</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const date = new Date(activity.createdAt);
        const timeAgo = getTimeAgo(date);
        
        if (activity.type === 'contact') {
            return `
                <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">mail</span>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-slate-900 dark:text-white">Liên hệ mới</p>
                        <p class="text-xs text-slate-600 dark:text-slate-400">${activity.fullName}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">${timeAgo}</p>
                    </div>
                </div>
            `;
        } else {
            const stars = '⭐'.repeat(activity.rating);
            return `
                <div class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span class="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">feedback</span>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-slate-900 dark:text-white">Phản hồi mới</p>
                        <p class="text-xs text-slate-600 dark:text-slate-400">${stars} ${activity.rating}/5</p>
                        <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">${timeAgo}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// ================== UPDATE RESPONSE TIME ==================
function updateResponseTime(contacts) {
    const avgEl = document.getElementById('avg-response-time');
    const minEl = document.getElementById('min-response-time');
    const maxEl = document.getElementById('max-response-time');
    
    if (!avgEl || !minEl || !maxEl) return;
    
    // Calculate response times (in hours) for processed contacts
    const processedContacts = contacts.filter(c => c.processedAt && c.status !== 'pending');
    
    if (processedContacts.length === 0) {
        avgEl.textContent = '-';
        minEl.textContent = '-';
        maxEl.textContent = '-';
        return;
    }
    
    const responseTimes = processedContacts.map(c => {
        const created = new Date(c.createdAt);
        const processed = new Date(c.processedAt);
        return (processed - created) / (1000 * 60 * 60); // Convert to hours
    });
    
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    
    avgEl.textContent = formatTime(avg);
    minEl.textContent = formatTime(min);
    maxEl.textContent = formatTime(max);
}

// ================== UTILITY FUNCTIONS ==================
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' phút trước';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' giờ trước';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' ngày trước';
    return date.toLocaleDateString('vi-VN');
}

function formatTime(hours) {
    if (hours < 1) {
        return Math.round(hours * 60) + ' phút';
    } else if (hours < 24) {
        return hours.toFixed(1) + ' giờ';
    } else {
        return (hours / 24).toFixed(1) + ' ngày';
    }
}

// ================== CREATE SENTIMENT CHART (PIE) ==================
function createSentimentChart(contacts, feedbacks) {
    const ctx = document.getElementById('sentimentChart');
    if (!ctx) return;
    
    // Get cached sentiment data from localStorage
    const allItems = [...contacts, ...feedbacks];
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let analyzedCount = 0;
    
    allItems.forEach(item => {
        const text = item.content || item.comment || '';
        const cached = typeof getCachedSentiment === 'function' ? getCachedSentiment(text) : null;
        
        if (cached && cached.sentiment) {
            analyzedCount++;
            if (cached.sentiment === 'positive') positiveCount++;
            else if (cached.sentiment === 'negative') negativeCount++;
            else neutralCount++;
        }
    });
    
    // Destroy existing chart
    if (sentimentChart) {
        sentimentChart.destroy();
    }
    
    // If no analyzed data, show placeholder
    if (analyzedCount === 0) {
        ctx.parentElement.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-6">
                <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">sentiment_neutral</span>
                <p class="text-slate-600 dark:text-slate-400 mb-2">Chưa có dữ liệu phân tích cảm xúc</p>
                <p class="text-sm text-slate-500 dark:text-slate-500">Nhấn nút "Phân tích" để bắt đầu</p>
            </div>
        `;
        return;
    }
    
    // Restore canvas if it was replaced
    if (!ctx.getContext) {
        const parent = document.getElementById('sentimentChart').parentElement;
        parent.innerHTML = '<canvas id="sentimentChart"></canvas>';
        return createSentimentChart(contacts, feedbacks);
    }
    
    // Create chart
    sentimentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['😊 Tích cực', '😐 Trung lập', '😞 Tiêu cực'],
            datasets: [{
                label: 'Số lượng',
                data: [positiveCount, neutralCount, negativeCount],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // green
                    'rgba(59, 130, 246, 0.8)',  // blue
                    'rgba(239, 68, 68, 0.8)'    // red
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#64748b',
                        padding: 15,
                        font: {
                            size: 13,
                            family: 'Manrope'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            return `Đã phân tích: ${analyzedCount}/${allItems.length}`;
                        }
                    }
                }
            }
        }
    });
}

// ================== BATCH SENTIMENT ANALYSIS ==================
async function analyzeBatchSentiment() {
    if (typeof analyzeBatch !== 'function') {
        alert('Chức năng phân tích AI chưa khả dụng');
        return;
    }
    
    const contacts = getContacts ? getContacts() : [];
    const feedbacks = getFeedbacks ? getFeedbacks() : [];
    
    if (contacts.length === 0 && feedbacks.length === 0) {
        alert('Không có dữ liệu để phân tích');
        return;
    }
    
    // Confirm
    const total = contacts.length + feedbacks.length;
    if (!confirm(`Phân tích ${total} items (${contacts.length} liên hệ + ${feedbacks.length} phản hồi)?\n\nQuá trình này có thể mất vài phút và sử dụng Gemini API.`)) {
        return;
    }
    
    // Show loading
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span><span>Đang phân tích...</span>';
    
    try {
        // Analyze contacts (limit to 10 to avoid rate limit)
        const contactResults = await analyzeBatch(contacts.slice(0, 10), 'contact');
        console.log('Contact sentiment analysis:', contactResults);
        
        // Analyze feedbacks (limit to 10 to avoid rate limit)
        const feedbackResults = await analyzeBatch(feedbacks.slice(0, 10), 'feedback');
        console.log('Feedback sentiment analysis:', feedbackResults);
        
        // Refresh chart
        createSentimentChart(contacts, feedbacks);
        
        alert(`✅ Phân tích hoàn tất!\n\n${contactResults.length} liên hệ\n${feedbackResults.length} phản hồi\n\nXem kết quả trong biểu đồ`);
    } catch (error) {
        console.error('Batch analysis error:', error);
        
        // More helpful error message
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
            alert('⚠️ Vượt quá giới hạn API!\n\nVui lòng chờ 1-2 phút và thử lại.\n\nHoặc phân tích từng item một thay vì batch.');
        } else {
            alert('❌ Có lỗi xảy ra: ' + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ================== REFRESH DASHBOARD ==================
function refreshDashboard() {
    loadDashboardData();
}

// ================== EXPORT ==================
if (typeof window !== 'undefined') {
    window.initDashboard = initDashboard;
    window.refreshDashboard = refreshDashboard;
    window.analyzeBatchSentiment = analyzeBatchSentiment;
}
