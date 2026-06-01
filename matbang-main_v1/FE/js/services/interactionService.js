export const interactionService = {
  // Search History
  async getSearchHistory(userId) {
    if (!userId) return [];
    try {
      const res = await fetch(`/api/interactions/history?userId=${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('Lỗi fetch lịch sử tìm kiếm:', e);
      return [];
    }
  },

  async saveSearchHistory(userId, keyword, city) {
    if (!userId || (!keyword && !city)) return;
    try {
      await fetch('/api/interactions/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, keyword: keyword || null, city: city || null })
      });
    } catch (e) {
      console.warn('Lỗi lưu lịch sử tìm kiếm:', e);
    }
  },

  async clearSearchHistory(userId) {
    if (!userId) return;
    try {
      await fetch(`/api/interactions/history?userId=${userId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Lỗi xóa lịch sử tìm kiếm:', e);
    }
  },

  // Compare
  async getCompareList(userId) {
    if (!userId) return [];
    try {
      const res = await fetch(`/api/interactions/compare?userId=${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("Lỗi fetch danh sách so sánh:", e);
      return [];
    }
  },

  async toggleCompare(userId, propertyId) {
    if (!userId || !propertyId) return false;
    try {
      const res = await fetch('/api/interactions/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, propertyId })
      });
      return res.ok;
    } catch (e) {
      console.warn("Lỗi toggle so sánh:", e);
      return false;
    }
  },

  async clearCompare(userId) {
    if (!userId) return false;
    try {
      const res = await fetch(`/api/interactions/compare?userId=${userId}`, { 
        method: 'DELETE' 
      });
      return res.ok;
    } catch (e) {
      console.warn("Lỗi xóa tất cả so sánh:", e);
      return false;
    }
  }
};
