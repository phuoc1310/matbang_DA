import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { askAI } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", asyncHandler(askAI));

export default router;
