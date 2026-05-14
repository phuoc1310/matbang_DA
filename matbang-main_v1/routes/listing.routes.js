import { verifyToken } from "../middlewares/auth.js";
import express from "express";
import {
  getListingsController,
  compareListingsController,
  createListingController,
  getListingController,
  updateListingController,
  deleteListingController,
  updateListingStatusController,
  toggleListingVisibilityController
} from "../controllers/listing.controller.js";

const router = express.Router();

router.post("/", verifyToken, createListingController);

// GET listings
router.get("/", getListingsController);

// COMPARE listings
router.get("/compare", compareListingsController);

// GET single listing by id
router.get("/:id", getListingController);

// UPDATE listing
router.put("/:id", verifyToken, updateListingController);

// DELETE listing
router.delete("/:id", verifyToken, deleteListingController);

// UPDATE status
router.patch("/:id/status", verifyToken, updateListingStatusController);

// TOGGLE visibility
router.patch("/:id/visibility", verifyToken, toggleListingVisibilityController);

export default router;