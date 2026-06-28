import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  createReviewController,
  getReviewsByListingController
} from "../controllers/review.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verifyToken, asyncHandler(createReviewController));
router.get("/:listing_id", asyncHandler(getReviewsByListingController));

export default router;