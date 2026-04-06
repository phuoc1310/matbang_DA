// routes/review.routes.js
import express from "express";
import {
  createReview,
  getReviewsByListing
} from "../services/reviewService.js";

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  try {
    const data = await createReview(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BY LISTING
router.get("/:listing_id", async (req, res) => {
  const data = await getReviewsByListing(req.params.listing_id);
  res.json(data);
});

export default router;