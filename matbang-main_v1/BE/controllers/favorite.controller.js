import {
  addFavorite,
  getFavoritesByUser,
  deleteFavorite
} from "../services/favorite.service.js";

export async function addFavoriteController(req, res) {
  const { user_id, listing_id } = req.body;
  const data = await addFavorite(user_id, listing_id);
  res.json(data);
}

export async function getFavoritesController(req, res) {
  const data = await getFavoritesByUser(req.params.user_id);
  res.json(data);
}

export async function deleteFavoriteController(req, res) {
  const { user_id, listing_id } = req.body;
  const data = await deleteFavorite(user_id, listing_id);
  res.json(data);
}