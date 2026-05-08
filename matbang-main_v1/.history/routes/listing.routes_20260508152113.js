import { verifyToken } from "../middlewares/auth.js";
import express from "express";
import {
  getListingsController,
  compareListingsController,
  createListingController
  ,getListingController
} from "../controllers/listing.controller.js";

const router = express.Router();

router.post("/", verifyToken, createListingController);

// GET listings
router.get("/", getListingsController);

// COMPARE listings
router.get("/compare", compareListingsController);

// GET single listing by id
router.get("/:id", getListingController);

export default router;