const API_URL = 'http://localhost:3033/api';

let currentPage = 1;
let totalPages = 1;
const limit = 6;

document.addEventListener('DOMContentLoaded', () => {
    loadNews();

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadNews();
        }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadNews();
        }
    });
});

async function loadNews() {
    const loadingEl = document.getElementById('news-loading');
    const gridEl = document.getElementById('news-grid');
    const emptyEl = document.getElementById('news-empty');
    const paginationEl = document.getElementById('news-pagination');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (gridEl) gridEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (paginationEl) paginationEl.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}/news?page=${currentPage}&limit=${limit}`);
        if (!response.ok) throw new Error('Lỗi khi tải tin tức');
        
        const data = await response.json();
        
        if (loadingEl) loadingEl.classList.add('hidden');

        if (data.success && data.news && data.news.length > 0) {
            renderNews(data.news);
            if (gridEl) gridEl.classList.remove('hidden');
            
            // Pagination logic
            totalPages = data.totalPages;
            currentPage = data.page;
            
            if (totalPages > 1) {
                if (paginationEl) paginationEl.classList.remove('hidden');
                
                const prevBtn = document.getElementById('prev-page');
                const nextBtn = document.getElementById('next-page');
                const pageInfo = document.getElementById('page-info');
                
                if (prevBtn) prevBtn.disabled = currentPage <= 1;
                if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
                if (pageInfo) pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
            }
        } else {
            if (emptyEl) emptyEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Lỗi fetch news:', error);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.innerHTML = `<p class="text-red-500">Lỗi: ${error.message}</p>`;
        }
    }
}

function renderNews(newsArray) {
    const gridEl = document.getElementById('news-grid');
    if (!gridEl) return;

    gridEl.innerHTML = newsArray.map(news => {
        const date = new Date(news.created_at).toLocaleDateString('vi-VN');
        const defaultImg = 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80';
        
        return `
        <article class="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
            <div class="relative h-48 overflow-hidden">
                <img src="${news.image_url || defaultImg}" alt="${news.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm dark:bg-slate-800/90 px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1 text-amber-500">
                    <span class="material-symbols-outlined text-[14px] fill-current">star</span>
                    <span>${news.average_rating}</span>
                    <span class="text-slate-500 font-normal ml-1">(${news.review_count})</span>
                </div>
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>${date}</span>
                </div>
                <h3 class="text-xl font-bold mb-3 text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                    <a href="tintuc-chitiet.html?id=${news.id}" class="after:absolute after:inset-0">${news.title}</a>
                </h3>
                <p class="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">${news.excerpt || ''}</p>
                <div class="pt-4 border-t border-border-light dark:border-border-dark flex items-center justify-between text-sm mt-auto">
                    <span class="font-medium text-slate-900 dark:text-white">${news.author_name || 'Admin'}</span>
                    <span class="text-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Đọc tiếp <span class="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                    </span>
                </div>
            </div>
        </article>
        `;
    }).join('');
}
