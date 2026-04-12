import { verifyToken } from "../middleware/auth.js";
import express from "express";
import {
  getListingsController,
  compareListingsController
} from "../controllers/listing.controller.js";

const router = express.Router();

// GET listings
router.get("/", getListingsController);

// COMPARE listings
router.get("/compare", compareListingsController);

export default router;