
// public/asset/js/render.js

function renderPagination() {
  const pagEl = document.querySelector(".pagination");
  if (!pagEl) return;

  const totalPages = Math.max(
    1,
    Math.ceil((window.filteredData?.length || 0) / (window.PAGE_SIZE || 1))
  );

  // bạn muốn hiện 1..10
  const maxShow = 20;
  const showPages = Math.min(totalPages, maxShow);

  pagEl.innerHTML = "";

  for (let p = 1; p <= showPages; p++) {
    const active = p === window.currentPage;

    const btn = document.createElement("button");
    btn.textContent = p;

    btn.className =
      "px-3 py-2 rounded-lg border text-sm font-bold transition mx-1 " +
      (active
        ? "bg-primary text-white border-primary"
        : "bg-white hover:bg-slate-100 border-slate-200");

    btn.addEventListener("click", () => {
      window.currentPage = p;
      renderPage();
      // Scroll lên đầu danh sách
      document.getElementById("listing")?.scrollIntoView({ behavior: 'smooth' });
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

  const start = (window.currentPage - 1) * window.PAGE_SIZE;
  const end = start + window.PAGE_SIZE;

  const itemsToRender = window.filteredData.slice(start, end);
  
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

    // Xử lý seller
    const sellerName = item.seller || "Chính chủ";
    const sellerShortName = sellerName.split(' ').pop() || "chủ";
    
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

  if (!item.images || !item.images.length) {
    el.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-400">
        Không có hình ảnh
      </div>`;
    return;
  }

  el.innerHTML = `
    <img
      src="${item.images[0]}"
      class="w-full h-full object-cover"
      alt="${item.title}"
      onerror="this.src='https://placehold.co/1200x600?text=No+Image'"
    />
  `;
}


window.renderPage = renderPage;
window.renderPagination = renderPagination;

export { renderPage, renderPagination, renderImages };
