import express from "express";
import db from "../config/db.js";
import { verifyToken } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import * as AdminController from "../controllers/admin.controller.js";

const router = express.Router();

async function verifyAdmin(req, res, next) {
  const firebase_uid = req.user?.uid;
  if (!firebase_uid) return res.status(401).json({ success: false, message: "Unauthorized" });
  const result = await db.query(`SELECT role FROM users WHERE firebase_uid = $1 LIMIT 1`, [firebase_uid]);
  if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
    return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
  }
  next();
}

router.use(verifyToken, asyncHandler(verifyAdmin));

router.get("/dashboard/stats", asyncHandler(AdminController.getDashboardStats));
router.get("/users", asyncHandler(AdminController.getUsers));
router.get("/users/:id", asyncHandler(AdminController.getUserById));
router.put("/users/:id", asyncHandler(AdminController.updateUser));
router.delete("/users/:id", asyncHandler(AdminController.deleteUser));
router.put("/users/:id/role", asyncHandler(AdminController.updateUserRole));

router.get("/listings", asyncHandler(AdminController.getListings));
router.get("/listings/stats", asyncHandler(AdminController.getListingStats));
router.patch("/listings/:id/status", asyncHandler(AdminController.updateListingStatus));
router.delete("/listings/:id", asyncHandler(AdminController.deleteListing));

router.get("/contacts", asyncHandler(AdminController.getContacts));
router.get("/contacts/:id", asyncHandler(AdminController.getContactById));
router.patch("/contacts/:id/status", asyncHandler(AdminController.updateContactStatus));
router.delete("/contacts/:id", asyncHandler(AdminController.deleteContact));

router.get("/feedbacks", asyncHandler(AdminController.getFeedbacks));
router.get("/feedbacks/:id", asyncHandler(AdminController.getFeedbackById));
router.patch("/feedbacks/:id/status", asyncHandler(AdminController.updateFeedbackStatus));
router.delete("/feedbacks/:id", asyncHandler(AdminController.deleteFeedback));

export default router;
