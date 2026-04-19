// public/asset/js/main.js
window.PAGE_SIZE = 12;
window.currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Xử lý Logic Tìm kiếm ---
  const handleSearchRedirect = () => {
    // Tìm input ở header hoặc ở body trang chủ
    const input = document.querySelector("#search"); 
    const citySelect = document.getElementById("citySelect");
    
    // Lấy giá trị
    const keyword = input ? input.value.trim() : "";
    const city = citySelect ? citySelect.value : "hcm"; 

    // Nếu đang ở trang timkiem.html thì chỉ reload/update param chứ không redirect loop
    if (window.location.pathname.includes("timkiem.html")) {
        const url = new URL(window.location);
        url.searchParams.set("keyword", keyword);
        // Reset về trang 1 khi search mới
        url.searchParams.set("city", city);
        window.location.href = url.toString();
        return;
    }

    // Chuyển hướng sang trang tìm kiếm
    const url = `timkiem.html?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}`;
    window.location.href = url;
  };

  // --- 2. Gán sự kiện cho nút tìm kiếm ---
  // Tìm nút search (id btnSearch hoặc nút trong header)
  const searchBtns = document.querySelectorAll("#btnSearch, button[id='btnSearchInside']");
  
  searchBtns.forEach(btn => {
      btn.addEventListener("click", handleSearchRedirect);
  });

  // --- 3. Gán sự kiện Enter cho ô input ---
  const searchInput = document.querySelector("#search");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearchRedirect();
    });
  }
});