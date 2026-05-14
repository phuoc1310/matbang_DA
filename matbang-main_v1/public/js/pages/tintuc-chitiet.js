import { getAuthToken } from '../modules/auth/auth.js';

const API_URL = 'http://localhost:3033/api';
let currentNewsId = null;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentNewsId = urlParams.get('id');

    if (!currentNewsId) {
        window.location.href = 'tintuc.html';
        return;
    }

    loadNewsDetail();
    loadRatings();
    setupRatingForm();
});

async function loadNewsDetail() {
    const loadingEl = document.getElementById('article-loading');
    const contentEl = document.getElementById('article-content');
    const ratingsEl = document.getElementById('ratings-section');

    try {
        const response = await fetch(`${API_URL}/news/${currentNewsId}`);
        if (!response.ok) throw new Error('Không thể tải bài viết');
        
        const data = await response.json();
        const news = data.news;

        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) contentEl.classList.remove('hidden');
        if (ratingsEl) ratingsEl.classList.remove('hidden');

        const date = new Date(news.created_at).toLocaleDateString('vi-VN');
        const defaultImg = 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=1200&q=80';

        document.title = `${news.title} - SpaceRent`;
        document.getElementById('breadcrumb-title').textContent = news.title;
        document.getElementById('news-title').textContent = news.title;
        document.getElementById('news-date').textContent = `${date} • Bởi ${news.author_name || 'Admin'}`;
        document.getElementById('news-image').src = news.image_url || defaultImg;
        document.getElementById('news-body').innerHTML = news.content;
        
        document.getElementById('news-rating-avg').textContent = news.average_rating;
        document.getElementById('news-rating-count').textContent = `(${news.review_count} đánh giá)`;

    } catch (error) {
        console.error('Lỗi chi tiết:', error);
        if (loadingEl) {
            loadingEl.innerHTML = `<p class="text-red-500">Lỗi: ${error.message}</p><a href="tintuc.html" class="text-primary mt-4 inline-block hover:underline">Quay lại danh sách</a>`;
        }
    }
}

async function loadRatings() {
    const listEl = document.getElementById('ratings-list');
    const emptyEl = document.getElementById('ratings-empty');

    try {
        const response = await fetch(`${API_URL}/news/${currentNewsId}/ratings`);
        const data = await response.json();

        if (data.success && data.ratings && data.ratings.length > 0) {
            if (emptyEl) emptyEl.classList.add('hidden');
            
            listEl.innerHTML = data.ratings.map(rating => {
                const date = new Date(rating.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                });
                
                // Generate stars HTML
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= rating.rating) {
                        starsHtml += '<span class="material-symbols-outlined text-amber-500 text-[18px] fill-current">star</span>';
                    } else {
                        starsHtml += '<span class="material-symbols-outlined text-slate-300 text-[18px]">star</span>';
                    }
                }

                return `
                <div class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-5 rounded-xl">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                ${rating.user_name ? rating.user_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <p class="font-semibold text-slate-900 dark:text-white">${rating.user_name || 'Người dùng ẩn danh'}</p>
                                <p class="text-xs text-slate-500">${date}</p>
                            </div>
                        </div>
                        <div class="flex">${starsHtml}</div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 whitespace-pre-line">${rating.comment || ''}</p>
                </div>
                `;
            }).join('');
        } else {
            if (emptyEl) emptyEl.classList.remove('hidden');
            listEl.innerHTML = '';
        }
    } catch (error) {
        console.error('Lỗi tải đánh giá:', error);
    }
}

function setupRatingForm() {
    const token = getAuthToken();
    const authWarning = document.getElementById('rating-auth-warning');
    const form = document.getElementById('rating-form');
    
    if (!token) {
        if (authWarning) authWarning.classList.remove('hidden');
        if (form) form.classList.add('hidden');
        return;
    }

    if (authWarning) authWarning.classList.add('hidden');
    if (form) form.classList.remove('hidden');

    // Star selection
    const starBtns = document.querySelectorAll('.star-btn');
    const selectedText = document.getElementById('selected-rating-text');
    
    starBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedRating = parseInt(e.currentTarget.dataset.val);
            updateStarsUI(starBtns, selectedRating);
            selectedText.textContent = `${selectedRating} sao`;
        });
        
        btn.addEventListener('mouseenter', (e) => {
            const val = parseInt(e.currentTarget.dataset.val);
            updateStarsUI(starBtns, val, true);
        });
        
        btn.addEventListener('mouseleave', () => {
            updateStarsUI(starBtns, selectedRating);
        });
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedRating === 0) {
            alert('Vui lòng chọn số sao để đánh giá!');
            return;
        }

        const comment = document.getElementById('rating-comment').value.trim();
        const submitBtn = document.getElementById('btn-submit-rating');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> Đang gửi...';

            const payload = _decodeJWT(token);
            if(!payload || !payload.id) {
                alert("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.");
                return;
            }

            const response = await fetch(`${API_URL}/news/${currentNewsId}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: payload.id,
                    rating: selectedRating,
                    comment: comment
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Cảm ơn bạn đã đánh giá!');
                document.getElementById('rating-comment').value = '';
                // Reload data
                loadNewsDetail();
                loadRatings();
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi submit rating:', error);
            alert('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Gửi đánh giá</span>';
        }
    });
}

function updateStarsUI(starBtns, val, isHover = false) {
    starBtns.forEach(btn => {
        const btnVal = parseInt(btn.dataset.val);
        if (btnVal <= val) {
            btn.classList.add('text-amber-500', 'fill-current');
            btn.classList.remove('text-slate-300');
        } else {
            btn.classList.remove('text-amber-500', 'fill-current');
            btn.classList.add('text-slate-300');
        }
    });
}

// Helper decode JWT since we don't have a library in vanilla JS
function _decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}
