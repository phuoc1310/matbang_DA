import express from "express";
import {
  createReviewController,
  getReviewsByListingController
} from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// POST (cần login)
router.post("/", verifyToken, createReviewController);

// GET (không cần login)
router.get("/:listing_id", getReviewsByListingController);

export default router;