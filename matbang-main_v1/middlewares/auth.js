// middleware/auth.js
import admin from "../config/firebase.js";

export async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded; // uid, email
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}