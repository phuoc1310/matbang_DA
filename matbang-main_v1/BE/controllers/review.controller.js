import {
  createReview,
  getReviewsByListing
} from "../services/review.service.js";
import db from "../config/db.js";

export async function createReviewController(req, res) {
  try {
    let { listing_id, user_id, rating, comment } = req.body;
    
    // If user_id is a string (Firebase UID), convert it to PostgreSQL integer ID
    if (isNaN(user_id) && req.user && req.user.uid) {
      const userRes = await db.query("SELECT id FROM users WHERE firebase_uid = $1", [req.user.uid]);
      if (userRes.rows.length > 0) {
        user_id = userRes.rows[0].id;
      } else {
        throw new Error("User not found in database.");
      }
    } else if (isNaN(user_id)) {
      throw new Error("Invalid user ID format.");
    }

    const data = await createReview({ listing_id, user_id, rating, comment });
    res.json(data);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getReviewsByListingController(req, res) {
  const data = await getReviewsByListing(req.params.listing_id);
  res.json(data);
}