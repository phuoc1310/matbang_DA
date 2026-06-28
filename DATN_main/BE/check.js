function normalizeText(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

fetch('http:
  .then(res => res.json())
  .then(json => {
    const data = json.data || json;
    const fKeyword = normalizeText('quận 8');
    const filtered = data.filter(item => {
      const dist = item.district || '';
      const reg = item.city || item.region || '';
      const text = normalizeText(`${item.title} undefined undefined ${dist} ${reg}`);
      return text.includes(fKeyword);
    });
    console.log('Total:', data.length);
    console.log('Filtered:', filtered.length);
  });
