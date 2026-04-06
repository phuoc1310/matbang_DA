// routes/listing.routes.js
import express from "express";
import { getAverageRating } from "../services/reviewService.js";

export default function listingRoutes(db, admin) {
  const router = express.Router();

  // CREATE
  router.post("/", async (req, res) => {
    try {
      const docRef = await db.collection("listings").add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ id: docRef.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET ALL + ⭐ RATING
  router.get("/", async (req, res) => {
    const snap = await db.collection("listings").get();

    const data = await Promise.all(
      snap.docs.map(async (doc) => {
        const item = {
          id: doc.id,
          ...doc.data(),
        };

        // ⭐ lấy rating từ PostgreSQL
        item.rating = await getAverageRating(item.id);

        return item;
      })
    );

    res.json({ listings: data });
  });

  // GET DETAIL
  router.get("/:id", async (req, res) => {
    const doc = await db.collection("listings").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Not found" });
    }

    const item = {
      id: doc.id,
      ...doc.data(),
    };

    // ⭐ thêm rating
    item.rating = await getAverageRating(item.id);

    res.json(item);
  });

  // DELETE
  router.delete("/:id", async (req, res) => {
    await db.collection("listings").doc(req.params.id).delete();
    res.json({ success: true });
  });

  return router;
}