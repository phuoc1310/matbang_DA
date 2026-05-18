import express from "express";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/test-auth", verifyToken, (req, res) => {
  res.json({
    message: "Auth OK",
    user: req.user
  });
});

export default router;