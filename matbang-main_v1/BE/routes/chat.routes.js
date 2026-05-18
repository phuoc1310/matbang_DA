import express from "express";
import { askAI } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", askAI);

export default router;
