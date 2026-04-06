// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

import reviewRoutes from "./routes/review.routes.js";
import listingRoutes from "./routes/listing.routes.js";

const app = express();
const PORT = 3033;

// ===== Firebase =====
const serviceAccount = JSON.parse(
  fs.readFileSync("./key_firebase/serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ===== Routes =====
app.use("/api/reviews", reviewRoutes);
app.use("/api/listings", listingRoutes(db, admin));

// ===== Chotot API (FIX ERROR HANDLING) =====
app.get("/api/ads", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const url = `https://gateway.chotot.com/v1/public/ad-listing?cg=1000&limit=${limit}&offset=${offset}`;

    const r = await fetch(url);
    const json = await r.json();

    res.json({ ads: json.ads || [] });
  } catch (err) {
    res.status(500).json({ error: "Fetch API error" });
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 Server running http://localhost:${PORT}`);
});