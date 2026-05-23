// routes/user.routes.js
import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import { syncUser, getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/auth/sync", verifyToken, syncUser);
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);

export default router;