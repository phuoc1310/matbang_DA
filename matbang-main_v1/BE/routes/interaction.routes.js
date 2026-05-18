import express from "express";
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
router.get("/history", getSearchHistory);
router.post("/history", addSearchHistory);
router.delete("/history", clearSearchHistory);

// So sánh mặt bằng
router.get("/compare", getCompareList);
router.post("/compare", toggleCompare);
router.delete("/compare", clearCompareList);

export default router;
