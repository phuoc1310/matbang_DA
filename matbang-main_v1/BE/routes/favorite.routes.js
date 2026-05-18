import express from "express";
import {
  addFavoriteController,
  getFavoritesController,
  deleteFavoriteController
} from "../controllers/favorite.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// ADD FAVORITE
router.post("/", verifyToken, addFavoriteController);

// GET FAVORITES BY USER
router.get("/:user_id", verifyToken, getFavoritesController);

// DELETE FAVORITE
router.delete("/", verifyToken, deleteFavoriteController);

export default router;