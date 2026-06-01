import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  addFavoriteController,
  getFavoritesController,
  deleteFavoriteController
} from "../controllers/favorite.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verifyToken, asyncHandler(addFavoriteController));
router.get("/:user_id", verifyToken, asyncHandler(getFavoritesController));
router.delete("/", verifyToken, asyncHandler(deleteFavoriteController));

export default router;