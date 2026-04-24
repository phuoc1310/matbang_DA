import { verifyToken } from "../middlewares/auth.js";
import express from "express";
import {
  getListingsController,
  compareListingsController,
  createListingController
} from "../controllers/listing.controller.js";

const router = express.Router();

router.post("/", verifyToken, createListingController);

// GET listings
router.get("/", getListingsController);

// COMPARE listings
router.get("/compare", compareListingsController);

export default router;