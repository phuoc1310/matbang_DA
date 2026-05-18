import {
  addFavorite,
  getFavoritesByUser,
  deleteFavorite
} from "../services/favorite.service.js";

// ADD
export async function addFavoriteController(req, res) {
  try {
    const { user_id, listing_id } = req.body;
    const data = await addFavorite(user_id, listing_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET
export async function getFavoritesController(req, res) {
  try {
    const data = await getFavoritesByUser(req.params.user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE
export async function deleteFavoriteController(req, res) {
  try {
    const { user_id, listing_id } = req.body;
    const data = await deleteFavorite(user_id, listing_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}