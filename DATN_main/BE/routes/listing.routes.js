import { verifyToken } from "../middlewares/auth.js";
import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  getListingsController,
  compareListingsController,
  createListingController,
  getListingController,
  updateListingController,
  deleteListingController,
  updateListingStatusController,
  toggleListingVisibilityController,
  getSuggestController,
  incrementListingViewController,
  getRecommendationsController
} from "../controllers/listing.controller.js";
import { getDistanceController } from "../controllers/location.controller.js";

const router = express.Router();

router.post("/", verifyToken, asyncHandler(createListingController));
router.get("/", asyncHandler(getListingsController));
router.get("/suggest", asyncHandler(getSuggestController));
router.post("/recommendations", asyncHandler(getRecommendationsController));
router.get("/compare", asyncHandler(compareListingsController));
router.get("/:id", asyncHandler(getListingController));
router.post("/:id/view", asyncHandler(incrementListingViewController));
router.post("/:id/distance", asyncHandler(getDistanceController));
router.put("/:id", verifyToken, asyncHandler(updateListingController));
router.delete("/:id", verifyToken, asyncHandler(deleteListingController));
router.patch("/:id/status", verifyToken, asyncHandler(updateListingStatusController));
router.patch("/:id/visibility", verifyToken, asyncHandler(toggleListingVisibilityController));

export default router;