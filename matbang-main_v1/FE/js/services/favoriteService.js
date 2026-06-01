import { getValidToken } from '../modules/auth/auth.js?v=1.0.5';

export const favoriteService = {
  async getFavorites(userId) {
    if (!userId) return [];
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/favorites/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error("Lỗi fetch danh sách yêu thích:", e);
      return [];
    }
  },

  async addFavorite(userId, listingId) {
    if (!userId || !listingId) return false;
    try {
      const token = await getValidToken();
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, listing_id: listingId })
      });
      return res.ok;
    } catch (e) {
      console.error("Lỗi lưu tin đăng:", e);
      return false;
    }
  },

  async removeFavorite(userId, listingId) {
    if (!userId || !listingId) return false;
    try {
      const token = await getValidToken();
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, listing_id: listingId })
      });
      return res.ok;
    } catch (e) {
      console.error("Lỗi bỏ lưu tin đăng:", e);
      return false;
    }
  }
};
