function normalizeText(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const item = {
  id: "10000",
  title: "🏡 Bán nhà đẹp mê ly đường Dương Bá Trạc P1 Q8\n",
  price: 6580000000,
  area_m2: 33,
  district: "Quận 8",
  ward: "Phường 1",
  region: "Hồ Chí Minh",
  address: "",
  type: "Nhà ở"
};

const f = {
  keyword: normalizeText("quận 8")
};

const text = normalizeText(
  `${item.title} ${item.street} ${item.ward} ${item.district} ${item.region}`
);

console.log("f.keyword:", f.keyword);
console.log("text:", text);
console.log("Match:", text.includes(f.keyword));

