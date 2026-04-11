import {
  createReview,
  getReviewsByListing
} from "../services/review.service.js";

// CREATE
export async function createReviewController(req, res) {
  try {
    const data = await createReview(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET BY LISTING
export async function getReviewsByListingController(req, res) {
  try {
    const data = await getReviewsByListing(req.params.listing_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}