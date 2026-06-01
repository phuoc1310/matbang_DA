import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  getCompareList,
  toggleCompare,
  clearCompareList
} from "../controllers/interaction.controller.js";

const router = express.Router();

// Lịch sử tìm kiếm
router.get("/history", asyncHandler(getSearchHistory));
router.post("/history", asyncHandler(addSearchHistory));
router.delete("/history", asyncHandler(clearSearchHistory));

// So sánh mặt bằng
router.get("/compare", asyncHandler(getCompareList));
router.post("/compare", asyncHandler(toggleCompare));
router.delete("/compare", asyncHandler(clearCompareList));

export default router;
