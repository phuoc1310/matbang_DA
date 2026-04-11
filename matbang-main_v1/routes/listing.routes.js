import express from "express";
import { getListingsController } from "../controllers/listing.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { createReviewController } from "../controllers/review.controller.js";

const router = express.Router();
router.post("/", verifyToken, createReviewController);
router.get("/", getListingsController);

export default router;