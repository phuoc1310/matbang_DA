// public/js/pages/main.js
window.PAGE_SIZE = 12;
window.currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  const handleSearchRedirect = () => {
    const keyword = (document.querySelector("#search")?.value || "").trim();
    const city = document.getElementById("citySelect")?.value || "";
    const type = document.getElementById("type")?.value || "";
    const price = document.getElementById("price")?.value || ""; // format min-max in VND
    const area = document.getElementById("area")?.value || ""; // format min-max in m2

    let minPrice = "";
    let maxPrice = "";
    if (price && price.includes("-")) {
      [minPrice, maxPrice] = price.split("-");
    }

    let minArea = "";
    let maxArea = "";
    if (area && area.includes("-")) {
      [minArea, maxArea] = area.split("-");
    }

    // Nếu đang ở trang timkiem.html thì chỉ update param
    if (window.location.pathname.includes("timkiem")) {
      const url = new URL(window.location);
      url.searchParams.set("keyword", keyword);
      if (city) url.searchParams.set("city", city);
      else url.searchParams.delete("city");
      window.location.href = url.toString();
      return;
    }

    // Chuyển hướng sang trang tìm kiếm với đường dẫn đúng
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    // send standardized range params
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);
    if (minArea !== "") params.set("minArea", minArea);
    if (maxArea !== "") params.set("maxArea", maxArea);

    window.location.href = `/js/views/timkiem.html?${params.toString()}`;
  };

  // Gán sự kiện cho nút tìm kiếm
  document.querySelectorAll("#btnSearch").forEach(btn => {
    btn.addEventListener("click", handleSearchRedirect);
  });

  // Gán sự kiện Enter cho ô input
  document.querySelector("#search")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearchRedirect();
  });
});