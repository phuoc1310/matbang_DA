// routes/user.routes.js
import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { syncUser, getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/auth/sync", verifyToken, asyncHandler(syncUser));
router.get("/profile", verifyToken, asyncHandler(getUserProfile));
router.put("/profile", verifyToken, asyncHandler(updateUserProfile));

export default router;