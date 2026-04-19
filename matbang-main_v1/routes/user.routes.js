// routes/user.routes.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { syncUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/auth/sync", verifyToken, syncUser);

export default router;