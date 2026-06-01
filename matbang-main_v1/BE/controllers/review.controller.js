import {
  createReview,
  getReviewsByListing
} from "../services/review.service.js";

export async function createReviewController(req, res) {
  const data = await createReview(req.body);
  res.json(data);
}

export async function getReviewsByListingController(req, res) {
  const data = await getReviewsByListing(req.params.listing_id);
  res.json(data);
}