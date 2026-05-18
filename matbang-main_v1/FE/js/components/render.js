
// public/asset/js/render.js

function renderPagination() {
  const pagEl = document.querySelector(".pagination");
  if (!pagEl) return;

  const totalCount = window.totalCount || (window.filteredData?.length || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / (window.PAGE_SIZE || 1)));
  const maxDisplay = Number(window._maxDisplayPages) || 50; // cap pages shown in UI
  let displayPages = Math.min(totalPages, maxDisplay);
  // ensure current page is within displayed range
  if (window.currentPage > displayPages) window.currentPage = displayPages;

  // condensed pagination: show first 3, last 3, and pages around current with ellipses
  const pagElInner = [];

  function pushPage(n) { pagElInner.push({ type: 'page', value: n }); }
  function pushEllipsis() { const last = pagElInner[pagElInner.length - 1]; if (!last || last.type !== 'ellipsis') pagElInner.push({ type: 'ellipsis' }); }

  const firstCount = 3;
  const lastCount = 3;
  const around = 1; // pages around current

  // build set of pages to show
  const pagesSet = new Set();
  for (let i = 1; i <= Math.min(firstCount, displayPages); i++) pagesSet.add(i);
  for (let i = Math.max(1, window.currentPage - around); i <= Math.min(displayPages, window.currentPage + around); i++) pagesSet.add(i);
  for (let i = Math.max(1, displayPages - lastCount + 1); i <= displayPages; i++) pagesSet.add(i);

  // convert to sorted array
  const pagesArr = Array.from(pagesSet).sort((a, b) => a - b);

  // compose pagElInner with ellipses
  let prev = 0;
  for (const p of pagesArr) {
    if (prev && p - prev > 1) {
      pushEllipsis();
    }
    pushPage(p);
    prev = p;
  }

  pagEl.innerHTML = "";

  for (const node of pagElInner) {
    if (node.type === 'ellipsis') {
      const span = document.createElement('span');
      span.textContent = '...';
      span.className = 'px-3 py-2 text-sm text-slate-500 mx-1';
      pagEl.appendChild(span);
      continue;
    }

    const p = node.value;
    const activeBtn = p === window.currentPage;
    const btn = document.createElement('button');
    btn.textContent = p;
    btn.className =
      'px-3 py-2 rounded-lg border text-sm font-bold transition mx-1 ' +
      (activeBtn
        ? 'bg-primary text-white border-primary'
        : 'bg-white hover:bg-slate-100 border-slate-200');

    btn.addEventListener('click', async () => {
      window.currentPage = p;
      // Fetch page from backend if available
      try {
        const fetcher = window.apiFetchListings || window.fetchListings;
        if (typeof fetcher === 'function') {
          const state = window.__SEARCH_STATE__ || {};
          const params = Object.assign({}, state, { page: p, limit: window.PAGE_SIZE });
          await fetcher(params);
        }
      } catch (e) {
        console.warn('Page fetch failed', e);
      }
      // Re-render page
      renderPage();
      // Scroll lên đầu danh sách
      document.getElementById('listing')?.scrollIntoView({ behavior: 'smooth' });
    });

    pagEl.appendChild(btn);
  }
}

function renderPage() {
  const listEl = document.getElementById("listing");
  if (!listEl) return;

  console.log("🖼️ Rendering page with", window.filteredData?.length, "items");

  // Kiểm tra nếu không có dữ liệu
  if (!window.filteredData || window.filteredData.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-3 text-center py-20">
        <span class="material-symbols-outlined text-5xl text-gray-400">search_off</span>
        <p class="mt-4 text-gray-600">Không tìm thấy mặt bằng nào</p>
        <p class="text-sm text-gray-500 mt-2">Hãy thử điều chỉnh bộ lọc</p>
      </div>`;
    return;
  }

  listEl.innerHTML = "";

  let itemsToRender = [];
  // If filteredData is a single-page payload (paged mode), render it directly
  if (window._renderIsPaged) {
    itemsToRender = window.filteredData || [];
  } else {
    const start = (window.currentPage - 1) * window.PAGE_SIZE;
    const end = start + window.PAGE_SIZE;
    itemsToRender = (window.filteredData || []).slice(start, end);
  }

  console.log("📊 Rendering items:", itemsToRender.length);

  itemsToRender.forEach((item, index) => {
    // Debug từng item
    console.log(`Item ${index}:`, {
      id: item.id,
      title: item.title,
      image: item.image,
      seller: item.seller,
      regionCode: item.regionCode,
      level: item.level
    });

    // Sửa lỗi "LUYỆN CẢO" - kiểm tra level
    let levelText = item.level || "Bình thường";
    let levelClass = "bg-gray-400";

    // Kiểm tra level bằng tiếng Anh trước
    if (levelText === "Ưu tiên cao" || levelText.includes("high") || item.score >= 0.7) {
      levelText = "Ưu tiên cao";
      levelClass = "bg-red-500";
    } else if (levelText === "Theo dõi" || levelText.includes("follow") || (item.score >= 0.4 && item.score < 0.7)) {
      levelText = "Theo dõi";
      levelClass = "bg-blue-500";
    } else {
      levelText = "Hiệu quả thấp";
      levelClass = "bg-gray-400";
    }

    // Xử lý seller - đảm bảo là string trước khi gọi split
    let sellerName = item.seller;
    if (!sellerName) sellerName = "Chính chủ";
    if (typeof sellerName !== 'string') {
      // nếu là object có fullName / name, dùng nó, nếu là số thì chuyển thành chuỗi
      if (typeof sellerName === 'object') {
        sellerName = sellerName.fullName || sellerName.name || "Chính chủ";
      } else {
        sellerName = String(sellerName);
      }
    }
    const sellerShortName = (sellerName || "Chính chủ").toString().split(' ').pop() || "chủ";

    // Xử lý tiêu đề
    const title = item.title || "Đang cập nhật thông tin";

    // Xử lý hình ảnh
    const imageUrl = item.image || item.images?.[0] || "https://placehold.co/600x400/cccccc/666666?text=No+Image";

    // Xử lý giá
    const priceText = item.price_string ||
      (item.price ? `${item.price.toLocaleString('vi-VN')} VNĐ` : "Thỏa thuận");

    // Xử lý địa chỉ
    const locationText = [item.district, item.region].filter(Boolean).join(", ") || "Đang cập nhật";

    listEl.innerHTML += `
  <a href="chitiet.html?id=${item.id || ''}" class="group relative bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 block h-full flex flex-col">
    <div class="relative h-56 overflow-hidden bg-gray-200">
      <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.src='https://placehold.co/600x400/cccccc/666666?text=No+Image'">
      <div class="absolute top-2 right-2 ${levelClass} text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm z-10">
        ${levelText}
      </div>
      <button onclick="event.preventDefault(); if(window.toggleCompare) window.toggleCompare('${item.id}');" class="absolute top-2 left-2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow z-10 compare-btn-${item.id}" title="So sánh mặt bằng">
        <span class="material-symbols-outlined text-[16px]">compare_arrows</span>
      </button>
      <button onclick="event.preventDefault(); event.stopPropagation(); if(window.toggleFavoriteCard) window.toggleFavoriteCard(${item.id}, this);" class="absolute bottom-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow z-10 fav-card-btn" data-listing-id="${item.id}" title="Yêu thích">
        <span class="material-symbols-outlined text-[18px] text-gray-400" style="font-variation-settings: 'FILL' 0">favorite</span>
      </button>
    </div>
    <div class="p-4 flex-1 flex flex-col">
      <h3 class="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 text-sm leading-snug flex-grow" title="${title}">${title}</h3>
      
      <div class="mt-auto">
         <div class="flex items-end gap-1 text-primary font-black text-lg mb-2">
            ${priceText}
         </div>
         <div class="flex items-center gap-2 text-slate-500 text-xs border-t pt-3 mt-1">
            <span class="material-symbols-outlined text-[16px]">location_on</span>
            <span class="truncate w-full">${locationText}</span>
         </div>
         <div class="flex items-center gap-4 text-slate-500 text-xs mt-2">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">square_foot</span> ${item.area_m2 || 0} m²</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">person</span> ${sellerShortName}</span>
         </div>
      </div>
    </div>
  </a>
`;
  });

  renderPagination();
}



function renderImages(item) {
  const el = document.getElementById("mainImage");
  if (!el) return;

  // support cả image và images[]
  let imageUrl = "";

  if (Array.isArray(item.images) && item.images.length > 0) {
    imageUrl = item.images[0];
  } else if (item.image) {
    imageUrl = item.image;
  }

  if (!imageUrl) {
    imageUrl = "https://placehold.co/1200x600?text=No+Image";
  }

  el.innerHTML = `
    <img
      src="${imageUrl}"
      class="w-full h-full object-cover"
      alt="${item.title || 'listing-image'}"
      onerror="this.src='https://placehold.co/1200x600?text=No+Image'"
    />
  `;
}
window.renderPage = renderPage;
window.renderPagination = renderPagination;

// ================== FAVORITE ON CARDS ==================
let _userFavorites = new Set(); // cached set of favorited listing IDs
let _cachedFirebaseUser = null;

async function _getFavToken() {
  try {
    // Try cached user first
    if (_cachedFirebaseUser) {
      return await _cachedFirebaseUser.getIdToken();
    }
    // Wait for Firebase auth to be ready
    const { auth } = await import('/js/config/firebase.js');
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    // If currentUser exists, use it
    if (auth.currentUser) {
      _cachedFirebaseUser = auth.currentUser;
      return await auth.currentUser.getIdToken();
    }
    
    // Otherwise wait for auth state
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        if (user) {
          _cachedFirebaseUser = user;
          user.getIdToken().then(resolve).catch(() => resolve(null));
        } else {
          resolve(null);
        }
      });
      // Timeout after 3s
      setTimeout(() => { resolve(null); }, 3000);
    });
  } catch { return null; }
}

function _getFavUserId() {
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw).id;
  } catch {}
  return null;
}

// Load user favorites and highlight cards
async function loadFavoritesForCards() {
  const userId = _getFavUserId();
  const token = await _getFavToken();
  if (!userId || !token) return;

  try {
    const res = await fetch(`/api/favorites/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const favorites = await res.json();
    _userFavorites.clear();
    if (Array.isArray(favorites)) {
      favorites.forEach(f => _userFavorites.add(String(f.listing_id)));
    }
    // Update all heart icons on current page
    document.querySelectorAll('.fav-card-btn').forEach(btn => {
      const lid = btn.dataset.listingId;
      const icon = btn.querySelector('.material-symbols-outlined');
      if (_userFavorites.has(String(lid))) {
        icon.style.fontVariationSettings = "'FILL' 1";
        icon.classList.remove('text-gray-400');
        icon.classList.add('text-red-500');
      }
    });
  } catch (e) {
    console.warn('Load favorites error:', e);
  }
}

// Toggle favorite on a card
window.toggleFavoriteCard = async function(listingId, btnEl) {
  const userId = _getFavUserId();
  const token = await _getFavToken();
  if (!userId || !token) {
    alert('Vui lòng đăng nhập để lưu yêu thích!');
    return;
  }

  const icon = btnEl.querySelector('.material-symbols-outlined');
  const isFav = _userFavorites.has(String(listingId));

  try {
    if (isFav) {
      await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, listing_id: parseInt(listingId) })
      });
      _userFavorites.delete(String(listingId));
      icon.style.fontVariationSettings = "'FILL' 0";
      icon.classList.remove('text-red-500');
      icon.classList.add('text-gray-400');
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, listing_id: parseInt(listingId) })
      });
      _userFavorites.add(String(listingId));
      icon.style.fontVariationSettings = "'FILL' 1";
      icon.classList.remove('text-gray-400');
      icon.classList.add('text-red-500');
    }
  } catch (e) {
    console.error('Toggle favorite error:', e);
  }
};

// Auto-load favorites after first render
let _favLoaded = false;
const _origRenderPage = renderPage;
// Monkey-patch renderPage to auto-check favorites
window.renderPage = function() {
  _origRenderPage();
  if (!_favLoaded) {
    _favLoaded = true;
    setTimeout(loadFavoritesForCards, 1000);
  } else {
    // Re-apply highlights for already loaded favorites
    document.querySelectorAll('.fav-card-btn').forEach(btn => {
      const lid = btn.dataset.listingId;
      const icon = btn.querySelector('.material-symbols-outlined');
      if (_userFavorites.has(String(lid))) {
        icon.style.fontVariationSettings = "'FILL' 1";
        icon.classList.remove('text-gray-400');
        icon.classList.add('text-red-500');
      }
    });
  }
};

export { renderPage, renderPagination, renderImages };

